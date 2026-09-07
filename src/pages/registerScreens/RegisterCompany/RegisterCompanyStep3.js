import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image
} from "react-native";
import colors from "../../../theme/colors";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { fonts } from "../../../theme/fonts";
import { useState } from "react";
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RegisterCompanyScreenStep3({ navigation }) {
  const [user, setUser] = useState({ photo: null, cep: "", street: "", number: "", neighborhood: "", complement:""});

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  function onChange(name, value) {
    setUser({ ...user, [name]: value });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.background}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.textProgressBar}>Passo 3 de 3</Text>
          <View style={styles.progressBar}/>
          <View style={styles.progressBarActive}/>

          <View style={styles.viewInformation}>
            <Text style={{alignSelf:"center"}}>FOTO MANEIRA</Text>
          </View>
          <View style={styles.viewInformation}>
            <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Nome da empresa: </Text></Text>
            <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Email da empresa: </Text></Text>
            <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>CNPJ da empresa: </Text></Text>
            <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>CPF do Responsável: </Text></Text>
            <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Telefone: </Text></Text>
          </View>
          <View style={styles.viewInformation}> 
            <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>CEP: </Text></Text>
            <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Logradouro: </Text></Text>
            <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Número: </Text></Text>
            <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Bairro: </Text></Text>
            <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Complemento: </Text></Text>
          </View>


        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("RegisterComp3")}>
            <Text style={styles.buttonText}>Verifiquei, Registrar-me</Text>
        </TouchableOpacity>

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    progressBar: { 
        marginTop: "2%",
        backgroundColor:colors.textLight,
        width:"90%",
        height:20,
        borderRadius:20,
        alignSelf:"center"
    },
    progressBarActive:{
        marginTop: "22%",
        backgroundColor:colors.primary,
        position:"absolute",
        width:"90%",
        height:20,
        borderRadius:20,
        marginLeft:"5%"
    },
    textProgressBar: {
      marginTop:"15%",
      marginLeft:"5%",
      fontFamily:fonts.bold,
      color: colors.primary
    },
    formView:{
      flex: 1,
      justifyContent:"center",
      alignItems:"center",
      marginTop:"10%"
    },
    input: {
      width: "90%",
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 22,
      backgroundColor: colors.white,
      borderRadius: 15,
      borderWidth: 0.5,
      borderColor: colors.textSecondary,
    },
    inputStreet:{
      width: "55%",
      marginLeft:"5%",
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 22,
      backgroundColor: colors.white,
      borderRadius: 15,
      borderWidth: 0.5,
      borderColor: colors.textSecondary,
    },
    inputNumber:{
      width: "30%",
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 22,
      backgroundColor: colors.white,
      borderRadius: 15,
      borderWidth: 0.5,
      borderColor: colors.textSecondary,
    },
    title:{
      alignSelf:"center",
      marginTop:"10%",
      fontFamily:fonts.bold,
      fontSize:25,
      color:colors.textDark
    },
    button: {
      width: "90%",
      marginTop: 30,
      alignSelf:"center",
      paddingHorizontal: 20,
      paddingVertical: 22,
      backgroundColor: colors.primary,
      borderRadius: 15,
      justifyContent:"center",
      alignItems:"center"
    },
    buttonText: {
        color: colors.white,
        fontFamily: fonts.bold,
    },
    viewInformation:{
        height:190,
        width:"93%",
        borderRadius:20,
        borderWidth:1,
        borderColor:colors.primaryDark,
        alignSelf:"center",
        backgroundColor:colors.background,
        marginTop:20,
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    textInformation:{
        marginLeft:"5%",
        marginTop:"4%",
        fontFamily:fonts.regular,
        fontSize:14
    },
    textInformationEmphasis: {
        fontFamily:fonts.bold,
    }
});