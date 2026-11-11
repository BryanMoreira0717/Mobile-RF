import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "../theme/colors";
import { fonts } from "../theme/fonts";
import { googleDisponivel } from "../services/google";

// Botão "Continuar com Google" do login e dos cadastros.
// No Expo Go o Google não existe: o botão aparece desativado com o aviso.
export default function GoogleButton({ label = "Continuar com Google", legenda = "ou continue com", onPress, disabled }) {
  const bloqueado = disabled || !googleDisponivel;

  return (
    <View style={styles.section}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.caption}>{legenda}</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity
        style={[styles.button, bloqueado && styles.disabled]}
        onPress={onPress}
        disabled={bloqueado}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: bloqueado }}
      >
        <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
        <Text style={styles.text}>{label}</Text>
      </TouchableOpacity>
      {!googleDisponivel && <Text style={styles.hint}>Disponível no app instalado (não funciona no Expo Go).</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  button: {
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  hint: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: "center",
    color: colors.textSecondary,
  },
});
