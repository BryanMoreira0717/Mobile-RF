import {
  TouchableOpacity,
  View,
  Text,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../theme/colors";
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavBar from "../../components/NavBar";

export default function ProfileScreen({navigation}) {
    const [user, setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(true)

    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
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

    async function logout() {
        try {
            await AsyncStorage.multiRemove(["@token", "@user"]);
            navigation.reset({ index: 0, routes: [{ name: "Login" }] })
        } catch (e) {
            console.log("Erro ao sair da conta:", e?.message);
            Alert.alert("Erro", "Não foi possível sair da conta.")
        }
    }

    if (!fontsLoaded || loadingUser) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 17, textAlign: "center" }}>
                    Não foi possível carregar seu usuário.{"\n"}Faça login novamente.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.reset({ index: 0, routes: [{ name: "Login" }] })}
                >
                    <Text style={styles.buttonText}>Ir para o login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return(
    <SafeAreaView style={styles.background} edges={["top", "bottom"]}>
        <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false}>
            <View style={styles.viewUser}>
                <View style={styles.viewPhoto}>
                    {user.photo?.uri || typeof user.photo === "string" && user.photo ? (
                        <Image
                            source={{uri: typeof user.photo === "string" ? user.photo : user.photo.uri}}
                            style={styles.image}
                        />
                    ) : (
                        <View style={styles.photo}>
                            <MaterialCommunityIcons name="account-outline" size={50} color={colors.primaryDark}/>
                        </View>
                    )}

                    <TouchableOpacity style={styles.buttonPhoto}>
                        <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.white}/>
                    </TouchableOpacity>
                </View>

                <Text style={styles.name}>{user.name || "visitante"}</Text>
                <Text style={styles.subtitle}>Artesão / Comprador Independente</Text>
            </View>

            <View style={styles.viewButtons}>
                <TouchableOpacity
                    style={styles.buttonOption}
                    onPress={() => Alert.alert(
                        "Dados Pessoais",
                        `Nome: ${user.name || "Não informado"}\nEmail: ${user.email || "Não informado"}\nTelefone: ${user.cellphone || "Não informado"}`
                    )}
                >
                    <MaterialCommunityIcons name="account-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Dados Pessoais</Text>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary}/>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.buttonOption}
                    onPress={() => Alert.alert(
                        "Endereço",
                        `Logradouro: ${user.street || "Não informado"}\nNúmero: ${user.number || "Não informado"}\nBairro: ${user.neighborhood || "Não informado"}\nCidade: ${user.city || "Não informada"}\nEstado: ${user.state || "Não informado"}\nCEP: ${user.zip_code || "Não informado"}`
                    )}
                >
                    <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Endereço{user.city ? ` e ${user.city}` : ""}{user.state ? `-${user.state}` : ""}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary}/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonOption}>
                    <MaterialCommunityIcons name="heart-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Preferências de Material</Text>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary}/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonOption}>
                    <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Notificações</Text>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary}/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonOption}>
                    <MaterialCommunityIcons name="close-circle-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Segurança</Text>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary}/>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.buttonOption}
                    onPress={() => Alert.alert(
                        "Sobre o Reaproveita",
                        "Conectamos as indústrias de Franca a artesãos, cooperativas e compradores para transformar resíduos em oportunidades."
                    )}
                >
                    <MaterialCommunityIcons name="help-circle-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Sobre o Reaproveita</Text>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary}/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonOption} onPress={() => logout()}>
                    <MaterialCommunityIcons name="logout" size={22} color="#ef4444"/>
                    <Text style={[styles.textOption, {color:"#ef4444"}]}>Sair</Text>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary}/>
                </TouchableOpacity>
            </View>

            <Text style={styles.version}>Reaproveita Franca v1.0.0 • 2026</Text>
        </ScrollView>
        <NavBar
            estagio="comprador"
            ativo="perfil"
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
    </SafeAreaView>
    )

}

