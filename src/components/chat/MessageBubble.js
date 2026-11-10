import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { formatTime } from "../../services/chat";
import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";

function answeredPreview(answered) {
  if (!answered) return "Mensagem respondida";
  if (answered.isDeleted) return "Mensagem excluída";
  return answered.content || "Mensagem";
}

export default function MessageBubble({
  message,
  answered,
  otherName,
  onOptions,
  onRetry,
}) {
  const mine = Boolean(message.mine);
  const failed = Boolean(message.failed);
  const pending = Boolean(message.pending);
  const deleted = Boolean(message.isDeleted);
  const time = formatTime(message.createdAt);
  const author = mine ? "Você" : (otherName || "Participante");

  const accessibilityLabel = [
    `${author} disse às ${time || "horário não disponível"}`,
    deleted ? "mensagem excluída" : message.content || "",
    message.isEdited && !deleted ? "mensagem editada" : "",
    pending ? "enviando" : "",
    failed ? "não enviada, toque para tentar novamente" : "",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      {mine && !deleted && !pending && !failed ? (
        <TouchableOpacity
          style={styles.options}
          onPress={onOptions}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Opções da mensagem"
        >
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={16}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      ) : null}

      <Pressable
        onLongPress={deleted ? undefined : onOptions}
        delayLongPress={350}
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleOther,
          failed && styles.bubbleFailed,
          deleted && !mine && styles.bubbleDeleted,
        ]}
        accessibilityHint="Mantenha pressionado para ver as opções da mensagem"
      >
        {message.answerId ? (
          <View
            style={[
              styles.answer,
              mine ? styles.answerMine : styles.answerOther,
            ]}
          >
            <Text
              style={[styles.answerAuthor, mine && styles.textMine]}
              numberOfLines={1}
            >
              {answered?.mine ? "Você" : (otherName || "Mensagem")}
            </Text>
            <Text
              style={[
                styles.answerText,
                mine ? styles.textMineSoft : styles.answerTextOther,
              ]}
              numberOfLines={2}
            >
              {answeredPreview(answered)}
            </Text>
          </View>
        ) : null}

        <Text
          style={[
            styles.content,
            mine ? styles.textMine : styles.textOther,
            deleted && styles.deletedText,
          ]}
          accessibilityLabel={accessibilityLabel}
        >
          {deleted ? "Mensagem excluída" : (message.content || "")}
        </Text>

        <View style={styles.meta}>
          {pending ? (
            <MaterialCommunityIcons
              name="clock-outline"
              size={11}
              color={mine ? "rgba(255,255,255,0.8)" : colors.textSecondary}
            />
          ) : null}

          <Text style={[styles.time, mine && styles.textMineSoft]}>
            {pending ? "Enviando..." : time}
          </Text>

          {message.isEdited && !deleted ? (
            <Text style={[styles.edited, mine && styles.textMineSoft]}>
              editada
            </Text>
          ) : null}
        </View>

        {failed ? (
          <TouchableOpacity
            style={styles.retry}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Tentar enviar novamente"
          >
            <MaterialCommunityIcons
              name="refresh"
              size={13}
              color="#b91c1c"
            />
            <Text style={styles.retryText}>Não enviada · tentar novamente</Text>
          </TouchableOpacity>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginVertical: 4,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },
  options: {
    width: 26,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomLeftRadius: 4,
  },
  bubbleFailed: {
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  bubbleDeleted: {
    backgroundColor: colors.background,
  },
  content: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  textMine: {
    color: colors.white,
  },
  textMineSoft: {
    color: "rgba(255,255,255,0.86)",
  },
  textOther: {
    color: colors.textPrimary,
  },
  deletedText: {
    fontStyle: "italic",
    color: colors.textSecondary,
  },
  answer: {
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  answerMine: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderLeftColor: "rgba(255,255,255,0.7)",
  },
  answerOther: {
    backgroundColor: colors.primaryLight,
    borderLeftColor: colors.primary,
  },
  answerAuthor: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primaryDark,
  },
  answerText: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  answerTextOther: {
    color: colors.textSecondary,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
  },
  edited: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
  },
  retry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(185,28,28,0.25)",
  },
  retryText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#b91c1c",
  },
});
