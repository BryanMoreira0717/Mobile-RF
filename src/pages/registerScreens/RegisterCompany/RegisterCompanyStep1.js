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
} from "react-native";
import colors from "../../../theme/colors";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { fonts } from "../../../theme/fonts";
import { useState } from "react";

export default function RegisterCompanyScreenStep1({ navigation }) {
  const [user, setUser] = useState({ name: "", email: "", doc_hmac:"", password:"", cellphone:"", cpf_owner:""});

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
          <Text style={styles.textProgressBar}>Passo 1 de 3</Text>
          <View style={styles.progressBar}/>
          <View style={styles.progressBarActive}/>
          <Text style={styles.title}>Registrar Empresa</Text>
          <View style={styles.formView}>
            <TextInput
              style={styles.input}
              placeholder="Nome da Empresa: "
              autoCapitalize="none"
              maxLength={255}
              placeholderTextColor={colors.textTertiary}
              value={user.name}
              onChangeText={(value) => onChange("name", value)}
            />

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              placeholder="Email da Empresa: "
              placeholderTextColor={colors.textTertiary}
              value={user.email}
              onChangeText={(value) => onChange("email", value)}
            />

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              placeholder="CNPJ da Empresa: "
              keyboardType="numeric"
              maxLength={14}
              placeholderTextColor={colors.textTertiary}
              value={user.doc_hmac}
              onChangeText={(value) => onChange("doc_hmac", value)}
            />

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              placeholder="CPF - Responsável Legal: "
              keyboardType="numeric"
              maxLength={11}
              placeholderTextColor={colors.textTertiary}
              value={user.cpf_owner}
              onChangeText={(value) => onChange("cpf_owner", value)}
            />

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              placeholder="Telefone: "
              placeholderTextColor={colors.textTertiary}
              value={user.cellphone}
              onChangeText={(value) => onChange("cellphone", value)}
            />

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              placeholder="Senha: "
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              value={user.password}
              onChangeText={(value) => onChange("password", value)}
            />

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("RegisterComp2")}>
              <Text style={styles.buttonText}>Próximo Passo</Text>
            </TouchableOpacity>
          </View>
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
        width:"30%",
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
      borderWidth: 1,
      borderColor: colors.borderLight,
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
      marginTop: 40,
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
    }
});