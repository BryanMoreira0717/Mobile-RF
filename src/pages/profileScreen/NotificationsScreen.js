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
import api from "../../services/axios";

export default function NotificationsScreen({ navigation }) {
    const [user, setUser] = useState(null)
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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

    // Filtros iguais aos do site: leitura e tipo de notificação.
    const [readFilter, setReadFilter] = useState("todas")
    const [typeFilter, setTypeFilter] = useState("todos")

    const typeNames = {
        reserva_solicitada: "Reserva solicitada",
        reserva_aceita: "Reserva aceita",
        reserva_recusada: "Reserva recusada",
        reserva_cancelada: "Reserva cancelada",
        reserva_concluida: "Reserva concluída",
        pagamento_confirmado: "Pagamento",
        nova_mensagem: "Mensagem",
        disputa: "Disputa"
    }

    useEffect(() => {
        if (isFocused) {
            loadNotifications()
        }
    }, [isFocused])

    async function loadNotifications() {
        try {
            setLoading(true)
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            const response = await api.getNotifications()

            setNotifications(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.log(
                "Erro ao carregar notificações:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar as notificações.")
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

    async function openNotification(notification) {
        try {
            if (!notification.read) {
                await api.markNotificationRead(notification.id)

                setNotifications(prev => prev.map(item =>
                    item.id === notification.id
                        ? { ...item, read: 1 }
                        : item
                ))
            }
        } catch (error) {
            console.log(
                "Erro ao marcar notificação:",
                error.response?.data || error.message
            )
        }

        // Leva para a tela relacionada ao aviso.
        if (notification.type === "reserva_solicitada" && user?.role === "company") {
            navigation.navigate("ReservationRequestsScreen")
        } else if (
            (notification.type === "reserva_aceita" ||
            notification.type === "reserva_recusada" ||
            notification.type === "pagamento_confirmado") &&
            user?.role === "user"
        ) {
            navigation.navigate("HistoryScreen")
        }
    }

    async function markAllRead() {
        if (saving) return

        try {
            setSaving(true)

            await api.markAllNotificationsRead()

            setNotifications(prev => prev.map(item => ({ ...item, read: 1 })))
        } catch (error) {
            console.log(
                "Erro ao marcar notificações:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                "Não foi possível marcar as notificações como lidas."
            )
        } finally {
            setSaving(false)
        }
    }

    // Excluir pede confirmação, como no site.
    function confirmDelete(notification) {
        Alert.alert(
            "Excluir notificação?",
            "Ela some da sua lista de avisos.",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => deleteNotification(notification) }
            ]
        )
    }

    async function deleteNotification(notification) {
        try {
            await api.deleteNotification(notification.id)

            setNotifications(prev => prev.filter(item => item.id !== notification.id))
        } catch (error) {
            console.log(
                "Erro ao excluir notificação:",
                error.response?.data || error.message
            )

            Alert.alert("Erro", "Não foi possível excluir a notificação.")
        }
    }

    function getTypeName(type) {
        return typeNames[type] || "Outros"
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("ProfileScreen")
        }
    }

    if (fontError) {
        return (
            <View style={styles.loading}>
                <Text>Não foi possível carregar as fontes.</Text>
            </View>
        )
    }

    if (!fontsLoaded || (loading && notifications.length === 0)) {
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

    const unread = notifications.filter(item => !item.read).length
    const types = [...new Set(notifications.map(item => item.type))]

    const filteredNotifications = notifications.filter(item =>
        (readFilter === "todas" || (readFilter === "nao" ? !item.read : item.read)) &&
        (typeFilter === "todos" || item.type === typeFilter)
    )

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right", "bottom"]}
        >
            <FlatList
                data={filteredNotifications}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={loadNotifications}
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

                        <Text style={styles.eyebrow}>Avisos</Text>
                        <Text style={styles.title}>
                            Notificações
                        </Text>

                        <Text style={styles.subtitle}>
                            {unread > 0
                                ? unread + (unread === 1 ? " aviso não lido." : " avisos não lidos.")
                                : "Avisos da sua conta."}
                        </Text>

                        {errorMessage ? (
                            <Text style={styles.subtitle}>{errorMessage}</Text>
                        ) : null}

                        {unread > 0 && (
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    saving && styles.buttonDisabled
                                ]}
                                onPress={markAllRead}
                                disabled={saving}
                                accessibilityRole="button"
                            >
                                {saving ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        Marcar todas como lidas
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        <Text style={styles.filterLabel}>Leitura</Text>
                        <View style={styles.filters}>
                            {[
                                { id: "todas", name: "Todas" },
                                { id: "nao", name: "Não lidas" },
                                { id: "sim", name: "Lidas" }
                            ].map(option => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.filter, readFilter === option.id && styles.filterActive]}
                                    onPress={() => setReadFilter(option.id)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: readFilter === option.id }}
                                >
                                    <Text style={[styles.filterText, readFilter === option.id && styles.filterTextActive]}>
                                        {option.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {types.length > 1 && (
                            <>
                                <Text style={styles.filterLabel}>Tipo de notificação</Text>
                                <View style={styles.filters}>
                                    {["todos", ...types].map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.filter, typeFilter === type && styles.filterActive]}
                                            onPress={() => setTypeFilter(type)}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: typeFilter === type }}
                                        >
                                            <Text style={[styles.filterText, typeFilter === type && styles.filterTextActive]}>
                                                {type === "todos" ? "Todos" : getTypeName(type)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    <Text style={styles.subtitle}>
                        {notifications.length === 0
                            ? "Você não tem notificações."
                            : "Nenhuma notificação com esses filtros."}
                    </Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.card,
                            !item.read && styles.cardUnread
                        ]}
                        onPress={() => openNotification(item)}
                        accessibilityRole="button"
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>
                                {item.title}
                            </Text>

                            <Text style={[styles.readText, !item.read && styles.unreadText]}>
                                {item.read ? "Lida" : "Não lida"}
                            </Text>
                        </View>

                        {item.content ? (
                            <Text style={styles.cardText}>
                                {item.content}
                            </Text>
                        ) : null}

                        <View style={styles.cardFooter}>
                            <Text style={styles.cardDate}>
                                {formatDate(item.created_in)}
                            </Text>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => confirmDelete(item)}
                                accessibilityRole="button"
                                accessibilityLabel={"Excluir notificação " + item.title}
                            >
                                <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
                                <Text style={styles.deleteText}>Excluir</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
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
    card: {
        marginBottom: 12,
        padding: 16,
        gap: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    cardUnread: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
    },
    cardTitle: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.accent
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
    button: {
        width: "100%",
        minHeight: 54,
        marginBottom: 16,
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
    eyebrow: {
        marginBottom: 10,
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
    },
    filterLabel: {
        marginTop: 18,
        marginBottom: 8,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    filters: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 4
    },
    filter: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white
    },
    filterActive: {
        borderColor: colors.primaryDark,
        backgroundColor: colors.primaryDark
    },
    filterText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.primaryDark
    },
    filterTextActive: {
        fontFamily: fonts.bold,
        color: colors.white
    },
    readText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    unreadText: {
        fontFamily: fonts.bold,
        color: colors.accent
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 4
    },
    deleteButton: {
        minHeight: 36,
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    deleteText: {
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.error
    }
})
