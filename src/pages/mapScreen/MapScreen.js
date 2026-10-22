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
  Alert
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
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Imports do Projeto
import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import api from "../../services/axios";
import NavBar from "../../components/NavBar";

export default function MapScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState("");
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ["35%", "54%"], []);
    const [user, setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(true)
    
    const empresas = [
      {
          id: 1,
          nome: "Curtume Exemplo",
          latitude: -20.538,
          longitude: -47.401,
          categoria: "Couros",
          materiais: ["Couro Nobre", "Raspas"],
          distancia: "0.8 km",
          status: "Aberto",
      },
    ];

  const empresasFiltradas = empresas.filter((empresa) => {
  const busca = searchQuery.toLowerCase();
  const nomeBate = empresa.nome.toLowerCase().includes(busca);
  const materialBate = empresa.materiais.some((m) =>
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
                }
            } catch (e) {
                console.log("Erro ao carregar usuário:", e?.message);
            } finally {
                setLoadingUser(false)
            }
        }
        loadUser();
    }, [])

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
                        color="#6b7280"
                        />
                        <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar cooperativas, curtumes..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={(text) => setSearchQuery(text)}
                        />
                        {searchQuery.length > 0 && (
                        <MaterialCommunityIcons
                            name="close-circle"
                            size={18}
                            color="#9ca3af"
                            onPress={() => setSearchQuery("")}
                        />
                        )}
                    </View>
                </SafeAreaView>

                <MapView
                    style={{ flex: 1 }}
                    initialRegion={{
                        latitude: -20.538,
                        longitude: -47.401,
                        latitudeDelta: 0.04,
                        longitudeDelta: 0.04,
                    }}
                    showsUserLocation
                    >
                    {empresasFiltradas.map((empresa) => (
                        <Marker
                        key={empresa.id}
                        coordinate={{
                            latitude: empresa.latitude,
                            longitude: empresa.longitude,
                        }}
                        title={empresa.nome}
                        description={empresa.materiais.join(", ")}
                        />
                    ))}
                </MapView>

                {/* Side Bar de Baixo */}

            <BottomSheet
              ref={bottomSheetRef}
              index={0}
              snapPoints={snapPoints}
              handleIndicatorStyle={styles.dragIndicator}
              backgroundStyle={styles.bottomSheetBackground}
            >
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Empresas próximas</Text>
                <Text style={styles.sheetCount}>
                  {empresasFiltradas.length} ativas
                </Text>
              </View>

              <BottomSheetFlatList
                data={empresasFiltradas}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.empresaCard}
                    onPress={() => {
                      // Clique para ver os anúncios da empresa
                      console.log("Clicou na empresa:", item.nome);
                      // navigation.navigate("EmpresaAnuncios", { empresaId: item.id });
                    }}
                  >
                    <View style={styles.empresaIcon}>
                      <MaterialCommunityIcons
                        name="factory"
                        size={24}
                        color={colors.primaryDark || "#064e3b"}
                      />
                    </View>

                    <View style={styles.empresaInfo}>
                      <Text style={styles.empresaNome}>{item.nome}</Text>
                      <Text style={styles.empresaDetalhes}>
                        {item.distancia} • {item.materiais.join(", ")}
                      </Text>
                    </View>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                )}
              />
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
                  default:
                      Alert.alert("Em breve", "Esta funcionalidade estará disponível.");
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
                      Alert.alert("Em breve", "Esta funcionalidade estará disponível.");
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
        backgroundColor: "#ffffff",
        marginHorizontal: 16,
        paddingHorizontal: 14,
        height: 48,
        borderRadius: 14,
        // Sombra para iOS e Android
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: "#1f2937",
        fontFamily: "Manrope_400Regular", // Se estiver usando as fontes carregadas
    },
    bottomSheetBackground: {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    dragIndicator: {
        backgroundColor: "#d1d5db",
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
        color: "#064e3b",
    },
    sheetCount: {
        fontSize: 14,
        color: "#10b981",
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
        borderColor: "#e5e7eb",
        marginTop: 10,
        backgroundColor: "#ffffff",
    },
    empresaIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#ECFDF5",
        justifyContent: "center",
        alignItems: "center",
    },
    empresaInfo: {
        flex: 1,
        marginLeft: 12,
    },
    empresaNome: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#1f2937",
    },
    empresaDetalhes: {
        fontSize: 13,
        color: "#6b7280",
        marginTop: 2,
    },
});