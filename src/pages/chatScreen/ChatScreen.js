import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Animated
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
import { fonts } from "../../theme/fonts"
import api from "../../services/axios"
import { getSocket, emitSocket, setActiveConversation } from "../../services/socket"

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
        name: route?.params?.otherUserName || "Conversa",
        role: route?.params?.otherUserRole
    })

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

            if (!route?.params?.otherUserName) {
                loadOtherUser()
            }

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
                setOther({ name: conversation.otherUserName, role: conversation.otherUserRole })
            }
        } catch (error) {
            console.log("Erro ao buscar participante:", error.response?.data || error.message)
        }
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
            Alert.alert("Não foi possível enviar", error.message || "Tente novamente.")
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

        Alert.alert("Mensagem", undefined, options)
    }

    // Excluir pede confirmação: a mensagem some para as duas pessoas.
    function confirmDelete(message) {
        Alert.alert(
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
            Alert.alert("Não foi possível excluir", error.message || "Tente novamente.")
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

                <View style={styles.headerTexts}>
                    <Text style={styles.headerName} numberOfLines={1}>
                        {other.name}
                    </Text>

                    <Text style={styles.headerRole}>
                        {getRole(other.role)}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
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
    }
})
