import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, Modal, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../theme/colors";
import { useFonts } from "expo-font";
import { Manrope_400Regular, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { Gelasio_400Regular, Gelasio_400Regular_Italic, Gelasio_700Bold } from "@expo-google-fonts/gelasio";
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/axios";
import { disconnectSocket } from "../../services/socket";
import NavBar from "../../components/NavBar";
import Brand from "../../components/Brand";
import GoogleButton from "../../components/GoogleButton";
import { pegarTokenGoogle } from "../../services/google";
export default function LoginScreen({
  navigation
}) {
  const [entityType, setEntityType] = useState("comprador"); // ou "empresa"
  const [user, setUser] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [feedback, setFeedback] = useState({
    visible: false,
    type: "success",
    title: "",
    message: ""
  });
  // Conta criada sem confirmar o e-mail: pede o código antes de entrar.
  const [verifyCode, setVerifyCode] = useState({
    visible: false,
    id: null,
    email: "",
    code: ""
  });
  const [verifying, setVerifying] = useState(false);
  // "Lembrar de mim" do site: guarda o e-mail para o próximo acesso.
  const [remember, setRemember] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem("@rememberedEmail").then(email => {
      if (email) {
        setRemember(true);
        setUser(prev => ({
          ...prev,
          email
        }));
      }
    }).catch(() => {});
  }, []);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Gelasio_400Regular,
    Gelasio_400Regular_Italic,
    Gelasio_700Bold
  });
  if (!fontsLoaded) {
    return null;
  }
  function onChange(name, value) {
    setUser(prev => ({
      ...prev,
      [name]: value
    }));
  }
  function closeFeedback() {
    const wasSuccess = feedback.type === "success";
    setFeedback(prev => ({
      ...prev,
      visible: false
    }));
    if (wasSuccess) {
      navigation.reset({
        index: 0,
        routes: [{
          name: "DashboardScreen"
        }]
      });
    }
  }
  // Resposta do login (senha ou Google): confere o perfil e salva a sessão.
  async function iniciarSessao(data) {
    const token = data.token;
    const loggedUser = data.user;
    if (!token || !loggedUser || !loggedUser.id) {
      throw new Error("A API não retornou os dados necessários para iniciar a sessão.");
    }
    const roleEsperada = entityType === "empresa" ? "company" : "user";
    if (![roleEsperada, "admin"].includes(loggedUser.role)) {
      const abaCorreta = loggedUser.role === "company" ? "Empresa" : loggedUser.role === "user" ? "Comprador/Artesão" : null;
      setFeedback({
        visible: true,
        type: "error",
        title: "Tipo de acesso incorreto",
        message: abaCorreta ? `Esta conta pertence à categoria ${abaCorreta}. Selecione essa aba para entrar.` : "Não foi possível identificar o tipo desta conta."
      });
      return;
    }
    // Salva a sessão inicial. O dashboard consulta os dados atuais da conta.
    await AsyncStorage.multiSet([["@token", String(token)], ["@user", JSON.stringify(loggedUser)]]);
    // Se havia chat de outra conta aberto, a próxima conexão usa o token novo.
    disconnectSocket();
    // Senha temporária (ex.: admin criado por outro admin): cria a senha antes de entrar.
    if (data.mustChangePassword) {
      navigation.reset({
        index: 0,
        routes: [{
          name: "FirstAccessScreen"
        }]
      });
      return;
    }
    setFeedback({
      visible: true,
      type: "success",
      title: "Login realizado!",
      message: data.message || `Bem-vindo${loggedUser.name ? `, ${loggedUser.name}` : ""}!`
    });
  }
  async function handleGoogle() {
    if (loading) return;
    try {
      setLoading(true);
      const idToken = await pegarTokenGoogle();
      // Fechou a escolha de conta: não é erro.
      if (!idToken) return;
      const response = await api.loginGoogle(idToken, entityType === "empresa" ? "company" : "user");
      await iniciarSessao(response.data || {});
    } catch (error) {
      console.log("Erro no login com Google:", error.response?.data || error.message);
      // Empresa sem cadastro: o cadastro de empresa também tem o Google.
      if (error.response?.status === 404 && entityType === "empresa") {
        setFeedback({
          visible: true,
          type: "error",
          title: "Empresa não cadastrada",
          message: "Esta conta Google ainda não tem empresa. Use \"Faça parte da rede\" e cadastre a empresa com Google."
        });
        return;
      }
      setFeedback({
        visible: true,
        type: "error",
        title: "Não foi possível entrar com Google",
        message: error.response?.data?.error || error.message || "Tente novamente."
      });
    } finally {
      setLoading(false);
    }
  }
  async function handleLogin() {
    if (loading) return;
    if (!user.email.trim() || !user.password) {
      setFeedback({
        visible: true,
        type: "error",
        title: "Faltam informações",
        message: "Informe e-mail e senha para entrar."
      });
      return;
    }
    try {
      setLoading(true);
      const response = await api.login({
        email: user.email.trim(),
        password: user.password
      });
      if (remember) {
        await AsyncStorage.setItem("@rememberedEmail", user.email.trim());
      } else {
        await AsyncStorage.removeItem("@rememberedEmail");
      }
      await iniciarSessao(response.data || {});
    } catch (error) {
      const serverMessage = error.response?.data?.error;
      console.log("Erro no login:", error.response?.data || error.message);
      // Senha certa, mas o e-mail ainda não foi confirmado: abre o código.
      if (error.response?.data?.code === "EMAIL_VERIFICATION_REQUIRED" && error.response.data.verification?.id) {
        openVerifyCode(error.response.data.verification);
        return;
      }
      setFeedback({
        visible: true,
        type: "error",
        title: "Não foi possível entrar",
        message: serverMessage || error.message || "Verifique e-mail e senha e tente novamente."
      });
    } finally {
      setLoading(false);
    }
  }
  // O código do cadastro pode ter expirado (10 min): já manda um novo.
  async function openVerifyCode(verification) {
    setVerifyCode({
      visible: true,
      id: verification.id,
      email: verification.email || user.email.trim(),
      code: ""
    });
    try {
      await api.sendCode(verification.id);
    } catch (error) {
      // 429 = um código foi enviado há menos de 30s; o do e-mail ainda vale.
      console.log("Erro ao enviar código:", error.response?.data || error.message);
    }
  }
  async function resendCode() {
    if (!verifyCode.id) return;
    try {
      await api.sendCode(verifyCode.id);
      Alert.alert("Código reenviado", "Confira seu e-mail (e a caixa de spam).");
    } catch (error) {
      console.log("Erro ao reenviar código:", error.response?.data || error.message);
      Alert.alert("Erro", String(error.response?.data?.error || "Não foi possível reenviar o código."));
    }
  }
  async function verifyAccount() {
    if (verifying) return;
    if (!/^\d{6}$/.test(verifyCode.code)) {
      Alert.alert("Código incompleto", "Informe os 6 dígitos enviados para o seu e-mail.");
      return;
    }
    try {
      setVerifying(true);
      await api.verifyCode({
        id: verifyCode.id,
        code: verifyCode.code
      });
      setVerifyCode(prev => ({
        ...prev,
        visible: false,
        code: ""
      }));
      // Conta ativada: entra direto com o e-mail e a senha já digitados.
      handleLogin();
    } catch (error) {
      console.log("Erro ao verificar conta:", error.response?.data || error.message);
      Alert.alert("Erro", String(error.response?.data?.error || error.response?.data?.message || "Não foi possível verificar o código."));
    } finally {
      setVerifying(false);
    }
  }
  const isCompany = entityType === "empresa";
  return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.screen}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
              {/* Cabeçalho do login do site: marca + voltar ao início */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate("Home")} accessibilityRole="button" accessibilityLabel="Voltar ao início">
                  <Brand />
                </TouchableOpacity>
                <TouchableOpacity style={styles.homeLink} onPress={() => navigation.navigate("Home")} accessibilityRole="button">
                  <MaterialCommunityIcons name="arrow-left" size={16} color={colors.primaryDark} />
                  <Text style={styles.homeLinkText}>Voltar ao início</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.eyebrow}>Seu espaço na rede</Text>
                <Text style={styles.title}>
                  Bom ter você{"\n"}<Text style={styles.titleEm}>de volta.</Text>
                </Text>
                <Text style={styles.subtitle}>Entre com os dados da sua conta.</Text>

                <Text style={styles.sectionLabel}>Como você participa?</Text>
                <View style={styles.tabs} accessibilityRole="tablist">
                  {[{
                  value: "empresa",
                  label: "Empresa"
                }, {
                  value: "comprador",
                  label: "Comprador / Artesão"
                }].map(option => {
                  const selected = entityType === option.value;
                  return <Pressable key={option.value} style={[styles.tab, selected && styles.tabActive]} onPress={() => setEntityType(option.value)} disabled={loading} accessibilityRole="tab" accessibilityState={{
                    selected,
                    disabled: loading
                  }} accessibilityLabel={option.label}>
                        <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                          {option.label}
                        </Text>
                        {selected && <MaterialCommunityIcons name="check" size={18} color={colors.primaryDark} />}
                      </Pressable>;
                })}
                </View>
                <Text style={styles.accountHint}>
                  {isCompany ? "Acesse o espaço da sua empresa." : "Acesse seu espaço de comprador ou artesão."}
                </Text>

                <Text style={styles.fieldLabel}>{isCompany ? "E-mail da empresa" : "E-mail"}</Text>
                <View style={[styles.inputContainer, focusedField === "email" && styles.inputFocused]}>
                  <TextInput style={styles.input} placeholder="Seu e-mail de cadastro" placeholderTextColor={colors.textTertiary} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email" maxLength={255} value={user.email} editable={!loading} onChangeText={value => onChange("email", value)} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} accessibilityLabel="E-mail" />
                </View>

                <Text style={styles.fieldLabel}>Senha</Text>
                <View style={[styles.inputContainer, focusedField === "password" && styles.inputFocused]}>
                  <TextInput style={styles.input} placeholder="Digite sua senha" placeholderTextColor={colors.textTertiary} autoCapitalize="none" autoCorrect={false} textContentType="password" autoComplete="current-password" secureTextEntry={!showPassword} value={user.password} editable={!loading} onChangeText={value => onChange("password", value)} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} returnKeyType="go" onSubmitEditing={handleLogin} accessibilityLabel="Senha" />
                  <TouchableOpacity style={styles.visibilityButton} onPress={() => setShowPassword(prev => !prev)} accessibilityRole="button" accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                    <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionsRow}>
                  <Pressable style={styles.rememberButton} onPress={() => setRemember(prev => !prev)} disabled={loading} accessibilityRole="checkbox" accessibilityState={{
                  checked: remember
                }}>
                    <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                      {remember && <MaterialCommunityIcons name="check" size={14} color={colors.white} />}
                    </View>
                    <Text style={styles.rememberText}>Lembrar de mim</Text>
                  </Pressable>

                  <TouchableOpacity style={styles.forgetButton} onPress={() => navigation.navigate("ForgotPasswordScreen")} disabled={loading} accessibilityRole="button">
                    <Text style={styles.forgetPass}>Esqueceu a senha?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleLogin} disabled={loading} accessibilityRole="button" accessibilityState={{
                disabled: loading,
                busy: loading
              }}>
                  {loading ? <ActivityIndicator color={colors.white} /> : <>
                      <Text style={styles.buttonText}>Entrar na minha conta</Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
                    </>}
                </TouchableOpacity>


                <GoogleButton onPress={handleGoogle} disabled={loading} />

                <View style={styles.registerSection}>
                  <Text style={styles.registerCaption}>Ainda não tem uma conta?</Text>
                  <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate(isCompany ? "RegisterComp1" : "RegisterScreen")} disabled={loading} accessibilityRole="button">
                    <Text style={styles.registerText}>Faça parte da rede</Text>
                    <MaterialCommunityIcons name="arrow-top-right" size={16} color={colors.primaryDark} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            <NavBar estagio="visitante" ativo="inicio" onNavigate={() => navigation.navigate("Home")} />
          </View>
        </TouchableWithoutFeedback>
      <Modal visible={feedback.visible} transparent animationType="fade" onRequestClose={closeFeedback}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconCircle, feedback.type === "success" ? styles.modalIconSuccess : styles.modalIconError]}>
              <MaterialCommunityIcons name={feedback.type === "success" ? "check-circle" : "alert-circle"} size={44} color={feedback.type === "success" ? colors.primary : colors.error} />
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

      {/* Confirmação do e-mail que ficou pendente no cadastro */}
      <Modal visible={verifyCode.visible} transparent animationType="fade" onRequestClose={() => setVerifyCode(prev => ({
        ...prev,
        visible: false
      }))}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconCircle, styles.modalIconSuccess]}>
              <MaterialCommunityIcons name="email-check-outline" size={44} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Confirme seu e-mail</Text>
            <Text style={styles.modalMessage}>
              Sua conta ainda não foi ativada. Enviamos um código de 6 dígitos para {verifyCode.email}.
            </Text>
            <View style={[styles.inputContainer, styles.codeContainer]}>
              <TextInput style={[styles.input, styles.codeInput]} placeholder="000000" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} value={verifyCode.code} editable={!verifying} onChangeText={value => setVerifyCode(prev => ({
              ...prev,
              code: value.replace(/\D/g, "")
            }))} onSubmitEditing={verifyAccount} accessibilityLabel="Código de verificação" />
            </View>
            <TouchableOpacity style={[styles.modalButton, verifying && styles.disabled]} onPress={verifyAccount} disabled={verifying}>
              {verifying ? <ActivityIndicator color={colors.white} /> : <Text style={styles.modalButtonText}>Confirmar e entrar</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.codeLink} onPress={resendCode} disabled={verifying}>
              <Text style={styles.forgetPass}>Não recebeu? Reenviar código</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.codeLink} onPress={() => setVerifyCode(prev => ({
            ...prev,
            visible: false
          }))} disabled={verifying}>
              <Text style={styles.rememberText}>Agora não</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24
  },
  homeLink: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  homeLinkText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.primaryDark
  },
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 26,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white
  },
  eyebrow: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textSecondary
  },
  title: {
    marginTop: 16,
    fontFamily: fonts.extraBold,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.6,
    color: colors.primaryDark
  },
  titleEm: {
    fontFamily: fonts.serifItalic,
    fontSize: 42,
    letterSpacing: -1.2
  },
  subtitle: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary
  },
  sectionLabel: {
    marginTop: 26,
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary
  },
  tabs: {
    flexDirection: "row",
    gap: 8
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white
  },
  tabActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  tabText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary
  },
  tabTextActive: {
    fontFamily: fonts.bold,
    color: colors.primaryDark
  },
  accountHint: {
    marginTop: 10,
    marginBottom: 22,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary
  },
  fieldLabel: {
    marginBottom: 9,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    marginBottom: 20,
    paddingLeft: 14,
    paddingRight: 4,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  inputFocused: {
    borderColor: colors.primary
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textPrimary
  },
  visibilityButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: -6,
    marginBottom: 16
  },
  rememberButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center"
  },
  checkboxChecked: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryDark
  },
  rememberText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary
  },
  forgetButton: {
    minHeight: 40,
    justifyContent: "center"
  },
  forgetPass: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.primaryDark,
    textDecorationLine: "underline"
  },
  button: {
    minHeight: 54,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryDark,
    borderRadius: 8
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white
  },
  disabled: {
    opacity: 0.7
  },
  registerSection: {
    marginTop: 26,
    paddingTop: 22,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  registerCaption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary
  },
  registerButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  registerText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryDark,
    textDecorationLine: "underline"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,61,46,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 24,
    alignItems: "center"
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  modalIconSuccess: {
    backgroundColor: colors.primaryLight
  },
  modalIconError: {
    backgroundColor: colors.errorLight
  },
  modalTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.primaryDark,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 30
  },
  modalMessage: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24
  },
  codeContainer: {
    width: "100%",
    marginBottom: 16
  },
  codeInput: {
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: 8
  },
  codeLink: {
    marginTop: 14,
    alignItems: "center"
  },
  modalButton: {
    width: "100%",
    minHeight: 52,
    padding: 16,
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  modalButtonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: "center"
  }
});
