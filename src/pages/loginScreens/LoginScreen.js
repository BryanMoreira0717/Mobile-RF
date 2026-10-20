import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, Image, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../theme/colors";
import { useFonts } from "expo-font";
import { Manrope_400Regular, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/axios";
import NavBar from "../../components/NavBar";
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
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold
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
      const data = response.data || {};
      const token = data.token;
      const loggedUser = data.user;
      if (!token) {
        throw new Error("Token não retornado pela API.");
      }
      const roleEsperada = entityType === "empresa" ? "company" : "user";
      if (!loggedUser || ![roleEsperada, "admin"].includes(loggedUser.role)) {
        const abaCorreta = loggedUser?.role === "company" ? "Empresa" : loggedUser?.role === "user" ? "Comprador/Artesão" : null;
        setFeedback({
          visible: true,
          type: "error",
          title: "Tipo de acesso incorreto",
          message: abaCorreta ? `Esta conta pertence à categoria ${abaCorreta}. Selecione essa aba para entrar.` : "Não foi possível identificar o tipo desta conta."
        });
        return;
      }
      await AsyncStorage.multiSet([["@token", String(token)], ["@user", JSON.stringify(loggedUser)]]);
      setFeedback({
        visible: true,
        type: "success",
        title: "Login realizado!",
        message: data.message || `Bem-vindo${loggedUser?.name ? `, ${loggedUser.name}` : ""}!`
      });
    } catch (error) {
      const serverMessage = error.response?.data?.error;
      console.log("Erro no login:", error.response?.data || error.message);
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
  const isCompany = entityType === "empresa";
  return <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.screen}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                <TouchableOpacity style={styles.brand} onPress={() => navigation.navigate("Home")} accessibilityRole="button" accessibilityLabel="Voltar ao início">
                  <View style={styles.brandIcon}>
                    <MaterialCommunityIcons name="repeat" size={30} color={colors.white} />
                  </View>
                  <View>
                    <Text style={styles.brandName}>Reaproveita</Text>
                    <Text style={styles.brandCity}>FRANCA</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.header}>
                  <Text style={styles.eyebrow}>BEM-VINDO DE VOLTA</Text>
                  <Text style={styles.title}>Entre na sua conta</Text>
                  <Text style={styles.subtitle}>
                    Conecte-se a novas oportunidades de reaproveitamento.
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>Como você quer acessar?</Text>
                <View style={styles.tabs} accessibilityRole="tablist">
                  {[{
                  value: "comprador",
                  label: "Comprador/Artesão",
                  icon: "account-outline"
                }, {
                  value: "empresa",
                  label: "Empresa",
                  icon: "domain"
                }].map(option => {
                  const selected = entityType === option.value;
                  return <Pressable key={option.value} style={[styles.tab, selected && styles.tabActive]} onPress={() => setEntityType(option.value)} disabled={loading} accessibilityRole="tab" accessibilityState={{
                    selected,
                    disabled: loading
                  }} accessibilityLabel={option.label}>
                        <MaterialCommunityIcons name={option.icon} size={22} color={selected ? colors.primaryDark : colors.textSecondary} />
                        <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>;
                })}
                </View>

                <View style={styles.accountHint}>
                  <MaterialCommunityIcons name={isCompany ? "domain" : "account-outline"} size={20} color={colors.primaryDark} />
                  <Text style={styles.accountHintText}>
                    {isCompany ? "Use o e-mail cadastrado para sua empresa." : "Use seu e-mail de comprador ou artesão."}
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>E-mail</Text>
                <View style={[styles.inputContainer, focusedField === "email" && styles.inputFocused]}>
                  <MaterialCommunityIcons name="email-outline" size={21} color={colors.textTertiary} />
                  <TextInput style={styles.input} placeholder="seuemail@exemplo.com" placeholderTextColor={colors.textTertiary} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email" maxLength={255} value={user.email} editable={!loading} onChangeText={value => onChange("email", value)} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} accessibilityLabel="E-mail" />
                </View>

                <Text style={styles.fieldLabel}>Senha</Text>
                <View style={[styles.inputContainer, focusedField === "password" && styles.inputFocused]}>
                  <MaterialCommunityIcons name="lock-outline" size={21} color={colors.textTertiary} />
                  <TextInput style={styles.input} placeholder="Digite sua senha" placeholderTextColor={colors.textTertiary} autoCapitalize="none" autoCorrect={false} textContentType="password" autoComplete="current-password" secureTextEntry={!showPassword} value={user.password} editable={!loading} onChangeText={value => onChange("password", value)} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} returnKeyType="go" onSubmitEditing={handleLogin} accessibilityLabel="Senha" />
                  <TouchableOpacity style={styles.visibilityButton} onPress={() => setShowPassword(prev => !prev)} accessibilityRole="button" accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                    <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.forgetPass}>Esqueceu sua senha?</Text>

                <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleLogin} disabled={loading} accessibilityRole="button" accessibilityState={{
                disabled: loading,
                busy: loading
              }}>
                  {loading ? <ActivityIndicator color={colors.white} /> : <>
                      <Text style={styles.buttonText}>Entrar na conta</Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
                    </>}
                </TouchableOpacity>

                {!isCompany && <View style={styles.socialSection}>
                    <Text style={styles.socialCaption}>Outras formas de acesso · em breve</Text>
                    <View style={styles.socialButtons}>
                      <TouchableOpacity style={styles.socialButton} disabled accessibilityLabel="Google, em breve" accessibilityState={{
                    disabled: true
                  }}>
                        <Image source={{
                      uri: "https://developers.google.com/identity/images/g-logo.png"
                    }} style={styles.googleIcon} />
                        <Text style={styles.socialText}>Google</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.socialButton} disabled accessibilityLabel="LinkedIn, em breve" accessibilityState={{
                    disabled: true
                  }}>
                        <MaterialCommunityIcons name="linkedin" size={22} color="#0A66C2" />
                        <Text style={styles.socialText}>LinkedIn</Text>
                      </TouchableOpacity>
                    </View>
                  </View>}

                <View style={styles.registerSection}>
                  <Text style={styles.registerCaption}>Ainda não tem uma conta?</Text>
                  <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate(isCompany ? "RegisterComp1" : "RegisterScreen")} disabled={loading} accessibilityRole="button">
                    <Text style={styles.registerText}>
                      {isCompany ? "Criar conta empresarial" : "Criar minha conta"}
                    </Text>
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
              <MaterialCommunityIcons name={feedback.type === "success" ? "check-circle" : "alert-circle"} size={44} color={feedback.type === "success" ? "#10b981" : "#ef4444"} />
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
    paddingTop: 24,
    paddingBottom: 120
  },
  content: {
    width: "90%",
    maxWidth: 480,
    alignSelf: "center"
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "flex-start"
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  brandName: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.primaryDark
  },
  brandCity: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.accent
  },
  header: {
    marginTop: 32,
    marginBottom: 24
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.primary
  },
  title: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.primaryDark
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary
  },
  sectionLabel: {
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark
  },
  tabs: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 72,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  tabActive: {
    backgroundColor: colors.primaryLight
  },
  tabText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: "center",
    color: colors.textSecondary
  },
  tabTextActive: {
    fontFamily: fonts.bold,
    color: colors.primaryDark
  },
  accountHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    marginBottom: 24,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.primaryLight
  },
  accountHintText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primaryDark
  },
  fieldLabel: {
    marginBottom: 8,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    marginBottom: 16,
    paddingLeft: 16,
    paddingRight: 4,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  inputFocused: {
    borderColor: colors.primary
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary
  },
  visibilityButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  forgetPass: {
    alignSelf: "flex-end",
    marginBottom: 20,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary
  },
  button: {
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 14
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white
  },
  disabled: {
    opacity: 0.7
  },
  socialSection: {
    marginTop: 24
  },
  socialCaption: {
    marginBottom: 12,
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: "center",
    color: colors.textSecondary
  },
  socialButtons: {
    flexDirection: "row",
    gap: 12
  },
  socialButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  googleIcon: {
    width: 20,
    height: 20
  },
  socialText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary
  },
  registerSection: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  registerCaption: {
    marginBottom: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: "center",
    color: colors.textSecondary
  },
  registerButton: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center"
  },
  registerText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: "center",
    color: colors.primaryDark
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.white,
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
    backgroundColor: "#FEF2F2"
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.primaryDark,
    textAlign: "center",
    marginBottom: 8
  },
  modalMessage: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24
  },
  modalButton: {
    width: "100%",
    minHeight: 52,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
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
