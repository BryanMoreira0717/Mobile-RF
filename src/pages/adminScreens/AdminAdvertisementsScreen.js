import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator
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
import api from "../../services/axios";

const filters = [
    { id: "all", name: "Todos" },
    { id: "available", name: "Publicados" },
    { id: "reserved", name: "Reservados" },
    { id: "unavailable", name: "Indisponíveis" }
]

// Somente consulta: a API permite editar/excluir anúncio apenas ao dono.
export default function AdminAdvertisementsScreen({ navigation }) {
    const [user, setUser] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [filter, setFilter] = useState("all")
    const [search, setSearch] = useState("")

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    useEffect(() => {
        loadProducts()
    }, [])

    async function loadProducts() {
        try {
            setLoading(true)
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            if (parsedUser.role !== "admin") return

            const response = await api.getProducts()

            setProducts(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.log(
                "Erro ao carregar anúncios:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar os anúncios.")
        } finally {
            setLoading(false)
        }
    }

    function getStatus(status) {
        switch (status) {
            case "available":
                return "Publicado"
            case "reserved":
                return "Reservado"
            case "unavailable":
                return "Indisponível"
            default:
                return "Status não informado"
        }
    }

    function getPrice(product) {
        if (product.type_negotiation === "donation") return "Doação"

        return Number(product.price).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
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

    if (!fontsLoaded || (loading && products.length === 0)) {
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

    if (user.role !== "admin") {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    Esta página é destinada ao administrador.
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

    const searchText = search.trim().toLowerCase()

    const filteredProducts = products.filter(item => {
        const sameStatus = filter === "all" || item.status === filter
        const sameSearch = String(item.name || "").toLowerCase().includes(searchText)

        return sameStatus && sameSearch
    })

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right", "bottom"]}
        >
            <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshing={loading}
                onRefresh={loadProducts}
                ListHeaderComponent={
                    <View>
                        <TouchableOpacity
                            style={styles.buttonBack}
                            onPress={goBack}
                            accessibilityRole="button"
                            accessibilityLabel="Voltar ao painel"
                        >
                            <MaterialCommunityIcons
                                name="arrow-left"
                                size={18}
                                color={colors.primaryDark}
                            />

                            <Text style={styles.textBack}>
                                Painel
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.eyebrow}>Administração</Text>
                        <Text style={styles.title}>
                            Gerenciar anúncios
                        </Text>

                        <Text style={styles.subtitle}>
                            Acompanhe os materiais publicados na plataforma.
                        </Text>

                        {errorMessage ? (
                            <Text style={styles.subtitle}>{errorMessage}</Text>
                        ) : null}

                        <View style={styles.viewFilters}>
                            {filters.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.filterButton,
                                        filter === item.id && styles.filterActive
                                    ]}
                                    onPress={() => setFilter(item.id)}
                                    accessibilityRole="button"
                                >
                                    <Text
                                        style={[
                                            styles.filterText,
                                            filter === item.id && styles.filterTextActive
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.viewInput}>
                            <Text style={styles.label}>Buscar anúncio</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Nome do material"
                                placeholderTextColor={colors.textTertiary}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <Text style={styles.subtitle}>
                        Nenhum anúncio encontrado.
                    </Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{item.name}</Text>

                        <Text style={styles.cardText}>
                            {getPrice(item)} · {item.quantity} unid. · {Number(item.weight).toLocaleString("pt-BR")} kg
                        </Text>

                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {getStatus(item.status)}
                            </Text>
                        </View>
                    </View>
                )}
            />
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
        paddingBottom: 32
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
    viewFilters: {
        marginBottom: 16,
        padding: 4,
        flexDirection: "row",
        gap: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    filterButton: {
        flex: 1,
        minHeight: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center"
    },
    filterActive: {
        backgroundColor: colors.primaryLight
    },
    filterText: {
        fontSize: 11,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    filterTextActive: {
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    viewInput: {
        width: "100%",
        marginBottom: 18
    },
    label: {
        marginBottom: 8,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
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
        fontSize: 16,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    badge: {
        alignSelf: "flex-start",
        height: 26,
        paddingHorizontal: 12,
        borderRadius: 100,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center"
    },
    badgeText: {
        fontSize: 10,
        fontFamily: fonts.bold,
        color: colors.primaryDark
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
    eyebrow: {
        marginBottom: 10,
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
    }
})
