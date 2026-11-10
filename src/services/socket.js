import { io } from "socket.io-client"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { SOCKET_URL } from "./axios"

// Uma conexão só para o app inteiro, aberta na primeira vez que o chat precisa.
// O backend identifica o usuário pelo token enviado em auth.token.
let socket = null

export async function getSocket() {
    if (socket) return socket

    const token = await AsyncStorage.getItem("@token")

    if (!token) return null

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"]
    })

    return socket
}

// Chamado no logout e no login: a próxima conexão usa o token novo.
export function disconnectSocket() {
    if (socket) {
        socket.disconnect()
        socket = null
    }
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
