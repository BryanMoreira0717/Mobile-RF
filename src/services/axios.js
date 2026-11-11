import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Preencha com a URL base da sua API
export const BASE_URL = 'http://192.168.1.166:5000/api/reaproveitafranca';

// O Socket.IO (chat) roda na raiz do servidor, sem o prefixo da API.
export const SOCKET_URL = BASE_URL.replace(/\/api\/reaproveitafranca\/?$/, '');

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
  // Reenvia o código de confirmação para o e-mail da conta.
  sendCode: (id) => api.post("/otp/enviar", { id }),
  createProduct: (data) => {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    return api.post("/product/create", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
  },
  getUserById: (id) => api.get("/user/" + id),
  // A lista traz as fotos em base64 e fica pesada: tempo maior que as demais.
  getProducts: () => api.get("/product/", { timeout: 60000 }),
  // Lista sem as fotos (7 KB em vez de MBs): mapa de materiais.
  getProductsLight: () => api.get("/product/?photos=none", { timeout: 15000 }),
  getProductById: (id) =>
    api.get(`/product/${encodeURIComponent(id)}`, { timeout: 15000 }),
  createReservation: (productId, quantity) =>
    api.post("/shopping/create", {
      items: [{ id_product: productId, quantity }],
    }, { timeout: 20000 }),
  getProductLocation: (id) =>
    api.get(`/localization/product/${encodeURIComponent(id)}`, { timeout: 15000 }),
  getShoppingById: (id) => api.get("/shopping/" + id),
  getShoppings: () => api.get("/shopping/", { timeout: 15000 }),
  cancelShopping: (id) => api.patch("/shopping/" + id + "/cancel"),
  updateShoppingStatus: (id, status) =>
    api.patch("/shopping/" + id + "/status", { status }),
  getPaymentsByShopping: (id) => api.get("/payment/shopping/" + id),
  createPayment: (data) => api.post("/payment/create", data),
  getPaymentCheckout: (id) => api.get("/payment/" + id + "/checkout"),
  syncPayment: (id) => api.post("/payment/" + id + "/sync"),

  //ROTAS DA CONTA
  updateUser: (id, data) => api.put("/user/" + id, data),
  // Foto vai como FormData (campo "photo").
  updateUserPhoto: (id, data) =>
    api.put("/user/" + id, data, { headers: { "Content-Type": "multipart/form-data" } }),
  // Volta a imagem em blob; sem foto a API responde 204.
  getUserPhoto: (id) => api.get("/user/" + id + "/photo", { responseType: "blob", timeout: 15000 }),
  changePassword: (data) => api.patch("/user/password", data),
  forgotPassword: (email) => api.post("/user/password/forgot", { email }),
  // Token que chega no link do e-mail de redefinição.
  resetPassword: (token, newPassword) => api.post("/user/password/reset", { token, newPassword }),
  firstAccessPassword: (data) => api.patch("/user/password/first-access", data),
  // Exclui a própria conta (mesma rota que o admin usa).
  deleteMyAccount: (id) => api.delete("/user/" + id),
  createLocalization: (data) => api.post("/localization/", data),
  updateLocalization: (id, data) => api.put("/localization/" + id, data),
  deleteLocalization: (id) => api.delete("/localization/" + id),
  markNotificationRead: (id) => api.patch("/notification/" + id + "/read"),
  markAllNotificationsRead: () => api.patch("/notification/read-all"),
  deleteNotification: (id) => api.delete("/notification/" + id),

  //ROTAS DO ADMIN
  searchUsers: (name) => api.get("/user/search/" + encodeURIComponent(name)),
  deleteUser: (id) => api.delete("/user/" + id),

  //ROTAS DO ANÚNCIO DA EMPRESA
  updateProduct: (id, data) => api.put("/product/" + id, data),
  deleteProduct: (id) => api.delete("/product/" + id),

  //ROTAS DO CARTÃO
  getPaymentConfiguration: () => api.get("/payment/configuration"),
  // Cartões salvos na conta: só bandeira, final, titular, validade e função.
  getCards: () => api.get("/card/", { timeout: 15000 }),
  createCard: (data) => api.post("/card/create", data),
  // Só titular e validade podem mudar; o número nunca passa por aqui.
  updateCard: (id, data) => api.put("/card/" + id, data),
  deleteCard: (id) => api.delete("/card/" + id),
  // Mercado Pago é externo: usa o axios puro para não enviar o token da nossa API.
  // Número e CVV vão só para o Mercado Pago, nunca para o nosso backend.
  createCardToken: (publicKey, card) =>
    axios.post("https://api.mercadopago.com/v1/card_tokens?public_key=" + publicKey, card, { timeout: 20000 }),
  // O parâmetro é "bins" (plural): com "bin" o Mercado Pago ignora o número
  // e devolve todos os meios da conta.
  getCardPaymentMethods: (publicKey, bin) =>
    axios.get("https://api.mercadopago.com/v1/payment_methods/search?public_key=" + publicKey + "&bins=" + bin + "&marketplace=NONE&status=active", { timeout: 15000 }),

  //ROTAS DO PAINEL
  getConversations: () => api.get("/conversation/", { timeout: 15000 }),
  // Chat: devolve a conversa com esse usuário; cria se ainda não existir.
  createConversation: (otherUserId) => api.post("/conversation/", { otherUserId }),
  // Sai da conversa (ela some da sua lista).
  deleteConversation: (id) => api.delete("/conversation/" + id),
  // Disputas das negociações em que a conta participa.
  getDisputes: () => api.get("/dispute/", { timeout: 15000 }),
  getEnvironmentalImpacts: () => api.get("/environmental-impact/", { timeout: 15000 }),
  getImpactByShopping: (id) => api.get("/environmental-impact/shopping/" + id),
  getNotifications: () => api.get("/notification/", { timeout: 15000 }),
  getUsers: () => api.get("/user/", { timeout: 15000 }),

  //ROTAS DE LOCALIZAÇÃO
  getLocalizations: () => api.get("/localization/", { timeout: 15000 }),
  getCompaniesMap: () => api.get("/localization/companies", { timeout: 15000 }),
  // ViaCEP é externo: usa o axios puro para não enviar o token da nossa API.
  getAddressByZipCode: (zipCode) =>
    axios.get("https://viacep.com.br/ws/" + zipCode + "/json/", { timeout: 10000 }),
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


