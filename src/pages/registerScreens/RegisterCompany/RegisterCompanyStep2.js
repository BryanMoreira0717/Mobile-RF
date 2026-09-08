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

export default function RegisterCompanyScreenStep2({ navigation }) {
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

  const selectImageFromLibrary = async () => {
    // Solicita permissão para acessar a galeria
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (!permissionResult.granted) {
      alert("É necessária a permissão para acessar a galeria!");
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
  
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onChange("photo", {
        uri: asset.uri,
        fileName: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };
  
  // Função para abrir a Câmera
  const openCamera = async () => {
    // Solicita permissão para acessar a câmera
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  
    if (!permissionResult.granted) {
      alert("É necessária a permissão para acessar a câmera!");
      return;
    }
  
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
  
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onChange("photo", {
        uri: asset.uri,
        fileName: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };
  
    // Exibe o diálogo com as opções para o usuário
    const handleSelectPhotoOptions = () => {
      Alert.alert(
        "Selecione a foto de perfil",
        "Escolha de onde deseja pegar a imagem:",
        [
          { text: "Câmera", onPress: openCamera },
          { text: "Galeria", onPress: selectImageFromLibrary },
          { text: "Cancelar", style: "cancel" }
        ],
        { cancelable: true }
      );
    };

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
          <Text style={styles.textProgressBar}>Passo 2 de 3</Text>
          <View style={styles.progressBar}/>
          <View style={styles.progressBarActive}/>
          <View style={styles.formView}>

            <TouchableOpacity 
              style={styles.photoPickerInput} 
              onPress={handleSelectPhotoOptions}
              activeOpacity={0.7}
            >
              {user.photo ? (
                <View style={styles.selectedPhotoContainer}>
                  <Image source={{ uri: user.photo.uri }} style={styles.previewImage} />
                  <Text style={styles.photoSelectedText} numberOfLines={1}>
                    {user.photo.fileName}
                  </Text>
                  <MaterialCommunityIcons name="check-circle" size={20} color="green" />
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>
                    Selecione a foto de Usuário...
                  </Text>
                  <MaterialCommunityIcons name="camera-plus-outline" size={22} color={colors.textTertiary} />
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="CEP: "
              autoCapitalize="none"
              maxLength={8}
              placeholderTextColor={colors.textTertiary}
              value={user.name}
              onChangeText={(value) => onChange("name", value)}
            />

            <View style={[{width:"100%"}, styles.viewStreetNumber]}>
                <TextInput
                style={styles.inputStreet}
                placeholder="Logradouro: "
                autoCapitalize="none"
                maxLength={255}
                placeholderTextColor={colors.textTertiary}
                value={user.street}
                onChangeText={(value) => onChange("street", value)}
                />

                <TextInput
                style={styles.inputNumber}
                placeholder="Número: "
                autoCapitalize="none"
                maxLength={5}
                placeholderTextColor={colors.textTertiary}
                value={user.number}
                onChangeText={(value) => onChange("number", value)}
                />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Bairro: "
              autoCapitalize="none"
              maxLength={8}
              placeholderTextColor={colors.textTertiary}
              value={user.neighborhood}
              onChangeText={(value) => onChange("neighborhood", value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Complemento: "
              autoCapitalize="none"
              maxLength={8}
              placeholderTextColor={colors.textTertiary}
              value={user.complement}
              onChangeText={(value) => onChange("complement", value)}
            />

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("RegisterComp3")}>
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
        width:"60%",
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
      marginTop: 40,
      paddingHorizontal: 20,
      paddingVertical: 22,
      backgroundColor: colors.primary,
      borderRadius: 15,
      justifyContent:"center",
      alignItems:"center"
    },
    photoPickerInput: {
    width: "90%",
    height:"40%",
    marginTop: 70,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: "center",
  },
  placeholderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  placeholderText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  selectedPhotoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  photoSelectedText: {
    flex: 1,
    color: colors.textPrimary || "#000",
    fontSize: 14,
  },
  button: {
    width: "90%",
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: colors.primary,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center"
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  viewStreetNumber:{ 
    flex: 1,
    flexDirection:"row",
    alignItems:"center",
    gap:"5%"
  }
});