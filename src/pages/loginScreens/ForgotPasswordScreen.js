import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useFonts } from "expo-font";
import {
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold
} from "@expo-google-fonts/manrope";
import {
    Gelasio_400Regular,
    Gelasio_400Regular_Italic,
    Gelasio_700Bold
} from "@expo-google-fonts/gelasio";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import api from "../../services/axios";

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState("")
    const [sending, setSending] = useState(false)
    // Depois de enviar, a tela mostra "Instruções enviadas".
    const [sent, setSent] = useState(false)

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    async function sendInstructions() {
        if (sending) return

        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            Alert.alert("E-mail inválido", "Informe o e-mail da sua conta.")
            return
        }

        try {
            setSending(true)

            await api.forgotPassword(email.trim())

            setSent(true)
        } catch (error) {
            console.log(
                "Erro ao recuperar senha:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                String(
                    error.response?.data?.error ||
                    "Não foi possível enviar as instruções. Tente novamente."
                )
            )
        } finally {
            setSending(false)
        }
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("Login")
        }
    }

    if (fontError) {
        return (
            <View style={styles.loading}>
                <Text>Não foi possível carregar as fontes.</Text>
            </View>
        )
    }

    if (!fontsLoaded) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />
            </View>
        )
    }

    if (sent) {
        return (
            <SafeAreaView
                style={styles.background}
                edges={["top", "left", "right", "bottom"]}
            >
                <View style={styles.sentContent}>
                    <View style={styles.sentIcon}>
                        <MaterialCommunityIcons
                            name="email-check-outline"
                            size={40}
                            color={colors.primary}
                        />
                    </View>

                    <Text style={styles.titleCenter}>
                        Instruções enviadas
                    </Text>

                    <Text style={styles.subtitleCenter}>
                        Se o e-mail {email.trim()} estiver cadastrado, você vai receber um link para criar uma nova senha. Confira também a caixa de spam.
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate("Login")}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonText}>
                            Voltar ao login
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonOutline}
                        onPress={() => navigation.navigate("ResetPasswordScreen")}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonOutlineText}>
                            Já recebi o link
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonOutline}
                        onPress={() => setSent(false)}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonOutlineText}>
                            Usar outro e-mail
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right", "bottom"]}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity
                        style={styles.buttonBack}
                        onPress={goBack}
                        accessibilityRole="button"
                        accessibilityLabel="Voltar"
                    >
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={18}
                            color={colors.primaryDark}
                        />

                        <Text style={styles.textBack}>
                            Voltar
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.eyebrow}>Acesso</Text>
                    <Text style={styles.title}>
                        Recuperar senha
                    </Text>

                    <Text style={styles.subtitle}>
                        Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.
                    </Text>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>E-mail</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="seuemail@exemplo.com"
                            placeholderTextColor={colors.textTertiary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            maxLength={255}
                            editable={!sending}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            sending && styles.buttonDisabled
                        ]}
                        onPress={sendInstructions}
                        disabled={sending}
                        accessibilityRole="button"
                    >
                        {sending ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>
                                Enviar instruções
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonOutline}
                        onPress={() => navigation.navigate("ResetPasswordScreen")}
                        disabled={sending}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonOutlineText}>
                            Já tenho o link do e-mail
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.background
    },
    container: {
        flex: 1
    },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: colors.background
    },
    scrollContent: {
        paddingHorizontal: 21,
        paddingTop: 8,
        paddingBottom: 32
    },
    buttonBack: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginBottom: 16
    },
    textBack: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.primaryDark,
        textDecorationLine: "underline"
    },
    title: {
        fontSize: 34,
        lineHeight: 40,
        fontFamily: fonts.serif,
        color: colors.primaryDark,
        letterSpacing: -0.8
    },
    subtitle: {
        marginTop: 16,
        marginBottom: 16,
        fontSize: 15,
        lineHeight: 24,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    viewInput: {
        width: "100%",
        marginBottom: 18
    },
    label: {
        marginBottom: 8,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    input: {
        minHeight: 52,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: fonts.regular,
        color: colors.textPrimary,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white
    },
    sentContent: {
        flex: 1,
        paddingHorizontal: 21,
        justifyContent: "center",
        alignItems: "center"
    },
    sentIcon: {
        width: 80,
        height: 80,
        marginBottom: 16,
        borderRadius: 40,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center"
    },
    titleCenter: {
        fontSize: 26,
        lineHeight: 39,
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        textAlign: "center"
    },
    subtitleCenter: {
        marginTop: 12,
        marginBottom: 24,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        textAlign: "center"
    },
    button: {
        width: "100%",
        minHeight: 54,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 8,
        backgroundColor: colors.primaryDark,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonDisabled: {
        opacity: 0.5
    },
    buttonText: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.white
    },
    buttonOutline: {
        width: "100%",
        minHeight: 54,
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonOutlineText: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    eyebrow: {
        marginBottom: 10,
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
    }
})
