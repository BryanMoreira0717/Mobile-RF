import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { useIsFocused } from "@react-navigation/native"
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
import { fonts } from "../../theme/fonts"
import NavBar from "../../components/NavBar"
import api from "../../services/axios"
import { getSocket } from "../../services/socket"

export default function ConversationsScreen({ navigation }) {
    const [user, setUser] = useState(null)
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")

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
            loadConversations()
        }
    }, [isFocused])

    // Mensagem nova em qualquer conversa: atualiza a lista (ordem e não lidas).
    useEffect(() => {
        if (!isFocused) return

        let activeSocket = null

        function handleNewMessage() {
            loadConversations()
        }

        getSocket().then(socket => {
            activeSocket = socket
            if (activeSocket) activeSocket.on("new_message", handleNewMessage)
        })

        return () => {
            if (activeSocket) activeSocket.off("new_message", handleNewMessage)
        }
    }, [isFocused])

    async function loadConversations() {
        try {
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            const response = await api.getConversations()

            setConversations(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.log(
                "Erro ao carregar conversas:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar as conversas.")
        } finally {
            setLoading(false)
        }
    }

    function getInitials(name) {
        const parts = String(name || "").trim().split(" ")
        const first = parts[0] ? parts[0][0] : ""
        const last = parts.length > 1 ? parts[parts.length - 1][0] : ""

        return (first + last).toUpperCase() || "?"
    }

    function getRole(role) {
        if (role === "company") return "Empresa / Fornecedor"
        if (role === "user") return "Comprador / Artesão"
        if (role === "admin") return "Administrador"
        return "Conta"
    }

    // Hoje mostra a hora; outros dias, a data.
    function formatDate(value) {
        const date = new Date(value)

        if (isNaN(date.getTime())) return ""

        if (date.toDateString() === new Date().toDateString()) {
            return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }

        return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    }

    function openConversation(item) {
        navigation.navigate("ChatScreen", {
            conversationId: item.conversationId,
            otherUserName: item.otherUserName,
            otherUserRole: item.otherUserRole
        })
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

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right"]}
        >
            <View style={styles.container}>
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.conversationId}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={false}
                    onRefresh={loadConversations}
                    ListHeaderComponent={
                        <View>
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
                                Mensagens
                            </Text>

                            <Text style={styles.subtitle}>
                                {user.role === "company"
                                    ? "Converse com os compradores dos seus materiais."
                                    : "Converse com as empresas sobre suas reservas."}
                            </Text>

                            {errorMessage ? (
                                <Text style={styles.subtitle}>{errorMessage}</Text>
                            ) : null}
                        </View>
                    }
                    ListEmptyComponent={
                        errorMessage ? null : (
                            <View style={styles.empty}>
                                <MaterialCommunityIcons
                                    name="message-text-outline"
                                    size={40}
                                    color={colors.textTertiary}
                                />

                                <Text style={styles.emptyTitle}>
                                    Nenhuma conversa ainda
                                </Text>

                                <Text style={styles.emptyText}>
                                    {user.role === "company"
                                        ? "Quando um comprador reservar um material seu, a conversa aparece aqui."
                                        : "Depois de pagar uma reserva, a conversa com a empresa aparece aqui."}
                                </Text>
                            </View>
                        )
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => openConversation(item)}
                            accessibilityRole="button"
                            accessibilityLabel={"Conversa com " + item.otherUserName}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {getInitials(item.otherUserName)}
                                </Text>
                            </View>

                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle} numberOfLines={1}>
                                    {item.otherUserName}
                                </Text>

                                <Text style={styles.cardText} numberOfLines={1}>
                                    {getRole(item.otherUserRole)}
                                </Text>
                            </View>

                            <View style={styles.cardSide}>
                                <Text style={styles.cardDate}>
                                    {formatDate(item.updated_in || item.created_in)}
                                </Text>

                                {Number(item.unreadCount) > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>
                                            {item.unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />

                {user.role === "user" && (
                    <NavBar
                        estagio="comprador"
                        ativo=""
                        onNavigate={handleNavigation}
                    />
                )}

                {user.role === "company" && (
                    <NavBar
                        estagio="empresa"
                        ativo=""
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
    empty: {
        marginTop: 32,
        alignItems: "center",
        gap: 8
    },
    emptyTitle: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    emptyText: {
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        textAlign: "center"
    },
    card: {
        marginBottom: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center"
    },
    avatarText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardInfo: {
        flex: 1
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardText: {
        marginTop: 2,
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    cardSide: {
        alignItems: "flex-end",
        gap: 6
    },
    cardDate: {
        fontSize: 11,
        fontFamily: fonts.regular,
        color: colors.textTertiary
    },
    badge: {
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        borderRadius: 10,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center"
    },
    badgeText: {
        fontSize: 10,
        fontFamily: fonts.bold,
        color: colors.white
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
