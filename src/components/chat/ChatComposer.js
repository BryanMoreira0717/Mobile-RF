import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";

const MAX_LENGTH = 2000;

function contextPreview(message) {
  if (!message) return "";
  if (message.isDeleted) return "Mensagem excluída";
  return message.content || "Mensagem";
}

export default function ChatComposer({
  value,
  onChangeText,
  onSend,
  onCancelReply,
  onCancelEdit,
  replyTo,
  editing,
  disabled = false,
  offline = false,
}) {
  const canSend = Boolean(value && value.trim()) && !disabled;
  const mode = editing ? "edit" : replyTo ? "reply" : null;

  return (
    <View style={styles.container}>
      {mode ? (
        <View style={styles.context}>
          <View style={styles.contextBar} />

          <View style={styles.contextTexts}>
            <Text style={styles.contextTitle}>
              {mode === "edit"
                ? "Editando mensagem"
                : `Respondendo ${replyTo?.mine ? "a você" : (replyTo?.author || "mensagem")}`}
            </Text>
            <Text style={styles.contextPreview} numberOfLines={1}>
              {contextPreview(mode === "edit" ? editing : replyTo)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.contextClose}
            onPress={mode === "edit" ? onCancelEdit : onCancelReply}
            accessibilityRole="button"
            accessibilityLabel={
              mode === "edit" ? "Cancelar edição" : "Cancelar resposta"
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={
            offline
              ? "Sem conexão no momento..."
              : mode === "edit"
                ? "Edite sua mensagem"
                : "Escreva uma mensagem"
          }
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={MAX_LENGTH}
          editable={!disabled}
          textAlignVertical="center"
          accessibilityLabel="Campo de mensagem"
        />

        <TouchableOpacity
          style={[styles.send, canSend ? styles.sendActive : styles.sendDisabled]}
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={mode === "edit" ? "Salvar edição" : "Enviar mensagem"}
          accessibilityState={{ disabled: !canSend }}
        >
          <MaterialCommunityIcons
            name={mode === "edit" ? "check" : "send"}
            size={20}
            color={canSend ? colors.white : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.counter}>
        {value ? `${value.length}/${MAX_LENGTH}` : " "}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  context: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },
  contextBar: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  contextTexts: {
    flex: 1,
    minWidth: 0,
  },
  contextTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primaryDark,
  },
  contextPreview: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  contextClose: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendActive: {
    backgroundColor: colors.primary,
  },
  sendDisabled: {
    backgroundColor: colors.borderLight,
  },
  counter: {
    marginTop: 2,
    paddingRight: 4,
    fontFamily: fonts.regular,
    fontSize: 9,
    color: colors.textTertiary,
    textAlign: "right",
  },
});
