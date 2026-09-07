import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../theme/colors";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SelectUserTypeScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={26}
            color={colors.primaryDark}
          />
        </TouchableOpacity>

        <Text style={styles.title}>Como você vai usar{"\n"}o Reaproveita?</Text>
        <Text style={styles.subtitle}>
          Escolha o tipo de conta para continuar
        </Text>
      </View>

      <View style={styles.options}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("RegisterComp1")}
        >
          <ImageBackground
            source={require("../../../assets/images/bussinessPhoto.jpeg")}
            style={styles.cardImage}
            imageStyle={styles.cardImageRadius}
          >
            <View style={styles.cardOverlay} />
            <View style={styles.cardContent}>
              <View style={styles.cardIconWrap}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={20}
                  color={colors.white}
                />
              </View>
              <View style={styles.cardTextRow}>
                <Text style={styles.cardLabel}>Empresa</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={22}
                  color={colors.white}
                />
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("RegisterScreen")}
        >
          <ImageBackground
            source={require("../../../assets/images/buyerPhoto.jpeg")}
            style={styles.cardImage}
            imageStyle={styles.cardImageRadius}
          >
            <View style={styles.cardOverlay} />
            <View style={styles.cardContent}>
              <View style={styles.cardIconWrap}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={colors.white}
                />
              </View>
              <View style={styles.cardTextRow}>
                <Text style={styles.cardLabel}>Comprador</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={22}
                  color={colors.white}
                />
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primaryLight,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.primaryDark,
    opacity: 0.7,
    marginTop: 8,
  },
  options: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 20,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImage: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cardImageRadius: {
    borderRadius: 22,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardContent: {
    padding: 20,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
  },
});