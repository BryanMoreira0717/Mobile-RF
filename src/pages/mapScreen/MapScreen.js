import 'react-native-gesture-handler';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useFonts } from "expo-font";
import { useState, useRef, useMemo, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import {
    Manrope_400Regular,
    Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Imports do Projeto
import colors, { theme } from "../../theme/colors";
import { showAlert } from "../../components/AppAlert";
import { fonts } from "../../theme/fonts";
import api from "../../services/axios";
import NavBar from "../../components/NavBar";

// Mapa do OpenStreetMap (biblioteca Leaflet) dentro de um WebView: não
// precisa de chave do Google. O app manda os pinos com setMarkers() e
// centraliza com focus(); o toque em "Ver material" volta pelo postMessage.
function getMapHtml() {
  // No tema escuro o mapa claro é invertido por CSS.
  const darkFilter = theme.name === "escuro"
    ? ".leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.85); }"
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; background: ${colors.background}; }
  .leaflet-popup-content { font-family: sans-serif; font-size: 13px; color: #0F3D2E; }
  .leaflet-popup-content b { font-size: 14px; }
  .ver { display: inline-block; margin-top: 8px; padding: 6px 10px; border-radius: 6px;
         background: #0F3D2E; color: #ffffff; font-weight: bold; text-decoration: none; }
  ${darkFilter}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map("map", { zoomControl: false, attributionControl: true })
    .setView([-20.538, -47.401], 14);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  var layer = L.layerGroup().addTo(map);

  function escapeText(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function setMarkers(list, kind) {
    layer.clearLayers();
    list.forEach(function (item) {
      var html = "<b>" + escapeText(item.name) + "</b><br>" + escapeText(item.description);
      if (kind === "materiais") {
        html += "<br><a class='ver' href='#' onclick='openMaterial(&quot;" + item.id + "&quot;);return false;'>Ver material</a>";
      }
      L.circleMarker([item.latitude, item.longitude], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: kind === "materiais" ? "${colors.accent}" : "#0F3D2E",
        fillOpacity: 1
      }).bindPopup(html).addTo(layer);
    });
  }

  function focus(latitude, longitude) {
    map.flyTo([latitude, longitude], 16, { duration: 0.6 });
  }

  function openMaterial(id) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "material", id: id }));
  }
