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
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/axios";
import { disconnectSocket } from "../../services/socket";

export default function SecurityScreen({ navigation }) {
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [password, setPassword] = useState({
        current: "",
        new: "",
        confirm: ""
    })

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

    async function finish() {
        if (saving) return

        // Sem trocar a senha, "Concluir" só volta ao perfil.
        if (!showForm) {
            goBack()
            return
        }

        if (!password.current || !password.new || !password.confirm) {
            Alert.alert(
                "Faltam informações",
                "Preencha a senha atual, a nova senha e a confirmação."
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

            await api.changePassword({
                currentPassword: password.current,
                newPassword: password.new
            })

            Alert.alert("Sucesso", "Senha alterada.")
            goBack()
        } catch (error) {
            console.log(
                "Erro ao alterar senha:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                String(
                    error.response?.data?.error ||
                    "Não foi possível alterar a senha."
                )
            )
        } finally {
            setSaving(false)
        }
    }

    // Excluir a própria conta, como na área "Segurança" do site.
    function confirmDeleteAccount() {
        Alert.alert(
            "Excluir minha conta?",
            "Sua conta e seus dados de acesso serão removidos. Essa ação não pode ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir conta", style: "destructive", onPress: deleteAccount }
            ]
        )
    }

    async function deleteAccount() {
        if (deleting) return

        try {
            setDeleting(true)

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            await api.deleteMyAccount(parsedUser.id)

            // Encerra a sessão deste aparelho.
            await AsyncStorage.multiRemove(["@token", "@user"])
            disconnectSocket()

            Alert.alert("Conta excluída", "Sua conta foi excluída e a sessão foi encerrada.")
            navigation.reset({ index: 0, routes: [{ name: "Home" }] })
        } catch (error) {
            console.log(
                "Erro ao excluir conta:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Não foi possível excluir",
                String(error.response?.data?.error || "Tente novamente.")
            )
        } finally {
            setDeleting(false)
        }
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("ProfileScreen")
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

                    <Text style={styles.eyebrow}>Minha conta</Text>
                    <Text style={styles.title}>
                        Segurança
                    </Text>

                    <Text style={styles.subtitle}>
                        Opções de acesso e proteção da conta.
                    </Text>

                    <TouchableOpacity
                        style={styles.buttonOutline}
                        onPress={() => setShowForm(!showForm)}
                        disabled={saving}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonOutlineText}>
                            Redefinir senha
                        </Text>
                    </TouchableOpacity>

                    {showForm && (
                        <View>
                            <View style={styles.viewInput}>
                                <Text style={styles.label}>Senha atual</Text>

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
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.button,
                            saving && styles.buttonDisabled
                        ]}
                        onPress={finish}
                        disabled={saving}
                        accessibilityRole="button"
                    >
                        {saving ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>
                                Concluir
                            </Text>
                        )}
                    </TouchableOpacity>
                    <View style={styles.dangerBox}>
                        <Text style={styles.dangerTitle}>Excluir conta</Text>
                        <Text style={styles.dangerText}>
                            Remove sua conta do Reaproveita Franca. Reservas e conversas deixam de aparecer para você.
                        </Text>

                        <TouchableOpacity
                            style={styles.dangerButton}
                            onPress={confirmDeleteAccount}
                            disabled={deleting}
                            accessibilityRole="button"
                        >
                            {deleting ? (
                                <ActivityIndicator color={colors.error} />
                            ) : (
                                <Text style={styles.dangerButtonText}>Excluir minha conta</Text>
                            )}
                        </TouchableOpacity>
                    </View>
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
        marginBottom: 16,
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
    },
    dangerBox: {
        marginTop: 32,
        padding: 20,
        borderRadius: 20,
        backgroundColor: colors.errorLight
    },
    dangerTitle: {
        fontSize: 18,
        fontFamily: fonts.bold,
        color: colors.error
    },
    dangerText: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    dangerButton: {
        minHeight: 48,
        marginTop: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.error,
        backgroundColor: colors.white,
        justifyContent: "center",
        alignItems: "center"
    },
    dangerButtonText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.error
    }
})
