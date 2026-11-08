import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Preencha com a URL base da sua API
const BASE_URL = 'http://192.168.137.67:5000/api/reaproveitafranca';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sheets = {
  connectMercadoPago: () =>
    api.post("/payment/mercado-pago/connect", {}, { timeout: 20000 }),
  getMercadoPagoAccount: () =>
    api.get("/payment/mercado-pago/account", { timeout: 15000 }),
  disconnectMercadoPago: () =>
    api.delete("/payment/mercado-pago/account", { timeout: 20000 }),

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
  createProduct: (data) => api.post("/product/create", data),
  getUserById: (id) => api.get("/user/" + id),
  getProducts: () => api.get("/product/", { timeout: 15000 }),
  getProductById: (id) =>
    api.get(`/product/${encodeURIComponent(id)}`, { timeout: 15000 }),
  createReservation: (productId, quantity) =>
    api.post("/shopping/create", {
      items: [{ id_product: productId, quantity }],
    }, { timeout: 20000 }),
  getProductLocation: (id) =>
    api.get(`/localization/product/${encodeURIComponent(id)}`, { timeout: 15000 }),
  getShoppingById: (id) => api.get("/shopping/" + id),
  getPaymentsByShopping: (id) => api.get("/payment/shopping/" + id),
  createPayment: (data) => api.post("/payment/create", data),
  getPaymentCheckout: (id) => api.get("/payment/" + id + "/checkout"),
  syncPayment: (id) => api.post("/payment/" + id + "/sync"),
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
