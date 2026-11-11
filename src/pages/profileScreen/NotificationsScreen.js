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

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right", "bottom"]}
        >
            <FlatList
                data={notifications}
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
                    </View>
                }
                ListEmptyComponent={
                    <Text style={styles.subtitle}>
                        Você não tem notificações.
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

                            {!item.read && <View style={styles.dot} />}
                        </View>

                        {item.content ? (
                            <Text style={styles.cardText}>
                                {item.content}
                            </Text>
                        ) : null}

                        <Text style={styles.cardDate}>
                            {formatDate(item.created_in)}
                        </Text>
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
    }
})
