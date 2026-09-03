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

export default function LoginScreen({ navigation }) {
  const [entityType, setEntityType] = useState("comprador"); // ou "empresa"
  const [user, setUser] = useState({ doc_hmac: "", password: "" });

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
          <View style={styles.circle}>
            <MaterialCommunityIcons
              name="repeat"
              size={50}
              color={colors.white}
            />
          </View>
          <Text style={styles.title}>Reaproveita</Text>
          <Text style={styles.subtitle}>FRANCA</Text>

          <View style={styles.container}>
            <Pressable
              style={[
                styles.option,
                entityType === "empresa" && styles.optionActive,
              ]}
              onPress={() => setEntityType("empresa")}
            >
              <Text
                style={[
                  styles.text,
                  entityType === "empresa" && styles.textActive,
                ]}
              >
                Empresa
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.option,
                entityType === "comprador" && styles.optionActive,
              ]}
              onPress={() => setEntityType("comprador")}
            >
              <Text
                style={[
                  styles.text,
                  entityType === "comprador" && styles.textActive,
                ]}
              >
                Comprador/Artesão
              </Text>
            </Pressable>
          </View>

          {entityType === "comprador" && (
            <View style={styles.compradorLogin}>
              <View style={styles.buttonsAuth}>
                <TouchableOpacity style={styles.buttonAuth}>
                  <MaterialCommunityIcons
                    name="google"
                    size={35}
                    color="red"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonAuth}>
                  <MaterialCommunityIcons
                    name="linkedin"
                    size={35}
                    color="blue"
                  />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="CPF: "
                autoCapitalize="none"
                keyboardType="numeric"
                maxLength={11}
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

              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Entrar</Text>
              </TouchableOpacity>
            </View>
          )}
          {entityType === "empresa" && (
            <View style={styles.compradorLogin}>
              <TextInput
                  style={styles.input}
                  placeholder="CPF: "
                  autoCapitalize="none"
                  keyboardType="numeric"
                  maxLength={11}
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

              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Entrar</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flexGrow: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingVertical: 40,
  },
  circle: {
    width: 69,
    height: 69,
    borderRadius: 34.5,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    marginTop: 12,
  },
  subtitle: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  container: {
    flexDirection: "row",
    width: "90%",
    marginTop: 24,
    backgroundColor: colors.borderLight,
    borderRadius: 16,
    padding: 4,
  },
  option: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  optionActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.primaryDark,
  },
  compradorLogin: {
    width: "100%",
    alignItems: "center",
  },
  buttonsAuth: {
    flexDirection: "row",
    marginTop: 24,
    gap: 16,
    marginBottom: 12,
  },
  buttonAuth: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
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
    color:"white",
    fontFamily:fonts.bold
  }
});