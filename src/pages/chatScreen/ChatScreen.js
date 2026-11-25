import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Modal,
    ScrollView
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect, useRef } from "react"
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
import { showAlert } from "../../components/AppAlert"
import { fonts } from "../../theme/fonts"
import api from "../../services/axios"
import { getSocket, emitSocket, setActiveConversation } from "../../services/socket"

// Motivos de denúncia (iguais aos da tabela dispute do banco).
const reportTypes = [
    { id: "material_incompativel", name: "Material diferente do anúncio" },
    { id: "item_danificado", name: "Item danificado" },
    { id: "nao_comparecimento", name: "Empresa não apareceu" },
    { id: "nao_retirado", name: "Não consegui retirar" },
    { id: "comportamento_inadequado", name: "Comportamento inadequado" },
    { id: "outro", name: "Outro motivo" }
]

export default function ChatScreen({ navigation, route }) {
    const [user, setUser] = useState(null)
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [text, setText] = useState("")
    // Mensagem sendo editada (null = enviando mensagem nova).
    const [editing, setEditing] = useState(null)
    // Mensagem que está sendo respondida (citada acima da nova).
    const [replyTo, setReplyTo] = useState(null)

    const listRef = useRef(null)

    // Animação da mensagem que acabou de chegar ou sair: sobe e "pula" na tela.
    const [newMessageId, setNewMessageId] = useState(null)
    const newMessageAnim = useRef(new Animated.Value(1)).current

    const conversationId = route?.params?.conversationId
    // Quem abre pelo botão "Conversar" manda só o id; o nome vem da lista de conversas.
    const [other, setOther] = useState({
        id: null,
        name: route?.params?.otherUserName || "Conversa",
        role: route?.params?.otherUserRole,
        since: null
    })

    // Painel que abre ao tocar no nome de quem está na conversa.
    const [showInfo, setShowInfo] = useState(false)
    // Local e materiais da empresa (vem do mapa de empresas).
    const [company, setCompany] = useState(null)
    // Pedidos do comprador com esta empresa.
    const [orders, setOrders] = useState([])
    const [loadingInfo, setLoadingInfo] = useState(false)
    const [finishingId, setFinishingId] = useState(null)

    // O painel troca de conteúdo: "info", "avaliar" ou "denunciar".
    const [panel, setPanel] = useState("info")
    // Pedido que está sendo avaliado ou denunciado.
    const [selectedOrder, setSelectedOrder] = useState(null)
    // Nota média da empresa e as notas que eu já dei (por pedido).
    const [rating, setRating] = useState(null)
    const [myReviews, setMyReviews] = useState({})
    // Formulário de avaliação.
    const [stars, setStars] = useState(0)
    const [comment, setComment] = useState("")
    // Formulário de denúncia.
    const [reportType, setReportType] = useState("")
    const [reportText, setReportText] = useState("")
    const [sendingForm, setSendingForm] = useState(false)

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    const isFocused = useIsFocused()

    // Recarrega ao voltar para a tela: edições e exclusões da outra pessoa
    // só chegam pelo histórico (o backend ainda não avisa em tempo real).
    useEffect(() => {
        if (isFocused) {
            // Com a conversa aberta, mensagem dela só toca (sem notificação por cima).
            setActiveConversation(conversationId)
            loadChat()
        } else {
            setActiveConversation(null)
        }

        return () => setActiveConversation(null)
    }, [isFocused])

    // Eventos em tempo real desta conversa.
    useEffect(() => {
        if (!user) return

        let activeSocket = null

        function handleNewMessage(raw) {
            if (raw.id_conversation !== conversationId) return

            const message = toMessage(raw)

            // O servidor também devolve a própria mensagem: não duplica.
            setMessages(prev => prev.find(item => item.id === message.id) ? prev : [...prev, message])

            if (!isMine(message)) {
                animateMessage(message.id)
                emitSocket("mark_read", { conversationId, upToMessageId: message.id }).catch(() => {})
            }
        }

        function handleEdited(raw) {
            setMessages(prev => prev.map(item =>
                item.id === raw.id ? { ...item, content: raw.content, isEdited: true } : item
            ))
        }

        function handleDeleted(raw) {
            setMessages(prev => prev.map(item =>
                item.id === raw.id ? { ...item, content: null, isDeleted: true } : item
            ))
        }

        // Reconectou (ex.: internet voltou): entra de novo na sala e recarrega.
        function handleConnect() {
            loadMessages()
        }

        getSocket().then(socket => {
            activeSocket = socket

            if (!activeSocket) return

            activeSocket.on("new_message", handleNewMessage)
            activeSocket.on("message_edited", handleEdited)
            activeSocket.on("message_deleted", handleDeleted)
            activeSocket.on("connect", handleConnect)
        })

        return () => {
            if (!activeSocket) return

            activeSocket.off("new_message", handleNewMessage)
            activeSocket.off("message_edited", handleEdited)
            activeSocket.off("message_deleted", handleDeleted)
            activeSocket.off("connect", handleConnect)
        }
    }, [user])

    // O servidor não avisa edição/exclusão para a outra pessoa em tempo real
    // (manda para a sala errada). Com a conversa aberta, confere o histórico
    // a cada 4 segundos e atualiza o que mudou.
    useEffect(() => {
        if (!isFocused || !user) return

        const timer = setInterval(syncMessages, 4000)

        return () => clearInterval(timer)
    }, [isFocused, user])

    async function syncMessages() {
        try {
            const response = await emitSocket("load_messages", { conversationId, limit: 50 })
            const list = Array.isArray(response.messages) ? response.messages.map(toMessage) : []

            setMessages(prev => {
                const changed = list.length !== prev.length || list.some((item, index) =>
                    !prev[index] ||
                    prev[index].id !== item.id ||
                    prev[index].content !== item.content ||
                    prev[index].isEdited !== item.isEdited ||
                    prev[index].isDeleted !== item.isDeleted
                )

                return changed ? list : prev
            })
        } catch (error) {
            // Sem internet: tenta de novo na próxima volta.
        }
    }

    async function loadChat() {
        try {
            const storedUser = await AsyncStorage.getItem("@user")
            const parsedUser = storedUser ? JSON.parse(storedUser) : null

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            // Sempre busca: além do nome, traz o id e desde quando conversam.
            loadOtherUser()

            await loadMessages(parsedUser)
        } finally {
            setLoading(false)
        }
    }

    async function loadOtherUser() {
        try {
            const response = await api.getConversations()
            const list = Array.isArray(response.data) ? response.data : []
            const conversation = list.find(item => item.conversationId === conversationId)

            if (conversation) {
                setOther({
                    id: conversation.otherUserId,
                    name: conversation.otherUserName,
                    role: conversation.otherUserRole,
                    since: conversation.created_in
                })
            }
        } catch (error) {
            console.log("Erro ao buscar participante:", error.response?.data || error.message)
        }
    }

    // Abre o painel e busca o que dá para mostrar de quem está na conversa.
    async function openInfo() {
        setPanel("info")
        setShowInfo(true)

        if (!other.id) return

        try {
            setLoadingInfo(true)

            if (other.role === "company") {
                const responseCompanies = await api.getCompaniesMap()
                const list = Array.isArray(responseCompanies.data) ? responseCompanies.data : []

                setCompany(list.find(item => item.companyId === other.id) || null)

                await loadReviews()
            }

            // Comprador conversando com empresa: lista os pedidos entre os dois.
            if (user.role === "user" && other.role === "company") {
                await loadOrders()
            }
        } catch (error) {
            console.log("Erro ao carregar informações:", error.response?.data || error.message)
        } finally {
            setLoadingInfo(false)
        }
    }

    // A lista de compras não traz o vendedor: busca o detalhe das
    // recentes (todas ao mesmo tempo) e fica só com as desta empresa.
    async function loadOrders() {
        const responseShoppings = await api.getShoppings()
        const all = Array.isArray(responseShoppings.data) ? responseShoppings.data : []

        const recent = all
            .filter(item => ["pending", "accepted", "completed"].includes(item.status))
            .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
            .slice(0, 10)

        const details = await Promise.all(
            recent.map(item => api.getShoppingById(item.id).then(res => res.data).catch(() => null))
        )

        const fromCompany = details.filter(item =>
            item && Array.isArray(item.items) &&
            item.items.some(product => String(product.seller_id).toLowerCase() === String(other.id).toLowerCase())
        )

        // Venda aceita só pode ser finalizada depois de paga.
        const withPayment = await Promise.all(fromCompany.map(async item => {
            let paid = Number(item.value) === 0

            if (item.status === "accepted" && !paid) {
                try {
                    const responsePayments = await api.getPaymentsByShopping(item.id)
                    const payments = Array.isArray(responsePayments.data) ? responsePayments.data : []

                    paid = payments.some(payment => payment.status === "approved")
                } catch (error) {
                    paid = false
                }
            }

            return { ...item, paid }
        }))

        setOrders(withPayment)
    }

    // Nota média da empresa e quais pedidos eu já avaliei.
    async function loadReviews() {
        try {
            const responseReviews = await api.getReviews()
            const list = Array.isArray(responseReviews.data) ? responseReviews.data : []
            const ofCompany = list.filter(item => String(item.id_reviewed).toLowerCase() === String(other.id).toLowerCase())

            if (ofCompany.length > 0) {
                let total = 0

                for (const item of ofCompany) {
                    total += Number(item.rating)
                }

                setRating({ average: total / ofCompany.length, count: ofCompany.length })
            } else {
                setRating(null)
            }

            const mine = {}

            for (const item of ofCompany) {
                if (String(item.id_reviewer).toLowerCase() === String(user.id).toLowerCase()) {
                    mine[item.id_shopping] = Number(item.rating)
                }
            }

            setMyReviews(mine)
        } catch (error) {
            console.log("Erro ao carregar avaliações:", error.response?.data || error.message)
        }
    }

    function openReview(order) {
        setSelectedOrder(order)
        setStars(0)
        setComment("")
        setPanel("avaliar")
        setShowInfo(true)
    }

    function openReport(order) {
        setSelectedOrder(order)
        setReportType("")
        setReportText("")
        setPanel("denunciar")
    }

    async function sendReview() {
        if (stars === 0) {
            showAlert("Escolha uma nota", "Toque nas estrelas para dar de 1 a 5.")
            return
        }

        try {
            setSendingForm(true)

            await api.createReview({
                rating: stars,
                comment: comment.trim() || null,
                id_shopping: selectedOrder.id,
                id_reviewed: other.id
            })

            setMyReviews(prev => ({ ...prev, [selectedOrder.id]: stars }))
            setPanel("info")
            loadReviews()

            showAlert("Avaliação enviada", "Obrigado! Sua nota ajuda outros compradores.")
        } catch (error) {
            console.log("Erro ao avaliar:", error.response?.data || error.message)
            showAlert(
                "Não foi possível avaliar",
                String(error.response?.data?.error || "Tente novamente.")
            )
        } finally {
            setSendingForm(false)
        }
    }

    async function sendReport() {
        if (!reportType) {
            showAlert("Escolha o motivo", "Selecione o que aconteceu com o pedido.")
            return
        }

        if (reportText.trim().length < 10) {
            showAlert("Conte o que aconteceu", "Escreva pelo menos 10 caracteres para a equipe analisar.")
            return
        }

        try {
            setSendingForm(true)

            await api.createDispute({
                type: reportType,
                description: reportText.trim(),
                id_shopping: selectedOrder.id
            })

            setPanel("info")

            showAlert(
                "Denúncia enviada",
                "A equipe do Reaproveita vai analisar. Acompanhe em Perfil > Denúncias.",
                [
                    { text: "Fechar", style: "cancel" },
                    {
                        text: "Ver denúncias",
                        onPress: () => {
                            setShowInfo(false)
                            navigation.navigate("DisputesScreen")
                        }
                    }
                ]
            )
        } catch (error) {
            console.log("Erro ao denunciar:", error.response?.data || error.message)
            showAlert(
                "Não foi possível enviar",
                String(error.response?.data?.error || "Tente novamente.")
            )
        } finally {
            setSendingForm(false)
        }
    }

    function confirmFinish(order) {
        showAlert(
            "Finalizar pedido?",
            "Confirme só depois de retirar ou receber o material. O pedido fica como concluído e entra nos seus indicadores ambientais.",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Finalizar", onPress: () => finishOrder(order) }
            ]
        )
    }

    async function finishOrder(order) {
        try {
            setFinishingId(order.id)

            const response = await api.updateShoppingStatus(order.id, "completed")

            const finished = { ...order, status: "completed" }

            setOrders(prev => prev.map(item =>
                item.id === order.id ? finished : item
            ))

            const impact = response.data.impact

            // Logo depois de finalizar, já oferece a avaliação da empresa.
            showAlert(
                "Pedido finalizado",
                (impact
                    ? "Você ajudou a reaproveitar " + formatNumber(impact.estimated_weight_kg) + " kg de material e evitou " + formatNumber(impact.co2_saved_kg) + " kg de CO₂."
                    : "O pedido foi concluído.") +
                    "\n\nQue tal avaliar a empresa?",
                [
                    {
                        text: "Ver impacto",
                        onPress: () => {
                            setShowInfo(false)
                            navigation.navigate("ImpactScreen", { shoppingId: order.id })
                        }
                    },
                    { text: "Agora não", style: "cancel" },
                    { text: "Avaliar", onPress: () => openReview(finished) }
                ]
            )
        } catch (error) {
            console.log("Erro ao finalizar pedido:", error.response?.data || error.message)
            showAlert(
                "Não foi possível finalizar",
                String(error.response?.data?.error || "Tente novamente.")
            )
        } finally {
            setFinishingId(null)
        }
    }

    function getOrderStatus(order) {
        if (order.status === "completed") return "Concluído"
        if (order.status === "pending") return "Aguardando a empresa aceitar"
        if (!order.paid) return "Aceito · aguardando pagamento"
        return "Aceito · pronto para retirar"
    }

    function formatNumber(value) {
        return Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })
    }

    function formatPrice(value) {
        if (Number(value) === 0) return "Doação"

        return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }

    function getInitials(name) {
        const parts = String(name || "").trim().split(" ").filter(Boolean)

        if (parts.length === 0) return "?"
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }

    // Entra na sala da conversa (para receber em tempo real) e busca o histórico.
    async function loadMessages(currentUser) {
        if (!conversationId) {
            setErrorMessage("Conversa não informada.")
            return
        }

        try {
            setErrorMessage("")

            await emitSocket("join_conversation", conversationId)

            const response = await emitSocket("load_messages", { conversationId, limit: 50 })
            const list = Array.isArray(response.messages) ? response.messages.map(toMessage) : []

            setMessages(list)

            // Marca como lido até a última mensagem recebida.
            const me = currentUser || user
            const received = list.filter(item => me && item.id_user.toLowerCase() !== me.id.toLowerCase())

            if (received.length > 0) {
                emitSocket("mark_read", {
                    conversationId,
                    upToMessageId: received[received.length - 1].id
                }).catch(() => {})
            }
        } catch (error) {
            console.log("Erro ao carregar mensagens:", error.message)
            setErrorMessage(error.message || "Não foi possível carregar as mensagens.")
        }
    }

    // Mensagens do histórico e do tempo real chegam com nomes um pouco diferentes.
    function toMessage(raw) {
        return {
            id: raw.id,
            content: raw.content,
            created_in: raw.created_in,
            id_user: String(raw.id_user || ""),
            isDeleted: Boolean(raw.isDeleted || raw.deleted_in),
            isEdited: Boolean(raw.isEdited || raw.edited_in),
            id_answer: raw.id_answer || null
        }
    }

    function animateMessage(id) {
        setNewMessageId(id)
        newMessageAnim.setValue(0)
        Animated.spring(newMessageAnim, {
            toValue: 1,
            damping: 12,
            stiffness: 180,
            useNativeDriver: true
        }).start()
    }

    function isMine(message) {
        return Boolean(user && message.id_user.toLowerCase() === user.id.toLowerCase())
    }

    async function sendMessage() {
        const content = text.trim()

        if (!content || sending) return

        try {
            setSending(true)

            if (editing) {
                await emitSocket("edit_message", { messageId: editing.id, content })

                setMessages(prev => prev.map(item =>
                    item.id === editing.id ? { ...item, content, isEdited: true } : item
                ))
                setEditing(null)
            } else {
                const response = await emitSocket("send_message", {
                    conversationId,
                    type: "texto",
                    content,
                    id_answer: replyTo ? replyTo.id : null
                })

                // Se o eco do servidor ainda não chegou, mostra a mensagem já.
                const message = {
                    id: response.id,
                    content,
                    created_in: new Date().toISOString(),
                    id_user: user.id,
                    isDeleted: false,
                    isEdited: false,
                    id_answer: replyTo ? replyTo.id : null
                }

                setMessages(prev => prev.find(item => item.id === message.id) ? prev : [...prev, message])
                animateMessage(message.id)
                setReplyTo(null)
            }

            setText("")
        } catch (error) {
            console.log("Erro ao enviar mensagem:", error.message)
            showAlert("Não foi possível enviar", error.message || "Tente novamente.")
        } finally {
            setSending(false)
        }
    }

    // Toque longo: responder qualquer mensagem; editar/excluir só as suas.
    function openOptions(message) {
        if (message.isDeleted) return

        const options = [
            {
                text: "Responder",
                onPress: () => {
                    cancelEditing()
                    setReplyTo(message)
                }
            }
        ]

        if (isMine(message)) {
            options.push({
                text: "Editar",
                onPress: () => {
                    setReplyTo(null)
                    setEditing(message)
                    setText(message.content || "")
                }
            })
            options.push({
                text: "Excluir",
                style: "destructive",
                onPress: () => confirmDelete(message)
            })
        }

        options.push({ text: "Cancelar", style: "cancel" })

        showAlert("Mensagem", undefined, options)
    }

    // Excluir pede confirmação: a mensagem some para as duas pessoas.
    function confirmDelete(message) {
        showAlert(
            "Excluir mensagem?",
            "Ela vai aparecer como \"Mensagem excluída\" para as duas pessoas.",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => deleteMessage(message) }
            ]
        )
    }

    async function deleteMessage(message) {
        try {
            await emitSocket("delete_message", { messageId: message.id })

            setMessages(prev => prev.map(item =>
                item.id === message.id ? { ...item, content: null, isDeleted: true } : item
            ))

            // Se estava editando ou respondendo essa mensagem, cancela.
            if (editing && editing.id === message.id) cancelEditing()
            if (replyTo && replyTo.id === message.id) setReplyTo(null)
        } catch (error) {
            console.log("Erro ao excluir mensagem:", error.message)
            showAlert("Não foi possível excluir", error.message || "Tente novamente.")
        }
    }

    function cancelEditing() {
        if (!editing) return

        setEditing(null)
        setText("")
    }

    // Quem escreveu e o texto da mensagem citada (na bolha e na barra de resposta).
    function getQuote(id) {
        const original = messages.find(item => item.id === id)

        if (!original) return { name: "Mensagem", text: "Mensagem anterior" }

        return {
            name: isMine(original) ? "Você" : other.name,
            text: original.isDeleted ? "Mensagem excluída" : original.content
        }
    }

    function formatTime(value) {
        const date = new Date(value)

        if (isNaN(date.getTime())) return ""

        return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }

    function formatDay(value) {
        const date = new Date(value)

        if (isNaN(date.getTime())) return ""

        const today = new Date()
        const yesterday = new Date()
        yesterday.setDate(today.getDate() - 1)

        if (date.toDateString() === today.toDateString()) return "Hoje"
        if (date.toDateString() === yesterday.toDateString()) return "Ontem"

        return date.toLocaleDateString("pt-BR")
    }

    function getRole(role) {
        if (role === "company") return "Empresa / Fornecedor"
        if (role === "user") return "Comprador / Artesão"
        if (role === "admin") return "Administrador"
        return "Conversa"
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("ConversationsScreen")
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
            edges={["top", "left", "right", "bottom"]}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={goBack}
                    accessibilityRole="button"
                    accessibilityLabel="Voltar"
                >
                    <MaterialCommunityIcons
                        name="arrow-left"
                        size={20}
                        color={colors.primaryDark}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.headerTexts}
                    onPress={openInfo}
                    accessibilityRole="button"
                    accessibilityLabel={"Ver informações de " + other.name}
                >
                    <Text style={styles.headerName} numberOfLines={1}>
                        {other.name}
                    </Text>

                    <Text style={styles.headerRole}>
                        {getRole(other.role)} · toque para ver
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={openInfo}
                    accessibilityRole="button"
                    accessibilityLabel="Informações da conversa"
                >
                    <MaterialCommunityIcons
                        name="information-outline"
                        size={22}
                        color={colors.primaryDark}
                    />
                </TouchableOpacity>
            </View>

            <Modal
                visible={showInfo}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInfo(false)}
            >
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior="padding"
                >
                <SafeAreaView style={styles.modalOverlay}>
                    <View style={styles.modalCard} accessibilityViewIsModal>
                        <ScrollView
                            contentContainerStyle={styles.modalContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.modalHeader}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{getInitials(other.name)}</Text>
                                </View>

                                <View style={styles.headerTexts}>
                                    <Text style={styles.modalName}>{other.name}</Text>
                                    <Text style={styles.headerRole}>{getRole(other.role)}</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={() => setShowInfo(false)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Fechar informações"
                                >
                                    <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {panel === "info" && (
                            <View>
                            {other.role === "company" && (
                                <View style={styles.infoRow}>
                                    <MaterialCommunityIcons name="star" size={18} color={colors.accent} />
                                    <Text style={styles.infoText}>
                                        {rating
                                            ? rating.average.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " de 5 · " + rating.count + (rating.count === 1 ? " avaliação" : " avaliações")
                                            : "Ainda sem avaliações"}
                                    </Text>
                                </View>
                            )}

                            {other.role === "company" && (
                                <TouchableOpacity
                                    style={styles.infoRow}
                                    onPress={() => {
                                        setShowInfo(false)
                                        navigation.navigate("CompanyProfileScreen", {
                                            companyId: other.id,
                                            companyName: other.name
                                        })
                                    }}
                                    accessibilityRole="button"
                                >
                                    <MaterialCommunityIcons name="storefront-outline" size={18} color={colors.primary} />
                                    <Text style={[styles.infoText, styles.infoLink]}>
                                        Ver perfil e avaliações da empresa
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {other.since && (
                                <View style={styles.infoRow}>
                                    <MaterialCommunityIcons name="message-text-outline" size={18} color={colors.primary} />
                                    <Text style={styles.infoText}>
                                        Conversando desde {new Date(other.since).toLocaleDateString("pt-BR")}
                                    </Text>
                                </View>
                            )}

                            {company && (
                                <View>
                                    <View style={styles.infoRow}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.primary} />
                                        <Text style={styles.infoText}>
                                            {[company.neighborhood, company.city, company.state].filter(Boolean).join(" · ")}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <MaterialCommunityIcons name="package-variant-closed" size={18} color={colors.primary} />
                                        <Text style={styles.infoText}>
                                            {company.availableProducts} {company.availableProducts === 1 ? "material disponível" : "materiais disponíveis"}
                                            {company.categories.length > 0 ? " · " + company.categories.join(", ") : ""}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {user.role === "user" && other.role === "company" && (
                                <View>
                                    <Text style={styles.sectionTitle}>Pedidos com esta empresa</Text>

                                    {loadingInfo ? (
                                        <ActivityIndicator color={colors.primary} style={styles.infoLoading} />
                                    ) : orders.length === 0 ? (
                                        <Text style={styles.infoEmpty}>
                                            Nenhum pedido em andamento com esta empresa.
                                        </Text>
                                    ) : (
                                        orders.map(order => (
                                            <View key={order.id} style={styles.order}>
                                                <Text style={styles.orderTitle} numberOfLines={2}>
                                                    {order.items.map(item => item.product_name).join(", ")}
                                                </Text>

                                                <Text style={styles.orderText}>
                                                    {formatPrice(order.value)} · {getOrderStatus(order)}
                                                </Text>

                                                {order.status === "accepted" && order.paid && (
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.button,
                                                            styles.orderButton,
                                                            finishingId === order.id && styles.sendDisabled
                                                        ]}
                                                        onPress={() => confirmFinish(order)}
                                                        disabled={finishingId !== null}
                                                        accessibilityRole="button"
                                                    >
                                                        {finishingId === order.id ? (
                                                            <ActivityIndicator color={colors.white} />
                                                        ) : (
                                                            <Text style={styles.buttonText}>
                                                                Finalizar pedido
                                                            </Text>
                                                        )}
                                                    </TouchableOpacity>
                                                )}

                                                {order.status === "accepted" && !order.paid && (
                                                    <TouchableOpacity
                                                        style={[styles.buttonOutline, styles.orderButton]}
                                                        onPress={() => {
                                                            setShowInfo(false)
                                                            navigation.navigate("PaymentMethodScreen", { shoppingId: order.id })
                                                        }}
                                                        accessibilityRole="button"
                                                    >
                                                        <Text style={styles.buttonOutlineText}>
                                                            Ir para o pagamento
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}

                                                {order.status === "completed" && (
                                                    <TouchableOpacity
                                                        style={[styles.buttonOutline, styles.orderButton]}
                                                        onPress={() => {
                                                            setShowInfo(false)
                                                            navigation.navigate("ImpactScreen", { shoppingId: order.id })
                                                        }}
                                                        accessibilityRole="button"
                                                    >
                                                        <Text style={styles.buttonOutlineText}>
                                                            Ver impacto ambiental
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}

                                                {order.status === "completed" && !myReviews[order.id] && (
                                                    <TouchableOpacity
                                                        style={[styles.button, styles.orderButton]}
                                                        onPress={() => openReview(order)}
                                                        accessibilityRole="button"
                                                    >
                                                        <Text style={styles.buttonText}>
                                                            Avaliar a empresa
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}

                                                {order.status === "completed" && myReviews[order.id] && (
                                                    <Text style={styles.myReview}>
                                                        Sua avaliação: {"★".repeat(myReviews[order.id])}{"☆".repeat(5 - myReviews[order.id])}
                                                    </Text>
                                                )}

                                                <TouchableOpacity
                                                    style={styles.reportLink}
                                                    onPress={() => openReport(order)}
                                                    accessibilityRole="button"
                                                >
                                                    <MaterialCommunityIcons name="flag-outline" size={16} color={colors.error} />
                                                    <Text style={styles.reportLinkText}>Denunciar problema</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    )}
                                </View>
                            )}
                            </View>
                            )}

                            {panel === "avaliar" && selectedOrder && (
                                <View>
                                    <Text style={styles.sectionTitle}>Avaliar {other.name}</Text>
                                    <Text style={styles.infoText}>
                                        Pedido: {selectedOrder.items.map(item => item.product_name).join(", ")}
                                    </Text>

                                    <View style={styles.stars}>
                                        {[1, 2, 3, 4, 5].map(number => (
                                            <TouchableOpacity
                                                key={number}
                                                onPress={() => setStars(number)}
                                                accessibilityRole="button"
                                                accessibilityLabel={number + (number === 1 ? " estrela" : " estrelas")}
                                            >
                                                <MaterialCommunityIcons
                                                    name={number <= stars ? "star" : "star-outline"}
                                                    size={36}
                                                    color={colors.accent}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TextInput
                                        style={[styles.input, styles.formInput]}
                                        placeholder="Conte como foi (opcional)"
                                        placeholderTextColor={colors.textTertiary}
                                        value={comment}
                                        onChangeText={setComment}
                                        multiline
                                        maxLength={1000}
                                    />

                                    <TouchableOpacity
                                        style={[styles.button, styles.orderButton, sendingForm && styles.sendDisabled]}
                                        onPress={sendReview}
                                        disabled={sendingForm}
                                        accessibilityRole="button"
                                    >
                                        {sendingForm ? (
                                            <ActivityIndicator color={colors.white} />
                                        ) : (
                                            <Text style={styles.buttonText}>Enviar avaliação</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.buttonOutline, styles.orderButton]}
                                        onPress={() => setPanel("info")}
                                        disabled={sendingForm}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.buttonOutlineText}>Voltar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {panel === "denunciar" && selectedOrder && (
                                <View>
                                    <Text style={styles.sectionTitle}>Denunciar problema</Text>
                                    <Text style={styles.infoText}>
                                        Pedido: {selectedOrder.items.map(item => item.product_name).join(", ")}
                                    </Text>

                                    <Text style={styles.formLabel}>O que aconteceu?</Text>
                                    <View style={styles.reasons}>
                                        {reportTypes.map(item => (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={[styles.reason, reportType === item.id && styles.reasonActive]}
                                                onPress={() => setReportType(item.id)}
                                                accessibilityRole="radio"
                                                accessibilityState={{ checked: reportType === item.id }}
                                            >
                                                <Text style={[styles.reasonText, reportType === item.id && styles.reasonTextActive]}>
                                                    {item.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TextInput
                                        style={[styles.input, styles.formInput]}
                                        placeholder="Descreva o problema para a equipe analisar"
                                        placeholderTextColor={colors.textTertiary}
                                        value={reportText}
                                        onChangeText={setReportText}
                                        multiline
                                        maxLength={1000}
                                    />

                                    <TouchableOpacity
                                        style={[styles.button, styles.reportButton, styles.orderButton, sendingForm && styles.sendDisabled]}
                                        onPress={sendReport}
                                        disabled={sendingForm}
                                        accessibilityRole="button"
                                    >
                                        {sendingForm ? (
                                            <ActivityIndicator color={colors.white} />
                                        ) : (
                                            <Text style={styles.buttonText}>Enviar denúncia</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.buttonOutline, styles.orderButton]}
                                        onPress={() => setPanel("info")}
                                        disabled={sendingForm}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.buttonOutlineText}>Voltar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>

            <KeyboardAvoidingView
                style={styles.container}
                behavior="padding"
            >
                {errorMessage ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{errorMessage}</Text>

                        <TouchableOpacity onPress={() => loadMessages()}>
                            <Text style={styles.errorLink}>Tentar novamente</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        errorMessage ? null : (
                            <View style={styles.empty}>
                                <MaterialCommunityIcons
                                    name="message-text-outline"
                                    size={36}
                                    color={colors.textTertiary}
                                />

                                <Text style={styles.emptyText}>
                                    Envie a primeira mensagem para combinar a retirada do material.
                                </Text>
                            </View>
                        )
                    }
                    renderItem={({ item, index }) => {
                        const mine = isMine(item)
                        const previous = messages[index - 1]
                        const newDay = !previous || formatDay(previous.created_in) !== formatDay(item.created_in)

                        return (
                            <View>
                                {newDay && (
                                    <Text style={styles.day}>
                                        {formatDay(item.created_in)}
                                    </Text>
                                )}

                                <Animated.View
                                    style={item.id === newMessageId ? {
                                        opacity: newMessageAnim,
                                        transform: [
                                            {
                                                translateY: newMessageAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [24, 0]
                                                })
                                            },
                                            {
                                                scale: newMessageAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.85, 1]
                                                })
                                            }
                                        ]
                                    } : null}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.bubble,
                                            mine ? styles.bubbleMine : styles.bubbleOther
                                        ]}
                                        onLongPress={() => openOptions(item)}
                                        activeOpacity={0.8}
                                    >
                                        {item.id_answer && !item.isDeleted && (
                                            <View style={[styles.quote, mine && styles.quoteMine]}>
                                                <Text style={[styles.quoteName, mine && styles.quoteNameMine]} numberOfLines={1}>
                                                    {getQuote(item.id_answer).name}
                                                </Text>
                                                <Text style={[styles.quoteText, mine && styles.quoteTextMine]} numberOfLines={2}>
                                                    {getQuote(item.id_answer).text}
                                                </Text>
                                            </View>
                                        )}

                                        <Text
                                            style={[
                                                styles.bubbleText,
                                                mine && styles.bubbleTextMine,
                                                item.isDeleted && styles.bubbleDeleted
                                            ]}
                                        >
                                            {item.isDeleted ? "Mensagem excluída" : item.content}
                                        </Text>

                                        <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                                            {item.isEdited && !item.isDeleted ? "editada · " : ""}
                                            {formatTime(item.created_in)}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        )
                    }}
                />

                {replyTo && (
                    <View style={styles.replyBar}>
                        <View style={styles.replyLine} />

                        <View style={styles.replyTexts}>
                            <Text style={styles.editingText}>
                                Respondendo a {isMine(replyTo) ? "você" : other.name}
                            </Text>
                            <Text style={styles.replyText} numberOfLines={1}>
                                {replyTo.content}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => setReplyTo(null)}
                            accessibilityRole="button"
                            accessibilityLabel="Cancelar resposta"
                        >
                            <MaterialCommunityIcons name="close" size={20} color={colors.primaryDark} />
                        </TouchableOpacity>
                    </View>
                )}

                {editing && (
                    <View style={styles.editingBar}>
                        <Text style={styles.editingText}>Editando mensagem</Text>

                        <TouchableOpacity onPress={() => cancelEditing()}>
                            <Text style={styles.errorLink}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.composer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Escreva uma mensagem"
                        placeholderTextColor={colors.textTertiary}
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={2000}
                    />

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!text.trim() || sending) && styles.sendDisabled
                        ]}
                        onPress={sendMessage}
                        disabled={!text.trim() || sending}
                        accessibilityRole="button"
                        accessibilityLabel={editing ? "Salvar edição" : "Enviar mensagem"}
                    >
                        {sending ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <MaterialCommunityIcons
                                name={editing ? "check" : "send"}
                                size={20}
                                color={colors.white}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        backgroundColor: colors.white
    },
    headerButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center"
    },
    headerTexts: {
        flex: 1
    },
    headerName: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    headerRole: {
        marginTop: 2,
        fontSize: 11,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    errorBox: {
        margin: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: colors.warningLight,
        gap: 4
    },
    errorText: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    errorLink: {
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    listContent: {
        flexGrow: 1,
        padding: 12
    },
    empty: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 32
    },
    emptyText: {
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        textAlign: "center"
    },
    day: {
        alignSelf: "center",
        marginVertical: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        overflow: "hidden",
        fontSize: 11,
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        backgroundColor: colors.primaryLight
    },
    bubble: {
        maxWidth: "80%",
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16
    },
    bubbleMine: {
        alignSelf: "flex-end",
        borderBottomRightRadius: 4,
        backgroundColor: colors.primaryDark
    },
    bubbleOther: {
        alignSelf: "flex-start",
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    bubbleText: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    bubbleTextMine: {
        color: colors.white
    },
    bubbleDeleted: {
        fontStyle: "italic",
        opacity: 0.7
    },
    bubbleTime: {
        marginTop: 4,
        alignSelf: "flex-end",
        fontSize: 10,
        fontFamily: fonts.regular,
        color: colors.textTertiary
    },
    bubbleTimeMine: {
        color: colors.primaryLight
    },
    quote: {
        marginBottom: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderLeftWidth: 3,
        borderLeftColor: colors.accent,
        borderRadius: 6,
        backgroundColor: colors.surfaceMuted
    },
    quoteMine: {
        backgroundColor: "rgba(250,249,245,0.12)"
    },
    quoteName: {
        fontSize: 11,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    quoteNameMine: {
        color: colors.white
    },
    quoteText: {
        marginTop: 2,
        fontSize: 12,
        lineHeight: 17,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    quoteTextMine: {
        color: colors.railText
    },
    replyBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.surfaceMuted
    },
    replyLine: {
        width: 3,
        alignSelf: "stretch",
        borderRadius: 2,
        backgroundColor: colors.accent
    },
    replyTexts: {
        flex: 1,
        minWidth: 0
    },
    replyText: {
        marginTop: 2,
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    editingBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.primaryLight
    },
    editingText: {
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    composer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        backgroundColor: colors.white
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryDark,
        justifyContent: "center",
        alignItems: "center"
    },
    sendDisabled: {
        opacity: 0.5
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
    buttonOutline: {
        width: "100%",
        minHeight: 48,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonOutlineText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    modalOverlay: {
        flex: 1,
        padding: 20,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center"
    },
    modalCard: {
        width: "100%",
        maxWidth: 420,
        maxHeight: "90%",
        borderRadius: 24,
        backgroundColor: colors.white,
        overflow: "hidden"
    },
    modalContent: {
        padding: 20
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16
    },
    infoLink: {
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        textDecorationLine: "underline"
    },
    modalName: {
        fontSize: 20,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 100,
        backgroundColor: colors.primaryDark,
        justifyContent: "center",
        alignItems: "center"
    },
    avatarText: {
        fontSize: 18,
        fontFamily: fonts.bold,
        color: colors.white
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 8
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    sectionTitle: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    infoLoading: {
        marginVertical: 16
    },
    infoEmpty: {
        fontSize: 13,
        lineHeight: 19,
        fontFamily: fonts.regular,
        color: colors.textTertiary
    },
    order: {
        marginBottom: 10,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.background
    },
    orderTitle: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.textPrimary
    },
    orderText: {
        marginTop: 4,
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    orderButton: {
        marginTop: 12,
        minHeight: 46
    },
    myReview: {
        marginTop: 10,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.accent
    },
    reportLink: {
        minHeight: 36,
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4
    },
    reportLinkText: {
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.error
    },
    stars: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
        marginVertical: 16
    },
    formLabel: {
        marginTop: 14,
        marginBottom: 8,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    formInput: {
        minHeight: 96,
        marginTop: 12,
        textAlignVertical: "top"
    },
    reasons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    reason: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white
    },
    reasonActive: {
        borderColor: colors.error,
        backgroundColor: colors.errorLight
    },
    reasonText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textPrimary
    },
    reasonTextActive: {
        fontFamily: fonts.bold,
        color: colors.error
    },
    reportButton: {
        backgroundColor: colors.error
    }
})
