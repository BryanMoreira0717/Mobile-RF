import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/pages/home/HomeScreen";
import LoginScreen from "./src/pages/loginScreens/LoginScreen";
import SelectUserTypeScreen from "./src/pages/registerScreens/SelectUserTypeScreen";
import RegisterScreen from "./src/pages/registerScreens/RegisterScreen";
import RegisterCompanyScreenStep1 from "./src/pages/registerScreens/RegisterCompany/RegisterCompanyStep1";
import RegisterCompanyScreenStep2 from "./src/pages/registerScreens/RegisterCompany/RegisterCompanyStep2";
import RegisterCompanyScreenStep3 from "./src/pages/registerScreens/RegisterCompany/RegisterCompanyStep3";

export default function App() {

  const Stack = createNativeStackNavigator();

  return (
   <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen}/>
      <Stack.Screen name="Login" component={LoginScreen}/>
      <Stack.Screen name="SelectUserType" component={SelectUserTypeScreen}/>
      <Stack.Screen name="RegisterScreen" component={RegisterScreen}/>
      <Stack.Screen name="RegisterComp1" component={RegisterCompanyScreenStep1}/>
      <Stack.Screen name="RegisterComp2" component={RegisterCompanyScreenStep2}/>
      <Stack.Screen name="RegisterComp3" component={RegisterCompanyScreenStep3}/>
    </Stack.Navigator>
   </NavigationContainer>
  );
}