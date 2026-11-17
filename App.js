import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Appearance, DevSettings } from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors, { applyTheme, theme } from "./src/theme/colors";
import { useEffect, useState } from "react";
import { createNavigationContainerRef } from "@react-navigation/native";
import * as Notifications from "expo-notifications";

const Stack = createNativeStackNavigator();

// Permite abrir uma tela a partir da notificação (fora de qualquer tela).
const navigationRef = createNavigationContainerRef();

// As telas são carregadas (require) só quando abrem pela primeira vez.
// Assim os estilos delas já nascem com as cores do tema escolhido.
const screens = [
  { name: "Home", getComponent: () => require("./src/pages/home/HomeScreen").default },
  { name: "Login", getComponent: () => require("./src/pages/loginScreens/LoginScreen").default },
  { name: "ForgotPasswordScreen", getComponent: () => require("./src/pages/loginScreens/ForgotPasswordScreen").default },
  { name: "ResetPasswordScreen", getComponent: () => require("./src/pages/loginScreens/ResetPasswordScreen").default },
  { name: "FirstAccessScreen", getComponent: () => require("./src/pages/loginScreens/FirstAccessScreen").default },
  { name: "ImpactScreen", getComponent: () => require("./src/pages/impactScreen/ImpactScreen").default },
  { name: "SelectUserType", getComponent: () => require("./src/pages/registerScreens/SelectUserTypeScreen").default },
  { name: "RegisterScreen", getComponent: () => require("./src/pages/registerScreens/RegisterScreen").default },
  { name: "RegisterComp1", getComponent: () => require("./src/pages/registerScreens/RegisterCompanyStep1").default },
  { name: "DashboardScreen", getComponent: () => require("./src/pages/dashboardScreen/DashboardScreen").default },
  { name: "RegisterAdmin", getComponent: () => require("./src/pages/registerScreens/RegisterAdminScreen").default },
  { name: "MapScreen", getComponent: () => require("./src/pages/mapScreen/MapScreen").default },
  { name: "ProfileScreen", getComponent: () => require("./src/pages/profileScreen/profileScreen").default },
  { name: "HistoryScreen", getComponent: () => require("./src/pages/historyScreen/HistoryScreen").default },
  { name: "ConversationsScreen", getComponent: () => require("./src/pages/chatScreen/ConversationsScreen").default },
  { name: "ChatScreen", getComponent: () => require("./src/pages/chatScreen/ChatScreen").default },
  { name: "NewMaterialScreen", getComponent: () => require("./src/pages/materialScreens/NewMaterialScreen").default },
  { name: "MaterialPublishedScreen", getComponent: () => require("./src/pages/materialScreens/MaterialPublishedScreen").default },
  { name: "MyAdvertisementsScreen", getComponent: () => require("./src/pages/materialScreens/MyAdvertisementsScreen").default },
  { name: "MarketplaceScreen", getComponent: () => require("./src/pages/marketplaceScreen/marketplaceScreen").default },
  { name: "MaterialDetailsScreen", getComponent: () => require("./src/pages/materialScreens/MaterialDetailsScreen").default },
  { name: "PaymentMethodScreen", getComponent: () => require("./src/pages/paymentScreens/PaymentMethodScreen").default },
  { name: "PaymentPixScreen", getComponent: () => require("./src/pages/paymentScreens/PaymentPixScreen").default },
  { name: "PaymentCardScreen", getComponent: () => require("./src/pages/paymentScreens/PaymentCardScreen").default },
  { name: "SavedCardsScreen", getComponent: () => require("./src/pages/paymentScreens/SavedCardsScreen").default },
  { name: "ReservationConfirmedScreen", getComponent: () => require("./src/pages/paymentScreens/ReservationConfirmedScreen").default },
  { name: "PersonalDataScreen", getComponent: () => require("./src/pages/profileScreen/PersonalDataScreen").default },
  { name: "AddressScreen", getComponent: () => require("./src/pages/profileScreen/AddressScreen").default },
  { name: "SecurityScreen", getComponent: () => require("./src/pages/profileScreen/SecurityScreen").default },
  { name: "NotificationsScreen", getComponent: () => require("./src/pages/profileScreen/NotificationsScreen").default },
  { name: "AppearanceScreen", getComponent: () => require("./src/pages/profileScreen/AppearanceScreen").default },
  { name: "ReservationRequestsScreen", getComponent: () => require("./src/pages/reservationScreens/ReservationRequestsScreen").default },
  { name: "AdvertisementDetailsScreen", getComponent: () => require("./src/pages/materialScreens/AdvertisementDetailsScreen").default },
  { name: "AdminUsersScreen", getComponent: () => require("./src/pages/adminScreens/AdminUsersScreen").default },
  { name: "AdminAdvertisementsScreen", getComponent: () => require("./src/pages/adminScreens/AdminAdvertisementsScreen").default },
  { name: "AdminLogsScreen", getComponent: () => require("./src/pages/adminScreens/AdminLogsScreen").default },
  { name: "DisputesScreen", getComponent: () => require("./src/pages/disputeScreen/DisputesScreen").default },
  { name: "LegalScreen", getComponent: () => require("./src/pages/legalScreens/LegalScreen").default },
  { name: "AboutScreen", getComponent: () => require("./src/pages/legalScreens/AboutScreen").default },
];

export default function App() {
  // Só abre as telas depois de aplicar o tema salvo.
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [initialRoute, setInitialRoute] = useState("Home");

  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem("@theme");
        applyTheme(savedTheme || "automatico");

        // Recarregou por causa do tema: volta para a tela de onde saiu (se estiver logado).
        const reloadRoute = await AsyncStorage.getItem("@themeReload");
        const token = await AsyncStorage.getItem("@token");

        if (reloadRoute) {
          await AsyncStorage.removeItem("@themeReload");

          if (token) {
            setInitialRoute(reloadRoute);
          }
        }
      } catch (e) {
        console.log("Erro ao carregar tema:", e?.message);
        applyTheme("automatico");
      } finally {
        setThemeLoaded(true);
      }
    }
    loadTheme();
  }, []);

  // No automático, se o celular trocar entre claro e escuro, recarrega o app.
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const next = colorScheme === "dark" ? "escuro" : "claro";

      if (theme.choice === "automatico" && next !== theme.name) {
        AsyncStorage.setItem("@themeReload", "DashboardScreen")
          .finally(() => DevSettings.reload());
      }
    });

    return () => subscription.remove();
  }, []);

  // Tocou na notificação de mensagem nova: abre a conversa.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const conversationId = response.notification.request.content.data?.conversationId;

      if (conversationId && navigationRef.isReady()) {
        navigationRef.navigate("ChatScreen", { conversationId });
      }
    });

    return () => subscription.remove();
  }, []);

  if (!themeLoaded) {
    return null;
  }

  return (
  <SafeAreaProvider>
  <StatusBar style={theme.name === "escuro" ? "light" : "dark"}/>
  <NavigationContainer ref={navigationRef}>
    <Stack.Navigator screenOptions={{
      headerShown: false,
      animation: "fade",
      animationDuration: 220,
      contentStyle: { backgroundColor: colors.background },
    }} initialRouteName={initialRoute}>
      {screens.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          getComponent={screen.getComponent}
        />
      ))}
    </Stack.Navigator>
  </NavigationContainer>
  </SafeAreaProvider>
  );
}
