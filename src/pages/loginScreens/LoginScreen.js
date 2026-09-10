import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator
} from "react-native";
import colors from "../../theme/colors";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/axios";

export default function LoginScreen({ navigation }) {
  const [entityType, setEntityType] = useState("comprador"); // ou "empresa"
  const [user, setUser] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, type: "success", title: "", message: "" });

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  function onChange(name, value) {
    setUser({ ...user, [name]: value });
  }

  function closeFeedback() {
    const wasSuccess = feedback.type === "success";
    setFeedback((prev) => ({ ...prev, visible: false }));
    if (wasSuccess) {
      navigation.reset({ index: 0, routes: [{ name: "DashboardScreen" }] });
    }
  }

  async function handleLogin() {
    if (!user.email.trim() || !user.password) {
      setFeedback({
        visible: true,
        type: "error",
        title: "Faltam informações",
        message: "Informe e-mail e senha para entrar.",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.login({ email: user.email.trim(), password: user.password });
      const data = response.data || {};

      const token = data.token
      const loggedUser = data.user

      if (!token) {
        throw new Error("Token não retornado pela API.");
      }

      await AsyncStorage.multiSet([
        ["@token", String(token)],
        ["@user", JSON.stringify(loggedUser)],
      ]);

      setFeedback({
        visible: true,
        type: "success",
        title: "Login realizado!",
        message: data.message || `Bem-vindo${loggedUser?.name ? `, ${loggedUser.name}` : ""}!`,
      });
    } catch (error) {
      const serverMessage = error.response?.data?.error;
      console.log("Erro no login:", error.response?.data || error.message);
      setFeedback({
        visible: true,
        type: "error",
        title: "Não foi possível entrar",
        message: serverMessage || error.message || "Verifique e-mail e senha e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.background}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.circle}>
            <MaterialCommunityIcons
              name="repeat"
              size={50}
              color={colors.white}
            />
          </View>
          <Text style={styles.title}>Reaproveita</Text>
          <Text style={styles.subtitle}>FRANCA</Text>

          <View style={styles.container}>
            <Pressable
              style={[
                styles.option,
                entityType === "empresa" && styles.optionActive,
              ]}
              onPress={() => setEntityType("empresa")}
            >
              <Text
                style={[
                  styles.text,
                  entityType === "empresa" && styles.textActive,
                ]}
              >
                Empresa
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.option,
                entityType === "comprador" && styles.optionActive,
              ]}
              onPress={() => setEntityType("comprador")}
            >
              <Text
                style={[
                  styles.text,
                  entityType === "comprador" && styles.textActive,
                ]}
              >
                Comprador/Artesão
              </Text>
            </Pressable>
          </View>

          {entityType === "comprador" && (
            <View style={styles.compradorLogin}>
              <View style={styles.buttonsAuth}>
              <TouchableOpacity style={styles.buttonAuth}>
                <Image
                  source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                  style={{ width: 35, height: 35 }}
                />
              </TouchableOpacity>
                <TouchableOpacity style={styles.buttonAuth}>
                  <MaterialCommunityIcons
                    name="linkedin"
                    size={40}
                    color="blue"
                  />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Email: "
                autoCapitalize="none"
                keyboardType="email-address"
                maxLength={255}
                placeholderTextColor={colors.textTertiary}
                value={user.email}
                onChangeText={(value) => onChange("email", value)}
              />

              <TextInput
                style={styles.input}
                autoCapitalize="none"
                placeholder="Senha: "
                secureTextEntry
                placeholderTextColor={colors.textTertiary}
                value={user.password}
                onChangeText={(value) => onChange("password", value)}
              />

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>

          )}
          {entityType === "empresa" && (
            <View style={styles.compradorLogin}>
              <TextInput
                  style={styles.input}
                  placeholder="Email: "
                  autoCapitalize="none"
                  keyboardType="email-address"
                  maxLength={255}
                  placeholderTextColor={colors.textTertiary}
                  value={user.email}
                  onChangeText={(value) => onChange("email", value)}
                />

                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  placeholder="Senha: "
                  secureTextEntry
                  placeholderTextColor={colors.textTertiary}
                  value={user.password}
                  onChangeText={(value) => onChange("password", value)}
                />

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}              
          <Text style={styles.forgetPass}>Esqueceu sua Senha ?</Text>

          {entityType==="empresa" ? (
            <Text style={styles.createAccount} onPress={() => navigation.navigate("RegisterComp1")}>Não tem uma conta? <Text style={styles.createAccountEmphasis}>Criar conta empresarial</Text></Text>
          ) : (
            <Text style={styles.createAccount} onPress={() => navigation.navigate("RegisterScreen")}>Não tem uma conta? <Text style={styles.createAccountEmphasis}>Criar conta</Text></Text>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>

      <Modal
        visible={feedback.visible}
        transparent
        animationType="fade"
        onRequestClose={closeFeedback}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconCircle,
                feedback.type === "success" ? styles.modalIconSuccess : styles.modalIconError,
              ]}
            >
              <MaterialCommunityIcons
                name={feedback.type === "success" ? "check-circle" : "alert-circle"}
                size={44}
                color={feedback.type === "success" ? "#10b981" : "#ef4444"}
              />
            </View>
            <Text style={styles.modalTitle}>{feedback.title}</Text>
            <Text style={styles.modalMessage}>{feedback.message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={closeFeedback}>
              <Text style={styles.modalButtonText}>
                {feedback.type === "success" ? "Continuar" : "Entendi"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flexGrow: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingVertical: 40,
  },
  circle: {
    width: 69,
    height: 69,
    borderRadius: 34.5,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    marginTop: 12,
  },
  subtitle: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  container: {
    flexDirection: "row",
    width: "90%",
    marginTop: 24,
    backgroundColor: colors.borderLight,
    borderRadius: 16,
    padding: 4,
  },
  option: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  optionActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.primaryDark,
  },
  compradorLogin: {
    width: "100%",
    alignItems: "center",
  },
  buttonsAuth: {
    flexDirection: "row",
    marginTop: 24,
    gap: 16,
    marginBottom: 12,
  },
  buttonAuth: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
  },
  input: {
    width: "90%",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  button: {
    width: "90%",
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: colors.primary,
    borderRadius: 15,
    justifyContent:"center",
    alignItems:"center"
  },
  buttonText: {
    color:"white",
    fontFamily:fonts.bold
  },
  forgetPass: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    marginTop: 10
  },
  createAccount: {
    marginTop: 25,
    fontFamily: fonts.semiBold,
    fontSize:15
  },
  createAccountEmphasis: {
    fontFamily:fonts.bold,
    textDecorationLine: "underline"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalIconSuccess: {
    backgroundColor: "#ECFDF5",
  },
  modalIconError: {
    backgroundColor: "#FEF2F2",
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  modalMessage: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});