import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef } from "react";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";

// Dados de exemplo da referência. Não representam negociações da conta logada.
const historicoExemplo = [
  {
    id: "1",
    material: "Sobra PU Calçados",
    empresa: "Fábrica Calçolar",
    quantidade: "120 kg",
    data: "Hoje, 14:30",
    status: "ativa",
    foto: require("../../../assets/images/history-pu.png"),
  },
  {
    id: "2",
    material: "Retalhos de Nobuck",
    empresa: "Curtume Silva S/A",
    quantidade: "45 kg",
    data: "Ontem, 16:15",
    status: "concluida",
    foto: require("../../../assets/images/history-nobuck.png"),
  },
  {
    id: "3",
    material: "Madeira de Pallet Maciça",
    empresa: "Expresso Francano",
    quantidade: "8 unid.",
    data: "02 de Ago, 11:00",
    status: "cancelada",
    foto: require("../../../assets/images/history-pallet.png"),
  },
];

const statusNegociacao = {
  ativa: {
    titulo: "Em andamento",
    icone: "clock-outline",
    cor: colors.accent,
    fundo: "#FEF3C7",
  },
  concluida: {
    titulo: "Concluída",
    icone: "check-circle-outline",
    cor: colors.primaryDark,
    fundo: colors.primaryLight,
  },
  cancelada: {
    titulo: "Cancelada",
    icone: "close-circle-outline",
    cor: "#DC2626",
    fundo: "#FEE2E2",
  },
};

// Quando a rota de histórico existir, substitua este retorno pela chamada da API.
// A atualização por gesto usa esta mesma função, sem simular uma chamada de rede.
async function buscarHistorico() {
  return historicoExemplo;
}

