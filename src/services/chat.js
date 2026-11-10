// Utilitários puros do chat: normalização dos contratos do backend,
// ordenação, formatação de data/hora e mensagens de erro.

const MESSAGE_TYPE_LABEL = {
  texto: "Mensagem de texto",
  imagem: "Imagem",
  audio: "Áudio",
  arquivo: "Arquivo",
};

function pad(value) {
  return String(value).padStart(2, "0");
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string") {
    const normalized = value.includes(" ") && !value.includes("T")
      ? value.replace(" ", "T")
      : value;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function timeOf(value) {
  const date = toDate(value);
  return date ? date.getTime() : 0;
}

export function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatTime(value) {
  const date = toDate(value);
  if (!date) return "";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDayLabel(value) {
  const date = toDate(value);
  if (!date) return "";

  const now = new Date();
  if (sameDay(date, now)) return "Hoje";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Ontem";

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatListTime(value) {
  const date = toDate(value);
  if (!date) return "";

  const now = new Date();
  if (sameDay(date, now)) return formatTime(date);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Ontem";

  if (date.getFullYear() === now.getFullYear()) {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
  }

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
}

export function roleLabel(role) {
  if (role === "company") return "Empresa / Fornecedor";
  if (role === "user") return "Comprador / Artesão";
  if (role === "admin") return "Administrador";
  return "Conta";
}

export function normalizePhoto(photo) {
  if (typeof photo === "string" && /^(https?:|data:image)/i.test(photo)) {
    return photo;
  }
  return null;
}

export function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function normalizeMessage(raw, currentUserId) {
  const userId = raw?.id_user ? String(raw.id_user) : null;
  const createdAt = raw?.created_in || raw?.createdAt || null;
  const deletedAt = raw?.deleted_in ?? raw?.deletedAt ?? null;
  const editedAt = raw?.edited_in ?? raw?.editedAt ?? null;
  const isDeleted = raw?.isDeleted ?? Boolean(deletedAt);
  const isEdited = raw?.isEdited ?? Boolean(editedAt && !deletedAt);

  return {
    id: raw?.id,
    type: raw?.type || "texto",
    content: isDeleted ? null : (raw?.content ?? null),
    createdAt,
    editedAt,
    deletedAt,
    userId,
    conversationId: raw?.id_conversation || raw?.conversationId || null,
    answerId: raw?.id_answer ?? raw?.answerId ?? null,
    isDeleted,
    isEdited,
    mine: Boolean(userId && currentUserId && userId.toLowerCase() === String(currentUserId).toLowerCase()),
    pending: false,
    failed: false,
    clientId: null,
    answeredMessage: null,
  };
}

export function compareMessages(a, b) {
  const diff = timeOf(a.createdAt) - timeOf(b.createdAt);
  if (diff !== 0) return diff;
  const first = String(a.id || "");
  const second = String(b.id || "");
  if (first === second) return 0;
  return first < second ? -1 : 1;
}

export function sortMessages(list) {
  return [...list].sort(compareMessages);
}

export function mergeMessages(current, incoming) {
  const byId = new Map();

  current.forEach((message) => byId.set(message.id, message));

  incoming.forEach((message) => {
    const existing = byId.get(message.id);
    byId.set(message.id, existing ? { ...existing, ...message, pending: false, failed: false } : message);
  });

  return sortMessages([...byId.values()]);
}

export function previewFromMessage(message) {
  return {
    type: message.type || "texto",
    content: message.isDeleted ? null : message.content,
    mine: Boolean(message.mine),
    isDeleted: Boolean(message.isDeleted),
    createdAt: message.createdAt || null,
  };
}

export function previewText(conversation) {
  const preview = conversation?.preview;

  if (!preview) {
    return conversation?.lastMessageId
      ? "Toque para abrir a conversa"
      : "Conversa iniciada — envie a primeira mensagem";
  }

  if (preview.isDeleted) return "Mensagem excluída";

  const content = preview.type === "texto"
    ? (preview.content || "")
    : MESSAGE_TYPE_LABEL[preview.type] || "Mensagem";

  if (!content) return "Mensagem";
  return preview.mine ? `Você: ${content}` : content;
}

export function normalizeConversation(row, currentUserId, cachedPreview = null) {
  return {
    conversationId: row?.conversationId || row?.id || null,
    otherUserId: row?.otherUserId ? String(row.otherUserId) : null,
    otherUserName: row?.otherUserName || "Usuário",
    otherUserRole: row?.otherUserRole || null,
    otherUserPhoto: row?.otherUserPhoto ?? null,
    createdAt: row?.created_in || row?.createdAt || null,
    updatedAt: row?.updated_in || row?.updatedAt || row?.created_in || null,
    lastMessageId: row?.id_last_message || null,
    unreadCount: Number(row?.unreadCount) || 0,
    preview: row?.preview || cachedPreview || null,
    mine: Boolean(currentUserId),
  };
}

export function sortConversations(list) {
  return [...list].sort((a, b) => timeOf(b.updatedAt) - timeOf(a.updatedAt));
}

// Monta os itens da FlatList invertida: mensagens (mais recente primeiro)
// com separadores de dia posicionados acima de cada grupo.
export function buildMessageRenderData(messagesAsc) {
  const descending = [...messagesAsc].reverse();
  const items = [];
  let currentDayKey = null;
  let currentDayLabel = null;

  descending.forEach((message) => {
    const date = toDate(message.createdAt);
    const dayKey = date
      ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      : "sem-data";
    const dayLabel = formatDayLabel(message.createdAt);

    if (currentDayKey !== null && dayKey !== currentDayKey) {
      items.push({
        type: "day",
        key: `day-${currentDayKey}`,
        label: currentDayLabel,
      });
    }

    currentDayKey = dayKey;
    currentDayLabel = dayLabel;
    items.push({ type: "message", key: message.id, message });
  });

  if (currentDayKey !== null) {
    items.push({
      type: "day",
      key: `day-${currentDayKey}`,
      label: currentDayLabel,
    });
  }

  return items;
}

export function extractErrorMessage(error, fallback = "Não foi possível concluir a ação.") {
  if (!error) return fallback;

  if (error.code === "offline") return "Sem conexão com o servidor.";
  if (error.code === "timeout") return "O servidor não respondeu. Tente novamente.";

  const data = error.response?.data;
  if (data?.error) return data.error;
  if (data?.message) return data.message;

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function isAuthError(error) {
  if (error?.response?.status === 401) return true;

  const message = extractErrorMessage(error, "").toLowerCase();
  return (
    message.includes("autenticação") ||
    message.includes("token expirado") ||
    message.includes("token inválido") ||
    message.includes("falha na autenticação")
  );
}

export function isPermissionError(error) {
  const message = extractErrorMessage(error, "").toLowerCase();
  return (
    message.includes("não participa") ||
    message.includes("acesso negado") ||
    message.includes("não encontrada")
  );
}
