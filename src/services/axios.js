import axios from 'axios';

// Preencha com a URL base da sua API
const BASE_URL = 'http://192.168.1.146/api/reaproveitafranca';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sheets = {
  //ROTAS DE USUÁRIO
  registerUser:(user) => api.post("/user/create", user),
  registerCompany:(user) => api.post("/user/create/empresa", user),
  registerAdmin:(user) => api.post("/user/create/admin", user)
}

// Interceptor de request - preencha conforme necessario (ex: token auth)
// api.interceptors.request.use(
//   async (config) => {
//     // const token = await AsyncStorage.getItem('@token');
//     // if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// Interceptor de response - preencha conforme necessario (ex: refresh token, log de erro)
// api.interceptors.response.use(
//   (response) => response,
//   (error) => Promise.reject(error)
// );

export default sheets;
