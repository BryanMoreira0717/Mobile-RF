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
    Manrope_700Bold,
    Manrope_800ExtraBold
} from "@expo-google-fonts/manrope";
import {
    Gelasio_400Regular,
    Gelasio_400Regular_Italic,
    Gelasio_700Bold
} from "@expo-google-fonts/gelasio";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import api from "../../services/axios";

export default function AddressScreen({ navigation }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    // null = ainda não tem endereço; o "Concluir" cria um novo.
    const [localizationId, setLocalizationId] = useState(null)
    const [address, setAddress] = useState({
        zipCode: "",
        street: "",
        number: "",
        neighborhood: "",
        state: "",
        city: ""
    })

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    useEffect(() => {
        loadAddress()
    }, [])

    async function loadAddress() {
        try {
            setLoading(true)

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            const response = await api.getLocalizations()

            if (Array.isArray(response.data) && response.data.length > 0) {
                const item = response.data[0]

                setLocalizationId(item.id)
                setAddress({
                    zipCode: item.zip_code || "",
                    street: item.street || "",
                    number: item.number || "",
                    neighborhood: item.neighborhood || "",
                    state: item.state || "",
                    city: item.city || ""
                })
            }
        } catch (error) {
            console.log(
                "Erro ao carregar endereço:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                "Não foi possível carregar seu endereço."
            )
        } finally {
            setLoading(false)
        }
    }

    function onChange(name, value) {
        setAddress(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // CEP completo: preenche rua, bairro, estado e cidade pelo ViaCEP.
    async function handleZipCode(value) {
        const zipCode = value.replace(/\D/g, "")

        onChange("zipCode", zipCode)

        if (zipCode.length !== 8) return

        try {
            const response = await api.getAddressByZipCode(zipCode)

            if (response.data?.erro) {
                Alert.alert(
                    "CEP não encontrado",
                    "Confira o CEP ou preencha o endereço manualmente."
                )
                return
            }

            setAddress(prev => ({
                ...prev,
                street: response.data.logradouro || prev.street,
                neighborhood: response.data.bairro || prev.neighborhood,
                state: response.data.uf || prev.state,
                city: response.data.localidade || prev.city
            }))
        } catch (error) {
            console.log("Erro ao buscar CEP:", error.message)
        }
    }

    async function saveAddress() {
        if (saving || !user) return

        if (
            !/^\d{8}$/.test(address.zipCode) ||
            !address.street.trim() ||
            !address.number.trim() ||
            !address.neighborhood.trim() ||
            !/^[A-Za-z]{2}$/.test(address.state.trim()) ||
            !address.city.trim()
        ) {
            Alert.alert(
                "Endereço incompleto",
                "Preencha CEP (8 dígitos), logradouro, número, bairro, estado (sigla, ex.: SP) e cidade."
            )
            return
        }

        const data = {
            zipCode: address.zipCode,
            street: address.street.trim(),
            number: address.number.trim(),
            neighborhood: address.neighborhood.trim(),
            state: address.state.trim().toUpperCase(),
            city: address.city.trim()
        }

        try {
            setSaving(true)

            if (localizationId) {
                await api.updateLocalization(localizationId, data)
            } else {
                await api.createLocalization({
                    ...data,
                    userId: user.id
                })
            }

            Alert.alert("Sucesso", "Endereço salvo.")
            goBack()
        } catch (error) {
            console.log(
                "Erro ao salvar endereço:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                String(
                    error.response?.data?.error ||
                    "Não foi possível salvar o endereço."
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
                        Endereço
                    </Text>

                    <Text style={styles.subtitle}>
                        {localizationId
                            ? "Localização cadastrada."
                            : "Cadastre o endereço da sua conta."}
                    </Text>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>CEP</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="14400000"
                            placeholderTextColor={colors.textTertiary}
                            value={address.zipCode}
                            onChangeText={handleZipCode}
                            keyboardType="number-pad"
                            maxLength={9}
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Logradouro</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Rua das Oportunidades"
                            placeholderTextColor={colors.textTertiary}
                            value={address.street}
                            onChangeText={value => onChange("street", value)}
                            maxLength={150}
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Número</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="100"
                            placeholderTextColor={colors.textTertiary}
                            value={address.number}
                            onChangeText={value => onChange("number", value)}
                            maxLength={6}
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Bairro</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Centro"
                            placeholderTextColor={colors.textTertiary}
                            value={address.neighborhood}
                            onChangeText={value => onChange("neighborhood", value)}
                            maxLength={80}
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Estado</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="SP"
                            placeholderTextColor={colors.textTertiary}
                            value={address.state}
                            onChangeText={value => onChange("state", value)}
                            autoCapitalize="characters"
                            maxLength={2}
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Cidade</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Franca"
                            placeholderTextColor={colors.textTertiary}
                            value={address.city}
                            onChangeText={value => onChange("city", value)}
                            maxLength={100}
                            editable={!saving}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            saving && styles.buttonDisabled
                        ]}
                        onPress={saveAddress}
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
        marginBottom: 18
    },
    label: {
        marginBottom: 8,
        fontSize: 14,
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
