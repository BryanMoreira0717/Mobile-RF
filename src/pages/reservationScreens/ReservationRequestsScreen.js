import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
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

// A API ainda não lista as reservas recebidas pela empresa.
// Cada reserva gera uma notificação "reserva_solicitada" para o vendedor,
// com o ID da compra em reference_id: é por ela que a tela aceita ou recusa.
export default function ReservationRequestsScreen({ navigation }) {
    const [user, setUser] = useState(null)
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(null)
    const [errorMessage, setErrorMessage] = useState("")
    // Resposta dada nesta tela: { idDaCompra: "accepted" | "refused" }
    const [answers, setAnswers] = useState({})

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
        if (isFocused) {
            loadRequests()
        }
    }, [isFocused])

    async function loadRequests() {
        try {
            setLoading(true)
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            if (parsedUser.role !== "company") return

            const response = await api.getNotifications()
            const list = Array.isArray(response.data) ? response.data : []

            setRequests(list.filter(item =>
                item.type === "reserva_solicitada" && item.reference_id
            ))
        } catch (error) {
            console.log(
                "Erro ao carregar reservas:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar as reservas.")
        } finally {
            setLoading(false)
        }
    }

    function formatDate(value) {
        const date = new Date(value)

        if (Number.isNaN(date.getTime())) return ""

        return date.toLocaleDateString("pt-BR") + " às " +
            date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }

    async function answerRequest(request, status) {
        if (saving) return

        try {
            setSaving(request.id)

            await api.updateShoppingStatus(request.reference_id, status)

            if (!request.read) {
                await api.markNotificationRead(request.id)
            }

            setAnswers(prev => ({
                ...prev,
                [request.reference_id]: status
            }))

            Alert.alert(
                status === "accepted" ? "Reserva aceita" : "Reserva recusada",
                "O comprador foi avisado."
            )
        } catch (error) {
            console.log(
                "Erro ao responder reserva:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Não foi possível responder",
                String(
                    error.response?.data?.error ||
                    "A reserva pode já ter sido respondida ou cancelada."
                )
            )
        } finally {
            setSaving(null)
        }
    }

    function confirmAnswer(request, status) {
        Alert.alert(
            status === "accepted" ? "Aceitar reserva" : "Recusar reserva",
            status === "accepted"
                ? "Confirma que o material ficará reservado para este comprador?"
                : "Ao recusar, o estoque volta para o anúncio.",
            [
                { text: "Voltar", style: "cancel" },
                {
                    text: status === "accepted" ? "Aceitar" : "Recusar",
                    style: status === "accepted" ? "default" : "destructive",
                    onPress: () => answerRequest(request, status)
                }
            ]
        )
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("DashboardScreen")
        }
    }

    function handleNavigation(item) {
        switch (item) {
            case "inicio":
                navigation.navigate("DashboardScreen")
                break
            case "mapa":
                navigation.navigate("MapScreen")
                break
            case "publicar":
                navigation.navigate("NewMaterialScreen")
                break
            case "anuncios":
                navigation.navigate("MyAdvertisementsScreen")
                break
            case "perfil":
                navigation.navigate("ProfileScreen")
                break
        }
    }

    if (fontError) {
        return (
            <View style={styles.loading}>
                <Text>Não foi possível carregar as fontes.</Text>
            </View>
        )
    }

    if (!fontsLoaded || (loading && requests.length === 0)) {
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
                    onPress={() => navigation.navigate("DashboardScreen")}
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
                <FlatList
                    data={requests}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={loadRequests}
                    ListHeaderComponent={
                        <View>
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

                            <Text style={styles.title}>
                                Reservas recebidas
                            </Text>

                            <Text style={styles.subtitle}>
                                Aceite ou recuse os pedidos dos compradores.
                            </Text>

                            {errorMessage ? (
                                <Text style={styles.subtitle}>{errorMessage}</Text>
                            ) : null}
                        </View>
                    }
                    ListEmptyComponent={
                        <Text style={styles.subtitle}>
                            Nenhum pedido de reserva por enquanto.
                        </Text>
                    }
                    renderItem={({ item }) => {
                        const answer = answers[item.reference_id]

                        return (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>
                                    {item.title}
                                </Text>

                                {item.content ? (
                                    <Text style={styles.cardText}>
                                        {item.content}
                                    </Text>
                                ) : null}

                                <Text style={styles.cardDate}>
                                    {formatDate(item.created_in)}
                                </Text>

                                {answer ? (
                                    <Text style={styles.answer}>
                                        {answer === "accepted"
                                            ? "Reserva aceita"
                                            : "Reserva recusada"}
                                    </Text>
                                ) : (
                                    <View style={styles.viewButtons}>
                                        <TouchableOpacity
                                            style={[
                                                styles.buttonSmall,
                                                saving === item.id && styles.buttonDisabled
                                            ]}
                                            onPress={() => confirmAnswer(item, "accepted")}
                                            disabled={saving !== null}
                                            accessibilityRole="button"
                                        >
                                            <Text style={styles.buttonText}>
                                                Aceitar
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.buttonSmallOutline,
                                                saving === item.id && styles.buttonDisabled
                                            ]}
                                            onPress={() => confirmAnswer(item, "refused")}
                                            disabled={saving !== null}
                                            accessibilityRole="button"
                                        >
                                            <Text style={styles.buttonOutlineText}>
                                                Recusar
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )
                    }}
                />

                <NavBar
                    estagio="empresa"
                    ativo="anuncios"
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
    card: {
        marginBottom: 12,
        padding: 16,
        gap: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    cardTitle: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardText: {
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    cardDate: {
        fontSize: 11,
        fontFamily: fonts.regular,
        color: colors.textTertiary
    },
    answer: {
        marginTop: 4,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDeep
    },
    viewButtons: {
        marginTop: 4,
        flexDirection: "row",
        gap: 10
    },
    buttonSmall: {
        flex: 1,
        minHeight: 44,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonSmallOutline: {
        flex: 1,
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.white,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonDisabled: {
        opacity: 0.5
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
    buttonText: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.white
    },
    buttonOutlineText: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    }
})
