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
import colors from "../../theme/colors";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { fonts } from "../../theme/fonts";
import { useState, useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { Picker } from "@react-native-picker/picker";

export default function RegisterCompanyScreenStep1({ navigation }) {
  const [user, setUser] = useState({ name: "", email: "", doc_hmac:"", password:"", cellphone:"", photo: null});
  const [ownerDoc, setOwnerDoc] = useState({cpf_owner: ""})
  const [address, setAdress] = useState({zip_code: "", street: "", number: "", neighborhood: "", state: "", city: ""});
  const [step, setStep] = useState(1)

  // --- IBGE: estados + municipios ---
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

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

  function onChangeOwnerDoc(name, value) {
    setOwnerDoc({ ...ownerDoc, [name]: value });
  }

  function onChangeAddress(name, value) {
    setAdress({ ...address, [name]: value });
  }

  function nextStep() {
    setStep(step + 1)
  }

  function previousStep() {
    setStep(step - 1)
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

  // 1. Busca os 27 UFs (26 estados + DF) uma vez, ao montar a tela
  useEffect(() => {
    async function loadStates() {
      try {
        setLoadingStates(true);
        const response = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
        );
        const data = await response.json();
        // data = [{ id, sigla: "SP", nome: "São Paulo", ... }, ...]
        setStates(data);
      } catch (error) {
        console.error("Erro ao buscar estados do IBGE:", error);
        Alert.alert("Erro", "Não foi possível carregar a lista de estados.");
      } finally {
        setLoadingStates(false);
      }
    }
    loadStates();
  }, []);

  // 2. Toda vez que o estado (sigla UF) mudar, busca os municípios dele
  useEffect(() => {
    async function loadCities() {
      if (!address.state) {
        setCities([]);
        return;
      }
      try {
        setLoadingCities(true);
        setCities([]);
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${address.state}/municipios?orderBy=nome`
        );
        const data = await response.json();
        // data = [{ id, nome: "Campinas", ... }, ...]
        setCities(data);
      } catch (error) {
        console.error("Erro ao buscar cidades do IBGE:", error);
        Alert.alert("Erro", "Não foi possível carregar a lista de cidades.");
      } finally {
        setLoadingCities(false);
      }
    }
    loadCities();
  }, [address.state]);

  // 3. Ao trocar de estado, limpa a cidade selecionada
  function handleSelectState(uf) {
    setAdress({ ...address, state: uf, city: "" });
  }

  useEffect(() => {

  }, [step])

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
        {step === 1 && (
          <View style={{width:"100%", height:"100%"}}>
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
                value={ownerDoc.cpf_owner}
                onChangeText={(value) => onChangeOwnerDoc("cpf_owner", value)}
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

              <TouchableOpacity style={styles.button} onPress={() => nextStep()}>
                <Text style={styles.buttonText}>Próximo Passo</Text>
              </TouchableOpacity>
              <Text style={{marginTop:20, fontFamily:fonts.regular, fontSize:15, color:colors.primary}} onPress={() => navigation.navigate("SelectUserType")}>Voltar</Text>
            </View>
          </View>
        )}
        {step === 2 && (
          <View>
            <Text style={styles.textProgressBar}>Passo 2 de 3</Text>
            <View style={styles.progressBar}/>
            <View style={styles.progressBarActive2}/>
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
                value={address.zip_code}
                onChangeText={(value) => onChangeAddress("zip_code", value)}
              />

              <View style={[{width:"100%"}, styles.viewStreetNumber]}>
                  <TextInput
                  style={styles.inputStreet}
                  placeholder="Logradouro: "
                  autoCapitalize="none"
                  maxLength={255}
                  placeholderTextColor={colors.textTertiary}
                  value={address.street}
                  onChangeText={(value) => onChangeAddress("street", value)}
                  />

                  <TextInput
                  style={styles.inputNumber}
                  placeholder="Número: "
                  autoCapitalize="none"
                  maxLength={5}
                  placeholderTextColor={colors.textTertiary}
                  value={address.number}
                  onChangeText={(value) => onChangeAddress("number", value)}
                  />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Bairro: "
                autoCapitalize="none"
                maxLength={8}
                placeholderTextColor={colors.textTertiary}
                value={address.neighborhood}
                onChangeText={(value) => onChangeAddress("neighborhood", value)}
              />

              <View style={[{width:"100%"}, styles.viewStateCity]}>
                <View style={styles.inputState}>
                  <Picker
                    selectedValue={address.state}
                    onValueChange={(value) => handleSelectState(value)}
                    enabled={!loadingStates}
                    style={styles.picker}
                    dropdownIconColor={colors.textTertiary}
                  >
                    <Picker.Item
                      label={loadingStates ? "Carregando..." : "Estado: "}
                      value=""
                      color={colors.textTertiary}
                    />
                    {states.map((uf) => (
                      <Picker.Item
                        key={uf.id}
                        label={`${uf.nome} (${uf.sigla})`}
                        value={uf.sigla}
                      />
                    ))}
                  </Picker>
                </View>

                <View style={styles.inputCity}>
                  <Picker
                    selectedValue={address.city}
                    onValueChange={(value) => onChangeAddress("city", value)}
                    enabled={!!address.state && !loadingCities}
                    style={styles.picker}
                    dropdownIconColor={colors.textTertiary}
                  >
                    <Picker.Item
                      label={
                        !address.state
                          ? "Cidade: "
                          : loadingCities
                            ? "Carregando..."
                            : "Cidade: "
                      }
                      value=""
                      color={colors.textTertiary}
                    />
                    {cities.map((city) => (
                      <Picker.Item
                        key={city.id}
                        label={city.nome}
                        value={city.nome}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <TouchableOpacity style={styles.button} onPress={() => nextStep()}>
                <Text style={styles.buttonText}>Próximo Passo</Text>
              </TouchableOpacity>
              <Text style={{marginTop:20, fontFamily:fonts.regular, fontSize:15, color:colors.primary}} onPress={() => previousStep()}>Voltar</Text>
            </View>
          </View>
        )}
        {step === 3 && (
          <View>
            <Text style={styles.textProgressBar}>Passo 3 de 3</Text>
            <View style={styles.progressBar}/>
            <View style={styles.progressBarActive3}/>

            <View style={styles.viewInformation}>
              {user.photo ? (
                <Image source={{ uri: user.photo.uri }} style={styles.imageFinal} />
              ) : (
                <Text style={styles.textInformation}>Nenhuma imagem anexada</Text>
              )}
            </View>
            <View style={styles.viewInformation}>
              <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Nome da empresa: </Text>{user.name}</Text>
              <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Email da empresa: </Text>{user.email}</Text>
              <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>CNPJ da empresa: </Text>{user.doc_hmac}</Text>
              <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>CPF do Responsável: </Text>{ownerDoc.cpf_owner}</Text>
              <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Telefone: </Text>{user.cellphone}</Text>
            </View>
            <View style={styles.viewInformation}> 
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>CEP: </Text>{address.zip_code}</Text>
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>Logradouro: </Text>{address.street}</Text>
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>Número: </Text>{address.number}</Text>
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>Bairro: </Text>{address.neighborhood}</Text>
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>Estado: </Text>{address.state}</Text>
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>Cidade: </Text>{address.city}</Text>
            </View>


          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("RegisterComp3")}>
              <Text style={styles.buttonText}>Verifiquei, Registrar-me</Text>
          </TouchableOpacity>
          <Text style={{marginTop:5, alignSelf:"center", fontFamily:fonts.regular, fontSize:15, color:colors.primary}} onPress={() => previousStep()}>Voltar</Text>
        </View>
        )}

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
    progressBarActive2:{
      marginTop: "22%",
      backgroundColor:colors.primary,
      position:"absolute",
      width:"60%",
      height:20,
      borderRadius:20,
      marginLeft:"5%"
    },
    progressBarActive3:{
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
      marginTop: 12,
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
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 22,
      backgroundColor: colors.primary,
      borderRadius: 15,
      justifyContent:"center",
      alignItems:"center",
      alignSelf:"center"
    },
    buttonText: {
      color: colors.white,
      fontFamily: fonts.bold,
    },
    photoPickerInput: {
      width: "90%",
      height:"25%",
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
  inputStreet:{
    width: "55%",
    marginLeft:"5%",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: colors.white,
    borderRadius: 15,
  },
  inputNumber:{
    width: "30%",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: colors.white,
    borderRadius: 15,
  },

  inputState:{
    width: "43%",
    marginLeft:"5%",
    height:140,
    marginTop: 20,
    paddingHorizontal: 4,
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: "center",
    overflow: "hidden",
  },
  inputCity:{
    width: "43%",
    height:140,
    marginTop: 20,
    paddingHorizontal: 4,
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: "center",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    marginTop:-100,
    height:150
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
  viewStreetNumber:{ 
    flex: 1,
    flexDirection:"row",
    alignItems:"center",
    gap:"5%"
  },

  viewStateCity:{ 
    flex: 1,
    flexDirection:"row",
    alignItems:"center",
    gap:"4%"
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
    textInformationAdress:{
        marginLeft:"5%",
        marginTop:"1.8%",
        fontFamily:fonts.regular,
        fontSize:14
    },
    textInformationEmphasis: {
        fontFamily:fonts.bold,
    },
    imageFinal: {
      width: "90%",
      height: 150,
      borderRadius: 15,
      alignSelf: "center",
      marginTop: 12,
      resizeMode: "cover",
    },
});