export default function HistoryScreen({ navigation }) {
  const [negociacoes, setNegociacoes] = useState(historicoExemplo);
  const [filtro, setFiltro] = useState("todas");
  const [atualizando, setAtualizando] = useState(false);
  const [negociacaoSelecionada, setNegociacaoSelecionada] = useState(null);
  const listaRef = useRef(null);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  const negociacoesFiltradas = negociacoes.filter((item) => {
    if (filtro === "ativas") return item.status === "ativa";
    if (filtro === "concluidas") return item.status === "concluida";
    return true;
  });

  const totalAtivas = negociacoes.filter((item) => item.status === "ativa").length;
  const totalConcluidas = negociacoes.filter((item) => item.status === "concluida").length;

  function mudarFiltro(value) {
    setFiltro(value);
    listaRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  async function atualizarHistorico() {
    if (atualizando) return;
    try {
      setAtualizando(true);
      const dados = await buscarHistorico();
      setNegociacoes(dados);
    } catch (error) {
      Alert.alert("Não foi possível atualizar", "Tente novamente em alguns instantes.");
    } finally {
      setAtualizando(false);
    }
  }

  function handleNavigation(item) {
    switch (item) {
      case "inicio":
        navigation.navigate("DashboardScreen");
        break;
      case "mapa":
        navigation.navigate("MapScreen");
        break;
      case "perfil":
        navigation.navigate("ProfileScreen");
        break;
      case "historico":
        listaRef.current?.scrollToOffset({ offset: 0, animated: true });
        break;
      default:
        Alert.alert("Em breve", "Esta funcionalidade estará disponível.");
    }
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.background}>
      <FlatList
        ref={listaRef}
        style={styles.list}
        data={negociacoesFiltradas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={atualizando}
        onRefresh={atualizarHistorico}
        ListHeaderComponent={
          <View>
            <View style={styles.viewIntro}>
              <View style={styles.introIcon}>
                <MaterialCommunityIcons name="history" size={25} color={colors.primaryDark} />
              </View>
              <Text style={styles.title}>Suas negociações</Text>
              <Text style={styles.subtitle}>
                Acompanhe os materiais reservados e tudo o que já foi reaproveitado.
              </Text>

              <View style={styles.viewSummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{negociacoes.length}</Text>
                  <Text style={styles.summaryLabel}>No total</Text>
                </View>
                <View style={[styles.summaryItem, styles.summaryMiddle]}>
                  <Text style={[styles.summaryNumber, { color: colors.accent }]}>{totalAtivas}</Text>
                  <Text style={styles.summaryLabel}>Ativas</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{totalConcluidas}</Text>
                  <Text style={styles.summaryLabel}>Concluídas</Text>
                </View>
              </View>
            </View>

            <View style={styles.viewFilters} accessibilityRole="tablist">
              <TouchableOpacity
                style={[styles.filterButton, filtro === "todas" && styles.filterActive]}
                onPress={() => mudarFiltro("todas")}
                accessibilityRole="tab"
                accessibilityState={{ selected: filtro === "todas" }}
              >
                <Text style={[styles.filterText, filtro === "todas" && styles.filterTextActive]}>Todas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filtro === "ativas" && styles.filterActive]}
                onPress={() => mudarFiltro("ativas")}
                accessibilityRole="tab"
                accessibilityState={{ selected: filtro === "ativas" }}
              >
                <Text style={[styles.filterText, filtro === "ativas" && styles.filterTextActive]}>Ativas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filtro === "concluidas" && styles.filterActive]}
                onPress={() => mudarFiltro("concluidas")}
                accessibilityRole="tab"
                accessibilityState={{ selected: filtro === "concluidas" }}
              >
                <Text style={[styles.filterText, filtro === "concluidas" && styles.filterTextActive]}>Concluídas</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listHeading}>
              <Text style={styles.listTitle}>
                {negociacoesFiltradas.length} {negociacoesFiltradas.length === 1 ? "negociação" : "negociações"}
              </Text>
              <View style={styles.refreshHint}>
                <MaterialCommunityIcons name="refresh" size={14} color={colors.textSecondary} />
                <Text style={styles.refreshText}>Puxe para atualizar</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const status = statusNegociacao[item.status];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => setNegociacaoSelecionada(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.material}, ${status.titulo}, ${item.quantidade}. Ver detalhes.`}
            >
              <View style={styles.viewPhoto}>
                <Image source={item.foto} style={styles.photo} />
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: status.fundo }]}>
                    <MaterialCommunityIcons name={status.icone} size={12} color={status.cor} />
                    <Text style={[styles.statusText, { color: status.cor }]}>{status.titulo}</Text>
                  </View>
                  <Text style={styles.date}>{item.data}</Text>
                </View>
                <Text style={styles.material}>{item.material}</Text>
                <Text style={styles.company}>{item.empresa}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.quantity}>{item.quantidade}</Text>
                  <View style={styles.detailsLink}>
                    <Text style={styles.detailsText}>Ver detalhes</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={34} color={colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma negociação por aqui</Text>
            <Text style={styles.emptyText}>
              {filtro === "todas"
                ? "Suas negociações aparecerão aqui conforme você reservar materiais."
                : "Não há negociações nessa categoria. Confira os outros filtros."}
            </Text>
            {filtro !== "todas" && (
              <TouchableOpacity style={styles.emptyButton} onPress={() => mudarFiltro("todas")}>
                <Text style={styles.emptyButtonText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <NavBar estagio="comprador" ativo="historico" onNavigate={handleNavigation} />

      <Modal
        visible={!!negociacaoSelecionada}
        transparent
        animationType="fade"
        onRequestClose={() => setNegociacaoSelecionada(null)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          {negociacaoSelecionada && (
            <View style={styles.modalCard} accessibilityViewIsModal>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalhes da negociação</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setNegociacaoSelecionada(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar detalhes"
                  >
                    <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalPhotoView}>
                  <Image source={negociacaoSelecionada.foto} style={styles.photo} />
                </View>

                <Text style={styles.modalMaterial}>{negociacaoSelecionada.material}</Text>
                <Text style={styles.modalCompany}>{negociacaoSelecionada.empresa}</Text>

                <View style={styles.informationRow}>
                  <Text style={styles.informationLabel}>Quantidade</Text>
                  <Text style={styles.informationValue}>{negociacaoSelecionada.quantidade}</Text>
                </View>
                <View style={styles.informationRow}>
                  <Text style={styles.informationLabel}>Registro</Text>
                  <Text style={styles.informationValue}>{negociacaoSelecionada.data}</Text>
                </View>
                <View style={styles.informationRow}>
                  <Text style={styles.informationLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusNegociacao[negociacaoSelecionada.status].fundo }]}>
                    <Text style={[styles.statusText, { color: statusNegociacao[negociacaoSelecionada.status].cor }]}>
                      {statusNegociacao[negociacaoSelecionada.status].titulo}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.modalButton} onPress={() => setNegociacaoSelecionada(null)}>
                  <Text style={styles.modalButtonText}>Voltar ao histórico</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    minHeight: 64,
    paddingHorizontal: "5%",
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primaryDark,
    textAlign: "center",
  },
  buttonProfile: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: "5%",
    paddingTop: 20,
    paddingBottom: 120,
  },
  viewIntro: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginTop: 16,
    fontFamily: fonts.bold,
    fontSize: 25,
    color: colors.primaryDark,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  viewSummary: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    flexDirection: "row",
    alignItems: "stretch",
  },
  summaryItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  summaryMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderMuted,
  },
  summaryNumber: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.primaryDark,
  },
  summaryLabel: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
  },
  viewFilters: {
    marginTop: 22,
    padding: 4,
    flexDirection: "row",
    gap: 4,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
  },
  filterButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filterActive: {
    backgroundColor: colors.white,
  },
  filterText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  filterTextActive: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  listHeading: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  listTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  refreshHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  refreshText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  viewPhoto: {
    width: 72,
    height: 72,
    flexShrink: 0,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.primaryLight,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardDetails: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  statusBadge: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
  },
  statusText: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 14,
  },
  date: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  material: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  company: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  quantity: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.accent,
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  detailsText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  emptyView: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 18,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primaryDark,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyButton: {
    minHeight: 44,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  modalOverlay: {
    flex: 1,
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    borderRadius: 24,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.primaryDark,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  modalPhotoView: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalMaterial: {
    marginTop: 18,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.primaryDark,
  },
  modalCompany: {
    marginTop: 4,
    marginBottom: 20,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  informationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  informationLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  informationValue: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  modalButton: {
    minHeight: 52,
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
  },
});
