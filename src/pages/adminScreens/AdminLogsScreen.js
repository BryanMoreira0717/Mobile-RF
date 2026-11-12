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

// Quantos registros vêm por vez (a API aceita até 200).
const LIMITE = 50

const filters = [
    { id: "all", name: "Todos" },
    { id: "sucesso", name: "Sucesso" },
    { id: "falha", name: "Falha" }
]

const operacoes = {
    login: "Login",
    create: "Criação",
    update: "Edição",
    delete: "Exclusão",
    callback: "Retorno externo",
    read: "Consulta",
    other: "Outra"
}

const tabelas = {
    user: "Usuário",
    product: "Anúncio",
    shopping: "Reserva",
    payment: "Pagamento",
    message: "Mensagem",
    conversation: "Conversa",
    localization: "Endereço",
    card: "Cartão",
    otp: "Código",
    notification: "Notificação",
    dispute: "Disputa",
    review: "Avaliação",
    log: "Log"
}

export default function AdminLogsScreen({ navigation }) {
    const [user, setUser] = useState(null)
    const [logs, setLogs] = useState([])
    const [total, setTotal] = useState(0)
    // id do usuário -> nome, para mostrar quem fez a ação
    const [nomes, setNomes] = useState({})
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [filter, setFilter] = useState("all")
    const [search, setSearch] = useState("")
    // Log aberto para ver os detalhes
    const [aberto, setAberto] = useState(null)

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    useEffect(() => {
        loadLogs(filter)
    }, [filter])

    async function loadLogs(status) {
        try {
            setLoading(true)
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            if (parsedUser.role !== "admin") return

            // Logs e usuários saem juntos; os nomes são só um complemento.
            const logsRequest = api.getLogs(status, 0, LIMITE)
            const usersRequest = api.getUsers().catch(() => null)

            const response = await logsRequest
            const usersResponse = await usersRequest

            setLogs(Array.isArray(response.data?.logs) ? response.data.logs : [])
            setTotal(Number(response.data?.total) || 0)

            if (Array.isArray(usersResponse?.data)) {
                const mapa = {}
                usersResponse.data.forEach(item => {
                    mapa[item.id] = item.name
                })
                setNomes(mapa)
            }
        } catch (error) {
            console.log(
                "Erro ao carregar logs:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar os logs.")
        } finally {
            setLoading(false)
        }
    }

    // Próxima página: continua de onde a lista parou.
    async function loadMore() {
        if (loadingMore || loading || logs.length >= total) return

        try {
            setLoadingMore(true)

            const response = await api.getLogs(filter, logs.length, LIMITE)
            const novos = Array.isArray(response.data?.logs) ? response.data.logs : []

            setLogs(prev => [...prev, ...novos])
            setTotal(Number(response.data?.total) || 0)
        } catch (error) {
            console.log(
                "Erro ao carregar mais logs:",
                error.response?.data || error.message
            )
        } finally {
            setLoadingMore(false)
        }
    }

    function formatDate(value) {
        const date = new Date(value)

        if (isNaN(date.getTime())) return ""

        return date.toLocaleDateString("pt-BR") + " às " +
            date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }

    // "POST /api/reaproveitafranca/user/login -> 200" vira "POST /user/login -> 200"
    function formatDescription(text) {
        return String(text || "").replace("/api/reaproveitafranca", "")
    }

    function getAuthor(item) {
        // Ação sem conta logada (ex.: tentativa de login, cadastro, webhook).
        if (!item.id_user) return "Visitante"

        return nomes[item.id_user] || "Conta removida"
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

    if (!fontsLoaded || (loading && logs.length === 0 && !user)) {
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

    // A busca olha só o que já foi carregado (operação, tabela, rota e autor).
    const filteredLogs = logs.filter(item => {
        if (!searchText) return true

        const texto = [
            operacoes[item.operation] || item.operation,
            tabelas[item.table] || item.table,
            item.description,
            getAuthor(item),
            item.ip
        ].join(" ").toLowerCase()

        return texto.includes(searchText)
    })

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right", "bottom"]}
        >
            <FlatList
                data={filteredLogs}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshing={loading}
                onRefresh={() => loadLogs(filter)}
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
                            Logs do sistema
                        </Text>

                        <Text style={styles.subtitle}>
                            Tudo o que foi criado, editado, excluído e cada login, do mais recente para o mais antigo.
                        </Text>

                        {errorMessage ? (
                            <Text style={styles.errorText}>{errorMessage}</Text>
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
                                    disabled={loading}
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
                            <Text style={styles.label}>Buscar nos registros</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Operação, tabela, rota ou usuário"
                                placeholderTextColor={colors.textTertiary}
                                value={search}
                                onChangeText={setSearch}
                                autoCapitalize="none"
                            />
                        </View>

                        <Text style={styles.counter}>
                            {loading ? "Carregando..." : logs.length + " de " + total + " registros"}
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <Text style={styles.subtitle}>
                            Nenhum registro encontrado.
                        </Text>
                    ) : null
                }
                renderItem={({ item }) => {
                    const sucesso = item.status === "sucesso"
                    const estaAberto = aberto === item.id

                    return (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => setAberto(estaAberto ? null : item.id)}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel={"Ver detalhes do registro"}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.statusIcon, !sucesso && styles.statusIconError]}>
                                    <MaterialCommunityIcons
                                        name={sucesso ? "check" : "alert-outline"}
                                        size={18}
                                        color={sucesso ? colors.primaryDark : colors.error}
                                    />
                                </View>

                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>
                                        {(operacoes[item.operation] || item.operation) + " · " + (tabelas[item.table] || item.table || "Sistema")}
                                    </Text>
                                    <Text style={styles.cardText}>
                                        {getAuthor(item) + " · " + formatDate(item.datetime)}
                                    </Text>
                                </View>

                                <MaterialCommunityIcons
                                    name={estaAberto ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </View>

                            <Text style={styles.route} numberOfLines={estaAberto ? undefined : 1}>
                                {formatDescription(item.description)}
                            </Text>

                            {estaAberto && (
                                <View style={styles.details}>
                                    <Text style={styles.detailText}>
                                        <Text style={styles.detailLabel}>Status: </Text>
                                        {sucesso ? "Sucesso" : "Falha"}
                                    </Text>
                                    <Text style={styles.detailText}>
                                        <Text style={styles.detailLabel}>IP: </Text>
                                        {item.ip || "Não registrado"}
                                    </Text>
                                    <Text style={styles.detailText}>
                                        <Text style={styles.detailLabel}>Aparelho: </Text>
                                        {item.user_agent || "Não registrado"}
                                    </Text>
                                    {item.reference_id ? (
                                        <Text style={styles.detailText}>
                                            <Text style={styles.detailLabel}>Registro afetado: </Text>
                                            {item.reference_id}
                                        </Text>
                                    ) : null}
                                </View>
                            )}
                        </TouchableOpacity>
                    )
                }}
                ListFooterComponent={
                    logs.length < total && !loading ? (
                        <TouchableOpacity
                            style={[styles.buttonOutline, loadingMore && styles.buttonDisabled]}
                            onPress={loadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <ActivityIndicator color={colors.primaryDark} />
                            ) : (
                                <Text style={styles.buttonOutlineText}>Carregar mais</Text>
                            )}
                        </TouchableOpacity>
                    ) : null
                }
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
    eyebrow: {
        marginBottom: 10,
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
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
    errorText: {
        marginBottom: 16,
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.error
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
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    filterTextActive: {
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    viewInput: {
        width: "100%",
        marginBottom: 12
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
    counter: {
        marginBottom: 12,
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    card: {
        marginBottom: 10,
        padding: 14,
        gap: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    statusIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center"
    },
    statusIconError: {
        backgroundColor: colors.errorLight
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
    route: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4
    },
    details: {
        gap: 4,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight
    },
    detailText: {
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    detailLabel: {
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
    buttonDisabled: {
        opacity: 0.5
    },
    buttonOutline: {
        width: "100%",
        minHeight: 54,
        marginTop: 8,
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
    }
})
