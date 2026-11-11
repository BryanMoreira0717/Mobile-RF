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
import { useState, useRef, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import api from "../../services/axios";

// Status das compras no banco: pending, accepted, refused, cancelled, completed.
const statusNegociacao = {
  pending: {
    titulo: "Aguardando aceite",
    icone: "clock-outline",
    cor: colors.accent,
    fundo: colors.warningLight,
  },
  accepted: {
    titulo: "Aceita",
    icone: "handshake-outline",
    cor: colors.primaryDeep,
    fundo: colors.primaryLight,
  },
  completed: {
    titulo: "Concluída",
    icone: "check-circle-outline",
    cor: colors.primaryDark,
    fundo: colors.primaryLight,
  },
  refused: {
    titulo: "Recusada",
    icone: "close-circle-outline",
    cor: colors.error,
    fundo: colors.errorLight,
  },
  cancelled: {
    titulo: "Cancelada",
    icone: "close-circle-outline",
    cor: colors.error,
    fundo: colors.errorLight,
  },
};

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR") + ", " +
    data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Foto em base64 do produto (mesma regra do marketplace).
function montarFoto(produto) {
  const foto = produto?.photos?.find((item) => item.photo)?.photo;
  if (!foto) return null;
  if (foto.startsWith("data:image/")) return foto;
  let tipo = "image/jpeg";
  if (foto.startsWith("iVBOR")) tipo = "image/png";
  else if (foto.startsWith("UklGR")) tipo = "image/webp";
  return "data:" + tipo + ";base64," + foto;
}

// Busca as compras do usuário e completa cada uma com itens e foto.
async function buscarHistorico() {
  // Dispara as consultas juntas e só depois espera as respostas.
  const comprasRequest = api.getShoppings();
  const produtosRequest = api.getProducts();

  // Se uma consulta falhar antes desta ser esperada, o erro cai no catch
  // de quem chamou em vez de aparecer como "Uncaught (in promise)".
  produtosRequest.catch(() => {});

  const responseCompras = await comprasRequest;
  const compras = Array.isArray(responseCompras.data) ? responseCompras.data : [];

  // Um detalhe por compra, todos saindo ao mesmo tempo.
  const detalhesRequests = compras.map((compra) => api.getShoppingById(compra.id));
  detalhesRequests.forEach((request) => request.catch(() => {}));

  const responseProdutos = await produtosRequest;
  const produtos = Array.isArray(responseProdutos.data) ? responseProdutos.data : [];

  const lista = [];

  for (let i = 0; i < compras.length; i++) {
    const compra = compras[i];
    const responseDetalhe = await detalhesRequests[i];
    const itens = Array.isArray(responseDetalhe.data?.items) ? responseDetalhe.data.items : [];
    const item = itens[0];
    const produto = item ? produtos.find((p) => p.id === item.id_product) : null;

    lista.push({
      id: compra.id,
      material: item
        ? item.product_name + (itens.length > 1 ? " e mais " + (itens.length - 1) : "")
        : "Reserva",
      empresa: Number(compra.value) > 0 ? formatarPreco(compra.value) : "Doação",
      quantidade: item ? item.quantity + " unid." : "",
      data: formatarData(compra.datetime),
      status: statusNegociacao[compra.status] ? compra.status : "pending",
      foto: montarFoto(produto),
      valor: Number(compra.value),
      // Empresa dona do material: é com ela que o comprador conversa.
      vendedor: item ? item.seller_id : null,
    });
  }

  return lista;
}

export default function HistoryScreen({ navigation }) {
  const [negociacoes, setNegociacoes] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState("");
  const [negociacaoSelecionada, setNegociacaoSelecionada] = useState(null);
  // Situação do pagamento da reserva aberta: "carregando", "aprovado", "andamento" ou "nenhum".
  const [pagamento, setPagamento] = useState("nenhum");
  const listaRef = useRef(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      carregarHistorico();
    }
  }, [isFocused]);

  async function carregarHistorico() {
    try {
      setCarregando(true);
      setErro("");
      const storedUser = await AsyncStorage.getItem("@user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      if (!parsedUser || !parsedUser.id) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }
      const dados = await buscarHistorico();
      setNegociacoes(dados);
    } catch (error) {
      console.log("Erro ao carregar histórico:", error.response?.data || error.message);
      setErro("Não foi possível carregar suas negociações.");
    } finally {
      setCarregando(false);
    }
  }

  async function cancelarReserva(negociacao) {
    if (cancelando) return;
    try {
      setCancelando(true);
      await api.cancelShopping(negociacao.id);
      setNegociacaoSelecionada(null);
      Alert.alert("Reserva cancelada", "O fornecedor foi avisado do cancelamento.");
      const dados = await buscarHistorico();
      setNegociacoes(dados);
    } catch (error) {
      console.log("Erro ao cancelar reserva:", error.response?.data || error.message);
      Alert.alert("Não foi possível cancelar", error.response?.data?.error || "Tente novamente em alguns instantes.");
    } finally {
      setCancelando(false);
    }
  }

  function confirmarCancelamento(negociacao) {
    Alert.alert("Cancelar reserva", "Deseja cancelar esta reserva?", [
      { text: "Voltar", style: "cancel" },
      { text: "Cancelar reserva", style: "destructive", onPress: () => cancelarReserva(negociacao) },
    ]);
  }

  // Aceite antes do pagamento: ao abrir uma reserva aceita, confere se já foi paga.
  async function abrirNegociacao(negociacao) {
    setNegociacaoSelecionada(negociacao);
    setPagamento("nenhum");

    if (negociacao.status !== "accepted" || !(negociacao.valor > 0)) return;

    try {
      setPagamento("carregando");
      const response = await api.getPaymentsByShopping(negociacao.id);
      const lista = Array.isArray(response.data) ? response.data : [];

      if (lista.some((item) => item.status === "approved")) setPagamento("aprovado");
      else if (lista.some((item) => item.status === "pending")) setPagamento("andamento");
      else setPagamento("nenhum");
    } catch (error) {
      console.log("Erro ao consultar pagamento:", error.response?.data || error.message);
      setPagamento("nenhum");
    }
  }

  function pagarReserva(negociacao) {
    setNegociacaoSelecionada(null);
    navigation.navigate("PaymentMethodScreen", { shoppingId: negociacao.id });
  }

  // Abre (ou cria) a conversa com a empresa vendedora desta reserva.
  async function conversarComEmpresa(negociacao) {
    try {
      const response = await api.createConversation(negociacao.vendedor);
      setNegociacaoSelecionada(null);
      navigation.navigate("ChatScreen", { conversationId: response.data.conversationId });
    } catch (error) {
      console.log("Erro ao abrir conversa:", error.response?.data || error.message);
      Alert.alert("Não foi possível abrir o chat", error.response?.data?.error || "Tente novamente.");
    }
  }

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Gelasio_400Regular,
    Gelasio_400Regular_Italic,
    Gelasio_700Bold,
  });

  const negociacoesFiltradas = negociacoes.filter((item) => {
    if (filtro === "ativas") return item.status === "pending" || item.status === "accepted";
    if (filtro === "concluidas") return item.status === "completed";
    return true;
  });

  const totalAtivas = negociacoes.filter((item) => item.status === "pending" || item.status === "accepted").length;
  const totalConcluidas = negociacoes.filter((item) => item.status === "completed").length;

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
      console.log("Erro ao atualizar histórico:", error.response?.data || error.message);
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
      case "marketplace":
        navigation.navigate("MarketplaceScreen");
        break;
      default:
        Alert.alert("Em breve", "Esta funcionalidade estará disponível.");
    }
  }

  if (!fontsLoaded || (carregando && negociacoes.length === 0)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (erro && negociacoes.length === 0) {
    return (
      <View style={styles.loading}>
        <Text style={styles.emptyText}>{erro}</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={carregarHistorico}>
          <Text style={styles.emptyButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
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
              <Text style={styles.eyebrow}>Movimentação dos materiais</Text>
              <Text style={styles.title}>Negociações</Text>
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
              onPress={() => abrirNegociacao(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.material}, ${status.titulo}, ${item.quantidade}. Ver detalhes.`}
            >
              <View style={styles.viewPhoto}>
                {item.foto ? (
                  <Image source={{ uri: item.foto }} style={styles.photo} />
                ) : (
                  <MaterialCommunityIcons name="package-variant-closed" size={30} color={colors.primaryDark} />
                )}
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
                  {negociacaoSelecionada.foto ? (
                    <Image source={{ uri: negociacaoSelecionada.foto }} style={styles.photo} />
                  ) : (
                    <MaterialCommunityIcons name="package-variant-closed" size={40} color={colors.primaryDark} />
                  )}
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

                {/* Aceite antes do pagamento: primeiro a empresa aceita, depois o comprador paga. */}
                {negociacaoSelecionada.status === "pending" && (
                  <View style={styles.paymentInfo}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={colors.accent} />
                    <Text style={styles.paymentInfoText}>
                      {negociacaoSelecionada.valor > 0
                        ? "Aguardando a empresa aceitar. O pagamento é liberado depois do aceite."
                        : "Aguardando a empresa aceitar a doação."}
                    </Text>
                  </View>
                )}

                {negociacaoSelecionada.status === "accepted" && negociacaoSelecionada.valor > 0 && pagamento === "carregando" && (
                  <ActivityIndicator style={styles.paymentLoading} color={colors.primary} />
                )}

                {negociacaoSelecionada.status === "accepted" && negociacaoSelecionada.valor > 0 && pagamento === "aprovado" && (
                  <View style={styles.paymentInfo}>
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
                    <Text style={styles.paymentInfoText}>Pagamento confirmado. Combine a retirada com a empresa.</Text>
                  </View>
                )}

                {negociacaoSelecionada.status === "accepted" && negociacaoSelecionada.valor > 0 && ["nenhum", "andamento"].includes(pagamento) && (
                  <>
                    <View style={styles.paymentInfo}>
                      <MaterialCommunityIcons name="handshake-outline" size={20} color={colors.primary} />
                      <Text style={styles.paymentInfoText}>
                        A empresa aceitou a sua reserva. Pague em até 48 horas para garantir o material.
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.modalButton} onPress={() => pagarReserva(negociacaoSelecionada)}>
                      <Text style={styles.modalButtonText}>
                        {pagamento === "andamento" ? "Continuar pagamento" : "Pagar reserva"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {(negociacaoSelecionada.status === "pending" ||
                  (negociacaoSelecionada.status === "accepted" && pagamento === "nenhum")) && (
                  <TouchableOpacity
                    style={styles.modalButtonOutline}
                    onPress={() => confirmarCancelamento(negociacaoSelecionada)}
                    disabled={cancelando}
                  >
                    {cancelando ? (
                      <ActivityIndicator color={colors.primaryDark} />
                    ) : (
                      <Text style={styles.modalButtonOutlineText}>Cancelar reserva</Text>
                    )}
                  </TouchableOpacity>
                )}

                {negociacaoSelecionada.vendedor && (
                  <TouchableOpacity style={styles.modalButtonOutline} onPress={() => conversarComEmpresa(negociacaoSelecionada)}>
                    <Text style={styles.modalButtonOutlineText}>Conversar com a empresa</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.modalButtonOutline} onPress={() => setNegociacaoSelecionada(null)}>
                  <Text style={styles.modalButtonOutlineText}>Voltar ao histórico</Text>
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
    paddingTop: 12,
    paddingBottom: 4,
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 8,
    right: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 34,
    color: colors.primaryDark,
    lineHeight: 40,
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    maxWidth: "85%",
  },
  viewSummary: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 0,
    backgroundColor: colors.primaryLight,
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
    marginTop: 18,
    padding: 6,
    flexDirection: "row",
    gap: 4,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
    backgroundColor: colors.primaryDark,
  },
  filterText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  filterTextActive: {
    fontFamily: fonts.bold,
    color: colors.white,
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
    borderRadius: 20,
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
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 100,
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
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.primaryDark,
    textAlign: "center",
    lineHeight: 30,
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
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 30,
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
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
  },
  modalButtonOutline: {
    minHeight: 52,
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonOutlineText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryDark,
    textAlign: "center",
  },
  eyebrow: {
    marginBottom: 10,
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
  },
  paymentInfoText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  paymentLoading: {
    marginTop: 18,
  },
});
