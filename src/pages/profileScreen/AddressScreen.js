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
    // Vários endereços, como no site: lista + formulário de novo/editar.
    const [addresses, setAddresses] = useState([])
    const [showForm, setShowForm] = useState(false)
    // null = endereço novo; com id = editando esse endereço.
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

            setAddresses(Array.isArray(response.data) ? response.data : [])
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

    function newAddress() {
        setLocalizationId(null)
        setAddress({
            zipCode: "",
            street: "",
            number: "",
            neighborhood: "",
            state: "",
            city: ""
        })
        setShowForm(true)
    }

    function editAddress(item) {
        setLocalizationId(item.id)
        setAddress({
            zipCode: item.zip_code || "",
            street: item.street || "",
            number: item.number || "",
            neighborhood: item.neighborhood || "",
            state: item.state || "",
            city: item.city || ""
        })
        setShowForm(true)
    }

    function confirmDelete(item) {
        Alert.alert(
            "Excluir endereço?",
            item.street + ", " + item.number + " deixa de aparecer na sua conta.",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => deleteAddress(item) }
            ]
        )
    }

    async function deleteAddress(item) {
        try {
            await api.deleteLocalization(item.id)

            setAddresses(prev => prev.filter(address => address.id !== item.id))
        } catch (error) {
            console.log(
                "Erro ao excluir endereço:",
                error.response?.data || error.message
            )

            // 409: o endereço é o local de retirada de algum anúncio.
            Alert.alert(
                "Não foi possível excluir",
                String(
                    error.response?.data?.error ||
                    "Tente novamente."
                )
            )
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
            setShowForm(false)
            loadAddress()
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
                        Endereços
                    </Text>

                    <Text style={styles.subtitle}>
                        {addresses.length > 0
                            ? "Endereços cadastrados na sua conta."
                            : "Cadastre o endereço da sua conta."}
                    </Text>

                    {addresses.map(item => (
                        <View key={item.id} style={styles.card}>
                            <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.primaryDark} />

                            <View style={styles.cardTexts}>
                                <Text style={styles.cardTitle}>
                                    {item.street}, {item.number}
                                </Text>
                                <Text style={styles.cardText}>
                                    {item.neighborhood} · {item.city} / {item.state}
                                </Text>
                                <Text style={styles.cardText}>CEP {item.zip_code}</Text>

                                <View style={styles.cardActions}>
                                    <TouchableOpacity
                                        style={styles.cardAction}
                                        onPress={() => editAddress(item)}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.cardActionText}>Editar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.cardAction}
                                        onPress={() => confirmDelete(item)}
                                        accessibilityRole="button"
                                    >
                                        <Text style={[styles.cardActionText, styles.cardActionDanger]}>Excluir</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}

                    {!showForm && (
                        <TouchableOpacity
                            style={styles.buttonOutline}
                            onPress={newAddress}
                            accessibilityRole="button"
                        >
                            <MaterialCommunityIcons name="plus" size={18} color={colors.primaryDark} />
                            <Text style={styles.buttonOutlineText}>Adicionar endereço</Text>
                        </TouchableOpacity>
                    )}

                    {showForm && (
                    <View style={styles.form}>
                    <Text style={styles.formTitle}>
                        {localizationId ? "Editar endereço" : "Novo endereço"}
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
                                Salvar endereço
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonCancel}
                        onPress={() => setShowForm(false)}
                        disabled={saving}
                        accessibilityRole="button"
                    >
                        <Text style={styles.textBack}>Cancelar</Text>
                    </TouchableOpacity>
                    </View>
                    )}
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
    eyebrow: {
        marginBottom: 10,
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
    },
    card: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    cardTexts: {
        flex: 1,
        minWidth: 0
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardText: {
        marginTop: 4,
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    cardActions: {
        flexDirection: "row",
        gap: 18,
        marginTop: 10
    },
    cardAction: {
        minHeight: 36,
        justifyContent: "center"
    },
    cardActionText: {
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        textDecorationLine: "underline"
    },
    cardActionDanger: {
        color: colors.error
    },
    buttonOutline: {
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white
    },
    buttonOutlineText: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    form: {
        marginTop: 8,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    formTitle: {
        marginBottom: 16,
        fontSize: 22,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    buttonCancel: {
        minHeight: 44,
        marginTop: 8,
        justifyContent: "center",
        alignItems: "center"
    }
})
