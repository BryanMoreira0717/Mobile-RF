import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, Image, Alert, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../theme/colors";
import { useFonts } from "expo-font";
import { Manrope_400Regular, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { Gelasio_400Regular, Gelasio_400Regular_Italic, Gelasio_700Bold } from "@expo-google-fonts/gelasio";
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";
import * as ImagePicker from 'expo-image-picker';
import { Picker } from "@react-native-picker/picker";
import api from "../../services/axios";
import Brand from "../../components/Brand";
export default function RegisterAdminScreen({
  navigation
}) {
  // Sem senha: a API gera uma senha temporária e envia por e-mail ao novo admin.
  const [user, setUser] = useState({
    name: "",
    email: "",
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
  const scrollRef = useRef(null);

  // --- IBGE: estados + municipios ---
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Gelasio_400Regular,
    Gelasio_400Regular_Italic,
    Gelasio_700Bold
  });
  function onChange(name, value) {
    setUser(prev => ({
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

  // CEP completo (8 dígitos): preenche rua, bairro, estado e cidade pelo ViaCEP.
  async function handleZipCode(value) {
    const zipCode = value.replace(/D/g, "");
    onChange("zip_code", zipCode);
    if (zipCode.length !== 8) return;
    try {
      const response = await api.getAddressByZipCode(zipCode);
      if (response.data?.erro) {
        Alert.alert("CEP não encontrado", "Confira o CEP ou preencha o endereço manualmente.");
        return;
      }
      setUser(prev => ({
        ...prev,
        street: response.data.logradouro || prev.street,
        neighborhood: response.data.bairro || prev.neighborhood,
        state: response.data.uf || prev.state,
        city: response.data.localidade || prev.city
      }));
    } catch (error) {
      console.log("Erro ao buscar CEP:", error.message);
    }
  }

  // 3. Ao trocar de estado, limpa a cidade selecionada
  function handleSelectState(uf) {
    setUser(prev => ({
      ...prev,
      state: uf,
      city: ""
    }));
  }
  function nextStep() {
    setStep(prev => Math.min(prev + 1, 2));
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
    // Admin criado: volta para o painel.
    if (wasSuccess) {
      navigation.goBack();
    }
  }
  async function registerAdmin() {
    if (!user.name.trim() || !user.email.trim() || !user.cpf.trim() || !user.cellphone.trim() || !user.birthday.trim()) {
      setFeedback({
        visible: true,
        type: "error",
        title: "Faltam informações",
        message: "Preencha nome, e-mail, CPF, data de nascimento e telefone."
      });
      return;
    }
    if (!user.zip_code.trim() || !user.street.trim() || !user.number.trim() || !user.neighborhood.trim() || !user.state || !user.city) {
      setFeedback({
        visible: true,
        type: "error",
        title: "Faltam informações",
        message: "Preencha o endereço completo do administrador."
      });
      return;
    }
    try {
      setLoading(true);
      // A rota de admin recebe JSON (não lê FormData).
      const response = await api.registerAdmin({
        name: user.name.trim(),
        email: user.email.trim(),
        cpf: user.cpf,
        cellphone: user.cellphone,
        birthday: user.birthday,
        zip_code: user.zip_code,
        street: user.street,
        number: user.number,
        neighborhood: user.neighborhood,
        state: user.state,
        city: user.city
      });
      // A foto vai depois, pela rota de edição, com o id do novo admin.
      if (user.photo?.uri) {
        try {
          const formData = new FormData();
          const fileName = user.photo.fileName || user.photo.uri.split("/").pop() || "photo.jpg";
          formData.append("photo", {
            uri: user.photo.uri,
            name: fileName,
            type: user.photo.type || "image/jpeg"
          });
          await api.updateUserPhoto(response.data.id, formData);
        } catch (photoError) {
          console.log("Erro ao enviar foto do admin:", photoError.response?.data || photoError.message);
        }
      }
      setFeedback({
        visible: true,
        type: "success",
        title: "Admin cadastrado!",
        message: response.data?.message || "A senha temporária foi enviada para o e-mail do novo administrador."
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
              <View style={styles.brandRow}>
                <Brand />
              </View>
              <Text style={styles.eyebrow}>Faça parte do Reaproveita Franca</Text>
              <Text style={styles.title}>{["Registrar administrador", "Endereço do administrador"][step - 1]}</Text>
              <Text style={styles.subtitle}>{["Preencha os dados do novo administrador. A senha temporária vai para o e-mail dele.", "Informe o endereço do novo administrador."][step - 1]}</Text>
              <View style={styles.chip}>
                <MaterialCommunityIcons name="shield-account-outline" size={16} color={colors.primaryDark} />
                <Text style={styles.chipText}>Conta de administrador</Text>
              </View>

              {/* Etapas numeradas, como no cadastro do site */}
              <View style={styles.stepper}>
                {["Dados", "Endereço"].map((etapa, index) => (
                  <View key={etapa} style={styles.stepperItem}>
                    <View style={[styles.stepperNumber, index + 1 <= step && styles.stepperDone]}>
                      {index + 1 < step ? <MaterialCommunityIcons name="check" size={12} color={colors.white} /> : <Text style={[styles.stepperText, index + 1 === step && styles.stepperTextActive]}>0{index + 1}</Text>}
                    </View>
                    <Text style={[styles.stepperLabel, index + 1 === step && styles.stepperLabelActive]}>{etapa}</Text>
                  </View>
                ))}
              </View>
            </View>

          {step === 1 && <View style={styles.step}>
              <View style={styles.formView}>
                <Text style={styles.inputLabel}>Nome de usuário</Text>
                <TextInput style={styles.input} autoCapitalize="none" maxLength={255} placeholderTextColor={colors.textTertiary} value={user.name} onChangeText={value => onChange("name", value)} />

                <Text style={styles.inputLabel}>Email</Text>
                <TextInput style={styles.input} autoCapitalize="none" maxLength={255} placeholderTextColor={colors.textTertiary} value={user.email} onChangeText={value => onChange("email", value)} />

                <Text style={styles.inputLabel}>CPF</Text>
                <TextInput style={styles.input} autoCapitalize="none" maxLength={11} keyboardType="numeric" placeholderTextColor={colors.textTertiary} value={user.cpf} onChangeText={value => onChange("cpf", value)} />

                <Text style={styles.inputLabel}>Data de nascimento</Text>
                <TextInput style={styles.input} autoCapitalize="none" placeholder="AAAA-MM-DD" placeholderTextColor={colors.textTertiary} value={user.birthday} onChangeText={value => onChange("birthday", value)} />

                <Text style={styles.inputLabel}>Telefone</Text>
                <TextInput style={styles.input} autoCapitalize="none" keyboardType="numeric" maxLength={11} placeholderTextColor={colors.textTertiary} value={user.cellphone} onChangeText={value => onChange("cellphone", value)} />

                <TouchableOpacity style={styles.photoPickerInput} onPress={handleSelectPhotoOptions} activeOpacity={0.7}>
                  {user.photo ? <View style={styles.selectedPhotoContainer}>
                      <Image source={{
                      uri: user.photo.uri
                    }} style={styles.previewImage} />
                      <Text style={styles.photoSelectedText} numberOfLines={1}>
                        {user.photo.fileName}
                      </Text>
                      <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
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
                <Text style={styles.backLink} onPress={() => navigation.goBack()}>Voltar ao painel</Text>
              </View>
            </View>}
          {step === 2 && <View>
              <View style={styles.formView}>

                <Text style={styles.inputLabel}>CEP</Text>
                <TextInput style={styles.input} autoCapitalize="none" keyboardType="numeric" maxLength={8} placeholderTextColor={colors.textTertiary} value={user.zip_code} onChangeText={value => handleZipCode(value)} />

                <View style={[{
                  width: "100%"
                }, styles.viewStreetNumber]}>
                    <Text style={styles.inputLabel}>Logradouro</Text>
                    <TextInput style={styles.inputStreet} autoCapitalize="none" maxLength={255} placeholderTextColor={colors.textTertiary} value={user.street} onChangeText={value => onChange("street", value)} />

                    <Text style={styles.inputLabel}>Número</Text>
                    <TextInput style={styles.inputNumber} autoCapitalize="none" maxLength={5} keyboardType="numeric" placeholderTextColor={colors.textTertiary} value={user.number} onChangeText={value => onChange("number", value)} />
                </View>

                <Text style={styles.inputLabel}>Bairro</Text>
                <TextInput style={styles.input} autoCapitalize="none" maxLength={255} placeholderTextColor={colors.textTertiary} value={user.neighborhood} onChangeText={value => onChange("neighborhood", value)} />

                <View style={[{
                  width: "100%"
                }, styles.viewStateCity]}>
                  <View style={styles.inputState}>
                    <Text style={styles.fieldLabel}>Estado</Text>
                    <View style={styles.pickerBox}>
                      <Picker selectedValue={user.state} onValueChange={value => handleSelectState(value)} enabled={!loadingStates} style={styles.picker} itemStyle={styles.pickerItem} dropdownIconColor={colors.textTertiary}>
                        <Picker.Item label={loadingStates ? "Carregando..." : "Estado: "} value="" color={colors.textTertiary} />
                        {states.map(uf => <Picker.Item key={uf.id} label={`${uf.nome} (${uf.sigla})`} value={uf.sigla} />)}
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.inputCity}>
                    <Text style={styles.fieldLabel}>Cidade</Text>
                    <View style={styles.pickerBox}>
                      <Picker selectedValue={user.city} onValueChange={value => onChange("city", value)} enabled={!!user.state && !loadingCities} style={styles.picker} itemStyle={styles.pickerItem} dropdownIconColor={colors.textTertiary}>
                        <Picker.Item label={!user.state ? "Cidade: " : loadingCities ? "Carregando..." : "Cidade: "} value="" color={colors.textTertiary} />
                        {cities.map(city => <Picker.Item key={city.id} label={city.nome} value={city.nome} />)}
                      </Picker>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={[styles.button, loading && {
                  opacity: 0.7
                }]} onPress={registerAdmin} disabled={loading}>
                  {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Cadastrar administrador</Text>}
                </TouchableOpacity>
                <Text style={styles.backLink} onPress={() => previousStep()}>Voltar</Text>
              </View>
            </View>}
        </ScrollView>
          <Modal visible={feedback.visible} transparent animationType="fade" onRequestClose={closeFeedback}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={[styles.modalIconCircle, feedback.type === "success" ? styles.modalIconSuccess : styles.modalIconError]}>
                    <MaterialCommunityIcons name={feedback.type === "success" ? "check-circle" : "alert-circle"} size={44} color={feedback.type === "success" ? colors.primary : colors.error} />
                  </View>
                  <Text style={styles.modalTitle}>{feedback.title}</Text>
                  <Text style={styles.modalMessage}>{feedback.message}</Text>
                  <TouchableOpacity style={styles.modalButton} onPress={closeFeedback}>
                    <Text style={styles.modalButtonText}>
                      {feedback.type === "success" ? "Voltar ao painel" : "Entendi"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
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
    paddingTop: 12,
    paddingBottom: 120
  },
  step: {
    width: "100%"
  },
  stepHeader: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 20
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
    marginTop: 16,
    fontFamily: fonts.extraBold,
    fontSize: 38,
    color: colors.primaryDark,
    lineHeight: 42,
    letterSpacing: -1.8
  },
  subtitle: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary
  },
  formView: {
    width: "90%",
    alignItems: "stretch",
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white
  },
  input: {
    width: "100%",
    minHeight: 50,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textPrimary
  },
  viewStreetNumber: {
    width: "100%",
    alignSelf: "center",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 0
  },
  inputStreet: {
    minHeight: 50,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textPrimary,
    width: "100%"
  },
  inputNumber: {
    minHeight: 50,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textPrimary,
    width: "100%"
  },
  viewStateCity: {
    width: "100%",
    alignSelf: "center"
  },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    marginBottom: 9
  },
  inputState: {
    width: "100%",
    marginBottom: 18
  },
  inputCity: {
    width: "100%",
    marginBottom: 18
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
    width: "100%",
    minHeight: 76,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 0,
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
    width: "100%",
    alignSelf: "center",
    minHeight: 54,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: colors.primaryDark,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center"
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 15,
    textAlign: "center"
  },
  backLink: {
    alignSelf: "center",
    marginTop: 16,
    padding: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.primaryDark,
    textDecorationLine: "underline"
  },
  viewInformation: {
    width: "100%",
    alignSelf: "center",
    padding: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 0,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceMuted
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
    backgroundColor: colors.errorLight
  },
  modalTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.primaryDark,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 30
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
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  modalButtonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: "center"
  },
  brandRow: {
    paddingVertical: 8,
    marginBottom: 18
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.primaryDark
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryLight
  },
  chipText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.primaryDark
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  stepperItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  stepperNumber: {
    width: 24,
    height: 24,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center"
  },
  stepperDone: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryDark
  },
  stepperText: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: colors.textSecondary
  },
  stepperTextActive: {
    color: colors.white
  },
  stepperLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary
  },
  stepperLabelActive: {
    fontFamily: fonts.bold,
    color: colors.primaryDark
  },
  inputLabel: {
    marginBottom: 9,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary
  },
  pickerBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: "hidden"
  }
});
