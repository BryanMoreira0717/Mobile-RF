import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  AppState,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import chatApi from "../services/axios";
import {
  connectSocket,
  disconnectSocket,
  emitAck,
  subscribeSocketStatus,
} from "../services/socket";
import {
  extractErrorMessage,
  isAuthError,
  normalizeConversation,
  normalizeMessage,
  previewFromMessage,
  sortConversations,
} from "../services/chat";
import { navigate, resetToRoute } from "../services/navigation";
import colors from "../theme/colors";
import { fonts } from "../theme/fonts";

const ChatContext = createContext(null);

const PREVIEW_CONCURRENCY = 3;
const BANNER_DURATION = 6000;

async function runWithConcurrency(items, limit, task) {
  let index = 0;
  const total = Math.min(limit, items.length);

  const workers = Array.from({ length: total }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await task(item);
    }
  });

  await Promise.all(workers);
}

function parseStoredUser(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

export function ChatProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState("idle");
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const [banner, setBanner] = useState(null);

  const activeConversationRef = useRef(null);
  const previewsRef = useRef(new Map());
  const previewFetchesRef = useRef(new Set());
  const conversationsRef = useRef([]);
  const userRef = useRef(null);
  const tokenRef = useRef(null);
  const expiringRef = useRef(false);
  const refreshRef = useRef(() => {});
  const bannerTimerRef = useRef(null);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const loadSession = useCallback(async () => {
    try {
      const entries = await AsyncStorage.multiGet(["@user", "@token"]);
      const stored = {};

      entries.forEach(([key, value]) => {
        stored[key] = value;
      });

      const parsedUser = parseStoredUser(stored["@user"]);
      const storedToken = stored["@token"] || null;

      setUser(parsedUser);
      setToken(storedToken);

      return { user: parsedUser, token: storedToken };
    } catch (error) {
      console.log("Erro ao carregar sessão do chat:", error?.message);
      setUser(null);
      setToken(null);
      return { user: null, token: null };
    } finally {
      setReady(true);
    }
  }, []);

  const expireSession = useCallback(async (message) => {
    if (expiringRef.current) return;
    expiringRef.current = true;

    disconnectSocket();
    setStatus("idle");
    setBanner(null);

    try {
      await AsyncStorage.multiRemove(["@token", "@user"]);
    } catch (error) {
      console.log("Erro ao limpar sessão expirada:", error?.message);
    }

    setUser(null);
    setToken(null);
    setConversations([]);
    previewsRef.current.clear();
    previewFetchesRef.current.clear();

    Alert.alert(
      "Sessão expirada",
      message || "Sua sessão não é mais válida. Faça login novamente.",
      [
        {
          text: "OK",
          onPress: () => {
            expiringRef.current = false;
            resetToRoute("Login");
          },
        },
      ]
    );
  }, []);

  const fetchMissingPreviews = useCallback((list) => {
    const currentUser = userRef.current;
    if (!currentUser?.id) return;

    const missing = list.filter(
      (conversation) =>
        conversation.conversationId &&
        !conversation.preview &&
        !previewFetchesRef.current.has(conversation.conversationId)
    );

    if (missing.length === 0) return;

    missing.forEach((conversation) => {
      previewFetchesRef.current.add(conversation.conversationId);
    });

    runWithConcurrency(missing, PREVIEW_CONCURRENCY, async (conversation) => {
      try {
        const response = await emitAck(
          "load_messages",
          { conversationId: conversation.conversationId, limit: 1 },
          9000
        );

        const raw = response?.messages?.[0];
        if (!raw) return;

        const message = normalizeMessage(raw, currentUser.id);
        const preview = previewFromMessage(message);

        previewsRef.current.set(conversation.conversationId, preview);
        setConversations((previous) =>
          previous.map((item) =>
            item.conversationId === conversation.conversationId
              ? { ...item, preview }
              : item
          )
        );
      } catch {
        // Sem conexão: a prévia é tentada novamente na próxima reconexão.
      } finally {
        previewFetchesRef.current.delete(conversation.conversationId);
      }
    });
  }, []);

  const refreshConversations = useCallback(
    async ({ silent = false } = {}) => {
      if (!userRef.current?.id) return;

      if (!silent) setLoadingConversations(true);
      setConversationsError(null);

      try {
        const response = await chatApi.listConversations();
        const rows = Array.isArray(response?.data) ? response.data : [];
        const currentUser = userRef.current;

        const normalized = rows.map((row) =>
          normalizeConversation(
            row,
            currentUser?.id,
            previewsRef.current.get(row.conversationId)
          )
        );

        setConversations(sortConversations(normalized));
        setLoadingConversations(false);
        fetchMissingPreviews(normalized);
      } catch (error) {
        if (error?.response?.status === 401 || isAuthError(error)) {
          expireSession();
          return;
        }

        setConversationsError(
          extractErrorMessage(error, "Não foi possível carregar as conversas.")
        );
        setLoadingConversations(false);
      }
    },
    [expireSession, fetchMissingPreviews]
  );

  useEffect(() => {
    refreshRef.current = refreshConversations;
  }, [refreshConversations]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Conecta/desconecta o socket conforme a sessão e registra os eventos globais.
  useEffect(() => {
    if (!ready) return undefined;

    if (!token || !user?.id) {
      disconnectSocket();
      setStatus("idle");
      setConversations([]);
      previewsRef.current.clear();
      previewFetchesRef.current.clear();
      return undefined;
    }

    const unsubscribeStatus = subscribeSocketStatus(setStatus);
    const socket = connectSocket(token);

    if (!socket) return () => unsubscribeStatus();

    const handleConnect = () => {
      refreshRef.current({ silent: true });
    };

    const handleNewMessage = (raw) => {
      const currentUser = userRef.current;
      if (!currentUser?.id) return;

      const message = normalizeMessage(raw, currentUser.id);
      if (!message.conversationId) return;

      const preview = previewFromMessage(message);
      previewsRef.current.set(message.conversationId, preview);

      setConversations((previous) => {
        const index = previous.findIndex(
          (item) => item.conversationId === message.conversationId
        );

        if (index === -1) {
          refreshRef.current({ silent: true });
          return previous;
        }

        const current = previous[index];
        const shouldCount =
          !message.mine &&
          activeConversationRef.current !== message.conversationId;

        const updated = {
          ...current,
          updatedAt: message.createdAt || current.updatedAt,
          preview,
          lastMessageId: message.id,
          unreadCount: shouldCount
            ? (current.unreadCount || 0) + 1
            : current.unreadCount,
        };

        const next = [...previous];
        next[index] = updated;
        return sortConversations(next);
      });
    };

    const handleEdited = (raw) => {
      if (!raw?.id || !raw?.id_conversation) return;

      setConversations((previous) =>
        previous.map((item) => {
          if (
            item.conversationId !== raw.id_conversation ||
            item.lastMessageId !== raw.id
          ) {
            return item;
          }

          const preview = {
            ...(item.preview || {}),
            type: "texto",
            content: raw.content,
            isDeleted: false,
            mine: item.preview?.mine ?? false,
          };

          previewsRef.current.set(item.conversationId, preview);
          return { ...item, preview };
        })
      );
    };

    const handleDeleted = (raw) => {
      if (!raw?.id || !raw?.id_conversation) return;

      setConversations((previous) =>
        previous.map((item) => {
          if (
            item.conversationId !== raw.id_conversation ||
            item.lastMessageId !== raw.id
          ) {
            return item;
          }

          const preview = {
            ...(item.preview || {}),
            content: null,
            isDeleted: true,
          };

          previewsRef.current.set(item.conversationId, preview);
          return { ...item, preview };
        })
      );
    };

    const handleNotification = (data) => {
      if (!data || data.type !== "nova_mensagem") return;
      if (data.reference_table !== "conversation" || !data.reference_id) return;
      if (activeConversationRef.current === data.reference_id) return;

      setBanner({
        title: data.title || "Nova mensagem",
        content: data.content || "Você recebeu uma nova mensagem.",
        conversationId: data.reference_id,
      });
    };

    socket.on("connect", handleConnect);
    socket.on("new_message", handleNewMessage);
    socket.on("message_edited", handleEdited);
    socket.on("message_deleted", handleDeleted);
    socket.on("notification", handleNotification);

    return () => {
      unsubscribeStatus();
      socket.off("connect", handleConnect);
      socket.off("new_message", handleNewMessage);
      socket.off("message_edited", handleEdited);
      socket.off("message_deleted", handleDeleted);
      socket.off("notification", handleNotification);
    };
  }, [ready, token, user?.id]);

  // Carga inicial / troca de conta.
  useEffect(() => {
    if (!ready || !token || !user?.id) return;
    refreshRef.current();
  }, [ready, token, user?.id]);

  // Ao voltar para o app, revalida a sessão e busca mensagens perdidas.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !tokenRef.current) return;

      loadSession().then((session) => {
        if (session?.token && session?.user?.id) {
          refreshRef.current({ silent: true });
        }
      });
    });

    return () => subscription.remove();
  }, [loadSession]);

  // Esconde o aviso de nova mensagem depois de alguns segundos.
  useEffect(() => {
    if (!banner) return undefined;

    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setBanner(null), BANNER_DURATION);

    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [banner]);

  const setActiveConversation = useCallback((conversationId) => {
    activeConversationRef.current = conversationId || null;
  }, []);

  const markConversationReadLocally = useCallback((conversationId) => {
    setConversations((previous) =>
      previous.map((item) =>
        item.conversationId === conversationId
          ? { ...item, unreadCount: 0 }
          : item
      )
    );
  }, []);

  const getConversation = useCallback(
    (conversationId) =>
      conversationsRef.current.find(
        (item) => item.conversationId === conversationId
      ) || null,
    []
  );

  const applyOutgoingPreview = useCallback((conversationId, content) => {
    const createdAt = new Date().toISOString();
    const preview = {
      type: "texto",
      content,
      mine: true,
      isDeleted: false,
      createdAt,
    };

    previewsRef.current.set(conversationId, preview);

    setConversations((previous) => {
      const index = previous.findIndex(
        (item) => item.conversationId === conversationId
      );

      if (index === -1) {
        refreshRef.current({ silent: true });
        return previous;
      }

      const next = [...previous];
      next[index] = { ...next[index], updatedAt: createdAt, preview };
      return sortConversations(next);
    });
  }, []);

  const disconnectChat = useCallback(() => {
    disconnectSocket();
    setStatus("idle");
    setUser(null);
    setToken(null);
    setConversations([]);
    setConversationsError(null);
    setBanner(null);
    previewsRef.current.clear();
    previewFetchesRef.current.clear();
  }, []);

  const reloadSession = useCallback(async () => {
    return loadSession();
  }, [loadSession]);

  const openBannerConversation = useCallback(() => {
    const conversationId = banner?.conversationId;
    setBanner(null);
    if (!conversationId) return;

    const conversation = conversationsRef.current.find(
      (item) => item.conversationId === conversationId
    );

    navigate("ChatScreen", {
      conversationId,
      otherUserId: conversation?.otherUserId,
      otherUserName: conversation?.otherUserName,
      otherUserRole: conversation?.otherUserRole,
    });
  }, [banner]);

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (total, item) => total + (Number(item.unreadCount) || 0),
        0
      ),
    [conversations]
  );

  const value = useMemo(
    () => ({
      ready,
      user,
      token,
      status,
      conversations,
      loadingConversations,
      conversationsError,
      totalUnread,
      refreshConversations,
      getConversation,
      setActiveConversation,
      markConversationReadLocally,
      applyOutgoingPreview,
      expireSession,
      disconnectChat,
      reloadSession,
    }),
    [
      ready,
      user,
      token,
      status,
      conversations,
      loadingConversations,
      conversationsError,
      totalUnread,
      refreshConversations,
      getConversation,
      setActiveConversation,
      markConversationReadLocally,
      applyOutgoingPreview,
      expireSession,
      disconnectChat,
      reloadSession,
    ]
  );

  const bannerTop =
    Platform.OS === "ios" ? 56 : (StatusBar.currentHeight || 24) + 8;

  return (
    <ChatContext.Provider value={value}>
      <View style={styles.root}>
        {children}

        {banner ? (
          <TouchableOpacity
            style={[styles.banner, { top: bannerTop }]}
            activeOpacity={0.9}
            onPress={openBannerConversation}
            accessibilityRole="button"
            accessibilityLabel={`Nova mensagem: ${banner.title}`}
          >
            <View style={styles.bannerIcon}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={20}
                color={colors.white}
              />
            </View>

            <View style={styles.bannerTexts}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {banner.title}
              </Text>
              <Text style={styles.bannerContent} numberOfLines={2}>
                {banner.content}
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="rgba(255,255,255,0.85)"
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat deve ser usado dentro de ChatProvider.");
  }

  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  banner: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.primaryDark,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  bannerTexts: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  bannerContent: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.88)",
  },
});
