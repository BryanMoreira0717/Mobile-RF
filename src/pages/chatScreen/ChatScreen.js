import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useChat } from "../../contexts/ChatContext";
import Avatar from "../../components/chat/Avatar";
import ChatComposer from "../../components/chat/ChatComposer";
import MessageBubble from "../../components/chat/MessageBubble";
import {
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
} from "../../components/chat/ChatStates";
import { emitAck, getSocket } from "../../services/socket";
import {
  buildMessageRenderData,
  extractErrorMessage,
  isAuthError,
  mergeMessages,
  normalizeMessage,
  roleLabel,
  sortMessages,
} from "../../services/chat";
import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";

const HISTORY_LIMIT = 50;

function createClientId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatScreen({ navigation, route }) {
  const params = route?.params || {};
  const conversationId = params.conversationId;

  const {
    user,
    status,
    getConversation,
    setActiveConversation,
    markConversationReadLocally,
    applyOutgoingPreview,
    refreshConversations,
    expireSession,
    ready,
  } = useChat();

  const myId = user?.id || null;
  const online = status === "online";

  const knownConversation = conversationId
    ? getConversation(conversationId)
    : null;

  const otherName =
    params.otherUserName || knownConversation?.otherUserName || "Conversa";
  const otherRole =
    params.otherUserRole || knownConversation?.otherUserRole || null;
  const otherPhoto =
    params.otherUserPhoto ?? knownConversation?.otherUserPhoto ?? null;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);

  const listRef = useRef(null);
  const loadRef = useRef(() => {});
  const messagesRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const markConversationAsRead = useCallback(
    (list) => {
      if (!conversationId) return;

      markConversationReadLocally(conversationId);

      const lastIncoming = [...list]
        .reverse()
        .find((message) => !message.mine && !message.isDeleted);

      emitAck(
        "mark_read",
        {
          conversationId,
          ...(lastIncoming?.id ? { upToMessageId: lastIncoming.id } : {}),
        },
        8000
      ).catch(() => {});
    },
    [conversationId, markConversationReadLocally]
  );

  const loadMessages = useCallback(
    async ({ silent = false } = {}) => {
      if (!conversationId || !myId) return;

      if (!silent) setLoading(true);
      setError(null);

      try {
        const response = await emitAck(
          "load_messages",
          { conversationId, limit: HISTORY_LIMIT },
          12000
        );

        const rows = Array.isArray(response?.messages) ? response.messages : [];
        const normalized = rows.map((row) => normalizeMessage(row, myId));

        setMessages((previous) => mergeMessages(previous, normalized));
        markConversationAsRead(normalized);
      } catch (err) {
        if (isAuthError(err)) {
          expireSession();
          return;
        }

        setError(
          extractErrorMessage(err, "Não foi possível carregar as mensagens.")
        );
      } finally {
        setLoading(false);
      }
    },
    [conversationId, myId, expireSession, markConversationAsRead]
  );

  useEffect(() => {
    loadRef.current = loadMessages;
  }, [loadMessages]);

  const joinAndLoad = useCallback(
    async ({ silent = false } = {}) => {
      if (!conversationId || !myId) return;

      try {
        await emitAck("join_conversation", conversationId, 10000);
      } catch (err) {
        if (isAuthError(err)) {
          expireSession();
          return;
        }

        setError(extractErrorMessage(err, "Não foi possível abrir a conversa."));
        setLoading(false);
        return;
      }

      await loadMessages({ silent });
    },
    [conversationId, myId, expireSession, loadMessages]
  );

  // Marca a conversa como ativa (para não contar mensagens como não lidas)
  // e limpa o contador local ao abrir.
  useEffect(() => {
    if (!conversationId) return undefined;

    setActiveConversation(conversationId);
    markConversationReadLocally(conversationId);

    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation, markConversationReadLocally]);

  // Entra na sala e carrega o histórico sempre que a conexão fica disponível.
  useEffect(() => {
    if (!conversationId || !online) return undefined;

    joinAndLoad();

    return undefined;
  }, [conversationId, online, joinAndLoad]);

  // Sem conexão e sem histórico: mostra estado de erro em vez de carregar para sempre.
  useEffect(() => {
    if (status === "offline" && messages.length === 0) {
      setLoading(false);
      setError("Sem conexão com o servidor. Verifique sua internet e tente novamente.");
    }
  }, [status, messages.length]);

  // Eventos em tempo real desta conversa.
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId || !myId) return undefined;

    const handleNewMessage = (raw) => {
      if (!raw || raw.id_conversation !== conversationId) return;

      const message = normalizeMessage(raw, myId);

      setMessages((previous) => {
        const existing = previous.find((item) => item.id === message.id);

        if (existing) {
          return previous.map((item) =>
            item.id === message.id
              ? { ...item, ...message, pending: false, failed: false }
              : item
          );
        }

        // Eco do próprio envio: reaproveita a mensagem otimista em vez de duplicar.
        if (message.mine) {
          const optimistic = previous.find(
            (item) =>
              (item.pending || item.failed) &&
              item.type === "texto" &&
              item.content === message.content
          );

          if (optimistic) {
            return sortMessages(
              previous.map((item) =>
                item.clientId === optimistic.clientId
                  ? {
                      ...message,
                      answeredMessage: optimistic.answeredMessage,
                      clientId: optimistic.clientId,
                    }
                  : item
              )
            );
          }
        }

        return sortMessages([...previous, message]);
      });

      if (!message.mine) {
        markConversationReadLocally(conversationId);
        emitAck(
          "mark_read",
          { conversationId, upToMessageId: message.id },
          8000
        ).catch(() => {});
      }
    };

    const handleEdited = (raw) => {
      if (!raw?.id || raw.id_conversation !== conversationId) return;

      setMessages((previous) =>
        previous.map((item) =>
          item.id === raw.id
            ? {
                ...item,
                content: raw.content,
                editedAt: raw.edited_in || new Date().toISOString(),
                isEdited: true,
              }
            : item
        )
      );
    };

    const handleDeleted = (raw) => {
      if (!raw?.id || raw.id_conversation !== conversationId) return;

      setMessages((previous) =>
        previous.map((item) =>
          item.id === raw.id
            ? {
                ...item,
                content: null,
                deletedAt: raw.deleted_in || new Date().toISOString(),
                isDeleted: true,
              }
            : item
        )
      );
    };

    const handleConnect = () => {
      emitAck("join_conversation", conversationId, 10000)
        .then(() => loadRef.current({ silent: true }))
        .catch(() => {});
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_edited", handleEdited);
    socket.on("message_deleted", handleDeleted);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_edited", handleEdited);
      socket.off("message_deleted", handleDeleted);
      socket.off("connect", handleConnect);
    };
  }, [conversationId, myId, markConversationReadLocally]);

  const sendMessage = useCallback(
    async ({ text, answerId = null, clientId = null }) => {
      const content = String(text || "").trim();
      if (!content || !conversationId || !myId) return;

      const isRetry = Boolean(clientId);
      const localId = clientId || createClientId();

      if (isRetry) {
        setMessages((previous) =>
          previous.map((item) =>
            item.clientId === localId
              ? { ...item, pending: true, failed: false }
              : item
          )
        );
      } else {
        const optimistic = {
          id: localId,
          clientId: localId,
          type: "texto",
          content,
          createdAt: new Date().toISOString(),
          userId: myId,
          conversationId,
          answerId: answerId || null,
          answeredMessage:
            messagesRef.current.find((item) => item.id === answerId) || null,
          isDeleted: false,
          isEdited: false,
          mine: true,
          pending: true,
          failed: false,
        };

        setMessages((previous) => sortMessages([...previous, optimistic]));
      }

      applyOutgoingPreview(conversationId, content);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });

      try {
        const response = await emitAck(
          "send_message",
          {
            conversationId,
            type: "texto",
            content,
            ...(answerId ? { id_answer: answerId } : {}),
          },
          15000
        );

        if (!response?.id) {
          throw new Error("O servidor não confirmou o envio da mensagem.");
        }

        // O eco do socket pode chegar antes do ack; remove a duplicata.
        setMessages((previous) => {
          const withoutEcho = previous.filter(
            (item) => item.clientId === localId || item.id !== response.id
          );

          return withoutEcho.map((item) =>
            item.clientId === localId
              ? { ...item, id: response.id, pending: false, failed: false }
              : item
          );
        });

        refreshConversations({ silent: true });
      } catch (err) {
        setMessages((previous) =>
          previous.map((item) =>
            item.clientId === localId && item.id === localId
              ? { ...item, pending: false, failed: true }
              : item
          )
        );

        if (isAuthError(err)) {
          expireSession();
        }
      }
    },
    [
      conversationId,
      myId,
      applyOutgoingPreview,
      refreshConversations,
      expireSession,
    ]
  );

  const retryMessage = useCallback(
    (message) => {
      if (!message?.clientId) return;
      sendMessage({
        text: message.content,
        answerId: message.answerId,
        clientId: message.clientId,
      });
    },
    [sendMessage]
  );

  const submitEdit = useCallback(
    async (content) => {
      if (!editing?.id) return;

      try {
        await emitAck(
          "edit_message",
          { messageId: editing.id, content },
          15000
        );

        setMessages((previous) =>
          previous.map((item) =>
            item.id === editing.id
              ? {
                  ...item,
                  content,
                  isEdited: true,
                  editedAt: new Date().toISOString(),
                }
              : item
          )
        );

        setEditing(null);
        setDraft("");
        refreshConversations({ silent: true });
      } catch (err) {
        if (isAuthError(err)) {
          expireSession();
          return;
        }

        Alert.alert(
          "Não foi possível editar",
          extractErrorMessage(err, "Tente novamente em instantes.")
        );
      }
    },
    [editing, expireSession, refreshConversations]
  );

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content) return;

    if (editing) {
      submitEdit(content);
      return;
    }

    const answerId =
      replyTo?.id && !replyTo.pending && !replyTo.failed && !replyTo.isDeleted
        ? replyTo.id
        : null;

    setDraft("");
    setReplyTo(null);
    sendMessage({ text: content, answerId });
  }, [draft, editing, replyTo, sendMessage, submitEdit]);

  const confirmDelete = useCallback(
    (message) => {
      Alert.alert(
        "Excluir mensagem",
        "Esta ação não pode ser desfeita. A mensagem ficará marcada como excluída para os dois participantes.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              try {
                await emitAck("delete_message", { messageId: message.id }, 15000);

                setMessages((previous) =>
                  previous.map((item) =>
                    item.id === message.id
                      ? {
                          ...item,
                          content: null,
                          isDeleted: true,
                          deletedAt: new Date().toISOString(),
                        }
                      : item
                  )
                );

                refreshConversations({ silent: true });
              } catch (err) {
                if (isAuthError(err)) {
                  expireSession();
                  return;
                }

                Alert.alert(
                  "Não foi possível excluir",
                  extractErrorMessage(err, "Tente novamente em instantes.")
                );
              }
            },
          },
        ]
      );
    },
    [expireSession, refreshConversations]
  );

  const openOptions = useCallback(
    (message) => {
      if (!message || message.pending) return;

      if (message.failed) {
        Alert.alert(
          "Mensagem não enviada",
          "Deseja tentar enviar esta mensagem novamente?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Tentar novamente", onPress: () => retryMessage(message) },
          ]
        );
        return;
      }

      if (message.isDeleted) return;

      const buttons = [];

      if (message.mine) {
        if (message.type === "texto" && !message.pending && !message.failed) {
          buttons.push({
            text: "Editar",
            onPress: () => {
              setReplyTo(null);
              setEditing(message);
              setDraft(message.content || "");
            },
          });
        }

        buttons.push({
          text: "Excluir",
          style: "destructive",
          onPress: () => confirmDelete(message),
        });
      } else {
        buttons.push({
          text: "Responder",
          onPress: () => {
            setEditing(null);
            setDraft("");
            setReplyTo(message);
          },
        });
      }

      buttons.push({ text: "Cancelar", style: "cancel" });

      Alert.alert("Mensagem", undefined, buttons);
    },
    [confirmDelete, retryMessage]
  );

  const messagesById = useMemo(() => {
    const map = new Map();
    messages.forEach((message) => map.set(message.id, message));
    return map;
  }, [messages]);

  const renderData = useMemo(
    () => buildMessageRenderData(sortMessages(messages)),
    [messages]
  );

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("DashboardScreen");
  }, [navigation]);

  if (!conversationId) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <ErrorState
          title="Conversa inválida"
          message="Não foi possível identificar a conversa. Volte e tente novamente."
          onRetry={goBack}
        />
      </SafeAreaView>
    );
  }

  const offline = status === "offline";
  const showLoading = (loading || !ready) && messages.length === 0;
  const showError = Boolean(error) && messages.length === 0 && !showLoading;

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={colors.primaryDark}
          />
        </TouchableOpacity>

        <Avatar name={otherName} photo={otherPhoto} size={40} />

        <View style={styles.headerTexts}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherName}
          </Text>
          <Text style={styles.headerRole} numberOfLines={1}>
            {otherRole ? roleLabel(otherRole) : "Conversa"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => joinAndLoad()}
          accessibilityRole="button"
          accessibilityLabel="Recarregar mensagens"
        >
          <MaterialCommunityIcons
            name="refresh"
            size={22}
            color={colors.primaryDark}
          />
        </TouchableOpacity>
      </View>

      {offline ? (
        <InlineNotice message="Sem conexão. Você verá as mensagens quando a internet voltar." />
      ) : null}

      {error && messages.length > 0 ? (
        <InlineNotice icon="alert-circle-outline" tone="error" message={error} />
      ) : null}

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {showLoading ? (
          <LoadingState label="Carregando mensagens..." />
        ) : showError ? (
          <ErrorState
            title="Não foi possível abrir"
            message={error}
            onRetry={() => joinAndLoad()}
          />
        ) : renderData.length === 0 ? (
          <EmptyState
            icon="message-text-outline"
            title="Comece a conversa"
            message="Envie uma mensagem para combinar detalhes da negociação."
          />
        ) : (
          <FlatList
            ref={listRef}
            data={renderData}
            inverted
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              if (item.type === "day") {
                return (
                  <View style={styles.day}>
                    <Text style={styles.dayText}>{item.label}</Text>
                  </View>
                );
              }

              const message = item.message;
              const answered =
                (message.answerId && messagesById.get(message.answerId)) ||
                message.answeredMessage ||
                null;

              return (
                <MessageBubble
                  message={message}
                  answered={answered}
                  otherName={otherName}
                  onOptions={() => openOptions(message)}
                  onRetry={() => retryMessage(message)}
                />
              );
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          onCancelReply={() => setReplyTo(null)}
          onCancelEdit={() => {
            setEditing(null);
            setDraft("");
          }}
          replyTo={
            replyTo
              ? {
                  ...replyTo,
                  author: replyTo.mine ? "você" : otherName,
                }
              : null
          }
          editing={editing}
          offline={offline}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  headerTexts: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryDark,
  },
  headerRole: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  body: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  day: {
    alignSelf: "center",
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },
  dayText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.2,
    color: colors.primaryDark,
  },
});
