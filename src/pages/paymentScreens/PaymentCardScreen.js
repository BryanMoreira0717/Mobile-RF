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

    // Cartão escolhido em "Escolha seu cartão": já preenche titular,
    // validade e função. Número e CVV são digitados de novo, porque o
    // token do Mercado Pago só vale para uma cobrança.
    const savedCard = route?.params?.savedCard || null

    // Função escolhida pelo comprador: "credit" ou "debit".
    const [cardType, setCardType] = useState(
        savedCard && savedCard.type === "debit" ? "debit" : "credit"
    )
    // Salva o cartão na conta depois de um pagamento aprovado.
    const [saveCard, setSaveCard] = useState(true)
    const [card, setCard] = useState({
        number: "",
        holder: savedCard ? savedCard.holder_name : "",
        expiration: savedCard
            ? String(savedCard.expiration_month).padStart(2, "0") + "/" + String(savedCard.expiration_year).slice(2)
            : "",
        cvv: "",
        cpf: ""
    })

    // Animação do logo da bandeira: cresce e aparece ao identificar.
    const brandScale = useRef(new Animated.Value(0)).current

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

            // Se a reserva falhar antes, o erro da configuração não vira
            // "Uncaught (in promise)": quem trata é o catch abaixo.
            configRequest.catch(() => {})

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
            const results = Array.isArray(response.data?.results) ? response.data.results : []

            // Só serve resultado de cartão (crédito, débito ou pré-pago).
            const method = results.find(item =>
                item.payment_type_id === "credit_card" ||
                item.payment_type_id === "debit_card" ||
                item.payment_type_id === "prepaid_card"
            )

            if (!method) {
                setPaymentMethod(null)
                return
            }

            setPaymentMethod(method)

            // Cartão que o Mercado Pago já reconhece como débito (ex.: Elo débito).
            if (method.payment_type_id === "debit_card") {
                setCardType("debit")
            }

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

        if (savedCard && number.slice(-4) !== savedCard.last_digits) {
            Alert.alert(
                "Cartão diferente",
                "O número digitado não termina em " + savedCard.last_digits + ". Confira ou volte e escolha outro cartão."
            )
            return
        }

        if (!paymentMethod) {
            Alert.alert("Cartão não reconhecido", "Não identificamos a bandeira deste cartão.")
            return
        }

        // O Mercado Pago só aceita débito nas bandeiras habilitadas na conta
        // (hoje, Elo). Débito de outra bandeira seria cobrado como crédito
        // e o banco recusaria; então avisamos antes de cobrar.
        if (cardType === "debit" && paymentMethod.payment_type_id !== "debit_card") {
            Alert.alert(
                "Débito indisponível",
                "O Mercado Pago não aceita débito " + paymentMethod.name + " por aqui. Pague com o Pix ou use a função crédito do cartão.",
                [
                    { text: "Usar crédito", onPress: () => setCardType("credit") },
                    { text: "Pagar com Pix", onPress: goToPix }
                ]
            )
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
                await saveCardOnAccount(responseToken.data.id, number, month, year)
                goToConfirmation()
            } else if (payment.status === "refused") {
                const detail = response.data.checkout?.status_detail

                // Sem limite no crédito: comum em cartão que é só de débito.
                if (detail === "cc_rejected_insufficient_amount") {
                    Alert.alert(
                        "Limite insuficiente",
                        "O banco recusou por falta de limite no crédito. Se o seu cartão for só de débito, pague com o Pix.",
                        [
                            { text: "Fechar" },
                            { text: "Pagar com Pix", onPress: goToPix }
                        ]
                    )
                    return
                }

                Alert.alert(
                    "Pagamento recusado",
                    "O cartão foi recusado" +
                    (detail ? " (" + detail + ")" : "") +
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

    // Guarda bandeira, final, titular, validade e função no /card do backend.
    // Falhar aqui não desfaz o pagamento: só não aparece na lista.
    async function saveCardOnAccount(token, number, month, year) {
        if (savedCard || !saveCard) return

        try {
            const lastDigits = number.slice(-4)
            const responseCards = await api.getCards()
            const cards = Array.isArray(responseCards.data) ? responseCards.data : []

            // Mesmo cartão já salvo: não duplica.
            const exists = cards.find(item =>
                item.last_digits === lastDigits &&
                item.brand === paymentMethod.name &&
                Number(item.expiration_month) === month &&
                Number(item.expiration_year) === year
            )

            if (exists) return

            await api.createCard({
                holder_name: card.holder.trim(),
                brand: paymentMethod.name,
                last_digits: lastDigits,
                type: cardType,
                expiration_month: month,
                expiration_year: year,
                // Obrigatório na rota; o token já foi usado e não cobra de novo.
                payment_token: token
            })
        } catch (error) {
            console.log(
                "Erro ao salvar cartão:",
                error.response?.data || error.message
            )
        }
    }

    function goToPix() {
        navigation.navigate("PaymentPixScreen", { shoppingId })
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
                            {savedCard ? "Confirmar cartão" : "Adicionar cartão"}
                        </Text>

                        <Text style={styles.subtitle}>
                            {savedCard
                                ? "Por segurança, digite o número completo e o código do cartão •••• " + savedCard.last_digits + "."
                                : "Informe os dados do seu cartão de pagamento."}
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
                                                {isDebit
                                                    ? "Débito"
                                                    : paymentMethod.payment_type_id === "prepaid_card"
                                                        ? "Pré-pago"
                                                        : "Crédito"}
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

                        <Text style={styles.typeTitle}>Função do cartão</Text>

                        <View style={styles.typeRow}>
                            <TouchableOpacity
                                style={[
                                    styles.typeOption,
                                    cardType === "credit" && styles.typeOptionActive
                                ]}
                                onPress={() => setCardType("credit")}
                                disabled={saving}
                                accessibilityRole="button"
                            >
                                <Text
                                    style={[
                                        styles.typeOptionText,
                                        cardType === "credit" && styles.typeOptionTextActive
                                    ]}
                                >
                                    Crédito
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeOption,
                                    cardType === "debit" && styles.typeOptionActive
                                ]}
                                onPress={() => setCardType("debit")}
                                disabled={saving}
                                accessibilityRole="button"
                            >
                                <Text
                                    style={[
                                        styles.typeOptionText,
                                        cardType === "debit" && styles.typeOptionTextActive
                                    ]}
                                >
                                    Débito
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {cardType === "debit" && (
                            <View style={styles.debitHint}>
                                <MaterialCommunityIcons
                                    name="information-outline"
                                    size={18}
                                    color={colors.primaryDark}
                                />

                                <Text style={styles.debitHintText}>
                                    No débito, o Mercado Pago aceita só cartões Elo. Para débito de outra bandeira,{" "}
                                    <Text style={styles.debitHintLink} onPress={goToPix}>
                                        pague com o Pix
                                    </Text>
                                    .
                                </Text>
                            </View>
                        )}

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

                        {!savedCard && (
                            <TouchableOpacity
                                style={styles.saveRow}
                                onPress={() => setSaveCard(!saveCard)}
                                disabled={saving}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: saveCard }}
                            >
                                <MaterialCommunityIcons
                                    name={saveCard ? "checkbox-marked" : "checkbox-blank-outline"}
                                    size={22}
                                    color={colors.primary}
                                />

                                <Text style={styles.saveText}>
                                    Salvar cartão para as próximas compras
                                </Text>
                            </TouchableOpacity>
                        )}

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
    saveRow: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    saveText: {
        flex: 1,
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    typeTitle: {
        marginBottom: 8,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    typeRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16
    },
    typeOption: {
        flex: 1,
        minHeight: 44,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.white,
        justifyContent: "center",
        alignItems: "center"
    },
    typeOptionActive: {
        backgroundColor: colors.primary
    },
    typeOptionText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primary
    },
    typeOptionTextActive: {
        color: colors.white
    },
    debitHint: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
        padding: 12,
        borderRadius: 14,
        backgroundColor: colors.primaryLight
    },
    debitHintText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    debitHintLink: {
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        textDecorationLine: "underline"
    },
    viewRow: {
        flexDirection: "row",
        gap: 12
    },
    viewInput: {
        width: "100%",
        marginBottom: 18
    },
    inputHalf: {
        flex: 1,
        width: "auto"
    },
    label: {
        marginBottom: 8,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        minHeight: 52,
        paddingHorizontal: 16,
        paddingVertical: 0,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white
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
    inputFlex: {
        flex: 1,
        minHeight: 50,
        paddingHorizontal: 0,
        borderWidth: 0,
        backgroundColor: "transparent"
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
    buttonOutline: {
        width: "100%",
        minHeight: 54,
        marginTop: 16,
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
