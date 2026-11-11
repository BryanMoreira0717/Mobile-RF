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
  Manrope_800ExtraBold
} from "@expo-google-fonts/manrope";
import {
  Gelasio_400Regular,
  Gelasio_400Regular_Italic,
  Gelasio_700Bold
} from "@expo-google-fonts/gelasio";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";
import Brand from "../../components/Brand";

// Mesmo conteúdo da home do site (FrontEnd-RF), adaptado para o celular.
const estagios = [
  { titulo: "Matéria", texto: "O que seria descartado ganha um novo destino." },
  { titulo: "Ideia", texto: "A criatividade conecta materiais e pessoas." },
  { titulo: "Nova história", texto: "Novas criações, mais possibilidades e menos desperdício." },
];

const materiais = [
  { nome: "Couro", texto: "Resistente, versátil e cheio de novas possibilidades." },
  { nome: "Tecidos", texto: "Texturas que se reinventam em cada criação." },
  { nome: "EVA", texto: "Leveza e novas formas para múltiplos usos." },
];

const passos = [
  { icone: "account-outline", titulo: "Escolha seu perfil", texto: "Uma conta de empresa ou pessoal, de acordo com a sua participação." },
  { icone: "pencil-outline", titulo: "Crie sua conta", texto: "Preencha seus dados e confirme seu e-mail para começar." },
  { icone: "leaf", titulo: "Faça parte da rede", texto: "Aproxime sua empresa ou suas ideias de novas possibilidades." },
];

