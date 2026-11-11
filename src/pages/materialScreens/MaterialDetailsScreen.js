import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
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

const categories = {
    madeira: "Madeira",
    metal: "Metal",
    plastico: "Plástico",
    "papel/papelao": "Papel / Papelão",
    vidro: "Vidro",
    tecido: "Tecido",
    borracha: "Borracha",
    eletronicos: "Eletrônicos"
}

const conditions = {
    new: "Novo",
    good: "Bom",
    regular: "Regular",
    poor: "Ruim"
}

function getPhotoUri(photo) {
    if (typeof photo !== "string" || !photo) return null

    if (photo.startsWith("data:image/")) return photo

    let type = null

    if (photo.startsWith("iVBOR")) {
        type = "image/png"
    } else if (photo.startsWith("/9j/")) {
        type = "image/jpeg"
    } else if (photo.startsWith("UklGR")) {
        type = "image/webp"
    } else if (photo.startsWith("R0lGOD")) {
        type = "image/gif"
    }

    return type ? `data:${type};base64,${photo}` : null
}

export default function MaterialDetailsScreen({ navigation, route }) {
    const productId = route.params?.productId
    const isFocused = useIsFocused()

    const [user, setUser] = useState(null)
    const [material, setMaterial] = useState(null)
    const [location, setLocation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [locationError, setLocationError] = useState(false)
    const [reload, setReload] = useState(0)
    const [photoIndex, setPhotoIndex] = useState(0)
    const [photoError, setPhotoError] = useState(false)
    const [openingChat, setOpeningChat] = useState(false)

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    useEffect(() => {
        if (!isFocused) return

        let active = true

        async function loadMaterial() {
            try {
                setLoading(true)
                setErrorMessage("")
                setLocationError(false)
                setMaterial(null)
                setLocation(null)
                setUser(null)
                setPhotoIndex(0)
                setPhotoError(false)

                if (!productId) {
                    setErrorMessage("O material não foi informado.")
                    return
                }

                const storedUser = await AsyncStorage.getItem("@user")
                const parsedUser = storedUser ? JSON.parse(storedUser) : null

                if (!active) return

                if (!parsedUser?.id) {
                    setErrorMessage("Faça login para acessar o material.")
                    return
                }

                // As três consultas saem juntas, sem uma esperar a outra.
                // A localização é opcional: se falhar, devolve null.
                const userRequest = api.getUserById(parsedUser.id)
                const productRequest = api.getProductById(productId)
                const locationRequest = api.getProductLocation(productId).catch(() => null)

                // Se o usuário falhar antes, o erro do produto não vira
                // "Uncaught (in promise)": quem trata é o catch abaixo.
                productRequest.catch(() => {})

                const userResponse = await userRequest

                if (!active) return

                if (userResponse.data?.role !== "user") {
                    setErrorMessage(
                        "Esta tela está disponível para comprador / artesão."
                    )
                    return
                }

                setUser(userResponse.data)

                const response = await productRequest

                if (!active) return

                if (
                    !response.data?.id ||
                    String(response.data.id).toLowerCase() !==
                    String(productId).toLowerCase()
                ) {
                    setErrorMessage("Não foi possível identificar o material.")
                    return
                }

                setMaterial(response.data)

                const locationResponse = await locationRequest

                if (active) {
                    if (locationResponse) {
                        setLocation(locationResponse.data)
                    } else {
                        setLocationError(true)
                    }
                }
            } catch (error) {
                if (!active) return

                if (error.response?.status === 401) {
                    setUser(null)
                    setErrorMessage("Sua sessão expirou. Faça login novamente.")
                } else {
                    setErrorMessage(
                        error.response?.data?.error ||
                        "Não foi possível carregar o material. Tente novamente."
                    )
                }
            } finally {
                if (active) setLoading(false)
            }
        }

        loadMaterial()

        return () => {
            active = false
        }
    }, [isFocused, productId, reload])

    // Abre (ou cria) a conversa com a empresa dona do material.
    async function openChat() {
        if (openingChat || !material) return

        try {
            setOpeningChat(true)

            const response = await api.createConversation(material.id_user)

            navigation.navigate("ChatScreen", {
                conversationId: response.data.conversationId
            })
        } catch (error) {
            console.log(
                "Erro ao abrir conversa:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Não foi possível abrir o chat",
                String(error.response?.data?.error || "Tente novamente.")
            )
        } finally {
            setOpeningChat(false)
        }
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("MarketplaceScreen")
        }
    }

    function goToLogin() {
        navigation.reset({
            index: 0,
            routes: [{ name: "Login" }]
        })
    }

    function handleNavigation(item) {
        switch (item) {
            case "inicio":
                navigation.navigate("DashboardScreen")
                break
            case "mapa":
                navigation.navigate("MapScreen")
                break
            case "marketplace":
                navigation.navigate("MarketplaceScreen")
                break
            case "historico":
                navigation.navigate("HistoryScreen")
                break
            case "perfil":
                navigation.navigate("ProfileScreen")
                break
        }
    }

    function changePhoto(index) {
        setPhotoIndex(index)
        setPhotoError(false)
    }

    function handleReserve() {
        if (!canReserve) return

        navigation.navigate("MarketplaceScreen", {
            reserveProductId: material.id
        })
    }

    function getPrice() {
        if (material.type_negotiation === "donation") {
            return "Doação"
        }

        if (
            material.price === null ||
            material.price === undefined ||
            material.price === ""
        ) {
            return "Preço não informado"
        }

        const price = Number(material.price)

        if (!Number.isFinite(price)) return "Preço não informado"

        return price.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        }) + " / unidade"
    }

    if (fontError) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text>Não foi possível carregar as fontes.</Text>
            </SafeAreaView>
        )
    }

    if (!fontsLoaded || loading) {
        return (
            <SafeAreaView style={styles.loading}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />
            </SafeAreaView>
        )
    }

    if (errorMessage || !material || !user) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.text}>
                    {errorMessage || "Material indisponível."}
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setReload(value => value + 1)}
                >
                    <Text style={styles.buttonText}>Tentar novamente</Text>
                </TouchableOpacity>

                {!user && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={goToLogin}
                    >
                        <Text style={styles.backText}>Ir para login</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={goBack}
                >
                    <Text style={styles.backText}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    const quantity = Number(material.quantity)
    const available =
        material.status === "available" &&
        Number.isSafeInteger(quantity) &&
        quantity > 0

    const ownMaterial =
        String(material.id_user).toLowerCase() ===
        String(user.id).toLowerCase()

    const canReserve = available && !ownMaterial

    const photos = Array.isArray(material.photos)
        ? material.photos.filter(item => getPhotoUri(item?.photo))
        : []

    const photoUri = getPhotoUri(photos[photoIndex]?.photo)

    const locationText = [
        location?.neighborhood,
        location?.city,
        location?.state
    ].filter(Boolean).join(" · ")

    const fullAddress = location?.addressFull
        ? [
            location.street,
            location.number,
            location.zipCode
        ].filter(Boolean).join(", ")
        : ""

    const weight = Number(material.weight)

    return (
        <SafeAreaView style={styles.background} edges={["top", "left", "right"]}>
            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={goBack}
                    accessibilityRole="button"
                    accessibilityLabel="Voltar"
                >
                    <MaterialCommunityIcons
                        name="chevron-left"
                        size={22}
                        color={colors.primaryDark}
                    />
                    <Text style={styles.backText}>Voltar</Text>
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {photoUri && !photoError ? (
                        <Image
                            source={{ uri: photoUri }}
                            style={styles.image}
                            resizeMode="cover"
                            accessibilityLabel={`Foto de ${material.name}`}
                            onError={() => setPhotoError(true)}
                        />
                    ) : (
                        <View style={[styles.image, styles.imageEmpty]}>
                            <MaterialCommunityIcons
                                name="image-off-outline"
                                size={42}
                                color={colors.primaryDark}
                            />
                            <Text style={styles.text}>
                                Foto indisponível
                            </Text>
                        </View>
                    )}

                    {photos.length > 1 && (
                        <View style={styles.photoNavigation}>
                            <TouchableOpacity
                                style={styles.photoButton}
                                disabled={photoIndex === 0}
                                onPress={() => changePhoto(photoIndex - 1)}
                                accessibilityLabel="Foto anterior"
                            >
                                <MaterialCommunityIcons
                                    name="chevron-left"
                                    size={24}
                                    color={
                                        photoIndex === 0
                                            ? colors.textTertiary
                                            : colors.primaryDark
                                    }
                                />
                            </TouchableOpacity>

                            <Text style={styles.text}>
                                {photoIndex + 1} de {photos.length}
                            </Text>

                            <TouchableOpacity
                                style={styles.photoButton}
                                disabled={photoIndex === photos.length - 1}
                                onPress={() => changePhoto(photoIndex + 1)}
                                accessibilityLabel="Próxima foto"
                            >
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={24}
                                    color={
                                        photoIndex === photos.length - 1
                                            ? colors.textTertiary
                                            : colors.primaryDark
                                    }
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.badges}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {categories[material.category] || material.category}
                            </Text>
                        </View>

                        <View style={[styles.badge, styles.conditionBadge]}>
                            <Text style={[styles.badgeText, styles.conditionText]}>
                                {conditions[material.conservation_state] || "Não informado"}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{material.name}</Text>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            Retirada do material
                        </Text>

                        <Text style={styles.text}>
                            {locationError
                                ? "Não foi possível carregar a localização."
                                : locationText || "Localização não informada."}
                        </Text>

                        {!!fullAddress && (
                            <Text style={styles.text}>{fullAddress}</Text>
                        )}
                    </View>

                    <View style={styles.summary}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.small}>Quantidade</Text>
                            <Text style={styles.summaryValue}>
                                {Number.isSafeInteger(quantity) ? quantity : "—"}
                            </Text>
                            <Text style={styles.small}>
                                {available ? "Unid. disponíveis" : "Indisponível"}
                            </Text>
                        </View>

                        <View style={styles.summaryCard}>
                            <Text style={styles.small}>Peso informado</Text>
                            <Text style={styles.summaryValue}>
                                {Number.isFinite(weight) && weight > 0
                                    ? weight.toLocaleString("pt-BR")
                                    : "—"}
                            </Text>
                            <Text style={styles.small}>Quilogramas</Text>
                        </View>

                        <View style={styles.summaryCard}>
                            <Text style={styles.small}>Negociação</Text>
                            <Text style={styles.summaryValue}>
                                {material.type_negotiation === "donation"
                                    ? "Doação"
                                    : "Venda"}
                            </Text>
                            <Text style={styles.small}>
                                {material.type_negotiation === "donation"
                                    ? "Sem custo"
                                    : "Por unidade"}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>
                        Descrição do material
                    </Text>

                    <Text style={styles.text}>
                        {material.description || "Descrição não informada."}
                    </Text>

                    <View style={styles.impactCard}>
                        <MaterialCommunityIcons
                            name="leaf"
                            size={24}
                            color={colors.primaryDark}
                        />
                        <Text style={styles.text}>
                            Reaproveite materiais e contribua para reduzir o descarte.
                        </Text>
                    </View>

                    <Text style={styles.price}>{getPrice()}</Text>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            !canReserve && styles.disabledButton
                        ]}
                        disabled={!canReserve}
                        onPress={handleReserve}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !canReserve }}
                    >
                        <Text style={styles.buttonText}>
                            {ownMaterial
                                ? "Este anúncio é seu"
                                : !available
                                    ? "Material indisponível"
                                    : material.type_negotiation === "donation"
                                        ? "Reservar lote grátis"
                                        : "Reservar lote"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={openChat}
                        disabled={openingChat}
                        accessibilityRole="button"
                    >
                        {openingChat ? (
                            <ActivityIndicator color={colors.primaryDark} />
                        ) : (
                            <Text style={styles.contactText}>
                                Conversar com a empresa
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>

                <NavBar
                    estagio="comprador"
                    ativo="marketplace"
                    onNavigate={handleNavigation}
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
    content: {
        flex: 1
    },
    loading: {
        flex: 1,
        padding: 24,
        gap: 16,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background
    },
    backButton: {
        minHeight: 44,
        paddingHorizontal: 21,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-start",
        gap: 8
    },
    backText: {
        fontFamily: fonts.bold,
        fontSize: 13,
        color: colors.primaryDark
    },
    scrollContent: {
        padding: 21,
        paddingBottom: 100,
        gap: 16
    },
    image: {
        width: "100%",
        height: 250,
        borderRadius: 20
    },
    imageEmpty: {
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.primaryLight
    },
    photoNavigation: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 16
    },
    photoButton: {
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center"
    },
    badges: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    badge: {
        minHeight: 26,
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: colors.primaryLight
    },
    badgeText: {
        fontFamily: fonts.bold,
        fontSize: 10,
        color: colors.primaryDark
    },
    conditionBadge: {
        backgroundColor: colors.warningLight
    },
    conditionText: {
        color: colors.accent
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 26,
        lineHeight: 39,
        color: colors.primaryDark
    },
    card: {
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 16,
        backgroundColor: colors.white
    },
    sectionTitle: {
        fontFamily: fonts.bold,
        fontSize: 17,
        lineHeight: 26,
        color: colors.primaryDark
    },
    text: {
        fontFamily: fonts.regular,
        fontSize: 12,
        lineHeight: 18,
        color: colors.textSecondary
    },
    small: {
        fontFamily: fonts.regular,
        fontSize: 10,
        lineHeight: 15,
        color: colors.textSecondary
    },
    summary: {
        flexDirection: "row",
        gap: 12
    },
    summaryCard: {
        flex: 1,
        minWidth: 0,
        minHeight: 132,
        padding: 12,
        gap: 8,
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 16,
        backgroundColor: colors.white
    },
    summaryValue: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.primaryDark
    },
    impactCard: {
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 16,
        backgroundColor: colors.primaryLight
    },
    price: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.primaryDeep
    },
    button: {
        minHeight: 54,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primaryDark
    },
    buttonText: {
        fontFamily: fonts.bold,
        fontSize: 14,
        color: colors.white,
        textAlign: "center"
    },
    disabledButton: {
        opacity: 0.5
    },
    contactButton: {
        minHeight: 54,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.white
    },
    contactText: {
        fontFamily: fonts.bold,
        fontSize: 14,
        color: colors.textTertiary
    }
})