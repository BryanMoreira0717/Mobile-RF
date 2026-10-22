import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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

import colors from "./src/theme/colors";

const Stack = createNativeStackNavigator();

export default function App() {


  return (
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
    </Stack.Navigator>
   </NavigationContainer>
  );
}