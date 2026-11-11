import { io } from "socket.io-client"
import { Platform, Vibration } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"

import { SOCKET_URL } from "./axios"

// Uma conexão só para o app inteiro, aberta no painel (para avisar de
// mensagens novas) ou na primeira vez que o chat precisa.
// O backend identifica o usuário pelo token enviado em auth.token.
let socket = null

// Conversa aberta na tela agora: mensagem dela só toca, sem notificação.
let activeConversation = null

// Com o app aberto, a notificação aparece no topo e toca o som do celular.
// Se a pessoa já está na conversa, só toca (sem o aviso por cima do chat).
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        const inChat = notification.request.content.data?.conversationId === activeConversation

        return {
            shouldShowBanner: !inChat,
            shouldShowList: !inChat,
            shouldPlaySound: true,
            shouldSetBadge: false
        }
    }
})

export function setActiveConversation(conversationId) {
    activeConversation = conversationId || null
}

// Pede permissão e cria o canal de mensagens no Android (som + vibração).
export async function setupNotifications() {
    try {
        await Notifications.requestPermissionsAsync()

        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("mensagens", {
                name: "Mensagens",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 150, 250],
                sound: "default"
            })
        }
    } catch (error) {
        console.log("Erro ao preparar notificações:", error.message)
    }
}

// O backend avisa cada destinatário com o evento "notification" (tipo nova_mensagem).
function handleNotification(data) {
    if (!data || data.type !== "nova_mensagem") return

    Vibration.vibrate(200)

    Notifications.scheduleNotificationAsync({
        content: {
            title: data.title || "Nova mensagem",
            body: data.content || "",
            data: { conversationId: data.reference_id },
            sound: true,
            // Android: cor do ícone "r." na barra de notificações (verde floresta).
            color: "#0F3D2E"
        },
        trigger: Platform.OS === "android" ? { channelId: "mensagens" } : null
    }).catch(error => console.log("Erro ao mostrar notificação:", error.message))
}

export async function getSocket() {
    if (socket) return socket

    const token = await AsyncStorage.getItem("@token")

    if (!token) return null

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"]
    })

    socket.on("notification", handleNotification)

    return socket
}

// Chamado no logout e no login: a próxima conexão usa o token novo.
export function disconnectSocket() {
    if (socket) {
        socket.disconnect()
        socket = null
    }

    activeConversation = null
}

// Envia um evento e espera a resposta do servidor (callback do Socket.IO).
export async function emitSocket(event, payload) {
    const activeSocket = await getSocket()

    if (!activeSocket) {
        throw new Error("Faça login novamente para usar o chat.")
    }

    return new Promise((resolve, reject) => {
        activeSocket.timeout(15000).emit(event, payload, (error, response) => {
            if (error) {
                reject(new Error("O servidor não respondeu. Tente novamente."))
                return
            }

            if (response && response.error) {
                reject(new Error(response.error))
                return
            }

            resolve(response || {})
        })
    })
}
