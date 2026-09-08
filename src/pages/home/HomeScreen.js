import {
  ImageBackground,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Image,
  ScrollView 
} from "react-native";
import colors from "../../theme/colors";
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function HomeScreen({navigation}) {
  
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return(
  <View style={styles.header}> 
    <Text style={styles.title}>Transforme resíduos em oportunidades</Text>
    <Text style={styles.subtitle}>Conectamos as grandes indústrias calçadistas de Franca a artesãos, cooperativas e microempresas locais</Text>
    <View style={styles.viewButtons}>
      <TouchableOpacity style={styles.buttonRegister} onPress={() => navigation.navigate("SelectUserType")}>
        <Text style={styles.textButtonRegister}>Cadastre-se</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonLogin} onPress={() => navigation.navigate("Login")}> 
        <Text style={styles.textButtonLogin}>Faça Login</Text>
      </TouchableOpacity>
    </View>
    <Image
      source={require('../../../assets/images/product-example.png')}
      style={styles.imageExample}
    />

    <View style={styles.systemData}>
      <Text style={styles.dataText}><Text style={styles.emphasisText}>2.500+{'\n'}</Text>Ton desviadas {'\n'} de aterros</Text>
      <Text style={styles.dataText}><Text style={styles.emphasisText}>340+{'\n'}</Text>Empresas{'\n'} Parceiras</Text>
      <Text style={styles.dataText}><Text style={styles.emphasisText}>1.200+{'\n'}</Text>Negociações{'\n'} concluídas</Text>
    </View>

    <Text style={styles.titleTecnology}>Nossas Tecnologias:</Text>

    <View style={styles.ourTecnology}>
      <View>
        <MaterialCommunityIcons name="truck" size={38} color={colors.primary} style={styles.icons}/>
      </View>
        <Text style={styles.titleOurTecnology}>Logística Inteligente</Text>
        <Text style={styles.subtitleOurTecnology}>Simplificação no transporte e coleta local</Text>
    </View>
    <View style={styles.ourTecnology}>
      <View>
        <MaterialCommunityIcons name="leaf" size={38} color={colors.primary} style={styles.icons}/>
      </View>
        <Text style={styles.titleOurTecnology}>Indicadores Verdes</Text>
        <Text style={styles.subtitleOurTecnology}>Monitore o volume de CO₂ evitado em Franca</Text>
    </View>
  </View>
  )
  
}

const styles = StyleSheet.create({
    header: {
      width:"100%",
      height:"60%",
      backgroundColor: colors.primaryLight,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
    },
    title: {
      marginTop: "20%",
      marginLeft: "8%",
      fontSize: 24,
      fontFamily: fonts.bold,
      color: colors.primaryDark
    },
    subtitle: {
      marginTop: "3%",
      marginLeft: "8%",
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textPrimary
    },
    viewButtons: {
      display: "flex",
      flexDirection:"row",
      justifyContent:"space-between",
      marginTop: "10%",
      marginHorizontal:"8%",
      height:"50%"
    },
    buttonRegister: {
      backgroundColor:colors.primary,
      height:"20%",
      width:"48%",
      alignItems:"center",
      justifyContent:"center",
      borderRadius:"10%",
    },
    buttonLogin: {
      backgroundColor:colors.white,
      height:"20%",
      width:"48%",
      alignItems:"center",
      justifyContent:"center",
      borderRadius:"10%",
      borderWidth:1,
      borderColor:colors.primary
    },
    textButtonLogin: {
      fontFamily: fonts.semiBold,
      color: colors.primary
    },
    textButtonRegister: {
      fontFamily: fonts.semiBold,
      color: colors.white
    },
    imageExample: {
      width:"90%",
      height:"37%",
      alignSelf:"center",
      marginTop:"-47%",
      borderRadius:"10%"
    },
    systemData: {
      width:"100%",
      backgroundColor:colors.primaryDark,
      height:"20%",
      marginTop: "5%",
      display:"flex",
      flexDirection:"row",
      justifyContent:"space-between",
      alignItems:"center"
    },
    emphasisText: {
      fontFamily:fonts.bold,
      color: colors.primary,
      fontSize:17
    },
    dataText: {
      fontFamily:fonts.regular,
      color: colors.white,   
      marginLeft:"5%",
      marginRight:"5%"
    },
    titleTecnology: {
      marginTop: "3%",
      marginLeft: "8%",
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.primaryDark     
    },
    ourTecnology: {
      width:"80%",
      marginHorizontal:"8%",
      marginVertical:"2%",
      backgroundColor:colors.white,
      padding:"6%",
      borderRadius:"7%"
    },
    titleOurTecnology: {
      marginLeft:"20%",
      fontFamily:fonts.bold
    },
    subtitleOurTecnology: {
      marginLeft:"20%",
      fontFamily:fonts.regular,
      fontSize:10
    },
    icons: {
      position:"absolute",
    }
})