import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/pages/home/HomeScreen";
import LoginScreen from "./src/pages/loginScreens/LoginScreen";
import SelectUserTypeScreen from "./src/pages/registerScreens/SelectUserTypeScreen";
import RegisterScreen from "./src/pages/registerScreens/RegisterScreen";
import RegisterCompanyScreenStep1 from "./src/pages/registerScreens/RegisterCompanyStep1";
import DashboardScreen from "./src/pages/dashboardScreen/DashboardScreen";
import RegisterAdminScreen from "./src/pages/registerScreens/RegisterAdminScreen";

export default function App() {

  const Stack = createNativeStackNavigator();

  return (
   <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen}/>
      <Stack.Screen name="Login" component={LoginScreen}/>
      <Stack.Screen name="SelectUserType" component={SelectUserTypeScreen}/>
      <Stack.Screen name="RegisterScreen" component={RegisterScreen}/>
      <Stack.Screen name="RegisterComp1" component={RegisterCompanyScreenStep1}/>
      <Stack.Screen name="DashboardScreen" component={DashboardScreen}/>
      <Stack.Screen name="RegisterAdmin" component={RegisterAdminScreen}/>
    </Stack.Navigator>
   </NavigationContainer>
  );
}