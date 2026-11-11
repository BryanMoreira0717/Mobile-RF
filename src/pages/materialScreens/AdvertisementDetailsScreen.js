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
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import api from "../../services/axios";

export default function AdvertisementDetailsScreen({ navigation, route }) {
    const [user, setUser] = useState(null)
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [edit, setEdit] = useState({
        name: "",
        quantity: "",
        price: "",
        status: "available"
    })

    const productId = route?.params?.productId

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold
    })

    useEffect(() => {
        loadProduct()
    }, [])

    async function loadProduct() {
        try {
            setLoading(true)
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            if (!productId) {
                setErrorMessage("Anúncio não informado.")
                return
            }

            const response = await api.getProductById(productId)
            const material = response.data

            if (
                String(material.id_user).toLowerCase() !==
                String(parsedUser.id).toLowerCase()
            ) {
                setErrorMessage("Este anúncio pertence a outra conta.")
                return
            }

            setProduct(material)
            setEdit({
                name: material.name || "",
                quantity: String(material.quantity),
                price: material.price != null ? String(material.price) : "",
                status: material.status
            })
        } catch (error) {
            console.log(
                "Erro ao carregar anúncio:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar o anúncio.")
        } finally {
            setLoading(false)
        }
    }

    function onChange(name, value) {
        setEdit(prev => ({
            ...prev,
            [name]: value
        }))
    }

    function getStatus(status) {
        switch (status) {
            case "available":
                return "Publicado"
            case "reserved":
                return "Reservado"
            case "unavailable":
                return "Indisponível"
            default:
                return "Status não informado"
        }
    }

    async function saveProduct() {
        if (saving || !product) return

        const quantity = Number(edit.quantity)

        if (!edit.name.trim()) {
            Alert.alert("Nome inválido", "Informe o nome do material.")
            return
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
            Alert.alert(
                "Quantidade inválida",
                "Informe uma quantidade inteira."
            )
            return
        }

        let price = null

        if (product.type_negotiation === "sale") {
            price = Number(edit.price.trim().replace(",", "."))

            if (!Number.isFinite(price) || price <= 0) {
                Alert.alert("Preço inválido", "Informe um preço maior que zero.")
                return
            }
        }

        try {
            setSaving(true)

            // O PUT regrava o anúncio inteiro: envia o atual com as alterações.
            await api.updateProduct(product.id, {
                name: edit.name.trim(),
                description: product.description,
                price: price,
                priority: product.priority,
                quantity: quantity,
                status: edit.status,
                category: product.category,
                type_negotiation: product.type_negotiation,
                weight: product.weight,
                conservation_state: product.conservation_state,
                id_localization: product.id_localization
            })

            Alert.alert("Sucesso", "Anúncio atualizado.")
            goBack()
        } catch (error) {
            console.log(
                "Erro ao atualizar anúncio:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                String(
                    error.response?.data?.error ||
                    "Não foi possível atualizar o anúncio."
                )
            )
        } finally {
            setSaving(false)
        }
    }

    async function deleteProduct() {
        if (saving || !product) return

        try {
            setSaving(true)

            await api.deleteProduct(product.id)

            Alert.alert("Anúncio excluído", "O material saiu do marketplace.")
            navigation.navigate("MyAdvertisementsScreen")
        } catch (error) {
            console.log(
                "Erro ao excluir anúncio:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Não foi possível excluir",
                String(
                    error.response?.data?.error ||
                    "Anúncios com reservas não podem ser excluídos. Deixe-o indisponível."
                )
            )
        } finally {
            setSaving(false)
        }
    }

    function confirmDelete() {
        Alert.alert(
            "Excluir anúncio",
            "Deseja excluir este anúncio?",
            [
                { text: "Voltar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: deleteProduct }
            ]
        )
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("MyAdvertisementsScreen")
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

    if (errorMessage || !product) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    {errorMessage || "Não foi possível carregar o anúncio."}
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={goBack}
                >
                    <Text style={styles.buttonText}>
                        Voltar aos anúncios
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
                        Detalhes do anúncio
                    </Text>

                    <Text style={styles.subtitle}>
                        Acompanhe o lote e sua situação de coleta.
                    </Text>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Material</Text>

                        <TextInput
                            style={styles.input}
                            value={edit.name}
                            onChangeText={value => onChange("name", value)}
                            maxLength={100}
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Quantidade</Text>

                        <TextInput
                            style={styles.input}
                            value={edit.quantity}
                            onChangeText={value => onChange("quantity", value)}
                            keyboardType="number-pad"
                            maxLength={10}
                            editable={!saving}
                        />
                    </View>

                    {product.type_negotiation === "sale" && (
                        <View style={styles.viewInput}>
                            <Text style={styles.label}>Preço (R$)</Text>

                            <TextInput
                                style={styles.input}
                                value={edit.price}
                                onChangeText={value => onChange("price", value)}
                                keyboardType="decimal-pad"
                                maxLength={9}
                                editable={!saving}
                            />
                        </View>
                    )}

                    <View style={styles.viewInput}>
                        <Text style={styles.label}>Status</Text>

                        <Picker
                            selectedValue={edit.status}
                            onValueChange={value => onChange("status", value)}
                            enabled={!saving}
                            style={styles.picker}
                        >
                            <Picker.Item label={getStatus("available")} value="available" />
                            <Picker.Item label={getStatus("reserved")} value="reserved" />
                            <Picker.Item label={getStatus("unavailable")} value="unavailable" />
                        </Picker>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            saving && styles.buttonDisabled
                        ]}
                        onPress={saveProduct}
                        disabled={saving}
                        accessibilityRole="button"
                    >
                        {saving ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>
                                Salvar alterações
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonOutline}
                        onPress={goBack}
                        disabled={saving}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonOutlineText}>
                            Voltar aos anúncios
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonDelete}
                        onPress={confirmDelete}
                        disabled={saving}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonDeleteText}>
                            Excluir anúncio
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
    picker: {
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
        marginTop: 16,
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
    },
    buttonDelete: {
        minHeight: 44,
        marginTop: 16,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonDeleteText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.error
    }
})
