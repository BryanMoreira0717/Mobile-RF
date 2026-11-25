import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Modal,
    ScrollView,
    TextInput,
    KeyboardAvoidingView
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
import api from "../../services/axios"
import { showAlert } from "../../components/AppAlert"

// Motivos das denúncias (mesmos valores do banco).
const types = {
    material_incompativel: "Material incompatível",
    nao_retirado: "Material não retirado",
    nao_comparecimento: "Não comparecimento",
    comportamento_inadequado: "Comportamento inadequado",
    item_danificado: "Item danificado",
    outro: "Outro motivo"
}

const statuses = {
    aberta: "Aberta",
    em_analise: "Em análise",
    resolvida: "Resolvida",
    rejeitada: "Rejeitada"
}

export default function DisputesScreen({ navigation }) {
    const [disputes, setDisputes] = useState([])
    const [status, setStatus] = useState("all")
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [user, setUser] = useState(null)
    // Admin: pedido da denúncia aberta e o parecer que ele escreve.
    const [order, setOrder] = useState(null)
    const [loadingOrder, setLoadingOrder] = useState(false)
    const [resolution, setResolution] = useState("")
    const [saving, setSaving] = useState(false)
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
            loadDisputes()
        }
    }, [isFocused])

    async function loadDisputes() {
        try {
            setLoading(true)
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            setUser(storedUser ? JSON.parse(storedUser) : null)

            const response = await api.getDisputes()

            setDisputes(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.log(
                "Erro ao carregar denúncias:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar as denúncias.")
        } finally {
            setLoading(false)
        }
    }

    const isAdmin = user?.role === "admin"

    async function openDispute(item) {
        setSelected(item)
        setResolution(item.resolution || "")
        setOrder(null)

        // Só o admin vê o pedido da denúncia (para abrir o anúncio).
        if (!isAdmin || !item.id_shopping) return

        try {
            setLoadingOrder(true)

            const response = await api.getShoppingById(item.id_shopping)

            setOrder(response.data)
        } catch (error) {
            console.log(
                "Erro ao carregar pedido da denúncia:",
                error.response?.data || error.message
            )
        } finally {
            setLoadingOrder(false)
        }
    }

    function closeDispute() {
        setSelected(null)
        setOrder(null)
        setResolution("")
    }

    function openProduct(productId) {
        closeDispute()
        navigation.navigate("AdvertisementDetailsScreen", { productId: productId })
    }

    // action: "em_analise", "resolvida" ou "rejeitada".
    async function changeStatus(action) {
        if (saving || !selected) return

        if (action !== "em_analise" && resolution.trim().length < 5) {
            showAlert("Escreva o parecer", "Explique em poucas palavras a decisão (mínimo 5 caracteres).")
            return
        }

        try {
            setSaving(true)

            if (action === "em_analise") {
                await api.updateDisputeStatus(selected.id, "em_analise")
            } else if (action === "resolvida") {
                await api.resolveDispute(selected.id, resolution.trim())
            } else {
                await api.rejectDispute(selected.id, resolution.trim())
            }

            closeDispute()
            await loadDisputes()

            showAlert(
                "Denúncia atualizada",
                action === "em_analise"
                    ? "A denúncia está em análise."
                    : action === "resolvida"
                        ? "A denúncia foi resolvida e as partes foram avisadas."
                        : "A denúncia foi rejeitada e as partes foram avisadas."
            )
        } catch (error) {
            console.log(
                "Erro ao atualizar denúncia:",
                error.response?.data || error.message
            )

            showAlert(
                "Não foi possível atualizar",
                String(error.response?.data?.error || "Tente novamente em alguns instantes.")
            )
        } finally {
            setSaving(false)
        }
    }

    function formatDate(value) {
        const date = new Date(value)

        if (Number.isNaN(date.getTime())) return ""

        return date.toLocaleDateString("pt-BR")
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

    if (!fontsLoaded || (loading && disputes.length === 0)) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />
            </View>
        )
    }

    const filtered = disputes.filter(item => status === "all" || item.status === status)

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right", "bottom"]}
        >
            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={loadDisputes}
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

                        <Text style={styles.eyebrow}>{isAdmin ? "Administração" : "Acompanhamento"}</Text>
                        <Text style={styles.title}>Denúncias</Text>
                        <Text style={styles.subtitle}>
                            {isAdmin
                                ? "Analise as denúncias da plataforma, abra o anúncio do pedido e registre a decisão."
                                : "Consulte as denúncias das negociações vinculadas à sua conta."}
                        </Text>

                        {errorMessage ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{errorMessage}</Text>

                                <TouchableOpacity onPress={loadDisputes}>
                                    <Text style={styles.link}>Tentar novamente</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        <Text style={styles.filterLabel}>Situação</Text>
                        <View style={styles.filters}>
                            {[["all", "Todas"], ...Object.entries(statuses)].map(([value, label]) => (
                                <TouchableOpacity
                                    key={value}
                                    style={[styles.filter, status === value && styles.filterActive]}
                                    onPress={() => setStatus(value)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: status === value }}
                                >
                                    <Text style={[styles.filterText, status === value && styles.filterTextActive]}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.count}>
                            {filtered.length} {filtered.length === 1 ? "registro encontrado" : "registros encontrados"}
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    errorMessage ? null : (
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="shield-check-outline" size={36} color={colors.primary} />
                            <Text style={styles.emptyTitle}>Nenhuma denúncia</Text>
                            <Text style={styles.subtitle}>Quando houver uma denúncia em uma negociação, ela aparece aqui.</Text>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => openDispute(item)}
                        accessibilityRole="button"
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.badge}>{statuses[item.status] || "Situação não reconhecida"}</Text>
                            <Text style={styles.cardDate}>{formatDate(item.created_in)}</Text>
                        </View>

                        <Text style={styles.cardTitle}>{types[item.type] || "Ocorrência"}</Text>
                        <Text style={styles.cardText} numberOfLines={2}>
                            {item.description || "Sem descrição."}
                        </Text>
                        <Text style={styles.link}>
                            {isAdmin && (item.status === "aberta" || item.status === "em_analise") ? "Analisar" : "Ver detalhes"}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            <Modal
                visible={selected !== null}
                transparent
                animationType="fade"
                onRequestClose={closeDispute}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior="padding"
                >
                    <View style={styles.modalCard}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style={styles.badge}>
                                {selected ? statuses[selected.status] || "Situação não reconhecida" : ""}
                            </Text>
                            <Text style={styles.modalTitle}>
                                {selected ? types[selected.type] || "Ocorrência" : ""}
                            </Text>
                            <Text style={styles.cardText}>
                                {selected?.description || "Sem descrição."}
                            </Text>

                            {isAdmin && (
                                <View>
                                    <Text style={styles.modalSection}>Pedido</Text>

                                    {loadingOrder ? (
                                        <ActivityIndicator style={styles.orderLoading} color={colors.primary} />
                                    ) : order ? (
                                        <View>
                                            <Text style={styles.cardText}>
                                                Comprador: {order.user_name || "Não informado"}
                                            </Text>

                                            {(order.items || []).map(product => (
                                                <TouchableOpacity
                                                    key={product.id}
                                                    style={styles.orderItem}
                                                    onPress={() => openProduct(product.id_product)}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={"Abrir anúncio " + product.product_name}
                                                >
                                                    <MaterialCommunityIcons
                                                        name="package-variant-closed"
                                                        size={20}
                                                        color={colors.primaryDark}
                                                    />
                                                    <Text style={styles.orderItemText}>{product.product_name}</Text>
                                                    <Text style={styles.orderItemLink}>Ver anúncio</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={styles.cardText}>Não foi possível carregar o pedido.</Text>
                                    )}
                                </View>
                            )}

                            <Text style={styles.modalSection}>Resolução</Text>

                            {isAdmin && (selected?.status === "aberta" || selected?.status === "em_analise") ? (
                                <View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Escreva o parecer da administração"
                                        placeholderTextColor={colors.textTertiary}
                                        value={resolution}
                                        onChangeText={setResolution}
                                        multiline
                                        maxLength={500}
                                    />

                                    {selected?.status === "aberta" && (
                                        <TouchableOpacity
                                            style={styles.buttonOutline}
                                            onPress={() => changeStatus("em_analise")}
                                            disabled={saving}
                                            accessibilityRole="button"
                                        >
                                            <Text style={styles.buttonOutlineText}>Marcar como em análise</Text>
                                        </TouchableOpacity>
                                    )}

                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            style={[styles.button, styles.actionButton, styles.buttonReject]}
                                            onPress={() => changeStatus("rejeitada")}
                                            disabled={saving}
                                            accessibilityRole="button"
                                        >
                                            <Text style={styles.buttonText}>Rejeitar</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.button, styles.actionButton]}
                                            onPress={() => changeStatus("resolvida")}
                                            disabled={saving}
                                            accessibilityRole="button"
                                        >
                                            {saving ? (
                                                <ActivityIndicator color={colors.white} />
                                            ) : (
                                                <Text style={styles.buttonText}>Resolver</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View>
                                    <Text style={styles.cardText}>
                                        {selected?.resolution || "Ainda não há uma resolução registrada."}
                                    </Text>

                                    {!isAdmin && (
                                        <Text style={styles.note}>
                                            A resolução ou rejeição é feita pela administração.
                                        </Text>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={closeDispute}
                                accessibilityRole="button"
                            >
                                <Text style={styles.buttonCloseText}>Fechar detalhes</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
        marginTop: 12,
        fontSize: 15,
        lineHeight: 24,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    errorBox: {
        marginTop: 16,
        padding: 14,
        gap: 6,
        borderRadius: 14,
        backgroundColor: colors.errorLight
    },
    errorText: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.error
    },
    filterLabel: {
        marginTop: 22,
        marginBottom: 8,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    filters: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
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
    count: {
        marginTop: 18,
        marginBottom: 12,
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    card: {
        marginBottom: 12,
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12
    },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 100,
        overflow: "hidden",
        backgroundColor: colors.primaryLight,
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.primaryDark
    },
    cardDate: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    cardTitle: {
        marginTop: 12,
        fontSize: 17,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardText: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    link: {
        marginTop: 10,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        textDecorationLine: "underline"
    },
    empty: {
        alignItems: "center",
        gap: 8,
        paddingVertical: 32
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "rgba(15,61,46,0.45)"
    },
    modalCard: {
        maxHeight: "85%",
        padding: 22,
        borderRadius: 24,
        backgroundColor: colors.background
    },
    modalTitle: {
        marginTop: 14,
        fontSize: 24,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    modalSection: {
        marginTop: 20,
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    note: {
        marginTop: 18,
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    button: {
        minHeight: 50,
        marginTop: 18,
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
    buttonClose: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white
    },
    buttonCloseText: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    orderLoading: {
        marginTop: 12
    },
    orderItem: {
        marginTop: 10,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    orderItemText: {
        flex: 1,
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    orderItemLink: {
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.primary,
        textDecorationLine: "underline"
    },
    input: {
        minHeight: 96,
        marginTop: 10,
        padding: 14,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.textPrimary,
        textAlignVertical: "top",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white
    },
    buttonOutline: {
        minHeight: 46,
        marginTop: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primaryDark,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonOutlineText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    actions: {
        flexDirection: "row",
        gap: 10
    },
    actionButton: {
        flex: 1
    },
    buttonReject: {
        backgroundColor: colors.error
    }
})