export default function HomeScreen({ navigation }) {
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

  return (
    <SafeAreaView style={styles.background} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Brand />

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.buttonSmall}
              onPress={() => navigation.navigate("SelectUserType")}
              accessibilityRole="button"
            >
              <Text style={styles.buttonSmallText}>Criar conta</Text>
              <MaterialCommunityIcons name="arrow-top-right" size={15} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonCircle}
              onPress={() => navigation.navigate("Login")}
              accessibilityRole="button"
              accessibilityLabel="Entrar"
            >
              <MaterialCommunityIcons name="login" size={20} color={colors.primaryDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Economia circular em Franca</Text>

          <Text style={styles.heroTitle}>
            O fim de{"\n"}um ciclo.{"\n"}
            <Text style={styles.titleEm}>O começo</Text>
            {"\n"}de outro.
          </Text>

          <Text style={styles.heroText}>
            O que sobra na indústria pode ser o início da sua próxima criação.
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("SelectUserType")}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Quero fazer parte</Text>
              <MaterialCommunityIcons name="arrow-top-right" size={18} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("Login")}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Já tenho conta</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroArt}>
          <Image
            source={require("../../../assets/images/web/hero.webp")}
            style={styles.heroImage}
          />
          <View style={[styles.artLabel, styles.artLabelOne]}>
            <View style={styles.artLine} />
            <Text style={styles.artText}>01{"\n"}COURO</Text>
          </View>
          <View style={[styles.artLabel, styles.artLabelTwo]}>
            <View style={styles.artLine} />
            <Text style={styles.artText}>02{"\n"}TECIDO</Text>
          </View>
          <View style={[styles.artLabel, styles.artLabelThree]}>
            <View style={styles.artLine} />
            <Text style={styles.artText}>03{"\n"}EVA</Text>
          </View>
        </View>

        {/* Faixa de materiais */}
        <View style={styles.strip}>
          <View style={styles.stripItem}>
            <Image
              source={require("../../../assets/images/web/retalho-couro-nobre.png")}
              style={styles.swatch}
            />
            <Text style={styles.stripText}>Couro</Text>
          </View>
          <View style={styles.stripItem}>
            <View style={[styles.swatch, styles.swatchFabric]} />
            <Text style={styles.stripText}>Tecidos</Text>
          </View>
          <View style={styles.stripItem}>
            <Image
              source={require("../../../assets/images/web/eva-camurca-premium.png")}
              style={styles.swatch}
            />
            <Text style={styles.stripText}>EVA e borracha</Text>
          </View>
          <View style={styles.stripItem}>
            <View style={[styles.swatch, styles.swatchWood]} />
            <Text style={styles.stripText}>Madeira</Text>
          </View>
        </View>

        {/* Uma ideia que circula */}
        <View style={[styles.container, styles.section]}>
          <Text style={styles.eyebrow}>Uma ideia que circula</Text>
          <Text style={styles.sectionTitle}>Tudo pode{"\n"}ganhar outra forma.</Text>
          <Text style={styles.sectionText}>
            Conectamos empresas de Franca, artesãos e cooperativas para transformar
            sobras da indústria em novas possibilidades.
          </Text>
        </View>

        <View style={styles.storyArt}>
          <Image
            source={require("../../../assets/images/web/transformation.webp")}
            style={styles.storyImage}
          />
        </View>

        <View style={[styles.container, styles.columns]}>
          {estagios.map((item, index) => (
            <View key={item.titulo} style={styles.column}>
              <Text style={styles.number}>0{index + 1}</Text>
              <Text style={styles.columnTitle}>{item.titulo}</Text>
              <Text style={styles.columnText}>{item.texto}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.container, styles.note]}>
          Possibilidade ilustrativa de reaproveitamento.
        </Text>

        {/* Materiais (fundo verde) */}
        <View style={styles.materials}>
          <View style={styles.container}>
            <Text style={[styles.eyebrow, styles.eyebrowLight]}>Materiais</Text>
            <Text style={[styles.sectionTitle, styles.textLight]}>Sinta as{"\n"}possibilidades.</Text>
            <Text style={[styles.sectionText, styles.textSoft]}>
              Sobras da indústria podem ganhar novas histórias nas mãos de quem transforma.
            </Text>
          </View>

          <View style={styles.materialsArt}>
            <Image
              source={require("../../../assets/images/web/materials.webp")}
              style={styles.materialsImage}
            />
          </View>

          <View style={[styles.container, styles.columns]}>
            {materiais.map((item, index) => (
              <View key={item.nome} style={styles.column}>
                <Text style={[styles.number, styles.textLight]}>0{index + 1}</Text>
                <Text style={[styles.columnTitle, styles.textLight]}>{item.nome}</Text>
                <Text style={[styles.columnText, styles.textSoft]}>{item.texto}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.container, styles.note, styles.noteLight]}>
            Composições ilustrativas. Não representam anúncios ou estoque disponível.
          </Text>
        </View>

        {/* Como fazer parte */}
        <View style={[styles.container, styles.section]}>
          <Text style={styles.eyebrow}>Como fazer parte</Text>
          <Text style={styles.sectionTitle}>Seu próximo ciclo{"\n"}começa aqui.</Text>

          <View style={[styles.columns, styles.steps]}>
            {passos.map((item, index) => (
              <View key={item.titulo} style={styles.column}>
                <View style={styles.stepIcon}>
                  <MaterialCommunityIcons name={item.icone} size={22} color={colors.primaryDark} />
                </View>
                <Text style={styles.number}>0{index + 1}</Text>
                <Text style={styles.columnTitle}>{item.titulo}</Text>
                <Text style={styles.columnText}>{item.texto}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Fechamento */}
        <View style={[styles.container, styles.section]}>
          <Text style={styles.eyebrow}>Economia circular em ação</Text>
          <Text style={styles.heroTitle}>
            O futuro não{"\n"}se descarta.{"\n"}
            <Text style={styles.titleEm}>Se transforma.</Text>
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.closingButton]}
            onPress={() => navigation.navigate("SelectUserType")}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Criar minha conta</Text>
            <MaterialCommunityIcons name="arrow-top-right" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.closingArt}>
          <Image
            source={require("../../../assets/images/web/hero.webp")}
            style={styles.closingImage}
          />
        </View>

        {/* Rodapé */}
        <View style={[styles.container, styles.footer]}>
          <Brand />
          <Text style={styles.footerTagline}>Da indústria para a criatividade.</Text>

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerLink}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("SelectUserType")}>
              <Text style={styles.footerLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerBottom}>
            <Text style={styles.footerSmall}>© 2026 Reaproveita Franca.</Text>
            <Text style={styles.footerSmall}>Feito para transformar. Pensado para circular.</Text>
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
    paddingBottom: 120,
  },
  container: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonSmall: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    backgroundColor: colors.primaryDark,
  },
  buttonSmallText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  buttonCircle: {
    width: 42,
    height: 42,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: colors.primaryDark,
  },
  eyebrowLight: {
    color: colors.background,
  },
  heroTitle: {
    marginTop: 20,
    fontFamily: fonts.extraBold,
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: -2.6,
    color: colors.primaryDark,
  },
  titleEm: {
    fontFamily: fonts.serifItalic,
    fontSize: 52,
    letterSpacing: -2.4,
  },
  heroText: {
    marginTop: 20,
    maxWidth: 320,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  heroButtons: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 24,
  },
  button: {
    minHeight: 50,
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
  linkButton: {
    minHeight: 44,
    justifyContent: "center",
  },
  link: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.primaryDark,
    textDecorationLine: "underline",
  },
  heroArt: {
    width: "100%",
    aspectRatio: 1.15,
    marginTop: 8,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  artLabel: {
    position: "absolute",
    gap: 5,
  },
  artLabelOne: {
    top: "6%",
    left: 20,
  },
  artLabelTwo: {
    top: "14%",
    right: 20,
    alignItems: "flex-end",
  },
  artLabelThree: {
    bottom: "16%",
    right: 20,
    alignItems: "flex-end",
  },
  artLine: {
    width: 28,
    height: 1,
    backgroundColor: colors.textTertiary,
  },
  artText: {
    fontFamily: fonts.regular,
    fontSize: 8,
    lineHeight: 14,
    letterSpacing: 1.6,
    color: colors.primaryDark,
  },
  strip: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 18,
    marginHorizontal: 20,
    paddingVertical: 22,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderMuted,
  },
  stripItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 100,
  },
  swatchFabric: {
    backgroundColor: "#D3C6AB",
  },
  swatchWood: {
    backgroundColor: "#CEAC79",
  },
  stripText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.primaryDark,
  },
  section: {
    marginTop: 48,
  },
  sectionTitle: {
    marginTop: 18,
    fontFamily: fonts.extraBold,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1.8,
    color: colors.primaryDark,
  },
  sectionText: {
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  textLight: {
    color: colors.background,
  },
  textSoft: {
    color: "#D8DFD1",
  },
  storyArt: {
    width: "100%",
    aspectRatio: 2.2,
    marginVertical: 12,
    overflow: "hidden",
  },
  storyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    transform: [{ scale: 1.25 }],
  },
  columns: {
    flexDirection: "row",
    gap: 15,
    marginTop: 8,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  number: {
    fontFamily: fonts.regular,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.textTertiary,
  },
  columnTitle: {
    marginTop: 4,
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.8,
    color: colors.primaryDark,
  },
  columnText: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  note: {
    marginTop: 26,
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 14,
    textAlign: "right",
    color: colors.textTertiary,
  },
  noteLight: {
    color: "#BEC9B8",
  },
  materials: {
    marginTop: 40,
    paddingTop: 45,
    paddingBottom: 22,
    backgroundColor: colors.primaryDark,
  },
  materialsArt: {
    width: "100%",
    aspectRatio: 3,
    marginTop: 22,
    marginBottom: 16,
  },
  materialsImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  steps: {
    marginTop: 26,
  },
  stepIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
    borderRadius: 100,
    backgroundColor: "#EEEEE6",
    justifyContent: "center",
    alignItems: "center",
  },
  closingButton: {
    marginTop: 24,
  },
  closingArt: {
    width: "100%",
    aspectRatio: 1.2,
    marginTop: 12,
    overflow: "hidden",
  },
  closingImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    transform: [{ scale: 1.4 }, { translateX: 60 }],
  },
  footer: {
    marginTop: 24,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  footerTagline: {
    marginTop: 14,
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.textTertiary,
  },
  footerLinks: {
    flexDirection: "row",
    gap: 22,
    marginTop: 24,
  },
  footerLink: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.primaryDark,
    textDecorationLine: "underline",
  },
  footerBottom: {
    gap: 8,
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  footerSmall: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textTertiary,
  },
});
