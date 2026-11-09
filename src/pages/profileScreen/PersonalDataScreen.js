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
import { useState, useEffect } from "react";
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

export default function PersonalDataScreen({ navigation }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [data, setData] = useState({
        name: "",
        email: "",
        cellphone: ""
    })

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            const response = await api.getUserById(parsedUser.id)

            setData({
                name: response.data.name || "",
                email: response.data.email || "",
                cellphone: response.data.cellphone || ""
            })
        } catch (error) {
            console.log(
                "Erro ao carregar dados pessoais:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                "Não foi possível carregar seus dados."
            )
        } finally {
            setLoading(false)
        }
    }

    function onChange(name, value) {
        setData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    async function saveData() {
        if (saving || !user) return

        const cellphone = data.cellphone.replace(/\D/g, "")

        if (!data.name.trim()) {
            Alert.alert("Nome inválido", "Informe seu nome.")
            return
        }

        if (!/^\d{11}$/.test(cellphone)) {
            Alert.alert(
                "Telefone inválido",
                "Informe 11 dígitos (DDD + número)."
            )
            return
        }

        try {
            setSaving(true)

            await api.updateUser(user.id, {
                name: data.name.trim(),
                cellphone: cellphone
            })

            // Atualiza só os campos alterados na sessão salva.
            const updatedUser = {
                ...user,
                name: data.name.trim(),
                cellphone: cellphone
            }

            await AsyncStorage.setItem("@user", JSON.stringify(updatedUser))

            Alert.alert("Sucesso", "Dados atualizados.")
            goBack()
        } catch (error) {
            console.log(
                "Erro ao salvar dados pessoais:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                String(
                    error.response?.data?.error ||
                    "Não foi possível salvar seus dados."
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

    if (!fontsLoaded || loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />
            </View>
        )
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    Não foi possível carregar seu usuário.
                    {"\n"}Faça login novamente.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.reset({
                        index: 0,
                        routes: [{ name: "Login" }]
                    })}
                >
                    <Text style={styles.buttonText}>
                        Ir para o login
                    </Text>
                </TouchableOpacity>
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
                            name="chevron-left"
                            size={22}
                            color={colors.primaryDark}
                        />

                        <Text style={styles.textBack}>
                            Voltar
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>
                        Dados pessoais
                    </Text>

                    <Text style={styles.subtitle}>
                        Dados da conta conectada.
                    </Text>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>
                            Nome
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nome cadastrado da conta"
                            placeholderTextColor={colors.textTertiary}
                            value={data.name}
                            onChangeText={value => onChange("name", value)}
                            maxLength={100}
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>
                            E-mail
                        </Text>

                        <TextInput
                            style={[styles.input, styles.inputDisabled]}
                            value={data.email}
                            editable={false}
                        />
                    </View>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>
                            Telefone
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="(16) 99999-9999"
                            placeholderTextColor={colors.textTertiary}
                            value={data.cellphone}
                            onChangeText={value => onChange("cellphone", value)}
                            keyboardType="phone-pad"
                            maxLength={15}
                            editable={!saving}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            saving && styles.buttonDisabled
                        ]}
                        onPress={saveData}
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
    message: {
        fontSize: 17,
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        textAlign: "center",
        marginBottom: 20
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
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
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
    inputDisabled: {
        color: colors.textSecondary
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
    }
})
