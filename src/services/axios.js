import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Preencha com a URL base da sua API
export const BASE_URL = 'http://172.20.10.5:5000/api/reaproveitafranca';

// O Socket.IO roda na raiz do servidor, sem o prefixo da API.
export const SOCKET_URL = BASE_URL.replace(/\/api\/reaproveitafranca\/?$/, '');

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sheets = {
  //ROTAS DE USUÁRIO
  registerUser:(data) => {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    return api.post("/user/create", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
  },
  registerCompany:(data) => {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    return api.post("/user/create/empresa", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
  },
  registerAdmin:(user) => api.post("/user/create/admin", user),
  login:(user) => api.post("/user/login", user),
  verifyCode: (data) => api.post("/otp/verificar", data),

  //ROTAS DE CONVERSA
  listConversations:() => api.get("/conversation"),
  getOrCreateConversation:(otherUserId) => api.post("/conversation", { otherUserId }),
  getConversation:(id) => api.get(`/conversation/${id}`),
  leaveConversation:(id) => api.delete(`/conversation/${id}`)
}

// Anexa o token salvo em toda request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log("Erro ao ler token:", e?.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response - preencha conforme necessario (ex: refresh token, log de erro)
// api.interceptors.response.use(
//   (response) => response,
//   (error) => Promise.reject(error)
// );

export { api };

export default sheets;
