import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    RefreshControl
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

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";
import api from "../../services/axios";

// Indicadores do impacto ambiental: comprador vê o que comprou,
// empresa vê o que vendeu (a própria API filtra pelo usuário).
export default function ImpactScreen({ navigation }) {
    const [user, setUser] = useState(null)
    const [impacts, setImpacts] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    useEffect(() => {
        loadImpacts()
    }, [])

    async function loadImpacts() {
        try {
            setLoading(true)
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            const response = await api.getEnvironmentalImpacts()

            setImpacts(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.log(
                "Erro ao carregar impacto:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar os indicadores.")
        } finally {
            setLoading(false)
        }
    }

    function sum(field) {
        let total = 0

        for (const item of impacts) {
            total += Number(item[field]) || 0
        }

        return total
    }

    function formatNumber(value) {
        return Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })
    }

    function formatDate(value) {
        const date = new Date(value)

        if (isNaN(date.getTime())) return ""

        return date.toLocaleDateString("pt-BR")
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
            case "marketplace":
                navigation.navigate("MarketplaceScreen")
                break
            case "historico":
                navigation.navigate("HistoryScreen")
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

    if (!fontsLoaded || (loading && impacts.length === 0 && !errorMessage)) {
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

    const isCompany = user.role === "company"

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
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={loadImpacts}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
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
                        Impacto ambiental
                    </Text>

                    <Text style={styles.subtitle}>
                        {isCompany
                            ? "O que os seus materiais deixaram de virar descarte."
                            : "O que as suas compras ajudaram a reaproveitar."}
                    </Text>

                    {errorMessage ? (
                        <Text style={styles.subtitle}>{errorMessage}</Text>
                    ) : null}

                    <View style={styles.highlight}>
                        <MaterialCommunityIcons
                            name="leaf"
                            size={28}
                            color={colors.white}
                        />

                        <Text style={styles.highlightValue}>
                            {formatNumber(sum("co2_saved_kg"))} kg
                        </Text>

                        <Text style={styles.highlightText}>
                            de CO₂ evitados
                        </Text>
                    </View>

                    <View style={styles.viewCards}>
                        <View style={styles.card}>
                            <MaterialCommunityIcons name="recycle" size={22} color={colors.primaryDark} />
                            <Text style={styles.cardValue}>{formatNumber(sum("estimated_weight_kg"))} kg</Text>
                            <Text style={styles.cardLabel}>Material reaproveitado</Text>
                        </View>

                        <View style={styles.card}>
                            <MaterialCommunityIcons name="water-outline" size={22} color={colors.primaryDark} />
                            <Text style={styles.cardValue}>{formatNumber(sum("water_saved_liters"))} L</Text>
                            <Text style={styles.cardLabel}>Água economizada</Text>
                        </View>

                        <View style={styles.card}>
                            <MaterialCommunityIcons name="lightning-bolt-outline" size={22} color={colors.primaryDark} />
                            <Text style={styles.cardValue}>{formatNumber(sum("energy_saved_kwh"))} kWh</Text>
                            <Text style={styles.cardLabel}>Energia economizada</Text>
                        </View>

                        <View style={styles.card}>
                            <MaterialCommunityIcons name="swap-horizontal" size={22} color={colors.primaryDark} />
                            <Text style={styles.cardValue}>{impacts.length}</Text>
                            <Text style={styles.cardLabel}>{isCompany ? "Vendas com impacto" : "Compras com impacto"}</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>
                        Histórico
                    </Text>

                    {impacts.length === 0 && !errorMessage && (
                        <Text style={styles.empty}>
                            {isCompany
                                ? "Quando uma venda for concluída, o impacto aparece aqui."
                                : "Quando uma compra for concluída, o impacto aparece aqui."}
                        </Text>
                    )}

                    {impacts.map(item => (
                        <View
                            key={item.id}
                            style={styles.row}
                        >
                            <View style={styles.rowIcon}>
                                <MaterialCommunityIcons name="leaf" size={18} color={colors.primary} />
                            </View>

                            <View style={styles.rowTexts}>
                                <Text style={styles.rowTitle}>
                                    {formatNumber(item.estimated_weight_kg)} kg reaproveitados
                                </Text>

                                <Text style={styles.rowText}>
                                    {formatNumber(item.co2_saved_kg)} kg de CO₂ · {formatDate(item.calculated_in)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {user.role === "user" && (
                    <NavBar
                        estagio="comprador"
                        ativo="inicio"
                        onNavigate={handleNavigation}
                    />
                )}

                {user.role === "company" && (
                    <NavBar
                        estagio="empresa"
                        ativo="inicio"
                        onNavigate={handleNavigation}
                    />
                )}
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
    highlight: {
        padding: 20,
        gap: 6,
        borderRadius: 20,
        backgroundColor: colors.primaryDark
    },
    highlightValue: {
        fontSize: 32,
        fontFamily: fonts.bold,
        color: colors.white
    },
    highlightText: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.white
    },
    viewCards: {
        marginTop: 16,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 12
    },
    card: {
        width: "48%",
        padding: 16,
        gap: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    cardValue: {
        fontSize: 18,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardLabel: {
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    sectionTitle: {
        marginTop: 24,
        marginBottom: 12,
        fontSize: 17,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    empty: {
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    row: {
        marginBottom: 10,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center"
    },
    rowTexts: {
        flex: 1
    },
    rowTitle: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    rowText: {
        marginTop: 2,
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
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
    buttonText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.white
    }
})
