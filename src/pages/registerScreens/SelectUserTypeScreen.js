import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../theme/colors";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
  Manrope_800ExtraBold
} from "@expo-google-fonts/manrope";
import {
  Gelasio_400Regular,
  Gelasio_400Regular_Italic,
  Gelasio_700Bold
} from "@expo-google-fonts/gelasio";
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Brand from "../../components/Brand";

// Mesmas opções da tela "Qual é o seu próximo passo?" do site.
const opcoes = [
  {
    id: "empresa",
    numero: "01 / Sou empresa",
    titulo: "Quero disponibilizar.",
    texto: "Tenho materiais para anunciar para venda ou doação.",
    icone: "office-building-outline",
    tela: "RegisterComp1",
  },
  {
    id: "pessoal",
    numero: "02 / Sou comprador / artesão",
    titulo: "Quero transformar.",
    texto: "Quero fazer parte da rede com novas ideias e possibilidades.",
    icone: "sprout-outline",
    tela: "RegisterScreen",
  },
];

export default function SelectUserTypeScreen({ navigation }) {
  const [escolha, setEscolha] = useState("empresa");
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Gelasio_400Regular,
    Gelasio_400Regular_Italic,
    Gelasio_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const opcaoEscolhida = opcoes.find((opcao) => opcao.id === escolha);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Brand />
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={16} color={colors.primaryDark} />
          <Text style={styles.backText}>Voltar ao início</Text>
        </TouchableOpacity>

        {/* Etapas do cadastro, como no site */}
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.stepNumber, styles.stepActive]}>
              <Text style={[styles.stepNumberText, styles.stepActiveText]}>01</Text>
            </View>
            <Text style={styles.stepLabel}>Seu perfil</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>02</Text>
            </View>
            <Text style={styles.stepLabelMuted}>Seus dados</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>03</Text>
            </View>
            <Text style={styles.stepLabelMuted}>Confirmação</Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>Diferentes pontos de partida. A mesma rede.</Text>
        <Text style={styles.title}>
          Qual é o seu{"\n"}<Text style={styles.titleEm}>próximo passo?</Text>
        </Text>
        <Text style={styles.subtitle}>
          Escolha como você quer participar. Cada perfil tem um papel na
          transformação dos materiais de Franca.
        </Text>

        <View style={styles.options}>
          {opcoes.map((opcao) => {
            const selecionada = escolha === opcao.id;

            return (
              <TouchableOpacity
                key={opcao.id}
                style={[styles.card, selecionada && styles.cardSelected]}
                activeOpacity={0.9}
                onPress={() => setEscolha(opcao.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selecionada }}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardNumber}>{opcao.numero}</Text>
                  <View style={[styles.radio, selecionada && styles.radioSelected]}>
                    {selecionada && (
                      <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                    )}
                  </View>
                </View>

                <MaterialCommunityIcons
                  name={opcao.icone}
                  size={28}
                  color={colors.primaryDark}
                  style={styles.cardIcon}
                />

                <Text style={styles.cardTitle}>{opcao.titulo}</Text>
                <Text style={styles.cardText}>{opcao.texto}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.note}>
          Você preenche seus dados e confirma seu e-mail nas próximas etapas.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate(opcaoEscolhida.tela)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Continuar cadastro</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Já faz parte da rede?</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
            accessibilityRole="button"
          >
            <Text style={styles.loginLink}>Entre na sua conta</Text>
            <MaterialCommunityIcons name="arrow-top-right" size={15} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 16,
  },
  backButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
  },
  backText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.primaryDark,
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 32,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryDark,
  },
  stepNumberText: {
    fontFamily: fonts.regular,
    fontSize: 8,
    color: colors.textSecondary,
  },
  stepActiveText: {
    color: colors.white,
  },
  stepLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.primaryDark,
  },
  stepLabelMuted: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: colors.textSecondary,
  },
  stepLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 6,
    backgroundColor: colors.border,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.primaryDark,
  },
  title: {
    marginTop: 18,
    fontFamily: fonts.extraBold,
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -2,
    color: colors.primaryDark,
  },
  titleEm: {
    fontFamily: fonts.serifItalic,
    fontSize: 44,
    letterSpacing: -1.6,
  },
  subtitle: {
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  options: {
    gap: 14,
    marginTop: 26,
  },
  card: {
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardNumber: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.primaryDark,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryDark,
  },
  cardIcon: {
    marginTop: 20,
  },
  cardTitle: {
    marginTop: 18,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -1,
    color: colors.primaryDark,
  },
  cardText: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  note: {
    marginTop: 22,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  button: {
    minHeight: 50,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 24,
    paddingHorizontal: 26,
    borderRadius: 100,
    backgroundColor: colors.primaryDark,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },
  loginRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 32,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  loginText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  loginButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  loginLink: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
    textDecorationLine: "underline",
  },
});
