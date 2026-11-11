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
    // Filtros do catálogo do site: tipo de negociação e ordenação.
    const [type, setType] = useState("all")
    const [sort, setSort] = useState("api")
    const [selectedMaterial, setSelectedMaterial] = useState(null)
    const [quantity, setQuantity] = useState("1")
    const [opening, setOpening] = useState(false)
    const [saving, setSaving] = useState(false)
    const [photoErrors, setPhotoErrors] = useState({})

    const isFocused = useIsFocused()

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    useEffect(() => {
        // Ao voltar para a tela, atualiza sem esconder a lista que já existe.
        if (isFocused) {
            loadMaterials(materials.length === 0)
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

            // Aceite antes do pagamento: a empresa aceita primeiro; o pagamento
            // (venda) é liberado no Histórico depois do aceite.
            Alert.alert(
                "Solicitação enviada",
                selectedMaterial.type_negotiation === "sale"
                    ? "Agora a empresa avalia a sua reserva. Quando ela aceitar, o pagamento é liberado em Histórico e você tem 48 horas para pagar."
                    : "Agora a empresa avalia a sua reserva. Você recebe um aviso quando ela responder.",
                [
                    { text: "Ver no Histórico", onPress: () => navigation.navigate("HistoryScreen") },
                    { text: "Continuar explorando", style: "cancel" }
                ]
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
        const sameType = type === "all" || item.type_negotiation === type
        const text = item.name + " " + (item.description || "") + " " + getCategory(item.category)
        const sameSearch = normalizeText(text).includes(normalizeText(search.trim()))

        return sameCategory && sameType && sameSearch
    }).sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name, "pt-BR")
        if (sort === "quantity") return Number(b.quantity) - Number(a.quantity)
        return 0
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
        <SafeAreaView style={styles.background} edges={["top", "left", "right"]}>
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
                    <Text style={styles.eyebrow}>Marketplace</Text>
                    <Text style={styles.title}>
                        Novos começos,{"\n"}<Text style={styles.titleEm}>com os mesmos materiais.</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Explore materiais publicados por empresas e encontre possibilidades para a sua próxima criação.
                    </Text>

                    {/* Painel de filtros, como o "Filtrar materiais" do site */}
                    <View style={styles.filters}>
                        <Text style={styles.filtersTitle}>Filtrar materiais</Text>

                        <View style={styles.viewCategories}>
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
                        </View>

                        <Text style={styles.filtersLabel}>Tipo</Text>
                        <View style={styles.viewCategories}>
                            {[["all", "Todos"], ["sale", "Venda"], ["donation", "Doação"]].map(([value, label]) => (
                                <TouchableOpacity
                                    key={value}
                                    style={[styles.category, type === value && styles.categoryActive]}
                                    onPress={() => setType(value)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: type === value }}
                                >
                                    <Text style={[styles.categoryText, type === value && styles.categoryActiveText]}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.filtersLabel}>Ordenar por</Text>
                        <View style={styles.viewCategories}>
                            {[["api", "Ordem do catálogo"], ["name", "Nome"], ["quantity", "Maior quantidade"]].map(([value, label]) => (
                                <TouchableOpacity
                                    key={value}
                                    style={[styles.category, sort === value && styles.categoryActive]}
                                    onPress={() => setSort(value)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: sort === value }}
                                >
                                    <Text style={[styles.categoryText, sort === value && styles.categoryActiveText]}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Materiais do marketplace</Text>

                    <View style={styles.viewSearch}>
                        <MaterialCommunityIcons name="magnify" size={20} color={colors.primaryDark} />
                        <TextInput
                            style={styles.input}
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Buscar materiais..."
                            placeholderTextColor={colors.textTertiary}
                            accessibilityLabel="Buscar materiais"
                        />
                    </View>

                    <Text style={styles.refreshText}>
                        {filteredMaterials.length} {filteredMaterials.length === 1 ? "material encontrado" : "materiais encontrados"} · puxe para atualizar
                    </Text>

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
                                                size={30}
                                                color={colors.textTertiary}
                                            />
                                            <Text style={styles.imageEmptyTitle}>{getCategory(item.category)}</Text>
                                            <Text style={styles.imageEmptyText}>Sem foto disponível</Text>
                                        </View>
                                    )}

                                    <View style={styles.materialContent}>
                                        <Text style={styles.materialCategory}>{getCategory(item.category)}</Text>
                                        <Text style={styles.materialName} numberOfLines={2}>{item.name}</Text>
                                        <Text style={styles.materialPrice}>{getPrice(item)}</Text>

                                        <View style={styles.materialFooter}>
                                            <Text style={styles.materialMeta}>
                                                Quantidade <Text style={styles.materialMetaValue}>{item.quantity} unidades</Text>
                                            </Text>
                                            <Text style={styles.materialMeta}>
                                                Disponibilidade <Text style={styles.materialMetaValue}>Disponível</Text>
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.buttonReserve}
                                            disabled={opening || saving}
                                            onPress={() => openMaterial(item)}
                                            accessibilityRole="button"
                                            accessibilityLabel={"Ver material " + item.name}
                                        >
                                            <Text style={styles.buttonText}>Ver material</Text>
                                        </TouchableOpacity>
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
                                A empresa avalia a solicitação. Em vendas, o pagamento é liberado depois do aceite.
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
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 120
    },
    title: {
        fontSize: 36,
        lineHeight: 40,
        fontFamily: fonts.serif,
        color: colors.primaryDark,
        letterSpacing: -1.2,
        marginTop: 14
    },
    subtitle: {
        marginTop: 16,
        marginBottom: 22,
        fontSize: 15,
        lineHeight: 24,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    viewSearch: {
        minHeight: 56,
        paddingVertical: 4,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.primary
    },
    searchLabel: {
        fontSize: 11,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    input: {
        minHeight: 44,
        padding: 0,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.textPrimary,
        flex: 1
    },
    viewCategories: {
        marginTop: 14,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    category: {
        paddingHorizontal: 14,
        borderRadius: 100,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white
    },
    categoryActive: {
        backgroundColor: colors.primaryDark,
        borderColor: colors.primaryDark
    },
    categoryText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.primaryDark
    },
    categoryActiveText: {
        fontFamily: fonts.bold,
        color: colors.white
    },
    refreshText: {
        marginVertical: 16,
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        marginTop: 14,
        marginBottom: 18
    },
    card: {
        marginBottom: 22,
        borderWidth: 0,
        borderRadius: 20,
        backgroundColor: colors.white,
        width: "100%",
        overflow: "hidden"
    },
    image: {
        width: "100%",
        height: undefined,
        borderRadius: 0,
        resizeMode: "cover",
        aspectRatio: 1.45,
        backgroundColor: colors.primaryLight
    },
    imageEmpty: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F3F4F1",
        gap: 6
    },
    materialContent: {
        paddingHorizontal: 22,
        paddingTop: 20,
        paddingBottom: 22
    },
    materialCategory: {
        fontSize: 12,
        lineHeight: 15,
        fontFamily: fonts.regular,
        color: colors.primaryDark,
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        overflow: "hidden",
        backgroundColor: colors.primaryLight
    },
    materialName: {
        marginTop: 14,
        fontSize: 24,
        lineHeight: 30,
        fontFamily: fonts.serif,
        color: colors.primaryDark,
        letterSpacing: -0.6
    },
    materialPrice: {
        marginTop: 10,
        fontSize: 15,
        lineHeight: 18,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    materialFooter: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight
    },
    materialQuantity: {
        flexShrink: 1,
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.accent
    },
    buttonReserve: {
        minWidth: 120,
        minHeight: 48,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primaryDark,
        width: "100%",
        marginTop: 18
    },
    button: {
        minHeight: 54,
        marginTop: 8,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primaryDark
    },
    buttonText: {
        fontSize: 15,
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
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.white
    },
    buttonOutlineText: {
        fontSize: 15,
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
        fontSize: 24,
        fontFamily: fonts.serif,
        color: colors.primaryDark,
        textAlign: "center",
        lineHeight: 30
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
        fontSize: 24,
        fontFamily: fonts.serif,
        color: colors.primaryDark,
        lineHeight: 30
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
    },
    eyebrow: {
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
    },
    titleEm: {
        fontFamily: fonts.serifItalic
    },
    filters: {
        marginTop: 28,
        padding: 22,
        borderRadius: 20,
        backgroundColor: colors.surfaceMuted
    },
    filtersTitle: {
        fontFamily: fonts.bold,
        fontSize: 15,
        color: colors.primaryDark
    },
    sectionTitle: {
        marginTop: 30,
        fontFamily: fonts.bold,
        fontSize: 20,
        color: colors.primaryDark
    },
    imageEmptyTitle: {
        fontFamily: fonts.serif,
        fontSize: 18,
        color: colors.primaryDark
    },
    imageEmptyText: {
        fontFamily: fonts.regular,
        fontSize: 11,
        color: colors.textSecondary
    },
    materialMeta: {
        fontFamily: fonts.regular,
        fontSize: 11,
        color: colors.textSecondary
    },
    materialMetaValue: {
        color: colors.primaryDark
    },
    filtersLabel: {
        marginTop: 18,
        fontFamily: fonts.bold,
        fontSize: 12,
        color: colors.primary
    }
})
