import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert
} from "react-native";
import colors from "../../theme/colors";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen({ navigation }) {
  const [user, setUser] = useState({ name: "", email: "", doc_hmac: "", password:"", cellphone:"", photo:null});
  const [selectedImage, setSelectedImage] = useState(null);

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
          <Text style={styles.textProgressBar}>Passo 1 de 1</Text>
          <View style={styles.progressBar}/>
          <Text style={styles.title}>Registrar Usuário</Text>
          <View style={styles.formView}>
            <TextInput
              style={styles.input}
              placeholder="Nome de Usuário: "
              autoCapitalize="none"
              maxLength={255}
              placeholderTextColor={colors.textTertiary}
              value={user.name}
              onChangeText={(value) => onChange("name", value)}
            />

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              placeholder="Email: "
              placeholderTextColor={colors.textTertiary}
              value={user.email}
              onChangeText={(value) => onChange("email", value)}
            />

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              placeholder="CPF: "
              placeholderTextColor={colors.textTertiary}
              value={user.doc_hmac}
              onChangeText={(value) => onChange("doc_hmac", value)}
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

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              placeholder="Telefone: "
              placeholderTextColor={colors.textTertiary}
              value={user.cellphone}
              onChangeText={(value) => onChange("cellphone", value)}
            />

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

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Registrar Usuário</Text>
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
        backgroundColor:colors.primary,
        width:"90%",
        height:"2%",
        borderRadius:20,
        alignSelf:"center"
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
      marginTop:"5%",
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
    height:"20%",
    marginTop: 20,
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
  }
});