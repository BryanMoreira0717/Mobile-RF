import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    DevSettings
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors, { palettes, theme } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

// Opções de tema. "palette" é a paleta mostrada nas bolinhas de exemplo.
const options = [
    {
        id: "automatico",
        title: "Automático",
        text: "Segue o modo claro ou escuro do celular.",
        icon: "theme-light-dark",
        palette: null
    },
    {
        id: "claro",
        title: "Claro",
        text: "Papel claro e verde floresta.",
        icon: "white-balance-sunny",
        palette: palettes.claro
    },
    {
        id: "escuro",
        title: "Escuro",
        text: "Fundo escuro, mais leve para os olhos à noite.",
        icon: "weather-night",
        palette: palettes.escuro
    },
    {
        id: "retro",
        title: "Retrô",
        text: "Papel envelhecido, marrom café e laranja anos 70.",
        icon: "record-player",
        palette: palettes.retro
    }
]

export default function AppearanceScreen({ navigation }) {
    const [selected, setSelected] = useState(theme.choice)
    const [saving, setSaving] = useState(false)

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    async function chooseTheme(id) {
        if (saving || id === theme.choice) return

        try {
            setSaving(true)
            setSelected(id)

            await AsyncStorage.setItem("@theme", id)
            // Depois de recarregar, o app volta para esta tela.
            await AsyncStorage.setItem("@themeReload", "AppearanceScreen")

            // As telas leem as cores quando abrem, então o app recarrega
            // para todas pegarem o tema novo. No app instalado (sem modo
            // de desenvolvimento) o recarregamento não existe: pede para reabrir.
            if (__DEV__) {
                DevSettings.reload()
            } else {
                Alert.alert(
                    "Tema salvo",
                    "Feche e abra o app para aplicar o tema em todas as telas."
                )
                setSaving(false)
            }
        } catch (e) {
            console.log("Erro ao salvar tema:", e?.message)
            Alert.alert("Erro", "Não foi possível salvar o tema.")
            setSelected(theme.choice)
            setSaving(false)
        }
    }

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("ProfileScreen")
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

                <Text style={styles.eyebrow}>Minha conta</Text>
                <Text style={styles.title}>
                    Aparência
                </Text>

                <Text style={styles.subtitle}>
                    Escolha as cores do app. Ao trocar, o app reinicia para aplicar o tema em todas as telas.
                </Text>

                <View style={styles.viewOptions}>
                    {options.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.option,
                                index === options.length - 1 && styles.optionLast,
                                selected === item.id && styles.optionSelected
                            ]}
                            onPress={() => chooseTheme(item.id)}
                            disabled={saving}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected === item.id }}
                            accessibilityLabel={"Tema " + item.title}
                        >
                            <MaterialCommunityIcons
                                name={item.icon}
                                size={22}
                                color={colors.primaryDark}
                            />

                            <View style={styles.optionTexts}>
                                <Text style={styles.optionTitle}>
                                    {item.title}
                                    {item.id === "automatico" && theme.choice === "automatico"
                                        ? " (" + (theme.name === "escuro" ? "escuro agora" : "claro agora") + ")"
                                        : ""}
                                </Text>
                                <Text style={styles.optionText}>{item.text}</Text>

                                {item.palette && (
                                    <View style={styles.swatches}>
                                        <View style={[styles.swatch, { backgroundColor: item.palette.background }]} />
                                        <View style={[styles.swatch, { backgroundColor: item.palette.white }]} />
                                        <View style={[styles.swatch, { backgroundColor: item.palette.primaryDark }]} />
                                        <View style={[styles.swatch, { backgroundColor: item.palette.accent }]} />
                                    </View>
                                )}
                            </View>

                            {saving && selected === item.id ? (
                                <ActivityIndicator color={colors.primaryDark} />
                            ) : (
                                <MaterialCommunityIcons
                                    name={selected === item.id ? "radiobox-marked" : "radiobox-blank"}
                                    size={22}
                                    color={colors.primaryDark}
                                />
                            )}
                        </TouchableOpacity>
                    ))}
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
        padding: 24,
        backgroundColor: colors.background
    },
    scrollContent: {
        paddingHorizontal: 21,
        paddingTop: 8,
        paddingBottom: 32
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
        marginBottom: 10,
        fontFamily: fonts.regular,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.textSecondary
    },
    title: {
        fontSize: 34,
        lineHeight: 40,
        fontFamily: fonts.serif,
        color: colors.primaryDark,
        letterSpacing: -0.8
    },
    subtitle: {
        marginTop: 16,
        marginBottom: 20,
        fontSize: 15,
        lineHeight: 24,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    viewOptions: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white,
        overflow: "hidden"
    },
    option: {
        minHeight: 72,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        backgroundColor: colors.white
    },
    optionLast: {
        borderBottomWidth: 0
    },
    optionSelected: {
        backgroundColor: colors.primaryLight
    },
    optionTexts: {
        flex: 1,
        minWidth: 0
    },
    optionTitle: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    optionText: {
        marginTop: 2,
        fontSize: 12,
        lineHeight: 18,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    swatches: {
        flexDirection: "row",
        gap: 6,
        marginTop: 8
    },
    swatch: {
        width: 18,
        height: 18,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: colors.border
    }
})
