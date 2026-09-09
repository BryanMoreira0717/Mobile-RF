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
  Image,
  Modal,
  ActivityIndicator
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
import api from "../../services/axios";

export default function RegisterCompanyScreenStep1({ navigation }) {
  const [user, setUser] = useState({ name: "", email: "", cnpj:"", password:"", cellphone:"", birthday:"", photo: null, cpf: "", zip_code: "", street: "", number: "", neighborhood: "", state: "", city: ""});
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, type: "success", title: "", message: "" });
  const [verifyCode, setVerifyCode] = useState({id: null, code: null})

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

  function nextStep() {
    setStep(step + 1)
  }

  function previousStep() {
    setStep(step - 1)
  }

  async function verifyAccount() {
    try {
      const response = await api.verifyCode(verifyCode)
      Alert.alert("Sucesso", String(response.data?.message || "Conta verificada!"))
      navigation.navigate("Home")
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      console.log("Erro ao verificar conta:", error.response?.data || error.message)
      Alert.alert("Erro", String(serverMessage || error.message || "Não foi possível verificar o código."))
    }
  }

  function onChangeVerifyCode(name, value) {
    setVerifyCode({ ...verifyCode, [name]: value });
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
      if (!user.state) {
        setCities([]);
        return;
      }
      try {
        setLoadingCities(true);
        setCities([]);
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${user.state}/municipios?orderBy=nome`
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
  }, [user.state]);

  // 3. Ao trocar de estado, limpa a cidade selecionada
  function handleSelectState(uf) {
    setUser({ ...user, state: uf, city: "" });
  }

  function closeFeedback() {
    const wasSuccess = feedback.type === "success";
    setFeedback((prev) => ({ ...prev, visible: false }));
    if (wasSuccess) {
      nextStep()
    }
  }

  async function registerCompany(){
    // Validação simples dos campos da tela
    if (!user.name.trim() || !user.email.trim() || !user.cnpj.trim() || !user.password.trim()) {
      setFeedback({
        visible: true,
        type: "error",
        title: "Faltam informações",
        message: "Preencha nome, e-mail, CNPJ e senha da empresa para continuar.",
      });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("cnpj", user.cnpj);
      formData.append("cpf", user.cpf);
      formData.append("cellphone", user.cellphone);
      formData.append("birthday", user.birthday);
      formData.append("password", user.password);
      formData.append("zip_code", user.zip_code);
      formData.append("street", user.street);
      formData.append("number", user.number);
      formData.append("neighborhood", user.neighborhood);
      formData.append("state", user.state);
      formData.append("city", user.city);

      if (user.photo?.uri) {
        const fileName = user.photo.fileName || user.photo.uri.split("/").pop() || "photo.jpg";
        formData.append("photo", {
          uri: user.photo.uri,
          name: fileName,
          type: user.photo.type || "image/jpeg",
        });
      }

      const response = await api.registerCompany(formData);
      verifyCode.id = response.data.id

      setFeedback({
        visible: true,
        type: "success",
        title: "Empresa cadastrada!",
        message: response.data?.message || "Cadastro realizado com sucesso. Bem-vindo!",
      });
    } catch (error) {
      const serverMessage = error.response?.data?.error;
      console.log("Erro ao cadastrar empresa:", error.response?.data || error.message);
      setFeedback({
        visible: true,
        type: "error",
        title: "Não foi possível cadastrar",
        message: serverMessage || "Verifique os dados e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
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
                value={user.cnpj}
                onChangeText={(value) => onChange("cnpj", value)}
              />

              <TextInput
                style={styles.input}
                autoCapitalize="none"
                placeholder="CPF - Responsável Legal: "
                keyboardType="numeric"
                maxLength={11}
                placeholderTextColor={colors.textTertiary}
                value={user.cpf}
                onChangeText={(value) => onChange("cpf", value)}
              />

              <TextInput
                style={styles.input}
                autoCapitalize="none"
                placeholder="Telefone: "
                keyboardType="numeric"
                maxLength={11}
                placeholderTextColor={colors.textTertiary}
                value={user.cellphone}
                onChangeText={(value) => onChange("cellphone", value)}
              />

              <TextInput
                style={styles.input}
                autoCapitalize="none"
                placeholder="Aniversário: "
                maxLength={10}
                placeholderTextColor={colors.textTertiary}
                value={user.birthday}
                onChangeText={(value) => onChange("birthday", value)}
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
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
                value={user.zip_code}
                onChangeText={(value) => onChange("zip_code", value)}
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
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                  value={user.number}
                  onChangeText={(value) => onChange("number", value)}
                  />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Bairro: "
                autoCapitalize="none"
                maxLength={255}
                placeholderTextColor={colors.textTertiary}
                value={user.neighborhood}
                onChangeText={(value) => onChange("neighborhood", value)}
              />

              <View style={[{width:"100%"}, styles.viewStateCity]}>
                <View style={styles.inputState}>
                  <Picker
                    selectedValue={user.state}
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
                    selectedValue={user.city}
                    onValueChange={(value) => onChange("city", value)}
                    enabled={!!user.state && !loadingCities}
                    style={styles.picker}
                    dropdownIconColor={colors.textTertiary}
                  >
                    <Picker.Item
                      label={
                        !user.state
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
              <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>CNPJ da empresa: </Text>{user.cnpj}</Text>
              <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>CPF do Responsável: </Text>{user.cpf}</Text>
              <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Telefone: </Text>{user.cellphone}</Text>
              <Text style={styles.textInformation}><Text style={styles.textInformationEmphasis}>Data de Criação: </Text>{user.birthday}</Text>
            </View>
            <View style={styles.viewInformation}> 
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>CEP: </Text>{user.zip_code}</Text>
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>Logradouro: </Text>{user.street}</Text>
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>Número: </Text>{user.number}</Text>
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>Bairro: </Text>{user.neighborhood}</Text>
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>Estado: </Text>{user.state}</Text>
              <Text style={styles.textInformationAdress}><Text style={styles.textInformationEmphasis}>Cidade: </Text>{user.city}</Text>
            </View>


          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={registerCompany}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Verifiquei, Registrar-me</Text>
            )}
          </TouchableOpacity>
          <Text style={{marginTop:5, alignSelf:"center", fontFamily:fonts.regular, fontSize:15, color:colors.primary}} onPress={() => previousStep()}>Voltar</Text>
        </View>
        )}

          <Modal
            visible={feedback.visible}
            transparent
            animationType="fade"
            onRequestClose={closeFeedback}
            >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View
                  style={[
                    styles.modalIconCircle,
                    feedback.type === "success" ? styles.modalIconSuccess : styles.modalIconError,
                  ]}
                  >
                  <MaterialCommunityIcons
                    name={feedback.type === "success" ? "check-circle" : "alert-circle"}
                    size={44}
                    color={feedback.type === "success" ? "#10b981" : "#ef4444"}
                    />
                </View>
                <Text style={styles.modalTitle}>{feedback.title}</Text>
                <Text style={styles.modalMessage}>{feedback.message}</Text>
                <TouchableOpacity style={styles.modalButton} onPress={closeFeedback}>
                  <Text style={styles.modalButtonText}>
                    {feedback.type === "success" ? "Ir para o login" : "Entendi"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>       
          </Modal>
          {step === 4 && (
            <View style={{width:"100%", height:"100%"}}>
            <Text style={styles.textProgressBar}>Passo 3 de 3</Text>
            <View style={styles.progressBar}/>
            <View style={styles.progressBarActive3}/>
            <Text style={styles.title}>Verifique sua conta</Text>
            <Text style={styles.subtitle}>Verifique seu email e digite o código abaixo</Text>
            <View style={styles.formView}>
              <TextInput
                style={styles.input}
                placeholder="Código de Verificação (6 Dígitos)"
                autoCapitalize="none"
                maxLength={6}
                placeholderTextColor={colors.textTertiary}
                value={verifyCode.code}
                onChangeText={(value) => onChangeVerifyCode("code", value)}
              />

              <TouchableOpacity style={styles.button}  onPress={()=>verifyAccount()}>
                <Text style={styles.buttonText}>Finalizar Cadastro</Text>
              </TouchableOpacity>
            </View>
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
        marginTop: "23%",
        backgroundColor:colors.primary,
        position:"absolute",
        width:"30%",
        height:20,
        borderRadius:20,
        marginLeft:"5%"
    },
    progressBarActive2:{
      marginTop: "23%",
      backgroundColor:colors.primary,
      position:"absolute",
      width:"60%",
      height:20,
      borderRadius:20,
      marginLeft:"5%"
    },
    progressBarActive3:{
      marginTop: "23%",
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
      paddingHorizontal: 16,
      paddingVertical: 22,
      backgroundColor: colors.white,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    title:{
      alignSelf:"center",
      marginTop:"10%",
      marginBottom:"-7%",
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
        marginTop:"2%",
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      backgroundColor: colors.white,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    modalIconCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    modalIconSuccess: {
      backgroundColor: "#ECFDF5",
    },
    modalIconError: {
      backgroundColor: "#FEF2F2",
    },
    modalTitle: {
      fontFamily: fonts.bold,
      fontSize: 19,
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: 8,
    },
    modalMessage: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },
    modalButton: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 15,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    modalButtonText: {
      color: colors.white,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
    subtitle: {
      alignSelf:"center",
      marginTop:"5%",
      fontFamily:fonts.regular,
      fontSize:18,
      color:colors.textDark
    },
});