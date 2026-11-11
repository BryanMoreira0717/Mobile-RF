import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput
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

export default function SavedCardsScreen({ navigation, route }) {
    const [user, setUser] = useState(null)
    const [shopping, setShopping] = useState(null)
    const [cards, setCards] = useState([])
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)
    const [removing, setRemoving] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    // Edição do cartão (como no site): só titular e validade.
    const [editing, setEditing] = useState(null)
    const [editForm, setEditForm] = useState({ holder: "", month: "", year: "" })
    const [savingEdit, setSavingEdit] = useState(false)

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

    // Recarrega ao voltar da tela de cartão, que pode ter salvo um novo.
    useEffect(() => {
        if (isFocused) {
            loadData()
        }
    }, [isFocused])

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

            // As duas consultas saem juntas, sem uma esperar a outra.
            const shoppingRequest = api.getShoppingById(shoppingId)
            const cardsRequest = api.getCards()

            // Se a reserva falhar antes, o erro dos cartões não vira
            // "Uncaught (in promise)": quem trata é o catch abaixo.
            cardsRequest.catch(() => {})

            const responseShopping = await shoppingRequest

            setShopping(responseShopping.data)

            const responseCards = await cardsRequest
            const list = Array.isArray(responseCards.data) ? responseCards.data : []

            setCards(list)

            // Mantém a escolha anterior; sem ela, já marca o primeiro.
            const stillExists = selected && list.find(item => item.id === selected)
            setSelected(stillExists ? selected : list.length > 0 ? list[0].id : null)
        } catch (error) {
            console.log(
                "Erro ao carregar cartões:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar seus cartões.")
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

    function addNewCard() {
        navigation.navigate("PaymentCardScreen", {
            shoppingId: shoppingId
        })
    }

    function confirmCard() {
        const savedCard = cards.find(item => item.id === selected)

        if (!savedCard) {
            Alert.alert("Escolha um cartão", "Selecione um cartão ou adicione um novo.")
            return
        }

        navigation.navigate("PaymentCardScreen", {
            shoppingId: shoppingId,
            savedCard: savedCard
        })
    }

    function openEdit(savedCard) {
        setEditing(savedCard)
        setEditForm({
            holder: savedCard.holder_name || "",
            month: String(savedCard.expiration_month || ""),
            year: String(savedCard.expiration_year || "")
        })
    }

    async function saveEdit() {
        if (savingEdit || !editing) return

        const month = Number(editForm.month)
        const year = Number(editForm.year)
        const now = new Date()

        // Mesma validação do site: titular e validade atual ou futura.
        if (
            !editForm.holder.trim() ||
            !Number.isInteger(month) || month < 1 || month > 12 ||
            !Number.isInteger(year) || year < now.getFullYear() ||
            (year === now.getFullYear() && month < now.getMonth() + 1)
        ) {
            Alert.alert("Confira os dados", "Informe o nome do titular e uma validade atual ou futura.")
            return
        }

        try {
            setSavingEdit(true)

            await api.updateCard(editing.id, {
                holder_name: editForm.holder.trim(),
                expiration_month: month,
                expiration_year: year
            })

            setCards(prev => prev.map(item =>
                item.id === editing.id
                    ? { ...item, holder_name: editForm.holder.trim(), expiration_month: month, expiration_year: year }
                    : item
            ))
            setEditing(null)
        } catch (error) {
            console.log(
                "Erro ao editar cartão:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Não foi possível atualizar",
                String(error.response?.data?.error || "Tente novamente.")
            )
        } finally {
            setSavingEdit(false)
        }
    }

    function removeCard(savedCard) {
        Alert.alert(
            "Remover cartão",
            "Remover o cartão •••• " + savedCard.last_digits + " da sua conta?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Remover", style: "destructive", onPress: () => deleteCard(savedCard.id) }
            ]
        )
    }

    async function deleteCard(id) {
        if (removing) return

        try {
            setRemoving(true)

            await api.deleteCard(id)

            const list = cards.filter(item => item.id !== id)

            setCards(list)

            if (selected === id) {
                setSelected(list.length > 0 ? list[0].id : null)
            }
        } catch (error) {
            console.log(
                "Erro ao remover cartão:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Não foi possível remover",
                String(error.response?.data?.error || "Tente novamente.")
            )
        } finally {
            setRemoving(false)
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

                    <Text style={styles.eyebrow}>Pagamentos</Text>
                    <Text style={styles.title}>
                        Escolha seu cartão
                    </Text>

                    <Text style={styles.subtitle}>
                        Selecione um cartão ou adicione um novo.
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

                    {cards.length === 0 && (
                        <Text style={styles.empty}>
                            Você ainda não tem cartões salvos.
                        </Text>
                    )}

                    {cards.map(savedCard => (
                        <TouchableOpacity
                            key={savedCard.id}
                            style={[
                                styles.option,
                                selected === savedCard.id && styles.optionSelected
                            ]}
                            onPress={() => setSelected(savedCard.id)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: selected === savedCard.id }}
                        >
                            <MaterialCommunityIcons
                                name="credit-card-outline"
                                size={28}
                                color={colors.primaryDark}
                            />

                            <View style={styles.optionDescription}>
                                <Text style={styles.optionTitle}>
                                    {savedCard.type === "debit" ? "Débito" : "Crédito"} · {savedCard.brand}
                                </Text>

                                <Text style={styles.optionText}>
                                    •••• {savedCard.last_digits}
                                    {savedCard.expiration_month
                                        ? " · validade " + String(savedCard.expiration_month).padStart(2, "0") + "/" + savedCard.expiration_year
                                        : ""}
                                </Text>

                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => openEdit(savedCard)}
                                    accessibilityRole="button"
                                    accessibilityLabel={"Editar cartão final " + savedCard.last_digits}
                                >
                                    <Text style={styles.editText}>Editar cartão</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeCard(savedCard)}
                                disabled={removing}
                                accessibilityRole="button"
                                accessibilityLabel={"Remover cartão final " + savedCard.last_digits}
                            >
                                <MaterialCommunityIcons
                                    name="trash-can-outline"
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={styles.buttonOutline}
                        onPress={addNewCard}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonOutlineText}>
                            Adicionar novo cartão
                        </Text>
                    </TouchableOpacity>

                    {cards.length > 0 && (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={confirmCard}
                            accessibilityRole="button"
                        >
                            <Text style={styles.buttonText}>
                                Confirmar Reserva e Contribuir
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>

                <Modal
                    visible={editing !== null}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setEditing(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Editar cartão</Text>
                            <Text style={styles.optionText}>
                                {editing ? editing.brand + " · final " + editing.last_digits : ""}
                            </Text>

                            <Text style={styles.label}>Nome do titular</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.holder}
                                onChangeText={value => setEditForm(prev => ({ ...prev, holder: value }))}
                                autoCapitalize="characters"
                                maxLength={100}
                                editable={!savingEdit}
                            />

                            <View style={styles.row}>
                                <View style={styles.rowItem}>
                                    <Text style={styles.label}>Mês</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.month}
                                        onChangeText={value => setEditForm(prev => ({ ...prev, month: value.replace(/\D/g, "") }))}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        placeholder="MM"
                                        placeholderTextColor={colors.textTertiary}
                                        editable={!savingEdit}
                                    />
                                </View>

                                <View style={styles.rowItem}>
                                    <Text style={styles.label}>Ano</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.year}
                                        onChangeText={value => setEditForm(prev => ({ ...prev, year: value.replace(/\D/g, "") }))}
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        placeholder="AAAA"
                                        placeholderTextColor={colors.textTertiary}
                                        editable={!savingEdit}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={saveEdit}
                                disabled={savingEdit}
                                accessibilityRole="button"
                            >
                                {savingEdit ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <Text style={styles.buttonText}>Salvar alterações</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.buttonOutline}
                                onPress={() => setEditing(null)}
                                disabled={savingEdit}
                                accessibilityRole="button"
                            >
                                <Text style={styles.buttonOutlineText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

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
    empty: {
        marginTop: 16,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        textAlign: "center"
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
    removeButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center"
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
    },
    editButton: {
        alignSelf: "flex-start",
        minHeight: 32,
        justifyContent: "center",
        marginTop: 2
    },
    editText: {
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        textDecorationLine: "underline"
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "rgba(15,61,46,0.45)"
    },
    modalCard: {
        padding: 22,
        borderRadius: 24,
        backgroundColor: colors.background
    },
    modalTitle: {
        marginBottom: 4,
        fontSize: 24,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    label: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    input: {
        minHeight: 50,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    row: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 18
    },
    rowItem: {
        flex: 1
    }
})
