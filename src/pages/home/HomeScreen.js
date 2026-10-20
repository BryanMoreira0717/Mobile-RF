import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";

export default function HomeScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.background}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Transforme resíduos em oportunidades
          </Text>

          <Text style={styles.subtitle}>
            Conectamos as grandes indústrias calçadistas de Franca a
            artesãos, cooperativas e microempresas locais
          </Text>

          <View style={styles.viewButtons}>
            <TouchableOpacity
              style={styles.buttonRegister}
              onPress={() => navigation.navigate("SelectUserType")}
            >
              <Text style={styles.textButtonRegister}>
                Cadastre-se
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonLogin}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.textButtonLogin}>
                Faça Login
              </Text>
            </TouchableOpacity>
          </View>

          <Image
            source={require("../../../assets/images/product-example.png")}
            style={styles.imageExample}
          />
        </View>

        <View style={styles.systemData}>
          <Text style={styles.dataText}>
            <Text style={styles.emphasisText}>
              2.500+{"\n"}
            </Text>
            Ton desviadas{"\n"}de aterros
          </Text>

          <Text style={styles.dataText}>
            <Text style={styles.emphasisText}>
              340+{"\n"}
            </Text>
            Empresas{"\n"}Parceiras
          </Text>

          <Text style={styles.dataText}>
            <Text style={styles.emphasisText}>
              1.200+{"\n"}
            </Text>
            Negociações{"\n"}concluídas
          </Text>
        </View>

        <View style={styles.technologies}>
          <Text style={styles.titleTecnology}>
            Nossas Tecnologias:
          </Text>

          <View style={styles.ourTecnology}>
            <MaterialCommunityIcons
              name="truck"
              size={38}
              color={colors.primary}
            />

            <View style={styles.technologyTexts}>
              <Text style={styles.titleOurTecnology}>
                Logística Inteligente
              </Text>
              <Text style={styles.subtitleOurTecnology}>
                Simplificação no transporte e coleta local
              </Text>
            </View>
          </View>

          <View style={styles.ourTecnology}>
            <MaterialCommunityIcons
              name="leaf"
              size={38}
              color={colors.primary}
            />

            <View style={styles.technologyTexts}>
              <Text style={styles.titleOurTecnology}>
                Indicadores Verdes
              </Text>
              <Text style={styles.subtitleOurTecnology}>
                Monitore o volume de CO₂ evitado em Franca
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <NavBar
        estagio="visitante"
        ativo="inicio"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    width: "100%",
    backgroundColor: colors.primaryLight,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    marginHorizontal: "8%",
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  subtitle: {
    marginTop: 12,
    marginHorizontal: "8%",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
  },
  viewButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginTop: 24,
    marginHorizontal: "8%",
  },
  buttonRegister: {
    backgroundColor: colors.primary,
    minHeight: 52,
    width: "48%",
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  buttonLogin: {
    backgroundColor: colors.white,
    minHeight: 52,
    width: "48%",
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  textButtonLogin: {
    fontFamily: fonts.bold,
    color: colors.primary,
    textAlign: "center",
  },
  textButtonRegister: {
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: "center",
  },
  imageExample: {
    width: "90%",
    aspectRatio: 1.6,
    alignSelf: "center",
    marginTop: 24,
    borderRadius: 20,
    resizeMode: "cover",
  },
  systemData: {
    width: "100%",
    backgroundColor: colors.primaryDark,
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  emphasisText: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 17,
  },
  dataText: {
    flex: 1,
    paddingHorizontal: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.white,
    textAlign: "center",
  },
  technologies: {
    paddingHorizontal: "8%",
    paddingTop: 20,
  },
  titleTecnology: {
    marginBottom: 12,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  ourTecnology: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 15,
  },
  technologyTexts: {
    flex: 1,
    marginLeft: 16,
  },
  titleOurTecnology: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  subtitleOurTecnology: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});