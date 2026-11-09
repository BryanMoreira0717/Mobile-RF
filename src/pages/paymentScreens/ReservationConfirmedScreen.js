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
import { useFonts } from "expo-font";
import {
    Manrope_400Regular,
    Manrope_700Bold
} from "@expo-google-fonts/manrope";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";
import api from "../../services/axios";

export default function ReservationConfirmedScreen({ navigation, route }) {
    const [shopping, setShopping] = useState(null)
    const [impact, setImpact] = useState(null)
    const [loading, setLoading] = useState(true)

    const shoppingId = route?.params?.shoppingId

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold
    })

    useEffect(() => {
        loadReservation()
    }, [])

    async function loadReservation() {
        try {
            setLoading(true)

            if (!shoppingId) return

            const response = await api.getShoppingById(shoppingId)

            setShopping(response.data)

            // O impacto ambiental é opcional: nem toda compra tem cálculo.
            try {
                const responseImpact = await api.getImpactByShopping(shoppingId)
                setImpact(responseImpact.data)
            } catch (error) {
                setImpact(null)
            }
        } catch (error) {
            console.log(
                "Erro ao carregar confirmação:",
                error.response?.data || error.message
            )
        } finally {
            setLoading(false)
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
                    <View style={styles.card}>
                        <MaterialCommunityIcons
                            name="check-circle-outline"
                            size={26}
                            color={colors.primary}
                            style={styles.icon}
                        />

                        <Text style={styles.title}>
                            Reserva confirmada!
                        </Text>

                        <Text style={styles.subtitle}>
                            Seu material está reservado para retirada.
                        </Text>

                        {impact && (
                            <View>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        CO₂ evitado
                                    </Text>
                                </View>

                                <Text style={styles.text}>
                                    Estimativa: {Number(impact.co2_saved_kg).toLocaleString("pt-BR")} kg de CO₂.
                                </Text>
                            </View>
                        )}

                        {item && (
                            <View>
                                <Text style={styles.materialName}>
                                    {item.product_name}
                                </Text>

                                <Text style={styles.text}>
                                    {item.quantity} unidade(s)
                                </Text>
                            </View>
                        )}

                        {shopping && (
                            <View>
                                <Text style={styles.text}>
                                    Apresente este código na portaria:
                                </Text>

                                <View style={styles.codeBox}>
                                    <Text style={styles.code}>
                                        {shopping.id.slice(0, 8).toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => navigation.navigate("HistoryScreen")}
                            accessibilityRole="button"
                        >
                            <Text style={styles.buttonText}>
                                Minhas reservas
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.buttonOutline}
                            onPress={() => navigation.navigate("MarketplaceScreen")}
                            accessibilityRole="button"
                        >
                            <Text style={styles.buttonOutlineText}>
                                Voltar ao Marketplace
                            </Text>
                        </TouchableOpacity>
                    </View>
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
    scrollContent: {
        paddingHorizontal: 21,
        paddingTop: 40,
        paddingBottom: 120
    },
    card: {
        padding: 24,
        gap: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    icon: {
        alignSelf: "center"
    },
    title: {
        fontSize: 26,
        lineHeight: 39,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    badge: {
        alignSelf: "center",
        height: 26,
        marginBottom: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center"
    },
    badgeText: {
        fontSize: 10,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    text: {
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    materialName: {
        marginBottom: 8,
        fontSize: 20,
        lineHeight: 28,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    codeBox: {
        marginTop: 12,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.primaryLight
    },
    code: {
        fontSize: 32,
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        letterSpacing: 2
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
    },
    buttonOutline: {
        width: "100%",
        minHeight: 54,
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
    }
})
