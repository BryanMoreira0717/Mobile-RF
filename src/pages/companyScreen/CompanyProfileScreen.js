import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { useFonts } from "expo-font"
import {
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold
} from "@expo-google-fonts/manrope"
import {
    Gelasio_400Regular,
    Gelasio_400Regular_Italic,
    Gelasio_700Bold
} from "@expo-google-fonts/gelasio"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

import colors from "../../theme/colors"
import { showAlert } from "../../components/AppAlert"
import { fonts } from "../../theme/fonts"
import api from "../../services/axios"

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

// Perfil público da empresa: aberto por comprador, empresa e admin.
// Recebe companyId (e companyName, se a tela de origem já souber).
export default function CompanyProfileScreen({ navigation, route }) {
    const companyId = route?.params?.companyId

    const [user, setUser] = useState(null)
    const [name, setName] = useState(route?.params?.companyName || "")
    const [photo, setPhoto] = useState(null)
    const [places, setPlaces] = useState([])
    const [products, setProducts] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
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
        loadCompany()
    }, [])

    async function loadCompany() {
        try {
            setLoading(true)
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            setUser(parsedUser)

            if (!companyId) {
                setErrorMessage("Empresa não informada.")
                return
            }

            // As consultas saem juntas; cada uma que falhar só esconde a sua parte.
            const companiesRequest = api.getCompaniesMap().catch(() => null)
            const productsRequest = api.getProductsLight().catch(() => null)
            const reviewsRequest = api.getReviews().catch(() => null)

            loadPhoto()

            const sameCompany = item =>
                String(item).toLowerCase() === String(companyId).toLowerCase()

            const companiesResponse = await companiesRequest
            const companies = Array.isArray(companiesResponse?.data) ? companiesResponse.data : []
            const mine = companies.filter(item => sameCompany(item.companyId))

            if (mine.length > 0) {
                setName(mine[0].name)
            }

            setPlaces(mine)

            const productsResponse = await productsRequest
            const list = Array.isArray(productsResponse?.data) ? productsResponse.data : []

            setProducts(list.filter(item =>
                sameCompany(item.id_user) &&
                item.status === "available" &&
                Number(item.quantity) > 0
            ))

            const reviewsResponse = await reviewsRequest
            const allReviews = Array.isArray(reviewsResponse?.data) ? reviewsResponse.data : []

            setReviews(allReviews
                .filter(item => sameCompany(item.id_reviewed))
                .sort((a, b) => new Date(b.created_in) - new Date(a.created_in)))
        } catch (error) {
            console.log(
                "Erro ao carregar empresa:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar a empresa.")
        } finally {
            setLoading(false)
        }
    }

    // A foto fica no banco; a API devolve a imagem e aqui ela vira data URI.
    async function loadPhoto() {
        try {
            const response = await api.getUserPhoto(companyId)

            // 204: a empresa ainda não tem foto.
            if (response.status !== 200 || !response.data) return

            const reader = new FileReader()
            reader.onloadend = () => setPhoto(reader.result)
            reader.readAsDataURL(response.data)
        } catch (e) {
            console.log("Erro ao carregar foto da empresa:", e.response?.status || e.message)
        }
    }

    async function openChat() {
        if (openingChat) return

        try {
            setOpeningChat(true)

            const response = await api.createConversation(companyId)

            navigation.navigate("ChatScreen", {
                conversationId: response.data.conversationId,
                otherUserName: name,
                otherUserRole: "company"
            })
        } catch (error) {
            console.log(
                "Erro ao abrir conversa:",
                error.response?.data || error.message
            )

            showAlert(
                "Não foi possível abrir o chat",
                String(error.response?.data?.error || "Tente novamente.")
            )
        } finally {
            setOpeningChat(false)
        }
    }

    function getInitials(value) {
        const parts = String(value || "Empresa").trim().split(" ").filter(Boolean)

        return parts.slice(0, 2).map(part => part[0].toUpperCase()).join("")
    }

    function formatDate(value) {
        const date = new Date(value)

        if (Number.isNaN(date.getTime())) return ""

        return date.toLocaleDateString("pt-BR")
    }

    function getPrice(product) {
        if (product.type_negotiation === "donation") return "Doação"

        return Number(product.price).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
    }

    // Estrelas cheias, meia e vazias para uma nota de 0 a 5.
    function renderStars(value, size) {
        const stars = []

        for (let i = 1; i <= 5; i++) {
            let icon = "star-outline"

            if (value >= i) {
                icon = "star"
            } else if (value >= i - 0.5) {
                icon = "star-half-full"
            }

            stars.push(
                <MaterialCommunityIcons
                    key={i}
                    name={icon}
                    size={size}
                    color={colors.accent}
                />
            )
        }

        return <View style={styles.stars}>{stars}</View>
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("DashboardScreen")
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

    if (errorMessage) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>{errorMessage}</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={goBack}
                >
                    <Text style={styles.buttonText}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    let total = 0

    for (const item of reviews) {
        total += Number(item.rating)
    }

    const average = reviews.length > 0 ? total / reviews.length : 0

    // Bairros sem repetir (a empresa pode ter mais de um endereço).
    const neighborhoods = []

    for (const place of places) {
        const text = place.neighborhood + ", " + place.city

        if (!neighborhoods.includes(text)) {
            neighborhoods.push(text)
        }
    }

    const isBuyer = user?.role === "user"

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right", "bottom"]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
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

                    <Text style={styles.textBack}>Voltar</Text>
                </TouchableOpacity>

                <Text style={styles.eyebrow}>Empresa parceira</Text>

                <View style={styles.header}>
                    {photo ? (
                        <Image
                            source={{ uri: photo }}
                            style={styles.avatar}
                            accessibilityLabel={"Foto de " + name}
                        />
                    ) : (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials(name)}</Text>
                        </View>
                    )}

                    <View style={styles.headerTexts}>
                        <Text style={styles.title}>{name || "Empresa"}</Text>

                        {reviews.length > 0 ? (
                            <View style={styles.ratingRow}>
                                {renderStars(average, 16)}
                                <Text style={styles.ratingText}>
                                    {average.toFixed(1).replace(".", ",")} · {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.ratingText}>Ainda sem avaliações</Text>
                        )}
                    </View>
                </View>

                {neighborhoods.length > 0 && (
                    <View style={styles.places}>
                        {neighborhoods.map(item => (
                            <View key={item} style={styles.place}>
                                <MaterialCommunityIcons
                                    name="map-marker-outline"
                                    size={16}
                                    color={colors.primaryDark}
                                />
                                <Text style={styles.placeText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {isBuyer && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={openChat}
                        disabled={openingChat}
                        accessibilityRole="button"
                    >
                        {openingChat ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>Conversar com a empresa</Text>
                        )}
                    </TouchableOpacity>
                )}

                <Text style={styles.sectionTitle}>Materiais disponíveis</Text>

                {products.length === 0 ? (
                    <Text style={styles.text}>Nenhum material disponível no momento.</Text>
                ) : (
                    products.map(product => (
                        <TouchableOpacity
                            key={product.id}
                            style={styles.card}
                            disabled={!isBuyer}
                            onPress={() => navigation.navigate("MaterialDetailsScreen", { productId: product.id })}
                            accessibilityRole="button"
                        >
                            <View style={styles.cardIcon}>
                                <MaterialCommunityIcons
                                    name="package-variant-closed"
                                    size={22}
                                    color={colors.primaryDark}
                                />
                            </View>

                            <View style={styles.cardTexts}>
                                <Text style={styles.cardTitle}>{product.name}</Text>
                                <Text style={styles.cardText}>
                                    {categories[product.category] || product.category} · {getPrice(product)}
                                </Text>
                            </View>

                            {isBuyer && (
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            )}
                        </TouchableOpacity>
                    ))
                )}

                <Text style={styles.sectionTitle}>Avaliações</Text>

                {reviews.length === 0 ? (
                    <Text style={styles.text}>
                        As avaliações aparecem aqui depois que os compradores finalizam pedidos.
                    </Text>
                ) : (
                    reviews.map(review => (
                        <View key={review.id} style={styles.review}>
                            <View style={styles.reviewHeader}>
                                {renderStars(Number(review.rating), 14)}
                                <Text style={styles.reviewDate}>{formatDate(review.created_in)}</Text>
                            </View>

                            <Text style={styles.reviewText}>
                                {review.comment || "Sem comentário."}
                            </Text>
                            <Text style={styles.reviewAuthor}>Comprador verificado</Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.background
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
        paddingBottom: 40
    },
    buttonBack: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginBottom: 12
    },
    textBack: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.primaryDark,
        textDecorationLine: "underline"
    },
    eyebrow: {
        marginBottom: 12,
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primaryLight
    },
    avatarText: {
        fontSize: 24,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    headerTexts: {
        flex: 1
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        fontFamily: fonts.serif,
        color: colors.primaryDark,
        letterSpacing: -0.6
    },
    ratingRow: {
        marginTop: 6,
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8
    },
    stars: {
        flexDirection: "row"
    },
    ratingText: {
        marginTop: 4,
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    places: {
        marginTop: 18,
        gap: 6
    },
    place: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6
    },
    placeText: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    button: {
        minHeight: 52,
        marginTop: 20,
        paddingHorizontal: 20,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primaryDark
    },
    buttonText: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.white
    },
    sectionTitle: {
        marginTop: 28,
        marginBottom: 10,
        fontSize: 20,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    text: {
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    card: {
        marginBottom: 10,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    cardIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primaryLight
    },
    cardTexts: {
        flex: 1
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardText: {
        marginTop: 2,
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    review: {
        marginBottom: 10,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    reviewDate: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textTertiary
    },
    reviewText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    reviewAuthor: {
        marginTop: 6,
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.textSecondary
    }
})
