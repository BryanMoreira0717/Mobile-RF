import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Preencha com a URL base da sua API
const BASE_URL = 'http://192.168.1.146:5000/api/reaproveitafranca';

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
  verifyCode: (data) => api.post("/otp/verificar", data)
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

export default sheets;
