import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
    Manrope_400Regular,
    Manrope_700Bold
} from "@expo-google-fonts/manrope";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";
import NavBar from "../../components/NavBar";
import api from "../../services/axios";

export default function MyAdvertisementsScreen({ navigation }) {
    const [user, setUser] = useState(null)
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")

    const isFocused = useIsFocused()

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold
    })

    useEffect(() => {
        if (isFocused) {
            loadAdvertisements()
        }
    }, [isFocused])

    async function loadAdvertisements() {
        try {
            setLoading(true)
            setErrorMessage("")
            setMaterials([])
            setUser(null)

            const storedUser = await AsyncStorage.getItem("@user")

            if (!storedUser) return

            const parsedUser = JSON.parse(storedUser)

            if (!parsedUser || !parsedUser.id) return

            setUser(parsedUser)

            if (parsedUser.role !== "company") return

            const response = await api.getProducts()

            if (!Array.isArray(response.data)) {
                setErrorMessage("Não foi possível carregar os anúncios.")
                return
            }

            const myMaterials = response.data.filter(item =>
                String(item.id_user).toLowerCase() ===
                String(parsedUser.id).toLowerCase()
            )

            setMaterials(myMaterials)
        } catch (error) {
            console.log(
                "Erro ao carregar anúncios:",
                error.response?.data || error.message
            )

            setErrorMessage(
                "Não foi possível carregar seus anúncios. Tente novamente."
            )
        } finally {
            setLoading(false)
        }
    }

    function getStatus(status) {
        switch (status) {
            case "available":
                return "Publicado"
            case "reserved":
                return "Reservado"
            case "unavailable":
                return "Indisponível"
            default:
                return "Status não informado"
        }
    }

    function openAdvertisement(material) {
        // Exibe um resumo até a página de detalhes ser implementada.
        Alert.alert(
            material.name,
            "Quantidade: " + material.quantity +
            "\nPeso: " + material.weight + " kg" +
            "\nStatus: " + getStatus(material.status) +
            (material.description
                ? "\n\n" + material.description
                : "")
        )
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("DashboardScreen")
        }
    }

    function handleNavigation(item) {
        switch (item) {
            case "inicio":
                navigation.navigate("DashboardScreen")
                break
            case "mapa":
                navigation.navigate("MapScreen")
                break
            case "publicar":
                navigation.navigate("NewMaterialScreen")
                break
            case "anuncios":
                break
            case "perfil":
                navigation.navigate("ProfileScreen")
                break
        }
    }

    if (fontError) {
        return (
            <View style={styles.loading}>
                <Text>Não foi possível carregar as fontes.</Text>
            </View>
        )
    }

    if (!fontsLoaded || loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />
            </View>
        )
    }

    if (errorMessage && !user) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    Não foi possível carregar os dados da sua sessão.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={loadAdvertisements}
                >
                    <Text style={styles.buttonText}>
                        Tentar novamente
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    Não foi possível carregar seu usuário.
                    {"\n"}Faça login novamente.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.reset({
                        index: 0,
                        routes: [{ name: "Login" }]
                    })}
                >
                    <Text style={styles.buttonText}>
                        Ir para o login
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    if (user.role !== "company") {
        return (
            <SafeAreaView style={styles.loading}>
                <Text style={styles.message}>
                    Esta página é destinada ao perfil de empresa.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        navigation.navigate("DashboardScreen")
                    }
                >
                    <Text style={styles.buttonText}>
                        Voltar ao início
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right"]}
        >
            <View style={styles.container}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity
                        style={styles.buttonBack}
                        onPress={goBack}
                        accessibilityRole="button"
                        accessibilityLabel="Voltar"
                    >
                        <MaterialCommunityIcons
                            name="chevron-left"
                            size={22}
                            color={colors.primaryDark}
                        />

                        <Text style={styles.textBack}>
                            Voltar
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>
                        Meus anúncios
                    </Text>

                    <Text style={styles.subtitle}>
                        Acompanhe os materiais publicados e as reservas.
                    </Text>

                    {errorMessage ? (
                        <View style={styles.viewMessage}>
                            <Text style={styles.message}>
                                {errorMessage}
                            </Text>

                            <TouchableOpacity
                                style={styles.buttonOutline}
                                onPress={loadAdvertisements}
                            >
                                <Text style={styles.buttonOutlineText}>
                                    Tentar novamente
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : materials.length === 0 ? (
                        <View style={styles.viewMessage}>
                            <MaterialCommunityIcons
                                name="package-variant-closed"
                                size={36}
                                color={colors.primary}
                            />

                            <Text style={styles.emptyTitle}>
                                Você ainda não publicou materiais
                            </Text>

                            <Text style={styles.emptyText}>
                                Publique seu primeiro material para
                                acompanhar seus anúncios aqui.
                            </Text>
                        </View>
                    ) : (
                        materials.map(item => (
                            <View
                                key={item.id}
                                style={styles.card}
                            >
                                {typeof item.photo === "string" &&
                                    item.photo.trim() !== "" && (
                                        <Image
                                            source={{ uri: item.photo }}
                                            style={styles.image}
                                            accessibilityLabel={
                                                "Foto de " + item.name
                                            }
                                        />
                                    )
                                }

                                <Text style={styles.materialName}>
                                    {item.name}
                                </Text>

                                <Text style={styles.materialInformation}>
                                    {item.weight} kg
                                    {" · "}
                                    {getStatus(item.status)}
                                </Text>

                                <TouchableOpacity
                                    style={styles.buttonOutline}
                                    onPress={() => openAdvertisement(item)}
                                    accessibilityRole="button"
                                    accessibilityLabel={
                                        "Ver anúncio de " + item.name
                                    }
                                >
                                    <Text style={styles.buttonOutlineText}>
                                        Ver anúncio
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() =>
                            navigation.navigate("NewMaterialScreen")
                        }
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonText}>
                            Publicar novo material
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonDashboard}
                        onPress={() =>
                            navigation.navigate("DashboardScreen")
                        }
                        accessibilityRole="button"
                    >
                        <Text style={styles.textDashboard}>
                            Voltar ao painel
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                <NavBar
                    estagio="empresa"
                    ativo="anuncios"
                    onNavigate={handleNavigation}
                />
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.background
    },
    container: {
        flex: 1
    },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: colors.background
    },
    scrollContent: {
        paddingHorizontal: 22,
        paddingTop: 8,
        paddingBottom: 120
    },
    buttonBack: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginBottom: 24
    },
    textBack: {
        marginLeft: 4,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    title: {
        fontSize: 26,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    subtitle: {
        marginTop: 14,
        marginBottom: 22,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    card: {
        width: "100%",
        padding: 16,
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: colors.white
    },
    image: {
        width: "100%",
        aspectRatio: 512 / 216,
        marginBottom: 16,
        borderRadius: 12,
        resizeMode: "cover"
    },
    materialName: {
        fontSize: 16,
        lineHeight: 24,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    materialInformation: {
        marginTop: 10,
        marginBottom: 14,
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    buttonOutline: {
        width: "100%",
        minHeight: 54,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.white,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonOutlineText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    button: {
        width: "100%",
        minHeight: 54,
        marginTop: 8,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 15,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.white
    },
    buttonDashboard: {
        minHeight: 48,
        marginTop: 16,
        justifyContent: "center",
        alignItems: "center"
    },
    textDashboard: {
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    viewMessage: {
        paddingVertical: 24,
        alignItems: "center",
        marginBottom: 16
    },
    message: {
        fontSize: 15,
        lineHeight: 23,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 20
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 17,
        fontFamily: fonts.bold,
        color: colors.primaryDark,
        textAlign: "center"
    },
    emptyText: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        textAlign: "center"
    }
})