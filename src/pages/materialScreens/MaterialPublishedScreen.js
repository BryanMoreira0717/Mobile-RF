import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import {
    Manrope_400Regular,
    Manrope_700Bold
} from "@expo-google-fonts/manrope";

import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";

export default function MaterialPublishedScreen({ navigation }) {
    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold
    })

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("DashboardScreen")
        }
    }

    function openAdvertisements() {
        Alert.alert(
            "Em breve",
            "A página de anúncios da empresa ainda não está conectada."
        )
    }

    function goToDashboard() {
        navigation.navigate("DashboardScreen")
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
                    Material publicado
                </Text>

                <Text style={styles.subtitle}>
                    Seu material está disponível para novas oportunidades
                    de reaproveitamento.
                </Text>

                <View style={styles.viewIcon}>
                    <MaterialCommunityIcons
                        name="check-circle-outline"
                        size={24}
                        color={colors.primary}
                    />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={openAdvertisements}
                    accessibilityRole="button"
                >
                    <Text style={styles.buttonText}>
                        Meus anúncios
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.buttonOutline}
                    onPress={goToDashboard}
                    accessibilityRole="button"
                >
                    <Text style={styles.buttonOutlineText}>
                        Voltar ao painel
                    </Text>
                </TouchableOpacity>
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
        padding: 24,
        backgroundColor: colors.background
    },
    scrollContent: {
        paddingHorizontal: 22,
        paddingTop: 8,
        paddingBottom: 32
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
        marginTop: 18,
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    viewIcon: {
        marginTop: 28,
        marginBottom: 28,
        paddingLeft: 16
    },
    button: {
        width: "100%",
        minHeight: 54,
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
    buttonOutline: {
        width: "100%",
        minHeight: 54,
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 15,
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
    }
})