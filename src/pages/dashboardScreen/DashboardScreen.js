import {
  TouchableOpacity,
  View,
  Text,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import api from "../../services/axios";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  async function loadUser() {
    try {
      const storedUser = await AsyncStorage.getItem("@user");

      if (!storedUser) {
        setUser(null);
        return;
      }

      const parsedUser = JSON.parse(storedUser);

      if (!parsedUser || !parsedUser.id) {
        setUser(null);
        return;
      }

      // Mantém os dados salvos caso não seja possível consultar a API.
      setUser(parsedUser);

      const response = await api.getUserById(parsedUser.id);
      const updatedUser = {
        ...parsedUser,
        ...response.data
      };

      await AsyncStorage.setItem("@user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.log(
        "Erro ao atualizar usuário:",
        error.response?.data || error.message
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        error.response?.status === 404
      ) {
        setUser(null);
      } else {
        Alert.alert(
          "Não foi possível atualizar",
          "Os dados disponíveis podem estar desatualizados. Tente novamente."
        );
      }
    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    if (isFocused) {
      loadUser();
    }
  }, [isFocused]);

  async function refreshUser() {
    if (refreshing) return;

    try {
      setRefreshing(true);
      await loadUser();
    } finally {
      setRefreshing(false);
    }
  }

  function handleNavigation(item) {
    switch (item) {
      case "inicio":
        // Já estamos nesta tela.
        break;
      case "perfil":
        navigation.navigate("ProfileScreen");
        break;
      case "publicar":
        navigation.navigate("NewMaterialScreen");
        break;
      case "mapa":
        navigation.navigate("MapScreen")
        break;
      case "anuncios":
        navigation.navigate("MyAdvertisementsScreen")
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
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshUser}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.viewBrand}>
              <View style={styles.brandIcon}>
                <MaterialCommunityIcons name="repeat" size={24} color={colors.white} />
              </View>
              <View>
                <Text style={styles.brandName}>Reaproveita</Text>
                <Text style={styles.brandCity}>FRANCA</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.buttonProfile}
              onPress={() => navigation.navigate("ProfileScreen")}
              accessibilityRole="button"
              accessibilityLabel="Abrir meu perfil"
            >
              <MaterialCommunityIcons name="account-outline" size={24} color={colors.primaryDark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.welcome}>Boas-vindas ao Reaproveita Franca</Text>
          <Text style={styles.welcome2}>Olá, {user.name || "visitante"} 👋</Text>

          <View style={styles.viewRole}>
            <MaterialCommunityIcons
              name={user.role === "company" ? "domain" : user.role === "admin" ? "shield-account-outline" : "account-outline"}
              size={15}
              color={colors.primaryDark}
            />
            <Text style={styles.welcome3}>
              {user.role === "company" ? "Empresa parceira" : user.role === "admin" ? "Administrador" : "Comprador / Artesão"}
            </Text>
          </View>

          <Text style={styles.headerSubtitle}>
            {user.role === "company"
              ? "Acompanhe seus lotes e o impacto de cada material reaproveitado."
              : user.role === "admin"
                ? "Acompanhe a comunidade e gerencie a plataforma."
                : "Acompanhe suas reservas e descubra novos materiais."}
          </Text>

          {user.role === "company" && (
            <TouchableOpacity style={styles.buttonHeader}>
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              <Text style={styles.buttonText}>Novo Material</Text>
            </TouchableOpacity>
          )}
        </View>

        {user.role === "user" && (
          <View style={styles.section}>
            <Text style={styles.balance}>Seu balanço do mês</Text>

            <View style={styles.viewsSummary}>
              <View style={styles.viewSummary}>
                <MaterialCommunityIcons name="bookmark-outline" size={22} color={colors.primary} />
                <Text style={styles.viewSummaryTitle}>Reservados</Text>
                <Text style={styles.viewSummaryReserveEmphasis}>12</Text>
                <Text style={styles.viewSummaryFooterReserve}>
                  + 3 pendentes
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <MaterialCommunityIcons name="message-outline" size={22} color={colors.accent} />
                <Text style={styles.viewSummaryTitle}>Negociação</Text>
                <Text style={styles.viewSummaryNegociationEmphasis}>
                  3
                </Text>
                <Text style={styles.viewSummaryFooterNegociation}>
                  Chat Ativo
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <MaterialCommunityIcons name="recycle" size={22} color={colors.primaryDark} />
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
              <Text style={styles.textRecInline}>Recomendados para você</Text>
              <Text style={styles.textRec2}>Ver mais</Text>
            </View>

            <View style={styles.recViews}>
              <View style={styles.recView}>
                <View style={styles.viewImage}>
                  <Image
                    source={require("../../../assets/images/product-reserved.png")}
                    style={styles.image}
                  />
                 </View>
                <Text style={styles.recTitle}>Sobra de Solados PU</Text>
                <Text style={styles.recSubTitle}>Calçados Franca</Text>

                <View style={styles.viewFooterRec}>
                  <Text style={styles.weightRec}>120kg</Text>
                  <Text style={styles.howFar}>0.8km</Text>
                </View>
              </View>

              <View style={styles.recView}>
                <View style={styles.viewImage}>
                  <Image
                    source={require("../../../assets/images/product-reserved2.png")}
                    style={styles.image}
                  />
                </View>
                <Text style={styles.recTitle}>Retalhos Nobuck Preto</Text>
                <Text style={styles.recSubTitle}>Estilos Couros</Text>

                <View style={styles.viewFooterRec}>
                  <Text style={styles.weightRec}>45kg</Text>
                  <Text style={styles.howFar}>2.4km</Text>
                </View>
              </View>
            </View>

            <Text style={styles.textRec}>Reservas recentes</Text>

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
            <Text style={styles.balance}>Resumo do impacto</Text>

            <View style={styles.viewsSummary}>
              <View style={styles.viewSummary}>
                <MaterialCommunityIcons name="package-variant-closed" size={22} color={colors.primaryDark} />
                <Text style={styles.viewSummaryTitle}>Publicados</Text>
                <Text style={styles.viewSummaryResumeEmphasis}>
                  24 Lotes
                </Text>
                <Text style={styles.viewSummaryFooterResume}>
                  +4 este mês
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <MaterialCommunityIcons name="bookmark-outline" size={22} color={colors.primaryDark} />
                <Text style={styles.viewSummaryTitle}>Reservas</Text>
                <Text style={styles.viewSummaryResumeEmphasis}>
                  8 Ativos
                </Text>
                <Text style={styles.viewSummaryFooterResume}>
                  2 aguardando coleta
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <MaterialCommunityIcons name="leaf" size={22} color={colors.primaryDark} />
                <Text style={styles.viewSummaryTitle}>KG Desviados</Text>
                <Text style={styles.viewSummaryResumeEmphasis}>
                  1.450 KG
                </Text>
                <Text style={styles.viewSummaryFooterResume}>
                  equivalente a 4.3t CC
                </Text>
              </View>
            </View>

            <Text style={styles.textRec}>Atividades recentes</Text>

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
            <Text style={styles.balance}>Visão geral de usuários</Text>

            <View style={styles.viewsSummary}>
              <View style={styles.viewSummary}>
                <MaterialCommunityIcons name="account-group-outline" size={22} color={colors.primaryDark} />
                <Text style={styles.viewSummaryTitle}>Usuários</Text>
                <Text style={styles.viewSummaryReserveEmphasis}>170</Text>
                <Text style={styles.viewSummaryFooterReserve}>
                  + 3 Desde SET
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <MaterialCommunityIcons name="domain" size={22} color={colors.primaryDark} />
                <Text style={styles.viewSummaryTitle}>Empresa</Text>
                <Text style={styles.viewSummaryNegociationEmphasis}>15</Text>
                <Text style={styles.viewSummaryFooterNegociation}>
                  +1 Desde SET
                </Text>
              </View>

              <View style={styles.viewSummary}>
                <MaterialCommunityIcons name="shield-account-outline" size={22} color={colors.primaryDark} />
                <Text style={styles.viewSummaryTitle}>Admin</Text>
                <Text style={styles.viewSummaryAcquiredEmphasis}>1</Text>
                <Text style={styles.viewSummaryFooterAcquired}>
                  +0 Desde SET
                </Text>
              </View>
            </View>

            <Text style={styles.textRec}>Gestão do Reaproveita Franca</Text>

            <TouchableOpacity
              style={styles.buttonManagement}
              onPress={() => navigation.navigate("RegisterAdmin")}
            >
              <View style={styles.managementIcon}>
                <MaterialCommunityIcons name="account-plus-outline" size={22} color={colors.primaryDark} />
              </View>
              <Text style={styles.managementText}>Adicionar um novo ADMIN</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonManagement}>
              <View style={styles.managementIcon}>
                <MaterialCommunityIcons name="account-group-outline" size={22} color={colors.primaryDark} />
              </View>
              <Text style={styles.managementText}>Gerenciar Usuários</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonManagement}>
              <View style={styles.managementIcon}>
                <MaterialCommunityIcons name="package-variant-closed" size={22} color={colors.primaryDark} />
              </View>
              <Text style={styles.managementText}>Gerenciar Anúncios</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
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
    backgroundColor: colors.background,
  },
  errorText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 25,
    color: colors.primaryDark,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    width: "100%",
  },
  header: {
    width: "100%",
    paddingHorizontal: "5%",
    paddingTop: 20,
    paddingBottom: 28,
    backgroundColor: colors.primaryLight,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
    gap: 16,
  },
  viewBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  brandName: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primaryDark,
  },
  brandCity: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 3,
    color: colors.accent,
  },
  buttonProfile: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  welcome2: {
    marginTop: 6,
    fontSize: 26,
    lineHeight: 35,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textTransform: "capitalize"
  },
  viewRole: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  welcome3: {
    flexShrink: 1,
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  headerSubtitle: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  balance: {
    width: "90%",
    alignSelf: "center",
    marginTop: 28,
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  viewsSummary: {
    width: "90%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: 10,
    marginTop: 14,
  },
  viewSummary: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 96,
    minHeight: 160,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  viewSummaryTitle: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  viewSummaryReserveEmphasis: {
    marginTop: 6,
    fontSize: 25,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  viewSummaryNegociationEmphasis: {
    marginTop: 6,
    fontSize: 25,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  viewSummaryAcquiredEmphasis: {
    marginTop: 6,
    fontSize: 23,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  viewSummaryFooterReserve: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.primaryDark,
  },
  viewSummaryFooterNegociation: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.accent,
  },
  viewSummaryFooterAcquired: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.primaryDark,
  },
  viewSummaryResumeEmphasis: {
    marginTop: 6,
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  viewSummaryFooterResume: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  recommendationsHeader: {
    width: "90%",
    alignSelf: "center",
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  textRecInline: {
    flex: 1,
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  textRec: {
    width: "90%",
    alignSelf: "center",
    marginTop: 28,
    marginBottom: 4,
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  textRec2: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  recViews: {
    width: "90%",
    alignSelf: "center",
    marginTop: 14,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  recView: {
    flex: 1,
    minWidth: 0,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  viewImage: {
    width: "100%",
    aspectRatio: 1.35,
    borderRadius: 12,
    overflow: "hidden",
  },

  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  recTitle: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  recSubTitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  viewFooterRec: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  weightRec: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  howFar: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  viewReserve: {
    width: "90%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 100,
  },
  viewReserveTexts: {
    flex: 1,
    minWidth: 140,
  },
  textEmphasis: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  textReserve: {
    marginTop: 5,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  statusReserve: {
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 15,
    color: colors.primaryDark,
    textAlign: "center",
  },
  statusPending: {
    color: colors.accent,
    backgroundColor: "#fff7ed",
  },
  buttonHeader: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  button: {
    width: "90%",
    alignSelf: "center",
    minHeight: 54,
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
  },
  buttonManagement: {
    width: "90%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 76,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  managementIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  managementText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 20,
    color: colors.primaryDark,
  },
});
