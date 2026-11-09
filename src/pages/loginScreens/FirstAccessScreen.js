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
    Manrope_700Bold
} from "@expo-google-fonts/manrope";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import api from "../../services/axios";

// Conta criada com senha temporária (ex.: admin cadastrado por outro admin):
// o login manda para cá até a pessoa criar a própria senha.
export default function FirstAccessScreen({ navigation }) {
    const [saving, setSaving] = useState(false)
    const [password, setPassword] = useState({
        current: "",
        new: "",
        confirm: ""
    })

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold
    })

    function onChange(name, value) {
        setPassword(prev => ({
            ...prev,
            [name]: value
        }))
    }

    async function savePassword() {
        if (saving) return

        if (!password.current || !password.new || !password.confirm) {
            Alert.alert(
                "Faltam informações",
                "Preencha a senha temporária, a nova senha e a confirmação."
            )
            return
        }

        if (password.new.length < 6) {
            Alert.alert(
                "Senha inválida",
                "A nova senha deve ter no mínimo 6 caracteres."
            )
            return
        }

        if (password.new !== password.confirm) {
            Alert.alert(
                "Senhas diferentes",
                "A confirmação não é igual à nova senha."
            )
            return
        }

        try {
            setSaving(true)

            await api.firstAccessPassword({
                currentPassword: password.current,
                newPassword: password.new
            })

            Alert.alert("Senha criada", "Agora é só usar a nova senha nos próximos acessos.")

            navigation.reset({
                index: 0,
                routes: [{ name: "DashboardScreen" }]
            })
        } catch (error) {
            console.log(
                "Erro ao criar senha:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                String(
                    error.response?.data?.error ||
                    "Não foi possível criar a nova senha."
                )
            )
        } finally {
            setSaving(false)
        }
    }

    // Sair limpa a sessão: no próximo login a troca é pedida de novo.
    async function logout() {
        await AsyncStorage.multiRemove(["@token", "@user"])

        navigation.reset({
            index: 0,
            routes: [{ name: "Login" }]
        })
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
                    <View style={styles.icon}>
                        <MaterialCommunityIcons
                            name="lock-reset"
                            size={36}
                            color={colors.primary}
                        />
                    </View>

                    <Text style={styles.title}>
                        Crie sua senha
                    </Text>

                    <Text style={styles.subtitle}>
                        Sua conta foi criada com uma senha temporária, enviada por e-mail. Para continuar, defina uma senha só sua.
                    </Text>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Senha temporária</Text>

                        <TextInput
                            style={styles.input}
                            value={password.current}
                            onChangeText={value => onChange("current", value)}
                            secureTextEntry
                            autoCapitalize="none"
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
                                Salvar e entrar
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonOutline}
                        onPress={logout}
                        disabled={saving}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonOutlineText}>
                            Sair
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
        paddingTop: 32,
        paddingBottom: 32
    },
    icon: {
        width: 72,
        height: 72,
        marginBottom: 16,
        borderRadius: 36,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center"
    },
    title: {
        fontSize: 26,
        lineHeight: 39,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    subtitle: {
        marginTop: 16,
        marginBottom: 16,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    viewInput: {
        width: "100%",
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    label: {
        marginBottom: 4,
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    input: {
        minHeight: 28,
        paddingVertical: 2,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    button: {
        width: "100%",
        minHeight: 54,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonDisabled: {
        opacity: 0.5
    },
    buttonText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.white
    },
    buttonOutline: {
        width: "100%",
        minHeight: 54,
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.white,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonOutlineText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    }
})
