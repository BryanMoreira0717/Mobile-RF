import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    ActivityIndicator
} from "react-native"
import { useState, useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFonts } from "expo-font"
import {
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold
} from "@expo-google-fonts/manrope"
import {
    Gelasio_400Regular,
    Gelasio_400Regular_Italic,
    Gelasio_700Bold
} from "@expo-google-fonts/gelasio"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

import colors from "../../theme/colors"
import { fonts } from "../../theme/fonts"

// Página "Sobre" do site: a história do Reaproveita Franca.
const ciclo = [
    { numero: "01", icone: "leaf", titulo: "Disponibilizar", texto: "Empresas apresentam os materiais que sobram da produção para venda ou doação." },
    { numero: "02", icone: "handshake-outline", titulo: "Conectar", texto: "Pessoas e iniciativas locais encontram materiais que podem fazer parte de uma nova criação." },
    { numero: "03", icone: "map-marker-outline", titulo: "Transformar", texto: "Novos encontros dão continuidade à história de cada material e fortalecem a rede local." }
]

export default function AboutScreen({ navigation }) {
    // Quem já está logado não vê o convite para criar conta.
    const [logged, setLogged] = useState(false)

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    useEffect(() => {
        AsyncStorage.getItem("@token")
            .then(token => setLogged(Boolean(token)))
            .catch(() => {})
    }, [])

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("Home")
        }
    }

    if (fontError) {
        return (
            <View style={styles.loading}>
                <Text>Não foi possível carregar as fontes.</Text>
            </View>
        )
    }

    if (!fontsLoaded) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />
            </View>
        )
    }

    return (
        <SafeAreaView
            style={styles.background}
            edges={["top", "left", "right", "bottom"]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                    <TouchableOpacity
                        style={styles.buttonBack}
                        onPress={goBack}
                        accessibilityRole="button"
                        accessibilityLabel="Voltar"
                    >
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={18}
                            color={colors.primaryDark}
                        />

                        <Text style={styles.textBack}>
                            Voltar
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.eyebrow}>De Franca. Para novos começos.</Text>
                    <Text style={styles.title}>
                        O que sobra{"\n"}também pode{"\n"}<Text style={styles.titleEm}>aproximar.</Text>
                    </Text>

                    <Text style={styles.edition}>Nossa proposta · 01</Text>
                    <Text style={styles.text}>
                        Uma rede que conecta a indústria de Franca a quem encontra novas possibilidades em cada material.
                    </Text>
                </View>

                <View style={styles.photo}>
                    <Image
                        source={require("../../../assets/images/web/hero-leather-scraps.jpg")}
                        style={styles.image}
                        accessibilityLabel="Retalhos de couro marrom, com diferentes tamanhos e texturas"
                    />
                </View>
                <View style={[styles.container, styles.caption]}>
                    <Text style={styles.captionText}>Matéria que ainda tem muito a oferecer.</Text>
                    <View style={styles.captionPlace}>
                        <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.captionText}>Franca, São Paulo</Text>
                    </View>
                </View>

                <View style={[styles.container, styles.section]}>
                    <Text style={styles.eyebrow}>Uma ideia que circula</Text>
                    <Text style={styles.sectionTitle}>
                        Entre o descarte{"\n"}e a criação,{"\n"}<Text style={styles.titleEm}>existe uma conexão.</Text>
                    </Text>

                    <Text style={styles.text}>
                        Franca tem uma história feita de trabalho, indústria e saber fazer. Dessa produção também surgem retalhos, aparas e sobras que ainda carregam valor.
                    </Text>
                    <Text style={styles.text}>
                        O Reaproveita Franca nasce para aproximar empresas, artesãos, cooperativas e iniciativas locais. Um espaço para disponibilizar materiais e descobrir o que eles podem se tornar.
                    </Text>
                    <Text style={styles.text}>
                        Acreditamos que transformar começa assim: enxergando possibilidades e conectando pessoas.
                    </Text>
                </View>

                <View style={[styles.container, styles.section]}>
                    {ciclo.map(item => (
                        <View key={item.numero} style={styles.cycleItem}>
                            <View style={styles.cycleTop}>
                                <Text style={styles.cycleNumber}>{item.numero}</Text>
                                <MaterialCommunityIcons name={item.icone} size={24} color={colors.primaryDark} />
                            </View>
                            <Text style={styles.cycleTitle}>{item.titulo}</Text>
                            <Text style={styles.text}>{item.texto}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.invitation}>
                    <Text style={[styles.eyebrow, styles.eyebrowLight]}>O próximo ciclo pode começar com você</Text>
                    <Text style={[styles.sectionTitle, styles.textLight]}>
                        Faça parte{"\n"}<Text style={styles.titleEm}>dessa história.</Text>
                    </Text>

                    {!logged && (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => navigation.navigate("SelectUserType")}
                            accessibilityRole="button"
                        >
                            <Text style={styles.buttonText}>Encontrar meu lugar na rede</Text>
                            <MaterialCommunityIcons name="arrow-top-right" size={18} color={colors.primaryDark} />
                        </TouchableOpacity>
                    )}

                    <Text style={styles.invitationNote}>Da indústria para a criatividade.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.background
    },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background
    },
    scrollContent: {
        paddingTop: 8,
        paddingBottom: 40
    },
    container: {
        paddingHorizontal: 21
    },
    buttonBack: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginBottom: 16
    },
    textBack: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.primaryDark,
        textDecorationLine: "underline"
    },
    eyebrow: {
        fontFamily: fonts.bold,
        fontSize: 10,
        letterSpacing: 2.4,
        textTransform: "uppercase",
        color: colors.primaryDark
    },
    eyebrowLight: {
        color: colors.background
    },
    title: {
        marginTop: 18,
        fontSize: 46,
        lineHeight: 48,
        fontFamily: fonts.extraBold,
        letterSpacing: -2.2,
        color: colors.primaryDark
    },
    titleEm: {
        fontFamily: fonts.serifItalic,
        letterSpacing: -1.4
    },
    edition: {
        marginTop: 26,
        fontSize: 11,
        letterSpacing: 1.6,
        fontFamily: fonts.regular,
        color: colors.textTertiary
    },
    text: {
        marginTop: 10,
        fontSize: 15,
        lineHeight: 25,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    photo: {
        width: "100%",
        aspectRatio: 1.9,
        marginTop: 28
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover"
    },
    caption: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 8,
        marginTop: 10
    },
    captionPlace: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    captionText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    section: {
        marginTop: 44
    },
    sectionTitle: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 36,
        lineHeight: 40,
        fontFamily: fonts.extraBold,
        letterSpacing: -1.6,
        color: colors.primaryDark
    },
    textLight: {
        color: colors.background
    },
    cycleItem: {
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight
    },
    cycleTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    cycleNumber: {
        fontSize: 12,
        letterSpacing: 1.6,
        fontFamily: fonts.regular,
        color: colors.textTertiary
    },
    cycleTitle: {
        marginTop: 10,
        fontSize: 26,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    invitation: {
        marginTop: 36,
        paddingHorizontal: 21,
        paddingVertical: 40,
        backgroundColor: colors.primaryDark
    },
    button: {
        minHeight: 50,
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 16,
        paddingHorizontal: 22,
        borderRadius: 100,
        backgroundColor: colors.background
    },
    buttonText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    invitationNote: {
        marginTop: 24,
        fontSize: 16,
        fontFamily: fonts.serif,
        color: colors.railText
    }
})
