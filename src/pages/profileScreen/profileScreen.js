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
  Manrope_800ExtraBold
} from '@expo-google-fonts/manrope';
import {
  Gelasio_400Regular,
  Gelasio_400Regular_Italic,
  Gelasio_700Bold
} from "@expo-google-fonts/gelasio";
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import NavBar from "../../components/NavBar";
import MercadoPagoCard from "../../components/MercadoPagoCard";
import api from "../../services/axios";
import { disconnectSocket } from "../../services/socket";

export default function ProfileScreen({navigation}) {
    const [user, setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(true)
    // Foto vinda da API (data URI) ou escolhida agora (uri local).
    const [photo, setPhoto] = useState(null)
    const [savingPhoto, setSavingPhoto] = useState(false)

    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold,
    });

    useEffect(() => {
        async function loadUser() {
            try {
                const storedUser = await AsyncStorage.getItem("@user");
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser)
                    if (parsedUser) {
                        setUser(parsedUser)
                        loadPhoto(parsedUser.id)
                    }
                }
            } catch (e) {
                console.log("Erro ao carregar usuário:", e?.message);
            } finally {
                setLoadingUser(false)
            }
        }
        loadUser();
    }, [])

    // A foto fica no banco; a API devolve a imagem e aqui ela vira data URI.
    async function loadPhoto(id) {
        try {
            const response = await api.getUserPhoto(id)

            // 204: a conta ainda não tem foto.
            if (response.status !== 200 || !response.data) return

            const reader = new FileReader()
            reader.onloadend = () => setPhoto(reader.result)
            reader.readAsDataURL(response.data)
        } catch (e) {
            console.log("Erro ao carregar foto:", e.response?.status || e.message)
        }
    }

    async function choosePhoto() {
        if (savingPhoto) return

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (!permissionResult.granted) {
            Alert.alert("Permissão negada", "Permita o acesso à galeria para escolher a foto.")
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.4
        })

        if (result.canceled || !result.assets[0]) return

        const asset = result.assets[0]

        try {
            setSavingPhoto(true)

            const formData = new FormData()
            formData.append("photo", {
                uri: asset.uri,
                name: asset.fileName || "photo.jpg",
                type: asset.mimeType || "image/jpeg"
            })

            await api.updateUserPhoto(user.id, formData)

            setPhoto(asset.uri)
        } catch (e) {
            console.log("Erro ao salvar foto:", e.response?.data || e.message)
            Alert.alert(
                "Erro",
                String(e.response?.data?.error || "Não foi possível salvar a foto.")
            )
        } finally {
            setSavingPhoto(false)
        }
    }

    async function logout() {
        try {
            // Fecha o chat desta conta antes de limpar a sessão.
            disconnectSocket();
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
            {/* Título da página "Minha conta" do site */}
            <View style={styles.heading}>
                <Text style={styles.eyebrow}>Minha conta</Text>
                {user.role === "company" ? (
                    <Text style={styles.title}>
                        O perfil da{"\n"}<Text style={styles.titleEm}>sua empresa.</Text>
                    </Text>
                ) : (
                    <Text style={styles.title}>
                        O seu <Text style={styles.titleEm}>perfil.</Text>
                    </Text>
                )}
                <Text style={styles.headingText}>
                    Mantenha seus dados, endereço e acesso atualizados.
                </Text>
            </View>

            {/* Painel verde de identidade, como no perfil do site */}
            <View style={styles.viewUser}>
                <View style={styles.viewPhoto}>
                    {photo ? (
                        <Image
                            source={{uri: photo}}
                            style={styles.image}
                        />
                    ) : (
                        <View style={styles.photo}>
                            <Text style={styles.monogram}>
                                {(user.name || "R").charAt(0).toUpperCase()}
                                <Text style={styles.monogramDot}>.</Text>
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.buttonPhoto}
                        onPress={choosePhoto}
                        disabled={savingPhoto}
                        accessibilityRole="button"
                        accessibilityLabel="Trocar foto de perfil"
                    >
                        {savingPhoto ? (
                            <ActivityIndicator size="small" color={colors.primaryDark}/>
                        ) : (
                            <MaterialCommunityIcons name="camera-outline" size={16} color={colors.primaryDark}/>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.viewUserTexts}>
                    <Text style={styles.panelEyebrow}>
                        {user.role === "company" ? "Minha empresa" : "Minha conta"}
                    </Text>
                    <Text style={styles.name}>{user.name || "visitante"}</Text>
                    <Text style={styles.subtitle}>
                        {user.role === "company"
                            ? "Empresa / Fornecedor"
                            : user.role === "user"
                            ? "Comprador / Artesão"
                            : user.role === "admin"
                            ? "Administrador"
                            : "Tipo de conta não identificado"}
                    </Text>
                </View>
            </View>

            {user.role === "company" && <MercadoPagoCard/>}
            
            <View style={styles.viewButtons}>
                <TouchableOpacity
                    style={styles.buttonOption}
                    onPress={() => navigation.navigate("PersonalDataScreen")}
                >
                    <MaterialCommunityIcons name="account-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Dados Pessoais</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark}/>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.buttonOption}
                    onPress={() => navigation.navigate("AddressScreen")}
                >
                    <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Endereço</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark}/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonOption}>
                    <MaterialCommunityIcons name="heart-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Preferências de Material</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark}/>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.buttonOption}
                    onPress={() => navigation.navigate("NotificationsScreen")}
                >
                    <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Notificações</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark}/>
                </TouchableOpacity>

                {user.role !== "admin" && (
                    <TouchableOpacity
                        style={styles.buttonOption}
                        onPress={() => navigation.navigate("ConversationsScreen")}
                    >
                        <MaterialCommunityIcons name="message-text-outline" size={22} color={colors.primaryDark}/>
                        <Text style={styles.textOption}>Mensagens</Text>
                        <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark}/>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.buttonOption}
                    onPress={() => navigation.navigate("SecurityScreen")}
                >
                    <MaterialCommunityIcons name="close-circle-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Segurança</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark}/>
                </TouchableOpacity>

                {user.role !== "admin" && (
                    <TouchableOpacity
                        style={styles.buttonOption}
                        onPress={() => navigation.navigate("DisputesScreen")}
                    >
                        <MaterialCommunityIcons name="shield-alert-outline" size={22} color={colors.primaryDark}/>
                        <Text style={styles.textOption}>Disputas</Text>
                        <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark}/>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.buttonOption}
                    onPress={() => navigation.navigate("LegalScreen", { kind: "termos" })}
                >
                    <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Termos, privacidade e direitos</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark}/>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.buttonOption}
                    onPress={() => navigation.navigate("AboutScreen")}
                >
                    <MaterialCommunityIcons name="help-circle-outline" size={22} color={colors.primaryDark}/>
                    <Text style={styles.textOption}>Sobre o Reaproveita</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark}/>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.buttonOption, styles.buttonLogout]} onPress={() => logout()}>
                    <MaterialCommunityIcons name="logout" size={22} color={colors.error}/>
                    <Text style={[styles.textOption, {color:colors.error}]}>Sair</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primaryDark}/>
                </TouchableOpacity>
            </View>

            <Text style={styles.version}>Reaproveita Franca v1.0.0 • 2026</Text>

            {/* Admin não tem navbar: volta ao painel por aqui. */}
            {user.role === "admin" && (
                <TouchableOpacity
                    style={styles.buttonAdmin}
                    onPress={() => navigation.navigate("DashboardScreen")}
                >
                    <Text style={styles.buttonAdminText}>Voltar ao painel Admin</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
        {user.role == "user" && (
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
                case "marketplace":
                    navigation.navigate("MarketplaceScreen");
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
            ativo="perfil"
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
        textAlign:"left",
        fontFamily:fonts.serif,
        fontSize:36,
        color:colors.primaryDark,
        marginTop:12,
        lineHeight:42,
        letterSpacing:-1
    },
    buttonMenu: {
        width:28,
        height:40,
        justifyContent:"center",
        alignItems:"center"
    },
    viewUser: {
        width:"90%",
        alignItems:"center",
        alignSelf:"center",
        flexDirection:"row",
        gap:18,
        marginTop:22,
        padding:22,
        borderRadius:20,
        backgroundColor:colors.primaryDark
    },
    viewPhoto: {
        width:84,
        height:84
    },
    image: {
        width:84,
        height:84,
        borderRadius:100,
        borderWidth:0,
        borderColor:colors.primary,
        resizeMode:"cover"
    },
    photo: {
        width:84,
        height:84,
        borderRadius:100,
        borderWidth:1,
        borderColor:colors.railLine,
        backgroundColor:"rgba(250,249,245,0.08)",
        justifyContent:"center",
        alignItems:"center"
    },
    buttonPhoto: {
        position:"absolute",
        bottom:0,
        right:0,
        width:32,
        height:32,
        borderRadius:100,
        borderWidth:0,
        borderColor:colors.white,
        backgroundColor:colors.background,
        justifyContent:"center",
        alignItems:"center"
    },
    name: {
        marginTop:6,
        paddingHorizontal:0,
        fontSize:24,
        fontFamily:fonts.serif,
        color:colors.background,
        textAlign:"left"
    },
    subtitle: {
        marginTop:4,
        paddingHorizontal:0,
        fontSize:13,
        fontFamily:fonts.regular,
        color:colors.railText,
        textAlign:"left",
        lineHeight:20
    },
    viewButtons: {
        width:"90%",
        paddingHorizontal:0,
        paddingVertical:0,
        alignSelf:"center",
        marginTop:18,
        borderRadius:20,
        borderWidth:1,
        borderColor:colors.borderLight,
        backgroundColor:colors.white,
        overflow:"hidden"
    },
    buttonOption: {
        width:"100%",
        minHeight:58,
        flexDirection:"row",
        alignItems:"center",
        marginBottom:0,
        borderRadius:0,
        borderWidth:0,
        backgroundColor:colors.white,
        paddingHorizontal:18,
        borderBottomWidth:1,
        borderBottomColor:colors.borderLight
    },
    textOption: {
        flex:1,
        marginLeft:12,
        marginRight:12,
        fontSize:14,
        fontFamily:fonts.bold,
        color:colors.primaryDark
    },
    version: {
        marginTop:22,
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
    buttonAdmin: {
        width:"90%",
        minHeight:54,
        marginBottom:32,
        borderRadius:100,
        borderWidth:1,
        borderColor:colors.border,
        backgroundColor:colors.white,
        justifyContent:"center",
        alignItems:"center",
        alignSelf:"center"
    },
    buttonAdminText: {
        fontFamily:fonts.bold,
        fontSize:14,
        color:colors.primaryDark
    },
    button: {
        width:"90%",
        marginTop:30,
        paddingHorizontal:20,
        paddingVertical:22,
        backgroundColor:colors.primaryDark,
        borderRadius:8,
        justifyContent:"center",
        alignSelf:"center",
        alignItems:"center"
    },
    buttonText: {
        color:colors.white,
        fontFamily:fonts.bold,
        fontSize:15
    },
    heading: {
        width:"90%",
        alignSelf:"center",
        paddingTop:28
    },
    eyebrow: {
        fontFamily:fonts.regular,
        fontSize:11,
        letterSpacing:2,
        textTransform:"uppercase",
        color:colors.textSecondary
    },
    titleEm: {
        fontFamily:fonts.serifItalic,
        color:colors.primary
    },
    headingText: {
        marginTop:12,
        fontFamily:fonts.regular,
        fontSize:14,
        lineHeight:22,
        color:colors.textSecondary
    },
    monogram: {
        fontFamily:fonts.serifBold,
        fontSize:38,
        color:colors.background
    },
    monogramDot: {
        color:colors.accent
    },
    viewUserTexts: {
        flex:1,
        minWidth:0
    },
    panelEyebrow: {
        fontFamily:fonts.regular,
        fontSize:10,
        letterSpacing:2,
        textTransform:"uppercase",
        color:colors.railText
    },
    buttonLogout: {
        borderBottomWidth:0
    }
})