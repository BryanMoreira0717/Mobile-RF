import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useFonts } from "expo-font";
import {
    Manrope_400Regular,
    Manrope_700Bold
} from "@expo-google-fonts/manrope";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import api from "../../services/axios";

const filters = [
    { id: "all", name: "Todos" },
    { id: "user", name: "Usuário" },
    { id: "company", name: "Empresa" },
    { id: "admin", name: "Admin" }
]

export default function AdminUsersScreen({ navigation }) {
    const [user, setUser] = useState(null)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [filter, setFilter] = useState("all")
    const [search, setSearch] = useState("")
    // Usuário em edição no modal: { id, name, cellphone }
    const [editing, setEditing] = useState(null)

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold
    })

    useEffect(() => {
        loadUsers()
    }, [])

    async function loadUsers() {
        try {
            setLoading(true)
            setErrorMessage("")

            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            if (parsedUser.role !== "admin") return

            const response = await api.getUsers()

            setUsers(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.log(
                "Erro ao carregar usuários:",
                error.response?.data || error.message
            )

            setErrorMessage("Não foi possível carregar os usuários.")
        } finally {
            setLoading(false)
        }
    }

    function getRole(role) {
        switch (role) {
            case "user":
                return "Usuário"
            case "company":
                return "Empresa"
            case "admin":
                return "Admin"
            default:
                return "Não informado"
        }
    }

    function getInitials(name) {
        const parts = String(name || "").trim().split(" ")
        const first = parts[0] ? parts[0][0] : ""
        const last = parts.length > 1 ? parts[parts.length - 1][0] : ""

        return (first + last).toUpperCase()
    }

    async function saveUser() {
        if (saving || !editing) return

        const cellphone = editing.cellphone.replace(/\D/g, "")

        if (!editing.name.trim()) {
            Alert.alert("Nome inválido", "Informe o nome.")
            return
        }

        if (!/^\d{11}$/.test(cellphone)) {
            Alert.alert("Telefone inválido", "Informe 11 dígitos (DDD + número).")
            return
        }

        try {
            setSaving(true)

            await api.updateUser(editing.id, {
                name: editing.name.trim(),
                cellphone: cellphone
            })

            setUsers(prev => prev.map(item =>
                item.id === editing.id
                    ? { ...item, name: editing.name.trim(), cellphone: cellphone }
                    : item
            ))
            setEditing(null)
        } catch (error) {
            console.log(
                "Erro ao editar usuário:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Erro",
                String(
                    error.response?.data?.error ||
                    "Não foi possível editar o usuário."
                )
            )
        } finally {
            setSaving(false)
        }
    }

    async function deleteUser(item) {
        try {
            setSaving(true)

            await api.deleteUser(item.id)

            setUsers(prev => prev.filter(userItem => userItem.id !== item.id))
        } catch (error) {
            console.log(
                "Erro ao excluir usuário:",
                error.response?.data || error.message
            )

            Alert.alert(
                "Não foi possível excluir",
                String(
                    error.response?.data?.error ||
                    "O usuário pode ter anúncios ou compras vinculadas."
                )
            )
        } finally {
            setSaving(false)
        }
    }

    function confirmDelete(item) {
        if (item.id === user.id) {
            Alert.alert("Ação bloqueada", "Você não pode excluir a própria conta por aqui.")
            return
        }

        Alert.alert(
            "Excluir usuário",
            "Deseja excluir " + item.name + "?",
            [
                { text: "Voltar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => deleteUser(item) }
            ]
        )
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

    if (!fontsLoaded || (loading && users.length === 0)) {
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

    const filteredUsers = users.filter(item => {
        const sameRole = filter === "all" || item.role === filter
        const sameSearch =
            String(item.name || "").toLowerCase().includes(searchText) ||
            String(item.email || "").toLowerCase().includes(searchText)

        return sameRole && sameSearch
    })

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right", "bottom"]}
        >
            <FlatList
                data={filteredUsers}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshing={loading}
                onRefresh={loadUsers}
                ListHeaderComponent={
                    <View>
                        <TouchableOpacity
                            style={styles.buttonBack}
                            onPress={goBack}
                            accessibilityRole="button"
                            accessibilityLabel="Voltar ao painel"
                        >
                            <MaterialCommunityIcons
                                name="chevron-left"
                                size={22}
                                color={colors.primaryDark}
                            />

                            <Text style={styles.textBack}>
                                Painel
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>
                            Gerenciar usuários
                        </Text>

                        <Text style={styles.subtitle}>
                            Encontre e organize as contas da plataforma.
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
                            <Text style={styles.label}>Buscar usuário</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Nome ou e-mail"
                                placeholderTextColor={colors.textTertiary}
                                value={search}
                                onChangeText={setSearch}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <Text style={styles.subtitle}>
                        Nenhum usuário encontrado.
                    </Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {getInitials(item.name)}
                                </Text>
                            </View>

                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>{item.name}</Text>
                                <Text style={styles.cardText}>{item.email}</Text>
                            </View>
                        </View>

                        <View style={styles.cardFooter}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {getRole(item.role)}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => setEditing({
                                    id: item.id,
                                    name: item.name || "",
                                    cellphone: item.cellphone || ""
                                })}
                                disabled={saving}
                                accessibilityRole="button"
                                accessibilityLabel={"Editar " + item.name}
                            >
                                <MaterialCommunityIcons
                                    name="pencil"
                                    size={22}
                                    color={colors.primaryDark}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => confirmDelete(item)}
                                disabled={saving}
                                accessibilityRole="button"
                                accessibilityLabel={"Excluir " + item.name}
                            >
                                <MaterialCommunityIcons
                                    name="trash-can-outline"
                                    size={22}
                                    color="#DC2626"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <Modal
                visible={editing !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setEditing(null)}
            >
                <View style={styles.modalOverlay}>
                    {editing && (
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Editar usuário</Text>

                            <View style={styles.viewInput}>
                                <Text style={styles.label}>Nome</Text>

                                <TextInput
                                    style={styles.input}
                                    value={editing.name}
                                    onChangeText={value => setEditing(prev => ({ ...prev, name: value }))}
                                    maxLength={100}
                                    editable={!saving}
                                />
                            </View>

                            <View style={styles.viewInput}>
                                <Text style={styles.label}>Telefone</Text>

                                <TextInput
                                    style={styles.input}
                                    value={editing.cellphone}
                                    onChangeText={value => setEditing(prev => ({ ...prev, cellphone: value }))}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                    editable={!saving}
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    saving && styles.buttonDisabled
                                ]}
                                onPress={saveUser}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <Text style={styles.buttonText}>Salvar</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.buttonOutline}
                                onPress={() => setEditing(null)}
                                disabled={saving}
                            >
                                <Text style={styles.buttonOutlineText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    label: {
        marginBottom: 4,
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    input: {
        minHeight: 28,
        paddingVertical: 2,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    card: {
        marginBottom: 12,
        padding: 16,
        gap: 12,
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
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center"
    },
    avatarText: {
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardInfo: {
        flex: 1
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    cardText: {
        marginTop: 2,
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    badge: {
        minWidth: 100,
        height: 26,
        paddingHorizontal: 12,
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
    iconButton: {
        minWidth: 32,
        minHeight: 32,
        justifyContent: "center",
        alignItems: "center"
    },
    modalOverlay: {
        flex: 1,
        padding: 21,
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)"
    },
    modalCard: {
        padding: 20,
        borderRadius: 20,
        backgroundColor: colors.background
    },
    modalTitle: {
        marginBottom: 16,
        fontSize: 20,
        fontFamily: fonts.bold,
        color: colors.primaryDark
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
    buttonDisabled: {
        opacity: 0.5
    },
    buttonText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.white
    },
    buttonOutline: {
        width: "100%",
        minHeight: 54,
        marginTop: 12,
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
