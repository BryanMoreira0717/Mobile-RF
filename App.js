import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/pages/home/HomeScreen";

export default function App() {

  const Stack = createNativeStackNavigator();

  return (
   <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen}/>
    </Stack.Navigator>
   </NavigationContainer>
  );
}