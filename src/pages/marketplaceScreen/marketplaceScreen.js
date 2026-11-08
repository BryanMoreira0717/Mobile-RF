import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    StyleSheet,
    ActivityIndicator,
    Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
    Manrope_400Regular,
    Manrope_700Bold
} from "@expo-google-fonts/manrope";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";
import api from "../../services/axios";

const categories = [
    { id: "all", name: "Todos" },
    { id: "madeira", name: "Madeira" },
    { id: "metal", name: "Metal" },
    { id: "plastico", name: "Plástico" },
    { id: "papel/papelao", name: "Papel / Papelão" },
    { id: "vidro", name: "Vidro" },
    { id: "tecido", name: "Tecido" },
    { id: "borracha", name: "Borracha" },
    { id: "eletronicos", name: "Eletrônicos" }
]

export default function MarketplaceScreen({ navigation, route }) {
    const [user, setUser] = useState(null)
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [search, setSearch] = useState("")
    const [category, setCategory] = useState("all")
    const [selectedMaterial, setSelectedMaterial] = useState(null)
    const [quantity, setQuantity] = useState("1")
    const [opening, setOpening] = useState(false)
    const [saving, setSaving] = useState(false)
    const [photoErrors, setPhotoErrors] = useState({})

    const isFocused = useIsFocused()

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold
    })

    useEffect(() => {
        if (isFocused) {
            loadMaterials()
        }
    }, [isFocused])

    async function loadMaterials(showLoading = true) {
        try {
            if (showLoading) {
                setLoading(true)
                setMaterials([])
                setUser(null)
            }

            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) {
                setUser(null)
                setMaterials([])
                return
            }

            setUser(parsedUser)

            if (parsedUser.role !== "user") return

            const response = await api.getProducts()

            if (!Array.isArray(response.data)) {
                setErrorMessage("Não foi possível carregar os materiais.")
                return
            }

            const availableMaterials = response.data.filter(item =>
                item.status === "available" &&
                Number(item.quantity) > 0 &&
                String(item.id_user).toLowerCase() !==
                String(parsedUser.id).toLowerCase()
            )

            setMaterials(availableMaterials)
            setPhotoErrors({})

            if (route.params?.reserveProductId) {
                const productId = route.params.reserveProductId

                navigation.setParams({ reserveProductId: undefined })
                await openReservation(productId, parsedUser.id)
            }
        } catch (error) {
            console.log("Erro ao carregar materiais:", error.message)
            setErrorMessage("Não foi possível carregar os materiais. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    async function refreshMaterials() {
        if (refreshing || opening || saving) return

        try {
            setRefreshing(true)
            await loadMaterials(false)
        } finally {
            setRefreshing(false)
        }
    }

    function getCategory(value) {
        const selectedCategory = categories.find(item => item.id === value)

        return selectedCategory ? selectedCategory.name : "Material"
    }

    function getPhoto(material) {
        const photo = material.photos?.find(item => item.photo)?.photo

        if (!photo) return null
        if (photo.startsWith("data:image/")) return photo

        let type = "image/jpeg"

        if (photo.startsWith("iVBOR")) {
            type = "image/png"
        } else if (photo.startsWith("UklGR")) {
            type = "image/webp"
        } else if (photo.startsWith("R0lGOD")) {
            type = "image/gif"
        }

        return "data:" + type + ";base64," + photo
    }

    function formatPrice(value) {
        return Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
    }

    function getPrice(material) {
        if (material.type_negotiation === "donation") return "Doação"

        return formatPrice(material.price) + " / unidade"
    }

    function normalizeText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
    }

    function openMaterial(material) {
        navigation.navigate("MaterialDetailsScreen", {
            productId: material.id
        })
    }

    async function openReservation(productId, userId) {
        if (opening || saving) return

        try {
            setOpening(true)

            const response = await api.getProductById(productId)
            const material = response.data

            if (
                material.status !== "available" ||
                Number(material.quantity) <= 0 ||
                String(material.id_user).toLowerCase() === String(userId).toLowerCase()
            ) {
                Alert.alert("Material indisponível", "Este material não está disponível para reserva.")
                return
            }

            setSelectedMaterial(material)
            setQuantity("1")
        } catch (error) {
            Alert.alert(
                "Não foi possível abrir a reserva",
                error.response?.data?.error || "Tente novamente em alguns instantes."
            )
        } finally {
            setOpening(false)
        }
    }
    
    useEffect(() => {
        const productId = route.params?.reserveProductId

        if (
            !productId ||
            loading ||
            !user ||
            !active.current ||
            openingLock.current ||
            submitLock.current
        ) {
            return
        }

        navigation.setParams({
            reserveProductId: undefined
        })

        openReservation({ id: productId })
    }, [route.params?.reserveProductId, loading, user?.id])

    function closeReservation() {
        if (saving) return

        setSelectedMaterial(null)
    }

    async function saveReservation() {
        if (saving || !selectedMaterial) return

        const requestedQuantity = Number(quantity)

        if (
            !Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1 ||
            requestedQuantity > Number(selectedMaterial.quantity)
        ) {
            Alert.alert("Quantidade inválida", "Informe uma quantidade inteira dentro do estoque disponível.")
            return
        }

        try {
            setSaving(true)

            const response = await api.createReservation(selectedMaterial.id, requestedQuantity)
            const reservation = response.data.shopping

            setSelectedMaterial(null)

            Alert.alert(
                "Solicitação enviada",
                "Sua reserva aguarda avaliação do fornecedor.\n\nProtocolo: " + reservation.id
            )

            await loadMaterials(false)
        } catch (error) {
            if (error.response?.status === 401) {
                setSelectedMaterial(null)
                Alert.alert("Sessão expirada", "Faça login novamente para reservar.", [
                    { text: "Ir para login", onPress: goToLogin }
                ])
            } else if (!error.response || error.response.status >= 500) {
                setSelectedMaterial(null)
                Alert.alert(
                    "Não foi possível confirmar",
                    "A solicitação pode ter sido registrada. Confirme com o fornecedor antes de repetir."
                )
            } else {
                Alert.alert(
                    "Reserva não realizada",
                    error.response.data?.error || "Não foi possível solicitar a reserva."
                )
            }
        } finally {
            setSaving(false)
        }
    }

    function goToLogin() {
        navigation.reset({
            index: 0,
            routes: [{ name: "Login" }]
        })
    }

    function handleNavigation(item) {
        if (saving) return

        switch (item) {
            case "inicio":
                navigation.navigate("DashboardScreen")
                break
            case "mapa":
                navigation.navigate("MapScreen")
                break
            case "marketplace":
                break
            case "historico":
                navigation.navigate("HistoryScreen")
                break
            case "perfil":
                navigation.navigate("ProfileScreen")
                break
        }
    }

    const filteredMaterials = materials.filter(item => {
        const sameCategory = category === "all" || item.category === category
        const text = item.name + " " + (item.description || "") + " " + getCategory(item.category)
        const sameSearch = normalizeText(text).includes(normalizeText(search.trim()))

        return sameCategory && sameSearch
    })

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
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        )
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    {errorMessage || "Não foi possível carregar seu usuário. Faça login novamente."}
                </Text>

                <TouchableOpacity style={styles.button} onPress={goToLogin}>
                    <Text style={styles.buttonText}>Ir para o login</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    if (user.role !== "user") {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    Esta página é destinada ao perfil de comprador / artesão.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate("DashboardScreen")}
                >
                    <Text style={styles.buttonText}>Voltar ao início</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.background}>
            <View style={styles.container}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshMaterials}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                >
                    <Text style={styles.title}>Encontre novos materiais</Text>
                    <Text style={styles.subtitle}>
                        Oportunidades de reaproveitamento para você.
                    </Text>

                    <View style={styles.viewSearch}>
                        <Text style={styles.searchLabel}>Buscar materiais</Text>
                        <TextInput
                            style={styles.input}
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Nome ou descrição do material"
                            placeholderTextColor={colors.textTertiary}
                            accessibilityLabel="Buscar materiais"
                        />
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.viewCategories}
                    >
                        {categories.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.category,
                                    category === item.id && styles.categoryActive
                                ]}
                                onPress={() => setCategory(item.id)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: category === item.id }}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    category === item.id && styles.categoryActiveText
                                ]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.refreshText}>Puxe para atualizar</Text>

                    {opening && <ActivityIndicator color={colors.primary} />}

                    {errorMessage ? (
                        <View style={styles.viewMessage}>
                            <Text style={styles.message}>{errorMessage}</Text>

                            <TouchableOpacity style={styles.buttonOutline} onPress={() => loadMaterials()}>
                                <Text style={styles.buttonOutlineText}>Tentar novamente</Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredMaterials.length === 0 ? (
                        <View style={styles.viewMessage}>
                            <MaterialCommunityIcons
                                name="package-variant-closed"
                                size={36}
                                color={colors.primary}
                            />
                            <Text style={styles.emptyTitle}>Nenhum material encontrado</Text>
                            <Text style={styles.emptyText}>Experimente outra busca ou categoria.</Text>
                        </View>
                    ) : (
                        filteredMaterials.map(item => {
                            const photo = getPhoto(item)

                            return (
                                <View key={item.id} style={styles.card}>
                                    {photo && !photoErrors[item.id] ? (
                                        <Image
                                            source={{ uri: photo }}
                                            style={styles.image}
                                            accessibilityLabel={"Foto de " + item.name}
                                            onError={() => setPhotoErrors(previous => ({
                                                ...previous,
                                                [item.id]: true
                                            }))}
                                        />
                                    ) : (
                                        <View style={[styles.image, styles.imageEmpty]}>
                                            <MaterialCommunityIcons
                                                name="package-variant-closed"
                                                size={28}
                                                color={colors.primaryDark}
                                            />
                                        </View>
                                    )}

                                    <View style={styles.materialContent}>
                                        <Text style={styles.materialCategory}>{getCategory(item.category)}</Text>
                                        <Text style={styles.materialName} numberOfLines={2}>{item.name}</Text>
                                        <Text style={styles.materialPrice}>{getPrice(item)}</Text>

                                        <View style={styles.materialFooter}>
                                            <Text style={styles.materialQuantity}>{item.quantity} unid.</Text>

                                            <TouchableOpacity
                                                style={styles.buttonReserve}
                                                disabled={opening || saving}
                                                onPress={() => openMaterial(item)}
                                                accessibilityRole="button"
                                                accessibilityLabel={"Ver material " + item.name}
                                            >
                                                <Text style={styles.buttonText}>Reservar →</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            )
                        })
                    )}
                </ScrollView>

                <NavBar estagio="comprador" ativo="marketplace" onNavigate={handleNavigation} />
            </View>

            <Modal
                visible={selectedMaterial !== null}
                transparent
                animationType="slide"
                onRequestClose={closeReservation}
            >
                <KeyboardAvoidingView
                    style={styles.modalBackground}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <SafeAreaView style={styles.modal} edges={["bottom"]}>
                        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                            <Text style={styles.modalTitle}>Solicitar reserva</Text>
                            <Text style={styles.materialName}>{selectedMaterial?.name}</Text>
                            <Text style={styles.modalText}>Disponível: {selectedMaterial?.quantity} unidade(s)</Text>

                            {selectedMaterial && (
                                <Text style={styles.modalText}>{getPrice(selectedMaterial)}</Text>
                            )}

                            <Text style={styles.searchLabel}>Quantidade em unidades</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="number-pad"
                                editable={!saving}
                                maxLength={10}
                                accessibilityLabel="Quantidade em unidades"
                            />

                            {selectedMaterial?.type_negotiation === "sale" &&
                                Number.isInteger(Number(quantity)) && Number(quantity) > 0 && (
                                    <Text style={styles.materialName}>
                                        Total: {formatPrice(Number(selectedMaterial.price) * Number(quantity))}
                                    </Text>
                                )
                            }

                            <Text style={styles.modalText}>
                                A solicitação ficará aguardando avaliação do fornecedor.
                            </Text>

                            <TouchableOpacity
                                style={[styles.button, saving && styles.buttonDisabled]}
                                onPress={saveReservation}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <Text style={styles.buttonText}>Confirmar solicitação</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.buttonCancel} onPress={closeReservation} disabled={saving}>
                                <Text style={styles.buttonOutlineText}>Voltar</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>
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
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background
    },
    scrollContent: {
        paddingHorizontal: 21,
        paddingTop: 21,
        paddingBottom: 100
    },
    title: {
        fontSize: 26,
        lineHeight: 39,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    subtitle: {
        marginTop: 14,
        marginBottom: 22,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    viewSearch: {
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    searchLabel: {
        fontSize: 11,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    input: {
        minHeight: 28,
        padding: 0,
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    viewCategories: {
        marginTop: 16,
        padding: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    category: {
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: 12,
        justifyContent: "center"
    },
    categoryActive: {
        backgroundColor: colors.primaryLight
    },
    categoryText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    categoryActiveText: {
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    refreshText: {
        marginVertical: 16,
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    card: {
        flexDirection: "row",
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 16,
        backgroundColor: colors.white
    },
    image: {
        width: 88,
        height: 108,
        marginRight: 12,
        borderRadius: 12,
        resizeMode: "cover"
    },
    imageEmpty: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primaryLight
    },
    materialContent: {
        flex: 1,
        minWidth: 0
    },
    materialCategory: {
        fontSize: 10,
        lineHeight: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    materialName: {
        marginTop: 5,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.bold,
        color: colors.textPrimary
    },
    materialPrice: {
        marginTop: 5,
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    materialFooter: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginTop: 5
    },
    materialQuantity: {
        flexShrink: 1,
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.accent
    },
    buttonReserve: {
        minWidth: 120,
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primaryDark
    },
    button: {
        minHeight: 54,
        marginTop: 8,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primaryDark
    },
    buttonText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.white,
        textAlign: "center"
    },
    buttonDisabled: {
        opacity: 0.5
    },
    buttonOutline: {
        minHeight: 44,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary,
        alignItems: "center",
        justifyContent: "center"
    },
    buttonOutlineText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    viewMessage: {
        paddingVertical: 24,
        alignItems: "center"
    },
    message: {
        marginBottom: 20,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        textAlign: "center"
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 17,
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        textAlign: "center"
    },
    emptyText: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        textAlign: "center"
    },
    modalBackground: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.4)"
    },
    modal: {
        maxHeight: "90%",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: colors.background
    },
    modalContent: {
        padding: 24
    },
    modalTitle: {
        marginBottom: 16,
        fontSize: 22,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    modalText: {
        marginVertical: 12,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    quantityInput: {
        minHeight: 48,
        marginVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        fontSize: 16,
        fontFamily: fonts.regular,
        color: colors.textPrimary,
        backgroundColor: colors.white
    },
    buttonCancel: {
        minHeight: 44,
        marginTop: 12,
        alignItems: "center",
        justifyContent: "center"
    }
})
