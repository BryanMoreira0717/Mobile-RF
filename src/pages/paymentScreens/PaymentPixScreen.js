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
import * as Clipboard from "expo-clipboard";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";
import api from "../../services/axios";

export default function PaymentPixScreen({ navigation, route }) {
    const [user, setUser] = useState(null)
    const [shopping, setShopping] = useState(null)
    const [payment, setPayment] = useState(null)
    const [checkout, setCheckout] = useState(null)
    const [loading, setLoading] = useState(true)
    const [checking, setChecking] = useState(false)
    const [copied, setCopied] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    const shoppingId = route?.params?.shoppingId

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    useEffect(() => {
        loadPayment()
    }, [])

    async function loadPayment() {
        try {
            setLoading(true)
            setErrorMessage("")
            setCopied(false)
            setShopping(null)
            setPayment(null)
            setCheckout(null)
            setUser(null)

            const storedUser = await AsyncStorage.getItem("@user")

            if (!storedUser) return

            const parsedUser = JSON.parse(storedUser)

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            if (parsedUser.role !== "user") return

            if (!shoppingId) {
                setErrorMessage("Reserva não informada.")
                return
            }

            // O backend reaproveita o PIX pendente desta compra,
            // então abrir a tela de novo não gera outra cobrança.
            // As duas consultas saem juntas, sem uma esperar a outra.
            const shoppingRequest = api.getShoppingById(shoppingId)
            const paymentRequest = api.createPayment({
                id_shopping: shoppingId,
                method: "pix"
            })

            // Se a reserva falhar antes, o erro do PIX não vira
            // "Uncaught (in promise)": quem trata é o catch abaixo.
            paymentRequest.catch(() => {})

            const shoppingResponse = await shoppingRequest

            setShopping(shoppingResponse.data)

            const response = await paymentRequest

            setPayment(response.data.payment)
            setCheckout(response.data.checkout)
        } catch (error) {
            console.log(
                "Erro ao gerar PIX:",
                error.response?.data || error.message
            )

            if (error.response?.status === 401) {
                Alert.alert(
                    "Sessão encerrada",
                    "Sua sessão expirou. Faça login novamente."
                )
                setUser(null)
            } else if (!error.response || error.response.status >= 500) {
                setErrorMessage(
                    "Não foi possível gerar o PIX agora. Tente novamente; a mesma cobrança será recuperada."
                )
            } else {
                setErrorMessage(
                    String(
                        error.response.data?.error ||
                        "Não foi possível gerar o PIX."
                    )
                )
            }
        } finally {
            setLoading(false)
        }
    }

    async function copyCode() {
        if (!checkout || !checkout.qr_code) return

        try {
            await Clipboard.setStringAsync(checkout.qr_code)
            setCopied(true)
        } catch (error) {
            console.log("Erro ao copiar código PIX:", error.message)

            Alert.alert(
                "Erro",
                "Não foi possível copiar o código PIX."
            )
        }
    }

    async function checkPayment() {
        if (checking || !payment) return

        try {
            setChecking(true)

            const response = await api.syncPayment(payment.id)

            setPayment(response.data.payment)
            setCheckout(response.data.checkout)

            if (response.data.payment.status === "approved") {
                navigation.reset({
                    index: 1,
                    routes: [
                        { name: "MarketplaceScreen" },
                        { name: "ReservationConfirmedScreen", params: { shoppingId: shoppingId } }
                    ]
                })
            } else if (response.data.payment.status === "refused") {
                Alert.alert(
                    "Pagamento recusado",
                    "O PIX não foi aprovado. Gere um novo código para tentar de novo."
                )
            } else {
                Alert.alert(
                    "Aguardando pagamento",
                    "Ainda não recebemos a confirmação do PIX. Após pagar, tente novamente."
                )
            }
        } catch (error) {
            console.log(
                "Erro ao consultar pagamento:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                String(
                    error.response?.data?.error ||
                    "Não foi possível consultar o pagamento."
                )
            )
        } finally {
            setChecking(false)
        }
    }

    function formatPrice(value) {
        return Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
    }

    function getStatus(status) {
        switch (status) {
            case "pending":
                return "Aguardando"
            case "approved":
                return "Aprovado"
            case "refused":
                return "Recusado"
            case "refunded":
                return "Estornado"
            default:
                return "Status não informado"
        }
    }

    function goBack() {
        if (checking) return

        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("MarketplaceScreen")
        }
    }

    function handleNavigation(item) {
        if (checking) return

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

    if (user.role !== "user") {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    Esta página é destinada ao perfil de comprador.
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

    if (errorMessage || !payment) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    {errorMessage || "Não foi possível gerar o PIX."}
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={loadPayment}
                >
                    <Text style={styles.buttonText}>
                        Tentar novamente
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.buttonOutline}
                    onPress={goBack}
                >
                    <Text style={styles.buttonOutlineText}>
                        Voltar
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    const item = shopping && shopping.items ? shopping.items[0] : null

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right"]}
        >
            <View style={styles.container}>
                <ScrollView
                    style={styles.container}
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

                        <Text style={styles.textBack}>
                            Voltar
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.eyebrow}>Pagamento</Text>
                    <Text style={styles.title}>
                        Pague com PIX
                    </Text>

                    <Text style={styles.subtitle}>
                        Escaneie o QR Code ou copie o código abaixo.
                    </Text>

                    <View style={styles.summary}>
                        <Text style={styles.summaryLabel}>
                            RESUMO DA RESERVA
                        </Text>

                        <Text style={styles.summaryName}>
                            {item ? item.product_name : "Material"}
                        </Text>

                        {item && (
                            <Text style={styles.summaryInfo}>
                                {item.quantity} unidade(s)
                            </Text>
                        )}

                        <View style={styles.summaryTotal}>
                            <Text style={styles.summaryTotalLabel}>
                                Total
                            </Text>

                            <Text style={styles.summaryTotalValue}>
                                {formatPrice(payment.value)}
                            </Text>
                        </View>
                    </View>

                    {payment.status === "pending" && checkout && checkout.qr_code ? (
                        <View style={styles.pix}>
                            {checkout.qr_code_base64 && (
                                <Image
                                    source={{
                                        uri: "data:image/png;base64," +
                                            checkout.qr_code_base64
                                    }}
                                    style={styles.qrCode}
                                    accessibilityLabel="QR Code do PIX"
                                />
                            )}

                            <Text style={styles.pixLabel}>
                                Código PIX
                            </Text>

                            <Text
                                style={styles.pixCode}
                                selectable
                            >
                                {checkout.qr_code}
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.buttonOutline,
                                    copied && styles.buttonCopied
                                ]}
                                onPress={copyCode}
                                accessibilityRole="button"
                            >
                                <Text
                                    style={[
                                        styles.buttonOutlineText,
                                        copied && styles.buttonCopiedText
                                    ]}
                                >
                                    {copied ? "Código copiado ✓" : "Copiar código"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.pix}>
                            <Text style={styles.pixLabel}>
                                {payment.status === "approved"
                                    ? "Este PIX já foi pago."
                                    : "Este PIX não está mais disponível para pagamento."}
                            </Text>
                        </View>
                    )}

                    <View
                        style={[
                            styles.badge,
                            payment.status === "approved" && styles.badgeApproved
                        ]}
                    >
                        <Text
                            style={[
                                styles.badgeText,
                                payment.status === "approved" && styles.badgeApprovedText
                            ]}
                        >
                            {getStatus(payment.status)}
                        </Text>
                    </View>

                    {payment.status === "refused" ? (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={loadPayment}
                            accessibilityRole="button"
                        >
                            <Text style={styles.buttonText}>
                                Gerar novo PIX
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.button,
                                checking && styles.buttonDisabled
                            ]}
                            onPress={checkPayment}
                            disabled={checking}
                            accessibilityRole="button"
                        >
                            {checking ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>
                                    Confirmar Reserva e Contribuir
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                </ScrollView>

                <NavBar
                    estagio="comprador"
                    ativo="marketplace"
                    onNavigate={checking ? undefined : handleNavigation}
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
        fontSize: 15,
        lineHeight: 24,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    summary: {
        marginTop: 16,
        padding: 14,
        gap: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    summaryLabel: {
        fontSize: 11,
        lineHeight: 17,
        fontFamily: fonts.bold,
        color: colors.textSecondary
    },
    summaryName: {
        fontSize: 17,
        lineHeight: 26,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    summaryInfo: {
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    summaryTotal: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    summaryTotalLabel: {
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    summaryTotalValue: {
        fontSize: 24,
        lineHeight: 36,
        fontFamily: fonts.bold,
        color: colors.primaryDeep
    },
    pix: {
        marginTop: 16,
        padding: 16,
        gap: 12,
        alignItems: "center",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    qrCode: {
        width: 224,
        height: 224
    },
    pixLabel: {
        alignSelf: "stretch",
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    pixCode: {
        alignSelf: "stretch",
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    badge: {
        marginTop: 16,
        height: 26,
        paddingHorizontal: 16,
        alignSelf: "flex-start",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 100,
        backgroundColor: colors.warningLight
    },
    badgeText: {
        fontSize: 10,
        lineHeight: 15,
        fontFamily: fonts.bold,
        color: colors.accent
    },
    badgeApproved: {
        backgroundColor: colors.primaryLight
    },
    badgeApprovedText: {
        color: colors.primaryDeep
    },
    button: {
        width: "100%",
        minHeight: 54,
        marginTop: 16,
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
    buttonOutline: {
        width: "100%",
        minHeight: 54,
        marginTop: 4,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonOutlineText: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    buttonCopied: {
        borderColor: colors.borderLight,
        backgroundColor: colors.borderLight
    },
    buttonCopiedText: {
        color: colors.textSecondary
    },
    eyebrow: {
        marginBottom: 10,
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
    }
})
