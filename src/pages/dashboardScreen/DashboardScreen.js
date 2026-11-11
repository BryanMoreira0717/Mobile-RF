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
  Manrope_800ExtraBold
} from "@expo-google-fonts/manrope";
import {
  Gelasio_400Regular,
  Gelasio_400Regular_Italic,
  Gelasio_700Bold
} from "@expo-google-fonts/gelasio";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import api from "../../services/axios";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";
import Brand from "../../components/Brand";
import { getSocket, setupNotifications } from "../../services/socket";

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const isFocused = useIsFocused();

  const statusTexto = {
    pending: "Aguardando aprovação",
    accepted: "Aprovado",
    completed: "Concluído",
    refused: "Recusado",
    cancelled: "Cancelado",
  };

  function formatarKg(valor) {
    return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " KG";
  }

  function formatarData(valor) {
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "";
    return data.toLocaleDateString("pt-BR") + " às " +
      data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  // Foto em base64 do produto (mesma regra do marketplace).
  function getPhoto(produto) {
    const foto = produto.photos?.find((item) => item.photo)?.photo;
    if (!foto) return null;
    if (foto.startsWith("data:image/")) return foto;
    let tipo = "image/jpeg";
    if (foto.startsWith("iVBOR")) tipo = "image/png";
    else if (foto.startsWith("UklGR")) tipo = "image/webp";
    return "data:" + tipo + ";base64," + foto;
  }

  function somarImpactos(impactos) {
    let peso = 0;
    let co2 = 0;
    for (const impacto of impactos) {
      peso += Number(impacto.estimated_weight_kg) || 0;
      co2 += Number(impacto.co2_saved_kg) || 0;
    }
    return { peso, co2 };
  }

  // Total de mensagens não lidas em todas as conversas do chat.
  function somarNaoLidas(conversas) {
    let total = 0;
    for (const conversa of conversas) {
      total += Number(conversa.unreadCount) || 0;
    }
    return total;
  }

  // Números do painel calculados a partir das rotas da API, conforme o perfil.
  async function loadDashboard(currentUser) {
    try {
      setDashboardError("");

      if (currentUser.role === "user") {
        // Dispara todas as consultas juntas e só depois espera as respostas.
        // Produtos e conversas são opcionais: se falharem, o resto aparece.
        const comprasRequest = api.getShoppings();
        const produtosRequest = api.getProducts().catch(() => null);
        const impactosRequest = api.getEnvironmentalImpacts();
        const conversasRequest = api.getConversations().catch(() => null);

        // Se uma consulta falhar antes desta ser esperada, o erro cai no catch
        // do painel em vez de aparecer como "Uncaught (in promise)".
        impactosRequest.catch(() => {});

        const responseCompras = await comprasRequest;
        const compras = Array.isArray(responseCompras.data) ? responseCompras.data : [];

        // Detalhes das 2 reservas mais recentes, também em paralelo.
        const detalhesRequests = compras.slice(0, 2).map((compra) => api.getShoppingById(compra.id));
        detalhesRequests.forEach((request) => request.catch(() => {}));

        const responseProdutos = await produtosRequest;
        const produtos = responseProdutos && Array.isArray(responseProdutos.data) ? responseProdutos.data : [];

        if (!responseProdutos) {
          setDashboardError("Alguns dados não carregaram. Puxe para atualizar.");
        }

        const responseImpactos = await impactosRequest;
        const impactos = Array.isArray(responseImpactos.data) ? responseImpactos.data : [];
        const responseConversas = await conversasRequest;
        const conversas = responseConversas && Array.isArray(responseConversas.data) ? responseConversas.data : [];

        const recentes = [];
        for (let i = 0; i < detalhesRequests.length; i++) {
          const compra = compras[i];
          const responseDetalhe = await detalhesRequests[i];
          const item = responseDetalhe.data?.items?.[0];
          recentes.push({
            id: compra.id,
            titulo: item ? item.quantity + " unid. de " + item.product_name : "Reserva",
            status: compra.status,
            data: formatarData(compra.datetime),
          });
        }

        const recomendados = produtos
          .filter((item) =>
            item.status === "available" &&
            Number(item.quantity) > 0 &&
            String(item.id_user).toLowerCase() !== String(currentUser.id).toLowerCase()
          )
          .slice(0, 2);

        // Pendências do comprador: reservas aceitas (venda) que ainda não foram pagas.
        const aceitas = compras.filter((item) => item.status === "accepted" && Number(item.value) > 0);
        const pagamentos = await Promise.all(
          aceitas.map((compra) => api.getPaymentsByShopping(compra.id).then((res) => res.data).catch(() => []))
        );
        const aguardandoPagamento = pagamentos.filter((lista) =>
          !(Array.isArray(lista) && lista.some((pagamento) => pagamento.status === "approved"))
        ).length;

        setDashboard({
          aguardandoPagamento,
          reservados: compras.filter((item) => item.status === "pending" || item.status === "accepted").length,
          pendentes: compras.filter((item) => item.status === "pending").length,
          conversas: conversas.length,
          mensagensNaoLidas: somarNaoLidas(conversas),
          concluidas: compras.filter((item) => item.status === "completed").length,
          impacto: somarImpactos(impactos),
          recentes,
          recomendados,
        });
      }

      if (currentUser.role === "company") {
        // Dispara as três consultas juntas e só depois espera as respostas.
        // Produtos são opcionais: se falharem, notificações e impacto aparecem.
        const produtosRequest = api.getProducts().catch(() => null);
        const notificacoesRequest = api.getNotifications();
        const impactosRequest = api.getEnvironmentalImpacts();
        // Conversas são opcionais: só alimentam o aviso de mensagens não lidas.
        const conversasRequest = api.getConversations().catch(() => null);

        // Se uma consulta falhar antes desta ser esperada, o erro cai no catch
        // do painel em vez de aparecer como "Uncaught (in promise)".
        notificacoesRequest.catch(() => {});
        impactosRequest.catch(() => {});

        const responseProdutos = await produtosRequest;
        const produtos = responseProdutos && Array.isArray(responseProdutos.data) ? responseProdutos.data : [];

        if (!responseProdutos) {
          setDashboardError("Alguns dados não carregaram. Puxe para atualizar.");
        }
        const meus = produtos.filter((item) =>
          String(item.id_user).toLowerCase() === String(currentUser.id).toLowerCase()
        );
        const responseNotificacoes = await notificacoesRequest;
        const notificacoes = Array.isArray(responseNotificacoes.data) ? responseNotificacoes.data : [];
        const responseImpactos = await impactosRequest;
        const impactos = Array.isArray(responseImpactos.data) ? responseImpactos.data : [];
        const solicitacoes = notificacoes.filter((item) => item.type === "reserva_solicitada");
        const responseConversas = await conversasRequest;
        const conversas = responseConversas && Array.isArray(responseConversas.data) ? responseConversas.data : [];

        setDashboard({
          mensagensNaoLidas: somarNaoLidas(conversas),
          publicados: meus.length,
          disponiveis: meus.filter((item) => item.status === "available").length,
          solicitacoes: solicitacoes.length,
          naoLidas: solicitacoes.filter((item) => !item.read).length,
          impacto: somarImpactos(impactos),
          atividades: notificacoes.slice(0, 3),
        });
      }

      if (currentUser.role === "admin") {
        const responseUsuarios = await api.getUsers();
        const usuarios = Array.isArray(responseUsuarios.data) ? responseUsuarios.data : [];
        const umMesAtras = Date.now() - 30 * 24 * 60 * 60 * 1000;

        function contar(role) {
          const lista = usuarios.filter((item) => item.role === role);
          return {
            total: lista.length,
            novos: lista.filter((item) => new Date(item.createdIn).getTime() >= umMesAtras).length,
          };
        }

        setDashboard({
          usuarios: contar("user"),
          empresas: contar("company"),
          admins: contar("admin"),
        });
      }
    } catch (error) {
      console.log("Erro ao carregar painel:", error.response?.data || error.message);
      setDashboardError("Não foi possível carregar os números do painel.");
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

      // Mostra a tela na hora com os dados salvos; o resto chega depois.
      setUser(parsedUser);
      setLoadingUser(false);

      // Comprador e empresa ficam conectados ao chat para receber aviso
      // (toque, vibração e notificação) de mensagem nova em qualquer tela.
      if (parsedUser.role === "user" || parsedUser.role === "company") {
        setupNotifications();
        getSocket();
      }

      // As duas consultas saem juntas, sem uma esperar a outra.
      const userRequest = api.getUserById(parsedUser.id);
      const dashboardRequest = loadDashboard(parsedUser);

      const response = await userRequest;
      const updatedUser = {
        ...parsedUser,
        ...response.data
      };

      await AsyncStorage.setItem("@user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      await dashboardRequest;
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
      case "marketplace":
        navigation.navigate("MarketplaceScreen");
        break;
      case "historico":
        navigation.navigate("HistoryScreen");
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

  // Chamada e título do painel, como nas páginas do site.
  const chamada =
    user.role === "company" ? "Meus anúncios" : user.role === "admin" ? "Administração" : "Materiais que continuam";
  const subtitulo =
    user.role === "company"
      ? "Seus materiais em vitrine. Acompanhe lotes, pedidos e o impacto de cada material reaproveitado."
      : user.role === "admin"
        ? "Acompanhe a comunidade e gerencie a plataforma."
        : "Sua próxima criação começa com uma nova possibilidade.";

  return (
    <SafeAreaView
      style={styles.background}
      edges={["top", "left", "right", "bottom"]}
    >
      {/* Cabeçalho do painel do site: letreiro serifado + ações */}
      <View style={styles.header}>
        <Brand serifada />

        <View style={styles.headerButtons}>
          {/* Pendências da empresa: solicitações de reserva aguardando resposta. */}
          {user.role === "company" && (
            <TouchableOpacity
              style={styles.buttonIcon}
              onPress={() => navigation.navigate("ReservationRequestsScreen")}
              accessibilityRole="button"
              accessibilityLabel="Abrir solicitações de reserva pendentes"
            >
              <MaterialCommunityIcons name="clipboard-text-clock-outline" size={22} color={colors.primaryDark} />

              {dashboard && dashboard.naoLidas > 0 && (
                <View style={styles.badgeChat}>
                  <Text style={styles.badgeChatText}>
                    {dashboard.naoLidas > 99 ? "99+" : dashboard.naoLidas}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Pendências do comprador: reservas ativas; o selo conta as aceitas e não pagas. */}
          {user.role === "user" && (
            <TouchableOpacity
              style={styles.buttonIcon}
              onPress={() => navigation.navigate("HistoryScreen", { filtro: "ativas" })}
              accessibilityRole="button"
              accessibilityLabel="Abrir reservas pendentes"
            >
              <MaterialCommunityIcons name="clipboard-text-clock-outline" size={22} color={colors.primaryDark} />

              {dashboard && dashboard.aguardandoPagamento > 0 && (
                <View style={styles.badgeChat}>
                  <Text style={styles.badgeChatText}>
                    {dashboard.aguardandoPagamento > 99 ? "99+" : dashboard.aguardandoPagamento}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Chat é entre comprador e empresa; o admin não tem conversas. */}
          {user.role !== "admin" && (
            <TouchableOpacity
              style={styles.buttonIcon}
              onPress={() => navigation.navigate("ConversationsScreen")}
              accessibilityRole="button"
              accessibilityLabel="Abrir mensagens"
            >
              <MaterialCommunityIcons name="message-text-outline" size={22} color={colors.primaryDark} />

              {dashboard && dashboard.mensagensNaoLidas > 0 && (
                <View style={styles.badgeChat}>
                  <Text style={styles.badgeChatText}>
                    {dashboard.mensagensNaoLidas > 99 ? "99+" : dashboard.mensagensNaoLidas}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.buttonProfile}
            onPress={() => navigation.navigate("ProfileScreen")}
            accessibilityRole="button"
            accessibilityLabel="Abrir meu perfil"
          >
            <MaterialCommunityIcons name="account-outline" size={20} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

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
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>{chamada}</Text>
          <Text style={styles.title}>Olá, {user.name || "visitante"}</Text>
          <Text style={styles.subtitle}>{subtitulo}</Text>

          <View style={styles.viewRole}>
            <MaterialCommunityIcons
              name={user.role === "company" ? "office-building-outline" : user.role === "admin" ? "shield-account-outline" : "account-outline"}
              size={15}
              color={colors.primaryDark}
            />
            <Text style={styles.textRole}>
              {user.role === "company" ? "Empresa parceira" : user.role === "admin" ? "Administrador" : "Comprador / Artesão"}
            </Text>
          </View>

          {user.role === "company" && (
            <TouchableOpacity style={styles.buttonHeader} onPress={() => navigation.navigate("NewMaterialScreen")}>
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              <Text style={styles.buttonText}>Publicar material</Text>
            </TouchableOpacity>
          )}
        </View>

        {dashboardError ? (
          <Text style={styles.errorBanner}>{dashboardError}</Text>
        ) : null}

        {/* Faixa verde com a pilha de couro (vitrine do site) */}
        {user.role !== "admin" && (
          <View style={styles.banner}>
            <Text style={styles.bannerEyebrow}>Da indústria para a criação</Text>
            <Text style={styles.bannerTitle}>
              Novos destinos.{"\n"}<Text style={styles.bannerTitleEm}>Novas possibilidades.</Text>
            </Text>
            <Text style={styles.bannerText}>
              {user.role === "company"
                ? "Uma vitrine para o que sua empresa tem a oferecer."
                : "Materiais de empresas de Franca esperando uma nova história."}
            </Text>

            <View style={styles.bannerChips}>
              {user.role === "company" ? (
                <>
                  <Text style={styles.bannerChip}>{dashboard ? dashboard.publicados : "–"} publicados</Text>
                  <Text style={styles.bannerChip}>{dashboard ? dashboard.disponiveis : "–"} disponíveis</Text>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.bannerButton}
                  onPress={() => navigation.navigate("MarketplaceScreen")}
                >
                  <Text style={styles.bannerButtonText}>Explorar materiais</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={colors.primaryDark} />
                </TouchableOpacity>
              )}
            </View>

            <Image
              source={require("../../../assets/images/web/leather-stack.webp")}
              style={styles.bannerImage}
            />
          </View>
        )}

        {user.role === "user" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seu balanço</Text>

            {/* Totais em linha com números serifados, como no site */}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{dashboard ? dashboard.reservados : "–"}</Text>
                <Text style={styles.statLabel}>Reservados</Text>
                <Text style={styles.statFooter}>{dashboard ? dashboard.pendentes + " pendentes" : ""}</Text>
              </View>

              <TouchableOpacity
                style={[styles.stat, styles.statBorder]}
                onPress={() => navigation.navigate("ConversationsScreen")}
              >
                <Text style={styles.statNumber}>{dashboard ? dashboard.conversas : "–"}</Text>
                <Text style={styles.statLabel}>Negociação</Text>
                <Text style={[styles.statFooter, dashboard && dashboard.mensagensNaoLidas > 0 && styles.statFooterAccent]}>
                  {dashboard && dashboard.mensagensNaoLidas > 0
                    ? dashboard.mensagensNaoLidas + " não lidas"
                    : dashboard && dashboard.conversas === 1 ? "Conversa" : "Conversas"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stat, styles.statBorder]}
                onPress={() => navigation.navigate("ImpactScreen")}
              >
                <Text style={styles.statNumber}>{dashboard ? formatarKg(dashboard.impacto.peso) : "–"}</Text>
                <Text style={styles.statLabel}>Adquiridos</Text>
                <Text style={styles.statFooter}>{dashboard ? dashboard.concluidas + " concluídas" : ""}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleInline}>Recomendados para você</Text>
              <TouchableOpacity onPress={() => navigation.navigate("MarketplaceScreen")}>
                <Text style={styles.link}>Ver mais</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cards}>
              {dashboard && dashboard.recomendados.length === 0 && (
                <Text style={styles.emptyText}>Nenhum material disponível no momento.</Text>
              )}

              {dashboard && dashboard.recomendados.map((produto) => (
                <TouchableOpacity
                  key={produto.id}
                  style={styles.card}
                  onPress={() => navigation.navigate("MaterialDetailsScreen", { productId: produto.id })}
                >
                  <View style={styles.cardImage}>
                    {getPhoto(produto) ? (
                      <Image source={{ uri: getPhoto(produto) }} style={styles.image} />
                    ) : (
                      <MaterialCommunityIcons name="package-variant-closed" size={34} color={colors.primaryDark} />
                    )}
                    <Text style={styles.cardTag}>
                      {produto.type_negotiation === "donation" ? "Doação" : "Venda"}
                    </Text>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardCategory} numberOfLines={1}>{produto.category}</Text>
                    <Text style={styles.cardTitle} numberOfLines={2}>{produto.name}</Text>
                    <Text style={styles.cardPrice}>
                      {produto.type_negotiation === "donation"
                        ? "Doação"
                        : Number(produto.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {produto.quantity} un. · {Number(produto.weight).toLocaleString("pt-BR")} kg
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Reservas recentes</Text>

            {dashboard && dashboard.recentes.length === 0 && (
              <Text style={styles.emptyText}>Você ainda não fez reservas.</Text>
            )}

            {dashboard && dashboard.recentes.length > 0 && (
              <View style={styles.ledger}>
                {dashboard.recentes.map((reserva, index) => (
                  <TouchableOpacity
                    key={reserva.id}
                    style={[styles.ledgerRow, index > 0 && styles.ledgerBorder]}
                    onPress={() => navigation.navigate("HistoryScreen")}
                  >
                    <View style={styles.ledgerTexts}>
                      <Text style={styles.ledgerTitle}>{reserva.titulo}</Text>
                      <Text style={styles.ledgerDate}>{reserva.data}</Text>
                    </View>

                    <Text style={[styles.status, reserva.status === "pending" && styles.statusPending]}>
                      {statusTexto[reserva.status] || reserva.status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {user.role === "company" && (
          <View style={styles.section}>
            {/* Acesso principal às solicitações: a empresa aceita antes de o comprador pagar. */}
            <TouchableOpacity
              style={styles.requestsCard}
              onPress={() => navigation.navigate("ReservationRequestsScreen")}
              accessibilityRole="button"
              accessibilityLabel="Abrir solicitações de reserva"
            >
              <View style={styles.requestsIcon}>
                <MaterialCommunityIcons name="clipboard-text-clock-outline" size={24} color={colors.background} />
              </View>

              <View style={styles.requestsTexts}>
                <Text style={styles.requestsEyebrow}>Negociações</Text>
                <Text style={styles.requestsTitle}>Solicitações de reserva</Text>
                <Text style={styles.requestsText}>
                  {dashboard && dashboard.naoLidas > 0
                    ? dashboard.naoLidas + (dashboard.naoLidas === 1 ? " pedido aguardando sua resposta" : " pedidos aguardando sua resposta")
                    : "Aceite ou recuse os pedidos. O comprador só paga depois do aceite."}
                </Text>
              </View>

              {dashboard && dashboard.naoLidas > 0 ? (
                <View style={styles.requestsBadge}>
                  <Text style={styles.requestsBadgeText}>{dashboard.naoLidas > 99 ? "99+" : dashboard.naoLidas}</Text>
                </View>
              ) : (
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.primaryDark} />
              )}
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Resumo do impacto</Text>

            <View style={styles.stats}>
              <TouchableOpacity
                style={styles.stat}
                onPress={() => navigation.navigate("MyAdvertisementsScreen")}
              >
                <Text style={styles.statNumber}>{dashboard ? dashboard.publicados : "–"}</Text>
                <Text style={styles.statLabel}>Lotes publicados</Text>
                <Text style={styles.statFooter}>{dashboard ? dashboard.disponiveis + " disponíveis" : ""}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stat, styles.statBorder]}
                onPress={() => navigation.navigate("ReservationRequestsScreen")}
              >
                <Text style={styles.statNumber}>{dashboard ? dashboard.solicitacoes : "–"}</Text>
                <Text style={styles.statLabel}>Pedidos</Text>
                <Text style={[styles.statFooter, dashboard && dashboard.naoLidas > 0 && styles.statFooterAccent]}>
                  {dashboard ? dashboard.naoLidas + " não lidos" : ""}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stat, styles.statBorder]}
                onPress={() => navigation.navigate("ImpactScreen")}
              >
                <Text style={styles.statNumber}>{dashboard ? formatarKg(dashboard.impacto.peso) : "–"}</Text>
                <Text style={styles.statLabel}>Desviados</Text>
                <Text style={styles.statFooter}>
                  {dashboard ? formatarKg(dashboard.impacto.co2) + " de CO₂" : ""}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Atividades recentes</Text>

            {dashboard && dashboard.atividades.length === 0 && (
              <Text style={styles.emptyText}>Nenhuma atividade ainda.</Text>
            )}

            {dashboard && dashboard.atividades.length > 0 && (
              <View style={styles.ledger}>
                {dashboard.atividades.map((atividade, index) => (
                  <TouchableOpacity
                    key={atividade.id}
                    style={[styles.ledgerRow, index > 0 && styles.ledgerBorder]}
                    onPress={() =>
                      atividade.type === "reserva_solicitada"
                        ? navigation.navigate("ReservationRequestsScreen")
                        : navigation.navigate("NotificationsScreen")
                    }
                  >
                    <View style={styles.ledgerTexts}>
                      <Text style={styles.ledgerTitle}>{atividade.title}</Text>
                      <Text style={styles.ledgerDate}>{formatarData(atividade.created_in)}</Text>
                    </View>

                    <Text style={[styles.status, !atividade.read && styles.statusPending]}>
                      {atividade.read ? "Lida" : "Nova"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {user.role === "admin" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visão geral de usuários</Text>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{dashboard ? dashboard.usuarios.total : "–"}</Text>
                <Text style={styles.statLabel}>Usuários</Text>
                <Text style={styles.statFooter}>{dashboard ? "+" + dashboard.usuarios.novos + " em 30 dias" : ""}</Text>
              </View>

              <View style={[styles.stat, styles.statBorder]}>
                <Text style={styles.statNumber}>{dashboard ? dashboard.empresas.total : "–"}</Text>
                <Text style={styles.statLabel}>Empresas</Text>
                <Text style={styles.statFooter}>{dashboard ? "+" + dashboard.empresas.novos + " em 30 dias" : ""}</Text>
              </View>

              <View style={[styles.stat, styles.statBorder]}>
                <Text style={styles.statNumber}>{dashboard ? dashboard.admins.total : "–"}</Text>
                <Text style={styles.statLabel}>Admins</Text>
                <Text style={styles.statFooter}>{dashboard ? "+" + dashboard.admins.novos + " em 30 dias" : ""}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Gestão do Reaproveita Franca</Text>

            <View style={styles.ledger}>
              <TouchableOpacity
                style={styles.buttonManagement}
                onPress={() => navigation.navigate("RegisterAdmin")}
              >
                <View style={styles.managementIcon}>
                  <MaterialCommunityIcons name="account-plus-outline" size={22} color={colors.primaryDark} />
                </View>
                <Text style={styles.managementText}>Adicionar um novo admin</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buttonManagement, styles.ledgerBorder]}
                onPress={() => navigation.navigate("AdminUsersScreen")}
              >
                <View style={styles.managementIcon}>
                  <MaterialCommunityIcons name="account-group-outline" size={22} color={colors.primaryDark} />
                </View>
                <Text style={styles.managementText}>Gerenciar usuários</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buttonManagement, styles.ledgerBorder]}
                onPress={() => navigation.navigate("AdminAdvertisementsScreen")}
              >
                <View style={styles.managementIcon}>
                  <MaterialCommunityIcons name="package-variant-closed" size={22} color={colors.primaryDark} />
                </View>
                <Text style={styles.managementText}>Gerenciar anúncios</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark} />
              </TouchableOpacity>
            </View>
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
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 28,
    color: colors.primaryDark,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  buttonIcon: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonProfile: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeChat: {
    position: "absolute",
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 100,
    backgroundColor: "#A0522D",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeChatText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.white,
  },
  heading: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  eyebrow: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.primaryDark,
  },
  title: {
    marginTop: 14,
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
    color: colors.primaryDark,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  viewRole: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  textRole: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.primaryDark,
  },
  buttonHeader: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 48,
    marginTop: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
  },
  button: {
    width: "90%",
    alignSelf: "center",
    minHeight: 54,
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
  },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.errorLight,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.error,
  },
  banner: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.primaryDark,
  },
  bannerEyebrow: {
    fontFamily: fonts.regular,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: colors.railText,
  },
  bannerTitle: {
    marginTop: 14,
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.8,
    color: colors.background,
  },
  bannerTitleEm: {
    fontFamily: fonts.serifItalic,
  },
  bannerText: {
    marginTop: 12,
    maxWidth: "62%",
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.railText,
  },
  bannerChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
    maxWidth: "62%",
  },
  bannerChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(250,249,245,0.3)",
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.background,
  },
  bannerButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  bannerButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  bannerImage: {
    position: "absolute",
    right: -34,
    bottom: -6,
    width: 170,
    height: 114,
    resizeMode: "contain",
  },
  section: {
    width: "100%",
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginTop: 30,
    marginBottom: 14,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primaryDark,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitleInline: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primaryDark,
  },
  link: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.primaryDark,
    textDecorationLine: "underline",
  },
  stats: {
    flexDirection: "row",
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.borderLight,
  },
  statNumber: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: colors.primaryDark,
  },
  statLabel: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primaryDark,
  },
  statFooter: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  statFooterAccent: {
    color: colors.accent,
  },
  cards: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 1.35,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardTag: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.primaryDark,
  },
  cardBody: {
    padding: 12,
  },
  cardCategory: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  cardTitle: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  cardPrice: {
    marginTop: 10,
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.primaryDark,
  },
  cardMeta: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  ledger: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  ledgerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  ledgerBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  ledgerTexts: {
    flex: 1,
    minWidth: 0,
  },
  ledgerTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.primaryDark,
  },
  ledgerDate: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  status: {
    maxWidth: "45%",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    overflow: "hidden",
    backgroundColor: colors.primaryLight,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.primaryDark,
    textAlign: "center",
  },
  statusPending: {
    color: "#92400E",
    backgroundColor: colors.warningLight,
  },
  buttonManagement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
    padding: 16,
  },
  managementIcon: {
    width: 42,
    height: 42,
    borderRadius: 100,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  managementText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  requestsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 24,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    backgroundColor: colors.white,
  },
  requestsIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    justifyContent: "center",
    alignItems: "center",
  },
  requestsTexts: {
    flex: 1,
    minWidth: 0,
  },
  requestsEyebrow: {
    fontFamily: fonts.regular,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  requestsTitle: {
    marginTop: 2,
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.primaryDark,
  },
  requestsText: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  requestsBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 100,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  requestsBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
});
