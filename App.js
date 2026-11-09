import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./src/pages/home/HomeScreen";
import LoginScreen from "./src/pages/loginScreens/LoginScreen";
import SelectUserTypeScreen from "./src/pages/registerScreens/SelectUserTypeScreen";
import RegisterScreen from "./src/pages/registerScreens/RegisterScreen";
import RegisterCompanyScreenStep1 from "./src/pages/registerScreens/RegisterCompanyStep1";
import DashboardScreen from "./src/pages/dashboardScreen/DashboardScreen";
import RegisterAdminScreen from "./src/pages/registerScreens/RegisterAdminScreen";
import MapScreen from "./src/pages/mapScreen/MapScreen";
import ProfileScreen from "./src/pages/profileScreen/profileScreen";
import HistoryScreen from "./src/pages/historyScreen/HistoryScreen";
import NewMaterialScreen from "./src/pages/materialScreens/NewMaterialScreen";
import MaterialPublishedScreen from "./src/pages/materialScreens/MaterialPublishedScreen";
import MyAdvertisementsScreen from "./src/pages/materialScreens/MyAdvertisementsScreen";
import MarketplaceScreen from "./src/pages/marketplaceScreen/marketplaceScreen";
import MaterialDetailsScreen from "./src/pages/materialScreens/MaterialDetailsScreen";
import PaymentMethodScreen from "./src/pages/paymentScreens/PaymentMethodScreen";
import PaymentPixScreen from "./src/pages/paymentScreens/PaymentPixScreen";
import PaymentCardScreen from "./src/pages/paymentScreens/PaymentCardScreen";
import ReservationConfirmedScreen from "./src/pages/paymentScreens/ReservationConfirmedScreen";
import PersonalDataScreen from "./src/pages/profileScreen/PersonalDataScreen";
import AddressScreen from "./src/pages/profileScreen/AddressScreen";
import SecurityScreen from "./src/pages/profileScreen/SecurityScreen";
import NotificationsScreen from "./src/pages/profileScreen/NotificationsScreen";
import ReservationRequestsScreen from "./src/pages/reservationScreens/ReservationRequestsScreen";
import AdvertisementDetailsScreen from "./src/pages/materialScreens/AdvertisementDetailsScreen";
import AdminUsersScreen from "./src/pages/adminScreens/AdminUsersScreen";
import AdminAdvertisementsScreen from "./src/pages/adminScreens/AdminAdvertisementsScreen";
import colors from "./src/theme/colors";

const Stack = createNativeStackNavigator();

export default function App() {


  return (
  <SafeAreaProvider>
  <NavigationContainer>
    <Stack.Navigator screenOptions={{
      headerShown: false,
      animation: "fade",
      animationDuration: 220,
      contentStyle: { backgroundColor: colors.background },
    }} initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen}/>
      <Stack.Screen name="Login" component={LoginScreen}/>
      <Stack.Screen name="SelectUserType" component={SelectUserTypeScreen}/>
      <Stack.Screen name="RegisterScreen" component={RegisterScreen}/>
      <Stack.Screen name="RegisterComp1" component={RegisterCompanyScreenStep1}/>
      <Stack.Screen name="DashboardScreen" component={DashboardScreen}/>
      <Stack.Screen name="RegisterAdmin" component={RegisterAdminScreen}/>
      <Stack.Screen name="MapScreen" component={MapScreen}/>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen}/>
      <Stack.Screen name="HistoryScreen" component={HistoryScreen}/>
      <Stack.Screen name="NewMaterialScreen" component={NewMaterialScreen}/>
      <Stack.Screen name="MaterialPublishedScreen" component={MaterialPublishedScreen}/>
      <Stack.Screen name="MyAdvertisementsScreen" component={MyAdvertisementsScreen}/>
      <Stack.Screen name="MarketplaceScreen" component={MarketplaceScreen}/>
      <Stack.Screen name="MaterialDetailsScreen" component={MaterialDetailsScreen}/>
      <Stack.Screen name="PaymentMethodScreen" component={PaymentMethodScreen}/>
      <Stack.Screen name="PaymentPixScreen" component={PaymentPixScreen}/>
      <Stack.Screen name="PaymentCardScreen" component={PaymentCardScreen}/>
      <Stack.Screen name="ReservationConfirmedScreen" component={ReservationConfirmedScreen}/>
      <Stack.Screen name="PersonalDataScreen" component={PersonalDataScreen}/>
      <Stack.Screen name="AddressScreen" component={AddressScreen}/>
      <Stack.Screen name="SecurityScreen" component={SecurityScreen}/>
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen}/>
      <Stack.Screen name="ReservationRequestsScreen" component={ReservationRequestsScreen}/>
      <Stack.Screen name="AdvertisementDetailsScreen" component={AdvertisementDetailsScreen}/>
      <Stack.Screen name="AdminUsersScreen" component={AdminUsersScreen}/>
      <Stack.Screen name="AdminAdvertisementsScreen" component={AdminAdvertisementsScreen}/>
    </Stack.Navigator>
  </NavigationContainer>
  </SafeAreaProvider>
  );
}