const styles = StyleSheet.create({
    background: {
        flex:1,
        width:"100%",
        backgroundColor:colors.background
    },
    header: {
        width:"100%",
        height:56,
        backgroundColor:colors.white,
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center",
        paddingHorizontal:16,
        borderBottomWidth:1,
        borderBottomColor:colors.borderLight
    },
    circle: {
        width:28,
        height:28,
        borderRadius:100,
        backgroundColor:colors.primary,
        justifyContent:"center",
        alignItems:"center"
    },
    title: {
        flex:1,
        textAlign:"center",
        fontFamily:fonts.bold,
        fontSize:16,
        color:colors.textPrimary
    },
    buttonMenu: {
        width:28,
        height:40,
        justifyContent:"center",
        alignItems:"center"
    },
    viewUser: {
        width:"100%",
        alignItems:"center",
        paddingTop:24,
        paddingBottom:20
    },
    viewPhoto: {
        width:96,
        height:96
    },
    image: {
        width:96,
        height:96,
        borderRadius:100,
        borderWidth:2,
        borderColor:colors.primary,
        resizeMode:"cover"
    },
    photo: {
        width:96,
        height:96,
        borderRadius:100,
        borderWidth:2,
        borderColor:colors.primary,
        backgroundColor:colors.primaryLight,
        justifyContent:"center",
        alignItems:"center"
    },
    buttonPhoto: {
        position:"absolute",
        bottom:0,
        right:0,
        width:28,
        height:28,
        borderRadius:100,
        borderWidth:2,
        borderColor:colors.white,
        backgroundColor:colors.primary,
        justifyContent:"center",
        alignItems:"center"
    },
    name: {
        marginTop:12,
        paddingHorizontal:16,
        fontSize:20,
        fontFamily:fonts.bold,
        color:colors.primaryDark,
        textAlign:"center"
    },
    subtitle: {
        marginTop:2,
        paddingHorizontal:16,
        fontSize:12,
        fontFamily:fonts.regular,
        color:colors.textSecondary,
        textAlign:"center"
    },
    viewButtons: {
        width:"100%",
        paddingHorizontal:16,
        paddingVertical:16
    },
    buttonOption: {
        width:"100%",
        minHeight:50,
        flexDirection:"row",
        alignItems:"center",
        padding:14,
        marginBottom:8,
        borderRadius:12,
        borderWidth:1,
        borderColor:colors.borderLight,
        backgroundColor:colors.white
    },
    textOption: {
        flex:1,
        marginLeft:12,
        marginRight:12,
        fontSize:13,
        fontFamily:fonts.bold,
        color:colors.textPrimary
    },
    version: {
        marginTop:12,
        marginBottom:32,
        fontSize:11,
        fontFamily:fonts.regular,
        color:colors.textTertiary,
        textAlign:"center"
    },
    viewNavigation: {
        width:"100%",
        minHeight:60,
        paddingHorizontal:12,
        paddingVertical:8,
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center",
        backgroundColor:colors.white,
        borderTopWidth:1,
        borderTopColor:colors.borderLight
    },
    buttonNavigation: {
        width:"20%",
        minHeight:44,
        justifyContent:"center",
        alignItems:"center"
    },
    textNavigation: {
        marginTop:4,
        fontSize:11,
        fontFamily:fonts.regular,
        color:colors.textTertiary
    },
    buttonMarketplace: {
        width:40,
        height:40,
        borderRadius:100,
        backgroundColor:colors.primary,
        justifyContent:"center",
        alignItems:"center",
        shadowColor:colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity:0.25,
        shadowRadius:6,
        elevation:4
    },
    button: {
        width:"90%",
        marginTop:30,
        paddingHorizontal:20,
        paddingVertical:22,
        backgroundColor:colors.primary,
        borderRadius:15,
        justifyContent:"center",
        alignSelf:"center",
        alignItems:"center"
    },
    buttonText: {
        color:colors.white,
        fontFamily:fonts.bold,
        fontSize:17
    }
})