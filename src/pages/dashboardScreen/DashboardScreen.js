import {
  TouchableOpacity,
  View,
  Text,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  useEffect(() => {
    async function loadUser() {
      try {
        const storedUser = await AsyncStorage.getItem("@user");

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser) setUser(parsedUser);
        }
      } catch (e) {
        console.log("Erro ao carregar usuário:", e?.message);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  function handleNavigation(item) {
    switch (item) {
      case "inicio":
        // Já estamos nesta tela.
        break;
      case "perfil":
        navigation.navigate("ProfileScreen");
        break;
      case "mapa":
        navigation.navigate("MapScreen")
        break;
      case "historico":
        navigation.navigate("HistoryScreen")
        break;
      default:
        Alert.alert(
          "Em breve",
          "Esta funcionalidade estará disponível."
        );
    }
  }

  if (!fontsLoaded || loadingUser) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.loading, { padding: 24 }]}>
        <Text style={styles.errorText}>
          Não foi possível carregar seu usuário.{"\n"}
          Faça login novamente.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          }
        >
          <Text style={styles.buttonText}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const estagio =
    user.role === "company" ? "empresa" : "comprador";

  return (
    <SafeAreaView
      style={styles.background}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        <View
          style={[
            styles.header,
            user.role === "company" && { height: 240 },
          ]}
        >
          <Text style={styles.welcome}>
            Boas vindas ao Reaproveita Franca
          </Text>

          <Text style={styles.welcome2}>
            Olá, {user.name || "visitante"} 👋
          </Text>

          <Text style={styles.welcome3}>
            {(user.role || "").toUpperCase()}
          </Text>

          {user.role === "company" && (
            <TouchableOpacity style={styles.buttonHeader}>
              <Text
                style={{
                  color: colors.white,
                  fontFamily: fonts.bold,
                }}
              >
                Novo Material
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {user.role === "user" && (
          <View style={styles.section}>
            <Text style={styles.balance}>Seu Balanço do mês:</Text>

            <View style={styles.viewsSummary}>
              <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Reservados</Text>
                <Text style={styles.viewSummaryReserveEmphasis}>12</Text>
                <Text style={styles.viewSummaryFooterReserve}>
                  + 3 pendentes
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Negociação</Text>
                <Text style={styles.viewSummaryNegociationEmphasis}>
                  3
                </Text>
                <Text style={styles.viewSummaryFooterNegociation}>
                  Chat Ativo
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Adquiridos</Text>
                <Text style={styles.viewSummaryAcquiredEmphasis}>
                  890 KG
                </Text>
                <Text style={styles.viewSummaryFooterAcquired}>
                  Meta Batida 🎊
                </Text>
              </View>
            </View>

            <View style={styles.recommendationsHeader}>
              <Text style={styles.textRec}>Recomendados para Você</Text>
              <Text style={styles.textRec2}>Ver mais</Text>
            </View>

            <View style={styles.recViews}>
              <View style={styles.recView}>
                <Image
                  source={require("../../../assets/images/product-reserved.png")}
                  style={styles.image}
                />
                <Text style={styles.recTitle}>Sobra de Solados PU</Text>
                <Text style={styles.recSubTitle}>Calçados Franca</Text>

                <View style={styles.viewFooterRec}>
                  <Text style={styles.weightRec}>120kg</Text>
                  <Text style={styles.howFar}>0.8km</Text>
                </View>
              </View>

              <View style={styles.recView}>
                <Image
                  source={require("../../../assets/images/product-reserved2.png")}
                  style={styles.image}
                />
                <Text style={styles.recTitle}>Retalhos Nobuck Preto</Text>
                <Text style={styles.recSubTitle}>Estilos Couros</Text>

                <View style={styles.viewFooterRec}>
                  <Text style={styles.weightRec}>45kg</Text>
                  <Text style={styles.howFar}>2.4km</Text>
                </View>
              </View>
            </View>

            <Text style={styles.textRec}>Reservas Recentes</Text>

            <View style={styles.viewReserve}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: colors.primary },
                ]}
              />

              <View style={styles.viewReserveTexts}>
                <Text style={styles.textEmphasis}>
                  120 kg de Solado Borracha
                </Text>
                <Text style={styles.textReserve}>
                  Curtume Francês S.A • Retirar até 12/08
                </Text>
              </View>

              <Text style={styles.statusReserve}>Aprovado</Text>
            </View>

            <View style={styles.viewReserve}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: colors.accent },
                ]}
              />

              <View style={styles.viewReserveTexts}>
                <Text style={styles.textEmphasis}>Placa EVA Coloridas</Text>
                <Text style={styles.textReserve}>
                  Fábrica Estrela • Aguardando Aprovação
                </Text>
              </View>

              <Text style={[styles.statusReserve, styles.statusPending]}>
                Análise
              </Text>
            </View>
          </View>
        )}

        {user.role === "company" && (
          <View style={styles.section}>
            <Text style={styles.balance}>Resumo do Impacto:</Text>

            <View style={styles.viewsSummary}>
              <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Publicados</Text>
                <Text style={styles.viewSummaryResumeEmphasis}>
                  24 Lotes
                </Text>
                <Text style={styles.viewSummaryFooterResume}>
                  +4 este mês
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Reservas</Text>
                <Text style={styles.viewSummaryResumeEmphasis}>
                  8 Ativos
                </Text>
                <Text style={styles.viewSummaryFooterResume}>
                  2 aguardando coleta
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>KG Desviados</Text>
                <Text style={styles.viewSummaryResumeEmphasis}>
                  1.450 KG
                </Text>
                <Text style={styles.viewSummaryFooterResume}>
                  equivalente a 4.3t CC
                </Text>
              </View>
            </View>

            <Text style={styles.textRec}>Atividades Recentes</Text>

            <View style={styles.viewReserve}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: colors.accent },
                ]}
              />

              <View style={styles.viewReserveTexts}>
                <Text style={styles.textEmphasis}>Lote de EVA Reservado</Text>
                <Text style={styles.textReserve}>
                  Hoje às 14:30 • Solados Estrela
                </Text>
              </View>

              <Text style={[styles.statusReserve, styles.statusPending]}>
                Aguardando{"\n"}Coleta
              </Text>
            </View>

            <View style={styles.viewReserve}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: colors.primary },
                ]}
              />

              <View style={styles.viewReserveTexts}>
                <Text style={styles.textEmphasis}>
                  Retalho de Couro Coletados
                </Text>
                <Text style={styles.textReserve}>
                  Ontem às 16:15 • Silvana M.
                </Text>
              </View>

              <Text style={styles.statusReserve}>Finalizado</Text>
            </View>
          </View>
        )}

        {user.role === "admin" && (
          <View style={styles.section}>
            <Text style={styles.balance}>Registro de Usuários:</Text>

            <View style={styles.viewsSummary}>
              <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Usuários</Text>
                <Text style={styles.viewSummaryReserveEmphasis}>170</Text>
                <Text style={styles.viewSummaryFooterReserve}>
                  + 3 Desde SET
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Empresa</Text>
                <Text style={styles.viewSummaryNegociationEmphasis}>15</Text>
                <Text style={styles.viewSummaryFooterNegociation}>
                  +1 Desde SET
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Admin</Text>
                <Text style={styles.viewSummaryAcquiredEmphasis}>1</Text>
                <Text style={styles.viewSummaryFooterAcquired}>
                  +0 Desde SET
                </Text>
              </View>
            </View>

            <Text style={styles.textRec}>Gestão do Reaproveita Franca</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("RegisterAdmin")}
            >
              <Text style={styles.buttonText}>Adicionar um novo ADMIN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Gerenciar Usuários</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Gerenciar Anúncios</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {(user.role === "user" || user.role === "company") && (
        <NavBar
          estagio={estagio}
          ativo="inicio"
          onNavigate={handleNavigation}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    width: "100%",
  },
  header: {
    width: "100%",
    height: 200,
    backgroundColor: colors.primaryLight,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcome: {
    marginTop: 80,
    marginLeft: 40,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  welcome2: {
    marginTop: 3,
    marginLeft: 40,
    fontSize: 25,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  welcome3: {
    marginTop: -6,
    marginLeft: 42,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  balance: {
    marginTop: 20,
    marginLeft: 20,
    fontSize: 18,
    fontFamily: fonts.regular,
  },
  viewsSummary: {
    marginTop: 15,
    width: "95%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  viewSummary: {
    backgroundColor: colors.background,
    width: "32%",
    height: 150,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.textLight,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  viewSummaryTitle: {
    marginTop: 5,
    marginLeft: 7,
    color: colors.textTertiary,
  },
  viewSummaryReserveEmphasis: {
    marginLeft: 7,
    marginTop: 16,
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  viewSummaryNegociationEmphasis: {
    marginLeft: 7,
    marginTop: 16,
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  viewSummaryAcquiredEmphasis: {
    marginLeft: 7,
    marginTop: 16,
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  viewSummaryFooterReserve: {
    marginLeft: 7,
    marginTop: 17,
    fontFamily: fonts.regular,
    color: colors.primary,
  },
  viewSummaryFooterNegociation: {
    marginLeft: 7,
    marginTop: 17,
    fontFamily: fonts.regular,
    color: colors.accent,
  },
  viewSummaryFooterAcquired: {
    marginLeft: 7,
    marginTop: 17,
    fontFamily: fonts.regular,
    color: colors.primaryDark,
  },
  recommendationsHeader: {
    justifyContent: "space-between",
    flexDirection: "row",
  },
  textRec: {
    marginTop: 28,
    marginLeft: 20,
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  textRec2: {
    marginTop: 20,
    marginLeft: 20,
    marginRight: 20,
    textDecorationLine: "underline",
    textDecorationColor: colors.primary,
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  recViews: {
    marginTop: 17,
    width: "95%",
    height: 190,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  recView: {
    width: "48%",
    height: 210,
    borderRadius: 20,
    borderWidth: 0.2,
    borderColor: colors.textTertiary,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    backgroundColor: colors.background,
  },
  image: {
    alignSelf: "center",
    marginTop: 10,
    width: "95%",
    height: 100,
    borderRadius: 20,
  },
  recTitle: {
    marginTop: 8,
    marginLeft: 9,
    fontFamily: fonts.bold,
  },
  recSubTitle: {
    marginLeft: 9,
    fontFamily: fonts.regular,
    marginTop: 10,
    color: colors.textTertiary,
  },
  viewFooterRec: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginTop: 10,
  },
  weightRec: {
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  howFar: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
  },
  viewReserve: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: colors.background,
    marginHorizontal: 8,
    justifyContent: "space-between",
    borderRadius: 20,
    borderWidth: 0.2,
    borderColor: colors.textTertiary,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    marginTop: 10,
  },
  statusDot: {
    alignSelf: "center",
    width: 15,
    height: 15,
    borderRadius: 100,
  },
  viewReserveTexts: {
    flex: 1,
    marginRight: 8,
  },
  textEmphasis: {
    fontFamily: fonts.bold,
    marginLeft: 10,
    fontSize: 15,
  },
  textReserve: {
    fontFamily: fonts.regular,
    marginLeft: 10,
    fontSize: 12,
  },
  statusReserve: {
    padding: 4,
    backgroundColor: "#33ff0046",
    alignSelf: "center",
    color: colors.textDark,
    fontFamily: fonts.bold,
    borderRadius: 10,
  },
  statusPending: {
    color: "#be6600",
    backgroundColor: "#ff880059",
  },
  buttonHeader: {
    marginLeft: 40,
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    width: "40%",
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  viewSummaryResumeEmphasis: {
    marginTop: 25,
    marginLeft: 9,
    fontSize: 22,
    fontFamily: fonts.bold,
  },
  viewSummaryFooterResume: {
    marginTop: 8,
    marginHorizontal: 9,
    fontFamily: fonts.regular,
    color: colors.primary,
  },
  button: {
    width: "90%",
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: colors.primary,
    borderRadius: 15,
    justifyContent: "center",
    alignSelf: "center",
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 17,
  },
});