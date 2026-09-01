import {
  ImageBackground,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import colors from "../../theme/colors";

export default function HomeScreen({navigation}) {

  return(
  <View style={styles.header}> 

  </View>
  )
  
}

const styles = StyleSheet.create({
    header: {
        width:"100%",
        height:"60%",
        backgroundColor: colors.primaryLight,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
    }
})