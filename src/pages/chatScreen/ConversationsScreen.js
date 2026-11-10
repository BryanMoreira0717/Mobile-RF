import { useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useChat } from "../../contexts/ChatContext";
import ConversationItem from "../../components/chat/ConversationItem";
import {
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
} from "../../components/chat/ChatStates";
import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";

export default function ConversationsScreen({ navigation }) {
  const {
    ready,
    status,
    conversations,
    loadingConversations,
    conversationsError,
    totalUnread,
    refreshConversations,
  } = useChat();

  useFocusEffect(
    useCallback(() => {
      refreshConversations({ silent: true });
    }, [refreshConversations])
  );

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("DashboardScreen");
  }, [navigation]);

  const openConversation = useCallback(
    (conversation) => {
      navigation.navigate("ChatScreen", {
        conversationId: conversation.conversationId,
        otherUserId: conversation.otherUserId,
        otherUserName: conversation.otherUserName,
        otherUserRole: conversation.otherUserRole,
      });
    },
    [navigation]
  );

  const offline = status === "offline";
  const empty = conversations.length === 0;
  const initialLoading = (!ready || loadingConversations) && empty;

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

        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>Mensagens</Text>
          <Text style={styles.headerSubtitle}>
            {totalUnread > 0
              ? `${totalUnread} ${totalUnread === 1 ? "mensagem não lida" : "mensagens não lidas"}`
              : "Suas negociações"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => refreshConversations()}
          disabled={loadingConversations}
          accessibilityRole="button"
          accessibilityLabel="Atualizar conversas"
        >
          <MaterialCommunityIcons
            name="refresh"
            size={22}
            color={loadingConversations ? colors.textTertiary : colors.primaryDark}
          />
        </TouchableOpacity>
      </View>

      {offline && !empty ? (
        <InlineNotice message="Sem conexão. As conversas podem estar desatualizadas." />
      ) : null}

      {conversationsError && !empty ? (
        <InlineNotice
          icon="alert-circle-outline"
          tone="error"
          message={conversationsError}
        />
      ) : null}

      {initialLoading ? (
        <LoadingState label="Carregando conversas..." />
      ) : conversationsError && empty ? (
        <ErrorState
          title="Não foi possível carregar"
          message={conversationsError}
          onRetry={() => refreshConversations()}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationId}
          contentContainerStyle={[
            styles.listContent,
            empty && styles.listContentEmpty,
          ]}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => openConversation(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState
              icon="message-text-outline"
              title="Nenhuma conversa por aqui"
              message="As conversas aparecem quando você entra em contato com uma empresa ou recebe uma mensagem."
              actionLabel="Atualizar"
              onAction={() => refreshConversations()}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={loadingConversations && !empty}
              onRefresh={() => refreshConversations()}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  headerButton: {
    width: 42,
    height: 42,
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
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primaryDark,
  },
  headerSubtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
});
