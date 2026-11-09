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
    Platform,
    Animated,
    Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
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

export default function PaymentCardScreen({ navigation, route }) {
    const [user, setUser] = useState(null)
    const [shopping, setShopping] = useState(null)
    const [publicKey, setPublicKey] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [checking, setChecking] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    // Tentativa anterior que ficou sem resposta do Mercado Pago.
    const [pendingPayment, setPendingPayment] = useState(null)
    // Bandeira identificada pelos 6 primeiros dígitos (resposta do Mercado Pago).
    const [paymentMethod, setPaymentMethod] = useState(null)
    const [bin, setBin] = useState("")
    const [card, setCard] = useState({
        number: "",
        holder: "",
        expiration: "",
        cvv: "",
        cpf: ""
    })

    // Animação do logo da bandeira: cresce e aparece ao identificar.
    const brandScale = useRef(new Animated.Value(0)).current

    const shoppingId = route?.params?.shoppingId

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            if (parsedUser.role !== "user") return

            if (!shoppingId) {
                setErrorMessage("Reserva não informada.")
                return
            }

            // As três consultas saem juntas, sem uma esperar a outra.
            const shoppingRequest = api.getShoppingById(shoppingId)
            const configRequest = api.getPaymentConfiguration()
            const paymentsRequest = api.getPaymentsByShopping(shoppingId).catch(() => null)

            const responseShopping = await shoppingRequest

            setShopping(responseShopping.data)

            // Public Key do marketplace: só serve para gerar o token do cartão.
            const responseConfig = await configRequest

            if (!responseConfig.data.public_key) {
                setErrorMessage("Pagamento com cartão indisponível no momento.")
                return
            }

            setPublicKey(responseConfig.data.public_key)

            // Se uma tentativa de cartão ficou pendente, ela precisa ser
            // conferida antes de cobrar de novo (regra do backend).
            const responsePayments = await paymentsRequest
            const payments = responsePayments && Array.isArray(responsePayments.data)
                ? responsePayments.data
                : []

            const pending = payments.find(item =>
                item.status === "pending" &&
                (item.method === "credit_card" || item.method === "debit_card")
            )

            setPendingPayment(pending || null)
        } catch (error) {
            console.log(
                "Erro ao carregar pagamento com cartão:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar o pagamento.")
        } finally {
            setLoading(false)
        }
    }

    // Confere no Mercado Pago o resultado da tentativa anterior.
    async function checkPendingPayment() {
        if (checking || !pendingPayment) return

        try {
            setChecking(true)

            const response = await api.syncPayment(pendingPayment.id)
            const status = response.data.payment.status

            if (status === "approved") {
                goToConfirmation()
            } else if (status === "refused") {
                setPendingPayment(null)
                Alert.alert(
                    "Tentativa anterior recusada",
                    "Nada foi cobrado. Você já pode tentar de novo."
                )
            } else {
                Alert.alert(
                    "Ainda em análise",
                    "O Mercado Pago ainda não confirmou a tentativa anterior. Tente verificar em alguns minutos."
                )
            }
        } catch (error) {
            console.log(
                "Erro ao conferir pagamento anterior:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Não foi possível verificar",
                String(
                    error.response?.data?.error ||
                    "Tente novamente em alguns instantes."
                )
            )
        } finally {
            setChecking(false)
        }
    }

    function onChange(name, value) {
        setCard(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Número em grupos de 4 e busca da bandeira ao completar 6 dígitos.
    function handleNumber(value) {
        const digits = value.replace(/\D/g, "").slice(0, 19)
        const groups = digits.match(/.{1,4}/g)

        onChange("number", groups ? groups.join(" ") : "")

        const newBin = digits.slice(0, 6)

        if (newBin.length < 6) {
            if (paymentMethod) {
                setPaymentMethod(null)
                brandScale.setValue(0)
            }
            setBin("")
            return
        }

        if (newBin !== bin) {
            setBin(newBin)
            findBrand(newBin)
        }
    }

    async function findBrand(cardBin) {
        if (!publicKey) return

        try {
            const response = await api.getCardPaymentMethods(publicKey, cardBin)
            const method = response.data?.results?.[0]

            if (!method) {
                setPaymentMethod(null)
                return
            }

            setPaymentMethod(method)

            brandScale.setValue(0)
            Animated.spring(brandScale, {
                toValue: 1,
                damping: 12,
                stiffness: 180,
                useNativeDriver: true
            }).start()
        } catch (error) {
            console.log("Erro ao identificar bandeira:", error.message)
            setPaymentMethod(null)
        }
    }

    // Validade no formato MM/AA, com a barra automática.
    function handleExpiration(value) {
        const digits = value.replace(/\D/g, "").slice(0, 4)

        onChange(
            "expiration",
            digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits
        )
    }

    function formatPrice(value) {
        return Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
    }

    function goToConfirmation() {
        navigation.reset({
            index: 1,
            routes: [
                { name: "MarketplaceScreen" },
                { name: "ReservationConfirmedScreen", params: { shoppingId: shoppingId } }
            ]
        })
    }

    async function payWithCard() {
        if (saving || !shopping || !publicKey) return

        if (pendingPayment) {
            Alert.alert(
                "Confira a tentativa anterior",
                "Há um pagamento anterior sem resposta. Verifique-o antes de tentar de novo, para não cobrar duas vezes."
            )
            return
        }

        const number = card.number.replace(/\D/g, "")
        const expiration = card.expiration.replace(/\D/g, "")
        const cvv = card.cvv.replace(/\D/g, "")
        const cpf = card.cpf.replace(/\D/g, "")

        if (number.length < 13 || number.length > 19) {
            Alert.alert("Cartão inválido", "Confira o número do cartão.")
            return
        }

        if (!paymentMethod) {
            Alert.alert("Cartão não reconhecido", "Não identificamos a bandeira deste cartão.")
            return
        }

        if (!card.holder.trim()) {
            Alert.alert("Titular inválido", "Informe o nome como está no cartão.")
            return
        }

        const month = Number(expiration.slice(0, 2))
        const year = Number("20" + expiration.slice(2, 4))

        if (expiration.length !== 4 || month < 1 || month > 12) {
            Alert.alert("Validade inválida", "Informe a validade no formato MM/AA.")
            return
        }

        if (cvv.length < 3 || cvv.length > 4) {
            Alert.alert("Código inválido", "Informe o código de segurança.")
            return
        }

        if (cpf.length !== 11) {
            Alert.alert("CPF inválido", "Informe os 11 dígitos do CPF do titular.")
            return
        }

        try {
            setSaving(true)

            // 1. Token do cartão gerado direto no Mercado Pago.
            const responseToken = await api.createCardToken(publicKey, {
                card_number: number,
                expiration_month: month,
                expiration_year: year,
                security_code: cvv,
                cardholder: {
                    name: card.holder.trim(),
                    identification: { type: "CPF", number: cpf }
                }
            })

            // 2. Cobrança pelo nosso backend, só com o token.
            const response = await api.createPayment({
                id_shopping: shopping.id,
                method: paymentMethod.payment_type_id === "debit_card"
                    ? "debit_card"
                    : "credit_card",
                token: responseToken.data.id,
                payment_method_id: paymentMethod.id,
                installments: 1,
                payer: {
                    identification: { type: "CPF", number: cpf }
                }
            })

            const payment = response.data.payment

            if (payment.status === "approved") {
                goToConfirmation()
            } else if (payment.status === "refused") {
                Alert.alert(
                    "Pagamento recusado",
                    "O cartão foi recusado" +
                    (response.data.checkout?.status_detail
                        ? " (" + response.data.checkout.status_detail + ")"
                        : "") +
                    ". Confira os dados ou use outro cartão."
                )
            } else {
                setPendingPayment(payment)
                Alert.alert(
                    "Pagamento em análise",
                    "O Mercado Pago ainda está analisando. Use \"Verificar pagamento\" em alguns minutos."
                )
            }
        } catch (error) {
            console.log(
                "Erro ao pagar com cartão:",
                error.response?.data || error.message
            )

            const data = error.response?.data

            // Resposta ambígua: a cobrança pode existir e precisa ser conferida.
            if (data?.payment_id && data?.reconciliation_required) {
                setPendingPayment({ id: data.payment_id })
                Alert.alert(
                    "Não foi possível confirmar",
                    "A cobrança pode ter sido criada. Toque em \"Verificar pagamento\" antes de tentar de novo."
                )
            } else if (error.response?.status === 409) {
                // Já existe tentativa pendente: recarrega para mostrar o aviso.
                await loadData()
                Alert.alert(
                    "Pagamento anterior pendente",
                    "Verifique a tentativa anterior antes de pagar de novo."
                )
            } else if (error.response?.status === 402 || error.response?.status === 422) {
                Alert.alert(
                    "Pagamento recusado",
                    String(
                        data?.provider_message ||
                        data?.error ||
                        "O cartão foi recusado. Confira os dados ou use outro cartão."
                    ) + (data?.status_detail ? "\n\nMotivo: " + data.status_detail : "")
                )
            } else if (!error.response || error.response.status >= 500) {
                Alert.alert(
                    "Não foi possível confirmar",
                    "O pagamento pode ter sido registrado. Confira antes de tentar de novo.",
                    [
                        { text: "Verificar", onPress: loadData }
                    ]
                )
            } else {
                Alert.alert(
                    "Pagamento não realizado",
                    String(
                        data?.error ||
                        data?.message ||
                        "Confira os dados do cartão."
                    )
                )
            }
        } finally {
            setSaving(false)
        }
    }

    function goBack() {
        if (saving) return

        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("MarketplaceScreen")
        }
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
                    onPress={() => navigation.navigate("DashboardScreen")}
                >
                    <Text style={styles.buttonText}>
                        Voltar ao início
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    if (errorMessage || !shopping) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    {errorMessage || "Não foi possível carregar a reserva."}
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={loadData}
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

    const item = shopping.items ? shopping.items[0] : null
    const lastDigits = card.number.replace(/\D/g, "").slice(-4)
    const isDebit = paymentMethod && paymentMethod.payment_type_id === "debit_card"

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right"]}
        >
            <View style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                            Adicionar cartão
                        </Text>

                        <Text style={styles.subtitle}>
                            Informe os dados do seu cartão de pagamento.
                        </Text>

                        {pendingPayment && (
                            <View style={styles.warning}>
                                <MaterialCommunityIcons
                                    name="alert-circle-outline"
                                    size={22}
                                    color={colors.accent}
                                />

                                <View style={styles.warningTexts}>
                                    <Text style={styles.warningTitle}>
                                        Pagamento anterior sem resposta
                                    </Text>

                                    <Text style={styles.warningText}>
                                        Confira a tentativa anterior antes de pagar de novo, para não cobrar duas vezes.
                                    </Text>

                                    <TouchableOpacity
                                        style={[
                                            styles.warningButton,
                                            checking && styles.buttonDisabled
                                        ]}
                                        onPress={checkPendingPayment}
                                        disabled={checking}
                                        accessibilityRole="button"
                                    >
                                        {checking ? (
                                            <ActivityIndicator color={colors.white} />
                                        ) : (
                                            <Text style={styles.buttonText}>
                                                Verificar pagamento
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Cartão desenhado que se preenche enquanto digita. */}
                        <View style={styles.cardPreview}>
                            <View style={styles.cardTop}>
                                <MaterialCommunityIcons
                                    name="integrated-circuit-chip"
                                    size={34}
                                    color={colors.warningLight}
                                />

                                <Animated.View
                                    style={[
                                        styles.brand,
                                        {
                                            opacity: brandScale,
                                            transform: [{ scale: brandScale }]
                                        }
                                    ]}
                                >
                                    {paymentMethod && paymentMethod.secure_thumbnail ? (
                                        <Image
                                            source={{ uri: paymentMethod.secure_thumbnail }}
                                            style={styles.brandImage}
                                            resizeMode="contain"
                                        />
                                    ) : null}

                                    {paymentMethod && (
                                        <View style={styles.brandBadge}>
                                            <Text style={styles.brandBadgeText}>
                                                {isDebit ? "Débito" : "Crédito"}
                                            </Text>
                                        </View>
                                    )}
                                </Animated.View>
                            </View>

                            <Text style={styles.cardNumber}>
                                •••• •••• •••• {lastDigits.length === 4 ? lastDigits : "••••"}
                            </Text>

                            <View style={styles.cardBottom}>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardLabel}>TITULAR</Text>
                                    <Text style={styles.cardValue} numberOfLines={1}>
                                        {card.holder.trim() ? card.holder.toUpperCase() : "SEU NOME"}
                                    </Text>
                                </View>

                                <View>
                                    <Text style={styles.cardLabel}>VALIDADE</Text>
                                    <Text style={styles.cardValue}>
                                        {card.expiration || "MM/AA"}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.summary}>
                            <Text style={styles.summaryName}>
                                {item ? item.product_name : "Material"}
                            </Text>

                            <View style={styles.summaryTotal}>
                                <Text style={styles.summaryTotalLabel}>
                                    {item ? item.quantity + " unidade(s)" : "Total"}
                                </Text>

                                <Text style={styles.summaryTotalValue}>
                                    {formatPrice(shopping.value)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>Número do cartão</Text>

                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[styles.input, styles.inputFlex]}
                                    placeholder="•••• •••• •••• ••••"
                                    placeholderTextColor={colors.textTertiary}
                                    value={card.number}
                                    onChangeText={handleNumber}
                                    keyboardType="number-pad"
                                    maxLength={23}
                                    editable={!saving}
                                />

                                <Animated.View
                                    style={{
                                        opacity: brandScale,
                                        transform: [{ scale: brandScale }]
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name="check-circle"
                                        size={20}
                                        color={colors.primary}
                                    />
                                </Animated.View>
                            </View>
                        </View>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>Nome do titular</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Como está no cartão"
                                placeholderTextColor={colors.textTertiary}
                                value={card.holder}
                                onChangeText={value => onChange("holder", value)}
                                autoCapitalize="characters"
                                maxLength={60}
                                editable={!saving}
                            />
                        </View>

                        <View style={styles.viewRow}>
                            <View style={[styles.viewInput, styles.inputHalf]}>
                                <Text style={styles.label}>Data de validade</Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="MM/AA"
                                    placeholderTextColor={colors.textTertiary}
                                    value={card.expiration}
                                    onChangeText={handleExpiration}
                                    keyboardType="number-pad"
                                    maxLength={5}
                                    editable={!saving}
                                />
                            </View>

                            <View style={[styles.viewInput, styles.inputHalf]}>
                                <Text style={styles.label}>Código de segurança</Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="•••"
                                    placeholderTextColor={colors.textTertiary}
                                    value={card.cvv}
                                    onChangeText={value => onChange("cvv", value)}
                                    keyboardType="number-pad"
                                    secureTextEntry
                                    maxLength={4}
                                    editable={!saving}
                                />
                            </View>
                        </View>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>CPF do titular</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Somente números"
                                placeholderTextColor={colors.textTertiary}
                                value={card.cpf}
                                onChangeText={value => onChange("cpf", value)}
                                keyboardType="number-pad"
                                maxLength={14}
                                editable={!saving}
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                (saving || pendingPayment) && styles.buttonDisabled
                            ]}
                            onPress={payWithCard}
                            disabled={saving}
                            accessibilityRole="button"
                        >
                            {saving ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>
                                    Pagar {formatPrice(shopping.value)}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.secure}>
                            <MaterialCommunityIcons
                                name="lock-outline"
                                size={14}
                                color={colors.textSecondary}
                            />

                            <Text style={styles.secureText}>
                                Os dados do cartão vão direto para o Mercado Pago.
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <NavBar
                    estagio="comprador"
                    ativo="marketplace"
                    onNavigate={saving ? undefined : handleNavigation}
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
    warning: {
        marginBottom: 16,
        padding: 14,
        flexDirection: "row",
        gap: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.accent,
        backgroundColor: colors.warningLight
    },
    warningTexts: {
        flex: 1,
        gap: 6
    },
    warningTitle: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.textPrimary
    },
    warningText: {
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    warningButton: {
        minHeight: 44,
        marginTop: 4,
        borderRadius: 12,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center"
    },
    cardPreview: {
        width: "100%",
        aspectRatio: 1.6,
        padding: 20,
        borderRadius: 20,
        backgroundColor: colors.primaryDark,
        justifyContent: "space-between"
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    brand: {
        alignItems: "flex-end",
        gap: 6
    },
    brandImage: {
        width: 64,
        height: 28
    },
    brandBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: colors.primaryLight
    },
    brandBadgeText: {
        fontSize: 10,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardNumber: {
        fontSize: 20,
        fontFamily: fonts.bold,
        color: colors.white,
        letterSpacing: 2
    },
    cardBottom: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16
    },
    cardInfo: {
        flex: 1
    },
    cardLabel: {
        fontSize: 9,
        fontFamily: fonts.bold,
        color: colors.textLight
    },
    cardValue: {
        marginTop: 2,
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.white
    },
    summary: {
        marginTop: 16,
        marginBottom: 16,
        padding: 14,
        gap: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    summaryName: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    summaryTotal: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    summaryTotalLabel: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    summaryTotalValue: {
        fontSize: 20,
        fontFamily: fonts.bold,
        color: colors.primaryDeep
    },
    viewRow: {
        flexDirection: "row",
        gap: 12
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
    inputHalf: {
        flex: 1,
        width: "auto"
    },
    label: {
        marginBottom: 4,
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    input: {
        minHeight: 28,
        paddingVertical: 2,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    inputFlex: {
        flex: 1
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
    secure: {
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6
    },
    secureText: {
        fontSize: 11,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    }
})
