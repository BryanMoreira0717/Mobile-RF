import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator
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

export default function PaymentMethodScreen({ navigation, route }) {
    const [user, setUser] = useState(null)
    const [shopping, setShopping] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [method, setMethod] = useState("pix")

    const isFocused = useIsFocused()

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
        if (isFocused) {
            loadReservation()
        }
    }, [isFocused])

    async function loadReservation() {
        try {
            setLoading(true)
            setErrorMessage("")
            setShopping(null)
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

            const response = await api.getShoppingById(shoppingId)

            if (!response.data || !Array.isArray(response.data.items)) {
                setErrorMessage("Não foi possível carregar a reserva.")
                return
            }

            setShopping(response.data)
        } catch (error) {
            console.log(
                "Erro ao carregar reserva:",
                error.response?.data || error.message
            )

            if (error.response?.status === 404) {
                setErrorMessage("Reserva não encontrada.")
            } else if (error.response?.status === 403) {
                setErrorMessage("Esta reserva pertence a outra conta.")
            } else {
                setErrorMessage(
                    "Não foi possível carregar a reserva. Tente novamente."
                )
            }
        } finally {
            setLoading(false)
        }
    }

    function formatPrice(value) {
        return Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
    }

    function confirmMethod() {
        if (!shopping) return

        if (method === "pix") {
            navigation.navigate("PaymentPixScreen", {
                shoppingId: shopping.id
            })
        } else {
            // Primeiro a lista de cartões salvos; de lá dá para adicionar um novo.
            navigation.navigate("SavedCardsScreen", {
                shoppingId: shopping.id
            })
        }
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("MarketplaceScreen")
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

    if (errorMessage || !shopping) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    {errorMessage || "Não foi possível carregar a reserva."}
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={loadReservation}
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

    // Doação não gera cobrança: o backend recusa pagamento com valor zero.
    if (Number(shopping.value) <= 0) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    Esta reserva é uma doação e não precisa de pagamento.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        navigation.navigate("HistoryScreen")
                    }
                >
                    <Text style={styles.buttonText}>
                        Ver histórico
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    // Aceite antes do pagamento: só uma reserva aceita pela empresa pode ser paga.
    if (shopping.status !== "accepted") {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    {shopping.status === "pending"
                        ? "A empresa ainda não aceitou esta reserva. O pagamento é liberado depois do aceite."
                        : "Esta reserva não está mais disponível para pagamento."}
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        navigation.navigate("HistoryScreen")
                    }
                >
                    <Text style={styles.buttonText}>
                        Ver histórico
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    const item = shopping.items[0]

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
                        Pague sua reserva
                    </Text>

                    <Text style={styles.subtitle}>
                        A empresa aceitou a sua reserva. Escolha como pagar em até 48 horas.
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
                                {formatPrice(shopping.value)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.option,
                            method === "pix" && styles.optionSelected
                        ]}
                        onPress={() => setMethod("pix")}
                        accessibilityRole="button"
                    >
                        <MaterialCommunityIcons
                            name="qrcode"
                            size={28}
                            color={colors.primaryDark}
                        />

                        <View style={styles.optionDescription}>
                            <Text style={styles.optionTitle}>
                                PIX
                            </Text>

                            <Text style={styles.optionText}>
                                Aprovação imediata
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.option,
                            method === "card" && styles.optionSelected
                        ]}
                        onPress={() => setMethod("card")}
                        accessibilityRole="button"
                    >
                        <MaterialCommunityIcons
                            name="credit-card-outline"
                            size={28}
                            color={colors.primaryDark}
                        />

                        <View style={styles.optionDescription}>
                            <Text style={styles.optionTitle}>
                                Cartão de crédito/débito
                            </Text>

                            <Text style={styles.optionText}>
                                Crédito à vista
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={confirmMethod}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonText}>
                            Continuar para o pagamento
                        </Text>
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
    option: {
        marginTop: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    optionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight
    },
    optionDescription: {
        flex: 1,
        gap: 4
    },
    optionTitle: {
        fontSize: 15,
        lineHeight: 23,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    optionText: {
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.regular,
        color: colors.textSecondary
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
    eyebrow: {
        marginBottom: 10,
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
    }
})
