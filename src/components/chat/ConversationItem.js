import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Avatar from "./Avatar";
import {
  formatListTime,
  previewText,
  roleLabel,
} from "../../services/chat";
import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";

export default function ConversationItem({ conversation, onPress }) {
  const unread = Number(conversation.unreadCount) > 0;
  const preview = previewText(conversation);
  const role = roleLabel(conversation.otherUserRole);
  const time = formatListTime(conversation.updatedAt);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${conversation.otherUserName}. ${role}. ${preview}.${
        unread ? ` ${conversation.unreadCount} mensagens não lidas.` : ""
      }`}
    >
      <Avatar
        name={conversation.otherUserName}
        photo={conversation.otherUserPhoto}
        size={50}
      />

      <View style={styles.content}>
        <View style={styles.row}>
          <Text
            style={[styles.name, unread && styles.nameUnread]}
            numberOfLines={1}
          >
            {conversation.otherUserName}
          </Text>

          <Text style={styles.time} numberOfLines={1}>
            {time}
          </Text>
        </View>

        <Text style={styles.role} numberOfLines={1}>
          {role}
        </Text>

        <View style={styles.row}>
          <Text
            style={[styles.preview, unread && styles.previewUnread]}
            numberOfLines={1}
          >
            {preview}
          </Text>

          {unread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  nameUnread: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  role: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  preview: {
    flex: 1,
    minWidth: 0,
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  previewUnread: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.white,
  },
});
