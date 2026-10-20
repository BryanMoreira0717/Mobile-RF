import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, Image, Alert, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../theme/colors";
import { useFonts } from "expo-font";
import { Manrope_400Regular, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";
import * as ImagePicker from 'expo-image-picker';
import { Picker } from "@react-native-picker/picker";
import api from "../../services/axios";
import NavBar from "../../components/NavBar";
export default function RegisterAdminScreen({
  navigation
}) {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    cellphone: "",
    birthday: "",
    photo: null,
    cpf: "",
    zip_code: "",
    street: "",
    number: "",
    neighborhood: "",
    state: "",
    city: ""
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    visible: false,
    type: "success",
    title: "",
    message: ""
  });
  const [verifyCode, setVerifyCode] = useState({
    id: null,
    code: ""
  });
  const scrollRef = useRef(null);

  // --- IBGE: estados + municipios ---
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold
  });
  function onChange(name, value) {
    setUser(prev => ({
      ...prev,
      [name]: value
    }));
  }
  function onChangeVerifyCode(name, value) {
    setVerifyCode(prev => ({
      ...prev,
      [name]: value
    }));
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
      quality: 0.8
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onChange("photo", {
        uri: asset.uri,
        fileName: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg'
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
      quality: 0.8
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onChange("photo", {
        uri: asset.uri,
        fileName: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg'
      });
    }
  };

  // Exibe o diálogo com as opções para o usuário
  const handleSelectPhotoOptions = () => {
    Alert.alert("Selecione a foto de perfil", "Escolha de onde deseja pegar a imagem:", [{
      text: "Câmera",
      onPress: openCamera
    }, {
      text: "Galeria",
      onPress: selectImageFromLibrary
    }, {
      text: "Cancelar",
      style: "cancel"
    }], {
      cancelable: true
    });
  };

  // 1. Busca os 27 UFs (26 estados + DF) uma vez, ao montar a tela
  useEffect(() => {
    async function loadStates() {
      try {
        setLoadingStates(true);
        const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
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
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${user.state}/municipios?orderBy=nome`);
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
    setUser(prev => ({
      ...prev,
      state: uf,
      city: ""
    }));
  }
  function nextStep() {
    setStep(prev => Math.min(prev + 1, 3));
  }
  function previousStep() {
    setStep(prev => Math.max(prev - 1, 1));
  }
  function closeFeedback() {
    const wasSuccess = feedback.type === "success";
    setFeedback(prev => ({
      ...prev,
      visible: false
    }));
    if (wasSuccess) {
      nextStep();
    }
  }
  async function registerAdmin() {
    if (!user.name.trim() || !user.email.trim() || !user.cpf.trim() || !user.password.trim()) {
      setFeedback({
        visible: true,
        type: "error",
        title: "Faltam informações",
        message: "Preencha nome, e-mail, CPF e senha para continuar."
      });
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("cpf", user.cpf);
      formData.append("password", user.password);
      formData.append("cellphone", user.cellphone);
      formData.append("birthday", user.birthday);
      formData.append("zip_code", user.zip_code);
      formData.append("street", user.street);
      formData.append("number", user.number);
      formData.append("neighborhood", user.neighborhood);
      formData.append("state", user.state);
      formData.append("city", user.city);
      console.log(user);
      if (user.photo?.uri) {
        const fileName = user.photo.fileName || user.photo.uri.split("/").pop() || "photo.jpg";
        formData.append("photo", {
          uri: user.photo.uri,
          name: fileName,
          type: user.photo.type || "image/jpeg"
        });
      }
      const response = await api.registerAdmin(formData);
      setVerifyCode(prev => ({
        ...prev,
        id: response.data.id
      }));
      setFeedback({
        visible: true,
        type: "success",
        title: "Conta criada!",
        message: response.data?.message || "Cadastro de Admin realizado com sucesso. Verifique sua conta!"
      });
    } catch (error) {
      const serverMessage = error.response?.data?.error;
      console.log("Erro ao cadastrar usuário:", error.response?.data || error.message);
      setFeedback({
        visible: true,
        type: "error",
        title: "Não foi possível cadastrar",
        message: serverMessage || "Verifique os dados e tente novamente."
      });
    } finally {
      setLoading(false);
    }
  }
  async function verifyAccount() {
    try {
      const response = await api.verifyCode(verifyCode);
      Alert.alert("Sucesso", String(response.data?.message || "Conta verificada!"));
      navigation.navigate("Home");
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      console.log("Erro ao verificar conta:", error.response?.data || error.message);
      Alert.alert("Erro", String(serverMessage || error.message || "Não foi possível verificar o código."));
    }
  }
  useEffect(() => {
    if (!fontsLoaded) return;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: 0,
        animated: false
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [step, fontsLoaded]);
  if (!fontsLoaded) return null;
  return <SafeAreaView style={styles.screen}>
    <KeyboardAvoidingView style={{
      flex: 1
    }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{
          flex: 1
        }}>
          <ScrollView ref={scrollRef} style={styles.scroll} keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.stepHeader}>
              <Text style={styles.textProgressBar}>Passo {step} de 3</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  width: `${step / 3 * 100}%`
                }]} />
              </View>
              <Text style={styles.title}>{["Registrar administrador", "Seu endereço", "Verifique sua conta"][step - 1]}</Text>
              <Text style={styles.subtitle}>{["Preencha seus dados para criar sua conta.", "Informe onde você está para conectar oportunidades próximas.", "Digite o código enviado para seu e-mail."][step - 1]}</Text>
            </View>

          {step === 1 && <View style={styles.step}>
              <View style={styles.formView}>
                <TextInput style={styles.input} placeholder="Nome de Usuário: " autoCapitalize="none" maxLength={255} placeholderTextColor={colors.textTertiary} value={user.name} onChangeText={value => onChange("name", value)} />

                <TextInput style={styles.input} autoCapitalize="none" placeholder="Email: " maxLength={255} placeholderTextColor={colors.textTertiary} value={user.email} onChangeText={value => onChange("email", value)} />

                <TextInput style={styles.input} autoCapitalize="none" placeholder="CPF: " maxLength={11} keyboardType="numeric" placeholderTextColor={colors.textTertiary} value={user.cpf} onChangeText={value => onChange("cpf", value)} />

                <TextInput style={styles.input} autoCapitalize="none" placeholder="Senha: " secureTextEntry placeholderTextColor={colors.textTertiary} value={user.password} onChangeText={value => onChange("password", value)} />

                <TextInput style={styles.input} autoCapitalize="none" placeholder="Data de nascimento: " placeholderTextColor={colors.textTertiary} value={user.birthday} onChangeText={value => onChange("birthday", value)} />

                <TextInput style={styles.input} autoCapitalize="none" placeholder="Telefone: " keyboardType="numeric" maxLength={11} placeholderTextColor={colors.textTertiary} value={user.cellphone} onChangeText={value => onChange("cellphone", value)} />

                <TouchableOpacity style={styles.photoPickerInput} onPress={handleSelectPhotoOptions} activeOpacity={0.7}>
                  {user.photo ? <View style={styles.selectedPhotoContainer}>
                      <Image source={{
                      uri: user.photo.uri
                    }} style={styles.previewImage} />
                      <Text style={styles.photoSelectedText} numberOfLines={1}>
                        {user.photo.fileName}
                      </Text>
                      <MaterialCommunityIcons name="check-circle" size={20} color="green" />
                    </View> : <View style={styles.placeholderContainer}>
                      <Text style={styles.placeholderText}>
                        Selecione sua foto de perfil...
                      </Text>
                      <MaterialCommunityIcons name="camera-plus-outline" size={22} color={colors.textTertiary} />
                    </View>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => nextStep()}>
                  <Text style={styles.buttonText}>Próximo Passo</Text>
                </TouchableOpacity>
              </View>
            </View>}
          {step === 2 && <View>
              <View style={styles.formView}>

                <TextInput style={styles.input} placeholder="CEP: " autoCapitalize="none" keyboardType="numeric" maxLength={8} placeholderTextColor={colors.textTertiary} value={user.zip_code} onChangeText={value => onChange("zip_code", value)} />

                <View style={[{
                  width: "100%"
                }, styles.viewStreetNumber]}>
                    <TextInput style={styles.inputStreet} placeholder="Logradouro: " autoCapitalize="none" maxLength={255} placeholderTextColor={colors.textTertiary} value={user.street} onChangeText={value => onChange("street", value)} />

                    <TextInput style={styles.inputNumber} placeholder="Número: " autoCapitalize="none" maxLength={5} keyboardType="numeric" placeholderTextColor={colors.textTertiary} value={user.number} onChangeText={value => onChange("number", value)} />
                </View>

                <TextInput style={styles.input} placeholder="Bairro: " autoCapitalize="none" maxLength={255} placeholderTextColor={colors.textTertiary} value={user.neighborhood} onChangeText={value => onChange("neighborhood", value)} />

                <View style={[{
                  width: "100%"
                }, styles.viewStateCity]}>
                  <View style={styles.inputState}>
                    <Text style={styles.fieldLabel}>Estado</Text>
                    <Picker selectedValue={user.state} onValueChange={value => handleSelectState(value)} enabled={!loadingStates} style={styles.picker} itemStyle={styles.pickerItem} dropdownIconColor={colors.textTertiary}>
                      <Picker.Item label={loadingStates ? "Carregando..." : "Estado: "} value="" color={colors.textTertiary} />
                      {states.map(uf => <Picker.Item key={uf.id} label={`${uf.nome} (${uf.sigla})`} value={uf.sigla} />)}
                    </Picker>
                  </View>

                  <View style={styles.inputCity}>
                    <Text style={styles.fieldLabel}>Cidade</Text>
                    <Picker selectedValue={user.city} onValueChange={value => onChange("city", value)} enabled={!!user.state && !loadingCities} style={styles.picker} itemStyle={styles.pickerItem} dropdownIconColor={colors.textTertiary}>
                      <Picker.Item label={!user.state ? "Cidade: " : loadingCities ? "Carregando..." : "Cidade: "} value="" color={colors.textTertiary} />
                      {cities.map(city => <Picker.Item key={city.id} label={city.nome} value={city.nome} />)}
                    </Picker>
                  </View>
                </View>

                <TouchableOpacity style={[styles.button, loading && {
                  opacity: 0.7
                }]} onPress={registerAdmin} disabled={loading}>
                  {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Registrar-me</Text>}
                </TouchableOpacity>
                <Text style={styles.backLink} onPress={() => previousStep()}>Voltar</Text>
              </View>
            </View>}

            

            {step === 3 && <View style={styles.step}>
              <View style={styles.formView}>
                <TextInput style={styles.input} placeholder="Código de Verificação (6 Dígitos)" autoCapitalize="none" maxLength={6} placeholderTextColor={colors.textTertiary} keyboardType="number-pad" textContentType="oneTimeCode" value={verifyCode.code} onChangeText={value => onChangeVerifyCode("code", value)} />

                <TouchableOpacity style={styles.button} onPress={() => verifyAccount()}>
                  <Text style={styles.buttonText}>Finalizar Cadastro</Text>
                </TouchableOpacity>
              </View>
            </View>}
        </ScrollView>
          <Modal visible={feedback.visible} transparent animationType="fade" onRequestClose={closeFeedback}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={[styles.modalIconCircle, feedback.type === "success" ? styles.modalIconSuccess : styles.modalIconError]}>
                    <MaterialCommunityIcons name={feedback.type === "success" ? "check-circle" : "alert-circle"} size={44} color={feedback.type === "success" ? "#10b981" : "#ef4444"} />
                  </View>
                  <Text style={styles.modalTitle}>{feedback.title}</Text>
                  <Text style={styles.modalMessage}>{feedback.message}</Text>
                  <TouchableOpacity style={styles.modalButton} onPress={closeFeedback}>
                    <Text style={styles.modalButtonText}>
                      {feedback.type === "success" ? "Verificar minha conta" : "Entendi"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
        <NavBar estagio="visitante" ativo="inicio" onNavigate={() => navigation.navigate("Home")} />
        </View>
     </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
    </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 120
  },
  step: {
    width: "100%"
  },
  stepHeader: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 24
  },
  textProgressBar: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
    marginBottom: 10
  },
  progressBar: {
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: colors.primary
  },
  title: {
    marginTop: 20,
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.primaryDark
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary
  },
  formView: {
    width: "100%",
    alignItems: "center"
  },
  input: {
    width: "90%",
    minHeight: 56,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary
  },
  viewStreetNumber: {
    width: "90%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12
  },
  inputStreet: {
    flex: 2,
    minWidth: 0,
    minHeight: 56,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary
  },
  inputNumber: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary
  },
  viewStateCity: {
    width: "90%",
    alignSelf: "center"
  },
  fieldLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark
  },
  inputState: {
    width: "100%",
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden"
  },
  inputCity: {
    width: "100%",
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden"
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 180 : 56,
    color: colors.textPrimary
  },
  pickerItem: {
    height: 180,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textPrimary
  },
  photoPickerInput: {
    width: "90%",
    minHeight: 76,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderStyle: "dashed",
    justifyContent: "center"
  },
  placeholderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  placeholderText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary
  },
  selectedPhotoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  previewImage: {
    width: 48,
    height: 48,
    borderRadius: 24
  },
  photoSelectedText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textPrimary
  },
  button: {
    width: "90%",
    alignSelf: "center",
    minHeight: 54,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: "center"
  },
  backLink: {
    alignSelf: "center",
    marginTop: 16,
    padding: 10,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryDark
  },
  viewInformation: {
    width: "90%",
    alignSelf: "center",
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white
  },
  textInformation: {
    marginBottom: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary
  },
  textInformationAdress: {
    marginBottom: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary
  },
  textInformationEmphasis: {
    fontFamily: fonts.bold,
    color: colors.primaryDark
  },
  imageFinal: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 12,
    resizeMode: "cover"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center"
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  modalIconSuccess: {
    backgroundColor: colors.primaryLight
  },
  modalIconError: {
    backgroundColor: "#FEF2F2"
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.primaryDark,
    textAlign: "center",
    marginBottom: 8
  },
  modalMessage: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24
  },
  modalButton: {
    width: "100%",
    minHeight: 52,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  modalButtonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: "center"
  }
});