</script>
</body>
</html>`;
}

export default function MapScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState("");
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ["35%", "54%"], []);
    const mapRef = useRef(null);
    // O mapa só recebe os pinos depois que a página do WebView carrega.
    const [mapReady, setMapReady] = useState(false);
    const mapHtml = useMemo(() => getMapHtml(), []);
    const [user, setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(true)
    const [empresas, setEmpresas] = useState([])
    const [loadingEmpresas, setLoadingEmpresas] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    // Camada do mapa: empresas ou materiais (o mapa do site mostra os materiais).
    const [camada, setCamada] = useState("empresas")
    const [materiais, setMateriais] = useState([])
    const [loadingMateriais, setLoadingMateriais] = useState(false)

    // Nomes das categorias do banco (mesma lista do marketplace)
    const categorias = {
      madeira: "Madeira",
      metal: "Metal",
      plastico: "Plástico",
      "papel/papelao": "Papel / Papelão",
      vidro: "Vidro",
      tecido: "Tecido",
      borracha: "Borracha",
      eletronicos: "Eletrônicos",
    };

    function getMateriais(empresa) {
      return empresa.categories.map((categoria) => categorias[categoria] || categoria);
    }

  const materiaisFiltrados = materiais.filter((item) => {
    const busca = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(busca) ||
      (categorias[item.category] || item.category || "").toLowerCase().includes(busca);
  });

  const empresasFiltradas = empresas.filter((empresa) => {
  const busca = searchQuery.toLowerCase();
  const nomeBate = empresa.name.toLowerCase().includes(busca);
  const materialBate = getMateriais(empresa).some((m) =>
    m.toLowerCase().includes(busca)
  );

  return nomeBate || materialBate;
});

    useEffect(() => {
        async function loadUser() {
            try {
                const storedUser = await AsyncStorage.getItem("@user");
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser)
                    if (parsedUser) setUser(parsedUser)
                    if (parsedUser) await loadEmpresas()
                }
            } catch (e) {
                console.log("Erro ao carregar usuário:", e?.message);
            } finally {
                setLoadingUser(false)
            }
        }
        loadUser();
    }, [])

    // Empresas com endereço no mapa. As coordenadas vêm aproximadas (~1 km)
    // pelo backend, igual à localização pública dos anúncios.
    async function loadEmpresas() {
      try {
        setLoadingEmpresas(true);
        setErrorMessage("");
        const response = await api.getCompaniesMap();
        if (!Array.isArray(response.data)) {
          setErrorMessage("Não foi possível carregar as empresas.");
          return;
        }
        setEmpresas(response.data);
      } catch (error) {
        console.log("Erro ao carregar empresas do mapa:", error.response?.data || error.message);
        setErrorMessage("Não foi possível carregar as empresas.");
      } finally {
        setLoadingEmpresas(false);
      }
    }

    // Materiais disponíveis com localização aproximada (mesma fonte do mapa do site).
    async function loadMateriais() {
      try {
        setLoadingMateriais(true);
        setErrorMessage("");
        const response = await api.getProductsLight();
        const produtos = Array.isArray(response.data) ? response.data : [];
        const disponiveis = produtos.filter((item) => item.status === "available" && Number(item.quantity) > 0);

        // Uma consulta de localização por material, todas juntas.
        const locais = await Promise.all(
          disponiveis.map((item) => api.getProductLocation(item.id).then((res) => res.data).catch(() => null))
        );

        const lista = [];
        disponiveis.forEach((item, index) => {
          const local = locais[index];
          if (!local || local.latitude == null || local.longitude == null) return;
          lista.push({
            id: item.id,
            name: item.name,
            category: item.category,
            type_negotiation: item.type_negotiation,
            city: local.city,
            neighborhood: local.neighborhood,
            latitude: Number(local.latitude),
            longitude: Number(local.longitude),
          });
        });

        setMateriais(lista);
      } catch (error) {
        console.log("Erro ao carregar materiais do mapa:", error.response?.data || error.message);
        setErrorMessage("Não foi possível carregar os materiais.");
      } finally {
        setLoadingMateriais(false);
      }
    }

    function mudarCamada(valor) {
      setCamada(valor);
      if (valor === "materiais" && materiais.length === 0) {
        loadMateriais();
      }
    }

    // Abre (ou cria) a conversa com a empresa escolhida no mapa
    async function openChat(empresa) {
      try {
        const response = await api.createConversation(empresa.companyId);
        navigation.navigate("ChatScreen", {
          conversationId: response.data.conversationId,
          otherUserName: empresa.name,
          otherUserRole: "company"
        });
      } catch (error) {
        console.log("Erro ao abrir conversa:", error.response?.data || error.message);
        showAlert("Não foi possível abrir o chat", String(error.response?.data?.error || "Tente novamente."));
      }
    }

    // Ao tocar no card, centraliza o mapa na empresa
    function focusEmpresa(empresa) {
      mapRef.current?.injectJavaScript(
        "focus(" + Number(empresa.latitude) + ", " + Number(empresa.longitude) + "); true;"
      );
    }

    // Manda para o mapa os pinos da aba aberta (já filtrados pela busca).
    useEffect(() => {
      if (!mapReady) return;

      const lista = camada === "empresas"
        ? empresasFiltradas.map((empresa) => ({
            id: empresa.id,
            name: empresa.name,
            description: empresa.neighborhood + ", " + empresa.city,
            latitude: Number(empresa.latitude),
            longitude: Number(empresa.longitude),
          }))
        : materiaisFiltrados.map((item) => ({
            id: item.id,
            name: item.name,
            description: "Localização aproximada · " + item.neighborhood + ", " + item.city,
            latitude: item.latitude,
            longitude: item.longitude,
          }));

      mapRef.current?.injectJavaScript(
        "setMarkers(" + JSON.stringify(lista) + ", " + JSON.stringify(camada) + "); true;"
      );
    }, [mapReady, camada, searchQuery, empresas, materiais]);

    // Toque em "Ver material" no balão do pino.
    function onMapMessage(event) {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "material") {
          navigation.navigate("MaterialDetailsScreen", { productId: data.id });
        }
      } catch (e) {
        console.log("Mensagem do mapa inválida:", e?.message);
      }
    }

    if (loadingUser) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!user) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Não foi possível carregar seu usuário.</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.reset({ index: 0, routes: [{ name: "Login" }] })
            }
          >
            <Text>Ir para o login</Text>
          </TouchableOpacity>
        </View>
      );
    }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{height:"100%", width:"100%"}}>

                {/* Barra de Pesquisa */}
                <SafeAreaView style={styles.topContainer}>
                    <View style={styles.searchBox}>
                        <MaterialCommunityIcons
                        name="magnify"
                        size={22}
                        color={colors.textSecondary}
                        />
                        <TextInput
                        style={styles.searchInput}
                        placeholder={camada === "empresas" ? "Buscar cooperativas, curtumes..." : "Buscar materiais..."}
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={(text) => setSearchQuery(text)}
                        />
                        {searchQuery.length > 0 && (
                        <MaterialCommunityIcons
                            name="close-circle"
                            size={18}
                            color={colors.textTertiary}
                            onPress={() => setSearchQuery("")}
                        />
                        )}
                    </View>
                </SafeAreaView>

                <WebView
                    ref={mapRef}
                    style={styles.map}
                    originWhitelist={["*"]}
                    source={{ html: mapHtml, baseUrl: "https://reaproveitafranca.app/" }}
                    onLoadEnd={() => setMapReady(true)}
                    onMessage={onMapMessage}
                    javaScriptEnabled
                    domStorageEnabled
                    setSupportMultipleWindows={false}
                    renderLoading={() => (
                      <View style={styles.mapLoading}>
                        <ActivityIndicator size="large" color={colors.primary} />
                      </View>
                    )}
                    startInLoadingState
                />

                {/* Side Bar de Baixo */}

            <BottomSheet
              ref={bottomSheetRef}
              index={0}
              snapPoints={snapPoints}
              handleIndicatorStyle={styles.dragIndicator}
              backgroundStyle={styles.bottomSheetBackground}
            >
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  Perto de você. <Text style={styles.sheetTitleEm}>Longe do fim.</Text>
                </Text>
                <Text style={styles.sheetCount}>
                  {camada === "empresas"
                    ? empresasFiltradas.length + " empresas"
                    : materiaisFiltrados.length + " materiais"}
                </Text>
              </View>

              {/* Abas: empresas da rede ou materiais no mapa */}
              <View style={styles.camadas}>
                {[["empresas", "Empresas"], ["materiais", "Materiais"]].map(([valor, nome]) => (
                  <TouchableOpacity
                    key={valor}
                    style={[styles.camada, camada === valor && styles.camadaAtiva]}
                    onPress={() => mudarCamada(valor)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: camada === valor }}
                  >
                    <Text style={[styles.camadaTexto, camada === valor && styles.camadaTextoAtivo]}>{nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {camada === "materiais" ? (
              <BottomSheetFlatList
                data={materiaisFiltrados}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  loadingMateriais ? (
                    <ActivityIndicator style={styles.listMessage} color={colors.primary} />
                  ) : (
                    <View style={styles.listMessage}>
                      <Text style={styles.empresaDetalhes}>
                        {errorMessage || "Nenhum material com localização no mapa."}
                      </Text>
                      {errorMessage ? (
                        <TouchableOpacity onPress={loadMateriais}>
                          <Text style={styles.retryText}>Tentar novamente</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.empresaCard}
                    onPress={() => focusEmpresa(item)}
                  >
                    <View style={styles.empresaIcon}>
                      <MaterialCommunityIcons
                        name="package-variant-closed"
                        size={24}
                        color={colors.primaryDark}
                      />
                    </View>

                    <View style={styles.empresaInfo}>
                      <Text style={styles.empresaNome}>{item.name}</Text>
                      <Text style={styles.empresaDetalhes}>
                        {categorias[item.category] || item.category} • {item.neighborhood}, {item.city}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.chatButton}
                      onPress={() => navigation.navigate("MaterialDetailsScreen", { productId: item.id })}
                      accessibilityRole="button"
                      accessibilityLabel={"Ver material " + item.name}
                    >
                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={20}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
              ) : (
              <BottomSheetFlatList
                data={empresasFiltradas}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  loadingEmpresas ? (
                    <ActivityIndicator style={styles.listMessage} color={colors.primary} />
                  ) : (
                    <View style={styles.listMessage}>
                      <Text style={styles.empresaDetalhes}>
                        {errorMessage || (searchQuery ? "Nenhuma empresa encontrada para a busca." : "Nenhuma empresa no mapa ainda.")}
                      </Text>
                      {errorMessage ? (
                        <TouchableOpacity onPress={loadEmpresas}>
                          <Text style={styles.retryText}>Tentar novamente</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.empresaCard}
                    onPress={() => focusEmpresa(item)}
                  >
                    <View style={styles.empresaIcon}>
                      <MaterialCommunityIcons
                        name="factory"
                        size={24}
                        color={colors.primaryDark}
                      />
                    </View>

                    <View style={styles.empresaInfo}>
                      <Text style={styles.empresaNome}>{item.name}</Text>
                      <Text style={styles.empresaDetalhes}>
                        {item.neighborhood}, {item.city} • {item.availableProducts > 0 ? getMateriais(item).join(", ") : "Sem anúncios disponíveis"}
                      </Text>
                    </View>

                    {/* Comprador conversa direto com a empresa pelo mapa. */}
                    {user.role == "user" ? (
                      <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => openChat(item)}
                        accessibilityRole="button"
                        accessibilityLabel={"Conversar com " + item.name}
                      >
                        <MaterialCommunityIcons
                          name="message-text-outline"
                          size={20}
                          color={colors.white}
                        />
                      </TouchableOpacity>
                    ) : (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={22}
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
              )}
            </BottomSheet>
            {user.role == "user" && (
              <NavBar
              estagio="comprador"
              ativo="mapa"
              onNavigate={(item) => {
              switch (item) {
                  case "inicio":
                      navigation.navigate("DashboardScreen");
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
                  case "marketplace":
                    navigation.navigate("MarketplaceScreen");
                    break;
                  default:
                      showAlert("Em breve", "Esta funcionalidade estará disponível.");
                  }
              }}
          />
          )}
          {user.role == "company" && (
              <NavBar
              estagio="empresa"
              ativo="mapa"
              onNavigate={(item) => {
              switch (item) {
                  case "inicio":
                      navigation.navigate("DashboardScreen");
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
                      showAlert("Em breve", "Esta funcionalidade estará disponível.");
                  }
              }}
          />
          )}
            </View>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
    topContainer: {
        position: "absolute",
        top: Platform.OS === "android" ? 40 : 10,
        left: 0,
        right: 0,
        zIndex: 10, // Garante que fica por cima do mapa
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        marginHorizontal: 16,
        paddingHorizontal: 14,
        height: 48,
        borderRadius: 14,
        // Sombra para iOS e Android
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: colors.textPrimary,
        fontFamily: fonts.regular,
    },
    bottomSheetBackground: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    dragIndicator: {
        backgroundColor: colors.border,
        width: 40,
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.primaryDark,
    },
    sheetCount: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: "600",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    empresaCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginTop: 10,
        backgroundColor: colors.white,
    },
    empresaIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    empresaInfo: {
        flex: 1,
        marginLeft: 12,
    },
    chatButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    empresaNome: {
        fontSize: 15,
        fontWeight: "bold",
        color: colors.textPrimary,
    },
    empresaDetalhes: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    listMessage: {
        marginTop: 20,
        alignItems: "center",
    },
    retryText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: "600",
        color: colors.primary,
    },
    sheetTitleEm: {
        fontFamily: fonts.serifItalic
    },
    camadas: {
        flexDirection: "row",
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 8,
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white
    },
    camada: {
        flex: 1,
        minHeight: 38,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center"
    },
    camadaAtiva: {
        backgroundColor: colors.primaryDark
    },
    camadaTexto: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.primaryDark
    },
    camadaTextoAtivo: {
        fontFamily: fonts.bold,
        color: colors.white
    },
    map: {
        flex: 1,
        backgroundColor: colors.background
    },
    mapLoading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background
    }
});