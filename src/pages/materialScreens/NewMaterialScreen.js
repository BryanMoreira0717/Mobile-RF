import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
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
import NavBar from "../../components/NavBar";
import api from "../../services/axios";

export default function NewMaterialScreen({ navigation, route }) {
    const [user, setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(true)
    const [loading, setLoading] = useState(false)

    const [material, setMaterial] = useState({
        name: "",
        description: "",
        category: "",
        quantity: "1",
        weight: "",
        conservation_state: "good",
        type_negotiation: "donation",
        price: "",
        id_localization: ""
    })

    // A integração do endereço será resolvida depois.
    // Formato esperado: [{ id: "...", label: "Rua..., 123" }]
    const localizations = Array.isArray(route?.params?.localizations)
        ? route.params.localizations
        : []

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold
    })

    useEffect(() => {
        async function loadUser() {
            try {
                const storedUser = await AsyncStorage.getItem("@user")

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser)
                    if (parsedUser) setUser(parsedUser)
                }
            } catch (e) {
                console.log("Erro ao carregar usuário:", e?.message)
            } finally {
                setLoadingUser(false)
            }
        }

        loadUser()
    }, [])

    function onChange(name, value) {
        setMaterial(prev => ({
            ...prev,
            [name]: value
        }))
    }

    function handleNegotiation(value) {
        setMaterial(prev => ({
            ...prev,
            type_negotiation: value,
            price: ""
        }))
    }

    function handleNavigation(item) {
        if (loading) return

        switch (item) {
            case "inicio":
                navigation.navigate("DashboardScreen")
                break
            case "mapa":
                navigation.navigate("MapScreen")
                break
            case "publicar":
                break
            case "anuncios":
                navigation.navigate("MyAdvertisementsScreen")
                break
            case "perfil":
                navigation.navigate("ProfileScreen")
                break
        }
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("DashboardScreen")
        }
    }

    async function publishMaterial() {
        if (loading) return

        if (
            !material.name.trim() ||
            !material.category ||
            !material.quantity.trim() ||
            !material.weight.trim() ||
            !material.conservation_state ||
            !material.type_negotiation ||
            !material.id_localization
        ) {
            Alert.alert(
                "Faltam informações",
                "Preencha todos os campos obrigatórios."
            )
            return
        }

        if (material.name.trim().length > 100) {
            Alert.alert(
                "Nome inválido",
                "O nome deve ter no máximo 100 caracteres."
            )
            return
        }

        const quantity = Number(material.quantity)

        if (!Number.isInteger(quantity) || quantity < 1) {
            Alert.alert(
                "Quantidade inválida",
                "Informe uma quantidade inteira maior que zero."
            )
            return
        }

        if (quantity > 2147483647) {
            Alert.alert(
                "Quantidade inválida",
                "A quantidade informada ultrapassa o limite permitido."
            )
            return
        }

        const weight = Number(
            material.weight.trim().replace(",", ".")
        )

        if (!Number.isFinite(weight) || weight <= 0) {
            Alert.alert(
                "Peso inválido",
                "Informe um peso maior que zero."
            )
            return
        }

        if (weight > 99999999.99) {
            Alert.alert(
                "Peso inválido",
                "O peso máximo permitido é 99.999.999,99 kg."
            )
            return
        }

        if (Number(weight.toFixed(2)) !== weight) {
            Alert.alert(
                "Peso inválido",
                "O peso deve ter no máximo duas casas decimais."
            )
            return
        }

        let price = null

        if (material.type_negotiation === "sale") {
            if (!material.price.trim()) {
                Alert.alert(
                    "Preço obrigatório",
                    "Informe o preço do material."
                )
                return
            }

            price = Number(
                material.price.trim().replace(",", ".")
            )

            if (!Number.isFinite(price) || price <= 0) {
                Alert.alert(
                    "Preço inválido",
                    "Informe um preço maior que zero."
                )
                return
            }

            if (price > 999999.99) {
                Alert.alert(
                    "Preço inválido",
                    "O preço máximo permitido é R$ 999.999,99."
                )
                return
            }

            if (Number(price.toFixed(2)) !== price) {
                Alert.alert(
                    "Preço inválido",
                    "O preço deve ter no máximo duas casas decimais."
                )
                return
            }
        }

        const localization = localizations.find(
            item => item.id === material.id_localization
        )

        if (!localization) {
            Alert.alert(
                "Local de retirada inválido",
                "Selecione um endereço cadastrado."
            )
            return
        }

        try {
            setLoading(true)

            const token = await AsyncStorage.getItem("@token")

            if (!token) {
                Alert.alert(
                    "Sessão encerrada",
                    "Faça login novamente para publicar."
                )
                return
            }

            const data = {
                name: material.name.trim(),
                description: material.description.trim() || null,
                category: material.category,
                quantity: quantity,
                weight: weight,
                conservation_state: material.conservation_state,
                type_negotiation: material.type_negotiation,
                price: price,
                id_localization: material.id_localization,
                priority: 0,
                status: "available"
            }

            await api.createProduct(data)

            setMaterial({
                name: "",
                description: "",
                category: "",
                quantity: "1",
                weight: "",
                conservation_state: "good",
                type_negotiation: "donation",
                price: "",
                id_localization: material.id_localization
            })

            Alert.alert(
                "Sucesso",
                "Material publicado com sucesso."
            )
        } catch (error) {
            console.log(
                "Erro ao publicar material:",
                error.response?.data || error.message
            )

            if (error.response?.status === 401) {
                Alert.alert(
                    "Sessão encerrada",
                    "Sua sessão expirou. Faça login novamente."
                )
            } else {
                Alert.alert(
                    "Erro",
                    String(
                        error.response?.data?.error ||
                        "Não foi possível publicar o material."
                    )
                )
            }
        } finally {
            setLoading(false)
        }
    }

    if (fontError) {
        return (
            <View style={styles.loading}>
                <Text>Não foi possível carregar as fontes.</Text>
            </View>
        )
    }

    if (!fontsLoaded || loadingUser) {
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

    if (user.role !== "company") {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    Esta página é destinada ao perfil de empresa.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        navigation.navigate("DashboardScreen")
                    }
                >
                    <Text style={styles.buttonText}>
                        Voltar ao início
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right"]}
        >
            <View style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={
                        Platform.OS === "ios" ? "padding" : undefined
                    }
                >
                    <ScrollView
                        style={styles.container}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <TouchableOpacity
                            style={styles.buttonBack}
                            onPress={goBack}
                            disabled={loading}
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
                            Publique seu material
                        </Text>

                        <Text style={styles.subtitle}>
                            Conecte suas sobras a novas oportunidades.
                        </Text>

                        <Text style={styles.description}>
                            Informe os dados e a categoria do material.
                            {"\n"}Os campos com * são obrigatórios.
                        </Text>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>
                                Nome do material / lote *
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ex.: Retalhos de tecido"
                                placeholderTextColor={colors.textTertiary}
                                value={material.name}
                                onChangeText={value =>
                                    onChange("name", value)
                                }
                                maxLength={100}
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>
                                Descrição
                            </Text>

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.inputDescription
                                ]}
                                placeholder="Descreva o material"
                                placeholderTextColor={colors.textTertiary}
                                value={material.description}
                                onChangeText={value =>
                                    onChange("description", value)
                                }
                                multiline
                                maxLength={10000}
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>
                                Categoria do material *
                            </Text>

                            <Picker
                                selectedValue={material.category}
                                onValueChange={value =>
                                    onChange("category", value)
                                }
                                enabled={!loading}
                                style={styles.picker}
                            >
                                <Picker.Item
                                    label="Selecione uma categoria"
                                    value=""
                                />
                                <Picker.Item label="Madeira" value="madeira" />
                                <Picker.Item label="Metal" value="metal" />
                                <Picker.Item label="Plástico" value="plastico" />
                                <Picker.Item label="Papel / Papelão" value="papel/papelao" />
                                <Picker.Item label="Vidro" value="vidro" />
                                <Picker.Item label="Tecido" value="tecido" />
                                <Picker.Item label="Borracha" value="borracha" />
                                <Picker.Item label="Eletrônicos" value="eletronicos" />
                            </Picker>
                        </View>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>
                                Quantidade de unidades / lotes *
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ex.: 1"
                                placeholderTextColor={colors.textTertiary}
                                value={material.quantity}
                                onChangeText={value =>
                                    onChange("quantity", value)
                                }
                                keyboardType="number-pad"
                                maxLength={10}
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>
                                Peso (kg) *
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ex.: 150,50"
                                placeholderTextColor={colors.textTertiary}
                                value={material.weight}
                                onChangeText={value =>
                                    onChange("weight", value)
                                }
                                keyboardType="decimal-pad"
                                maxLength={11}
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>
                                Estado de conservação *
                            </Text>

                            <Picker
                                selectedValue={material.conservation_state}
                                onValueChange={value =>
                                    onChange("conservation_state", value)
                                }
                                enabled={!loading}
                                style={styles.picker}
                            >
                                <Picker.Item label="Novo" value="new" />
                                <Picker.Item label="Bom" value="good" />
                                <Picker.Item label="Regular" value="regular" />
                                <Picker.Item label="Ruim" value="poor" />
                            </Picker>
                        </View>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>
                                Tipo de negociação *
                            </Text>

                            <Picker
                                selectedValue={material.type_negotiation}
                                onValueChange={handleNegotiation}
                                enabled={!loading}
                                style={styles.picker}
                            >
                                <Picker.Item label="Doação" value="donation" />
                                <Picker.Item label="Venda" value="sale" />
                            </Picker>
                        </View>

                        {material.type_negotiation === "sale" && (
                            <View style={styles.viewInput}>
                                <Text style={styles.label}>
                                    Preço (R$) *
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex.: 50,00"
                                    placeholderTextColor={colors.textTertiary}
                                    value={material.price}
                                    onChangeText={value =>
                                        onChange("price", value)
                                    }
                                    keyboardType="decimal-pad"
                                    maxLength={9}
                                    editable={!loading}
                                />
                            </View>
                        )}

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>
                                Local de retirada *
                            </Text>

                            {localizations.length > 0 ? (
                                <Picker
                                    selectedValue={material.id_localization}
                                    onValueChange={value =>
                                        onChange("id_localization", value)
                                    }
                                    enabled={!loading}
                                    style={styles.picker}
                                >
                                    <Picker.Item
                                        label="Selecione um endereço"
                                        value=""
                                    />

                                    {localizations.map(item => (
                                        <Picker.Item
                                            key={item.id}
                                            label={item.label}
                                            value={item.id}
                                        />
                                    ))}
                                </Picker>
                            ) : (
                                <Text style={styles.descriptionAddress}>
                                    Endereço indisponível.
                                    A integração do local de retirada
                                    será realizada depois.
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                (loading || localizations.length === 0) &&
                                    styles.buttonDisabled
                            ]}
                            onPress={publishMaterial}
                            disabled={
                                loading || localizations.length === 0
                            }
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>
                                    Publicar material
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>

                <NavBar
                    estagio="empresa"
                    ativo="publicar"
                    onNavigate={loading ? undefined : handleNavigation}
                />
            </View>
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
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 120
    },
    buttonBack: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginBottom: 16
    },
    textBack: {
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    title: {
        fontSize: 25,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    subtitle: {
        marginTop: 8,
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    description: {
        marginTop: 24,
        marginBottom: 20,
        fontSize: 12,
        lineHeight: 20,
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
        marginBottom: 6,
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    input: {
        minHeight: 32,
        paddingVertical: 4,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    inputDescription: {
        minHeight: 90,
        textAlignVertical: "top"
    },
    picker: {
        color: colors.textPrimary
    },
    descriptionAddress: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    button: {
        width: "100%",
        minHeight: 52,
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 15,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonDisabled: {
        opacity: 0.5
    },
    buttonText: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: colors.white
    }
})