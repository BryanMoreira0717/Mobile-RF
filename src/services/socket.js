import { io } from "socket.io-client";

import { SOCKET_URL } from "./axios";

// O backend autentica o socket pelo token enviado em handshake.auth.token
// (ver backend-RF/src/sockets/notificationSocket.js, extractToken).
// Em React Native não há CORS; em Expo web o backend precisa liberar a origem.

let socket = null;
let currentToken = null;
let status = "idle";
let manualClose = false;

const statusListeners = new Set();

function setStatus(next) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => {
    try {
      listener(next);
    } catch (error) {
      console.log("Erro em listener de status do socket:", error?.message);
    }
  });
}

export function getSocketStatus() {
  return status;
}

export function getSocket() {
  return socket;
}

export function subscribeSocketStatus(listener) {
  statusListeners.add(listener);
  listener(status);

  return () => {
    statusListeners.delete(listener);
  };
}

export function connectSocket(token) {
  if (!token) return null;

  if (socket && currentToken === token) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  disconnectSocket();

  currentToken = token;
  manualClose = false;
  setStatus("connecting");

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
    timeout: 12000,
    forceNew: true,
  });

  socket.on("connect", () => setStatus("online"));

  socket.on("disconnect", () => {
    if (manualClose) return;
    setStatus("offline");
  });

  socket.on("connect_error", () => {
    if (manualClose) return;
    setStatus("offline");
  });

  return socket;
}

export function disconnectSocket() {
  manualClose = true;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = null;
  setStatus("idle");
}

// Converte o callback do Socket.IO em Promise, com timeout e erro normalizado.
export function emitAck(event, payload, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const activeSocket = socket;

    if (!activeSocket || !activeSocket.connected) {
      const error = new Error("Sem conexão com o servidor.");
      error.code = "offline";
      reject(error);
      return;
    }

    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      const error = new Error("O servidor não respondeu. Tente novamente.");
      error.code = "timeout";
      reject(error);
    }, timeoutMs);

    activeSocket.emit(event, payload, (response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (response && response.error) {
        const error = new Error(response.error);
        error.code = "server";
        error.response = response;
        reject(error);
        return;
      }

      resolve(response || {});
    });
  });
}
