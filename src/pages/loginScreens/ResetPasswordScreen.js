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

// Redefinir senha com o link do e-mail (no site é a página /redefinir-senha).
export default function ResetPasswordScreen({ navigation }) {
    const [link, setLink] = useState("")
    const [password, setPassword] = useState({
        new: "",
        confirm: ""
    })
    const [saving, setSaving] = useState(false)

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    function onChange(name, value) {
        setPassword(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Aceita o link inteiro do e-mail ou só o código depois de "token=".
    function getToken() {
        const text = link.trim()

        if (text.includes("token=")) {
            return decodeURIComponent(text.split("token=")[1].split("&")[0])
        }

        return text
    }

    async function savePassword() {
        if (saving) return

        const token = getToken()

        if (!token) {
            Alert.alert("Faltam informações", "Cole o link que chegou no seu e-mail.")
            return
        }

        if (password.new.length < 6) {
            Alert.alert("Senha inválida", "A nova senha deve ter no mínimo 6 caracteres.")
            return
        }

        if (password.new !== password.confirm) {
            Alert.alert("Senhas diferentes", "A confirmação não é igual à nova senha.")
            return
        }

        try {
            setSaving(true)

            await api.resetPassword(token, password.new)

            Alert.alert("Senha alterada", "Entre com a sua nova senha.")
            navigation.reset({ index: 0, routes: [{ name: "Login" }] })
        } catch (error) {
            console.log(
                "Erro ao redefinir senha:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Não foi possível redefinir",
                String(
                    error.response?.data?.error ||
                    "O link pode ter expirado. Peça um novo e tente outra vez."
                )
            )
        } finally {
            setSaving(false)
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
                        Criar nova senha
                    </Text>

                    <Text style={styles.subtitle}>
                        Copie o link do e-mail "Redefinir senha" e cole abaixo. Depois escolha a nova senha.
                    </Text>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Link do e-mail</Text>

                        <TextInput
                            style={[styles.input, styles.inputLink]}
                            placeholder="https://.../redefinir-senha?token=..."
                            placeholderTextColor={colors.textTertiary}
                            value={link}
                            onChangeText={setLink}
                            autoCapitalize="none"
                            autoCorrect={false}
                            multiline
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Nova senha</Text>

                        <TextInput
                            style={styles.input}
                            value={password.new}
                            onChangeText={value => onChange("new", value)}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Confirmar nova senha</Text>

                        <TextInput
                            style={styles.input}
                            value={password.confirm}
                            onChangeText={value => onChange("confirm", value)}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!saving}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            saving && styles.buttonDisabled
                        ]}
                        onPress={savePassword}
                        disabled={saving}
                        accessibilityRole="button"
                    >
                        {saving ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>
                                Salvar nova senha
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonOutline}
                        onPress={() => navigation.navigate("ForgotPasswordScreen")}
                        disabled={saving}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonOutlineText}>
                            Pedir um novo link
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
    eyebrow: {
        marginBottom: 10,
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
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
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        fontSize: 16,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    inputLink: {
        minHeight: 80,
        fontSize: 13,
        textAlignVertical: "top"
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
    }
})
