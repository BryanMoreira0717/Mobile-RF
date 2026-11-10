import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";

export function LoadingState({ label = "Carregando..." }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon = "message-text-outline",
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <View style={styles.center}>
      <View style={styles.icon}>
        <MaterialCommunityIcons
          name={icon}
          size={30}
          color={colors.primaryDark}
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.label}>{message}</Text> : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.action}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function ErrorState({ title = "Algo deu errado", message, onRetry }) {
  return (
    <View style={styles.center}>
      <View style={[styles.icon, styles.iconError]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={30}
          color="#b91c1c"
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.label}>{message}</Text> : null}

      {onRetry ? (
        <TouchableOpacity
          style={styles.action}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
        >
          <Text style={styles.actionText}>Tentar novamente</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function InlineNotice({ icon = "wifi-off", message, tone = "warning" }) {
  const isError = tone === "error";

  return (
    <View style={[styles.notice, isError && styles.noticeError]}>
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={isError ? "#b91c1c" : colors.accent}
      />
      <Text style={[styles.noticeText, isError && styles.noticeTextError]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    marginBottom: 16,
  },
  iconError: {
    backgroundColor: "#FEE2E2",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.primaryDark,
    textAlign: "center",
  },
  label: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
  action: {
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFBEB",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  noticeError: {
    backgroundColor: "#FEF2F2",
    borderBottomColor: "#FECACA",
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: "#92400E",
  },
  noticeTextError: {
    color: "#991B1B",
  },
});
