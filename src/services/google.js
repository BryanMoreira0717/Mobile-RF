import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

// Client "Web" do Google Cloud: o mesmo do backend (GOOGLE_CLIENT_ID) e do site.
// O token do Google sai com esse client e o backend só aceita esse.
export const GOOGLE_WEB_CLIENT_ID = "364197487785-oijp7fnume85ekstufr50akvg309gmff.apps.googleusercontent.com";

// O Google Sign-In usa código nativo: não existe no Expo Go nem na web,
// só no app instalado (build do EAS).
let GoogleSignin = null;
if (Platform.OS !== "web" && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  try {
    GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  } catch (error) {
    console.log("Google Sign-In indisponível:", error.message);
    GoogleSignin = null;
  }
}

export const googleDisponivel = !!GoogleSignin;

// Abre a escolha de conta do Google e devolve o idToken (null se a pessoa cancelar).
export async function pegarTokenGoogle() {
  if (!GoogleSignin) {
    throw new Error("Entrar com Google funciona só no app instalado.");
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Sai da conta anterior para sempre mostrar a escolha de conta.
  try {
    await GoogleSignin.signOut();
  } catch (error) {}
  const response = await GoogleSignin.signIn();
  if (response.type !== "success") return null;
  return response.data.idToken;
}
