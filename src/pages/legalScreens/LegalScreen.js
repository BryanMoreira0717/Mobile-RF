import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator
} from "react-native"
import { useRef } from "react"
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

import colors from "../../theme/colors"
import { fonts } from "../../theme/fonts"
import legalDocuments from "./legalContent"

// Termos, privacidade, direitos, contato e cookies (mesmas páginas do site).
export default function LegalScreen({ navigation, route }) {
    const kind = legalDocuments[route?.params?.kind] ? route.params.kind : "termos"
    const document = legalDocuments[kind]

    const scrollRef = useRef(null)
    // Posição de cada seção, para o índice levar até ela.
    const positions = useRef({})

    const [fontsLoaded, fontError] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Gelasio_400Regular,
        Gelasio_400Regular_Italic,
        Gelasio_700Bold
    })

    function goBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.navigate("Home")
        }
    }

    function goToSection(index) {
        const y = positions.current[index]

        if (y !== undefined) {
            scrollRef.current?.scrollTo({ y: y - 12, animated: true })
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
                ref={scrollRef}
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

                <Text style={styles.eyebrow}>{document.label}</Text>
                <Text style={styles.title}>{document.title}</Text>
                <Text style={styles.subtitle}>{document.description}</Text>

                <View style={styles.notice}>
                    <MaterialCommunityIcons name="information-outline" size={18} color={colors.accent} />
                    <Text style={styles.noticeText}>
                        Documento preliminar: a entidade responsável e o canal institucional ainda estão em definição.
                    </Text>
                </View>

                {/* Índice do documento */}
                <View style={styles.index}>
                    <Text style={styles.indexTitle}>Neste documento</Text>

                    {document.sections.map((section, index) => (
                        <TouchableOpacity
                            key={section.title}
                            style={styles.indexItem}
                            onPress={() => goToSection(index)}
                            accessibilityRole="button"
                        >
                            <Text style={styles.indexNumber}>{String(index + 1).padStart(2, "0")}</Text>
                            <Text style={styles.indexText}>{section.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {document.sections.map((section, index) => (
                    <View
                        key={section.title}
                        style={styles.section}
                        onLayout={event => {
                            positions.current[index] = event.nativeEvent.layout.y
                        }}
                    >
                        <Text style={styles.sectionNumber}>{String(index + 1).padStart(2, "0")}</Text>
                        <Text style={styles.sectionTitle}>{section.title}</Text>

                        {section.texts.map(text => (
                            <Text key={text} style={styles.text}>{text}</Text>
                        ))}
                    </View>
                ))}

                {/* Outros documentos */}
                <View style={styles.others}>
                    <Text style={styles.indexTitle}>Outros documentos</Text>

                    <View style={styles.links}>
                        {Object.entries(legalDocuments)
                            .filter(([key]) => key !== kind)
                            .map(([key, item]) => (
                                <TouchableOpacity
                                    key={key}
                                    onPress={() => navigation.push("LegalScreen", { kind: key })}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.link}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}

                        <TouchableOpacity
                            onPress={() => navigation.navigate("AboutScreen")}
                            accessibilityRole="button"
                        >
                            <Text style={styles.link}>Sobre o projeto</Text>
                        </TouchableOpacity>
                    </View>
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
        paddingHorizontal: 21,
        paddingTop: 8,
        paddingBottom: 40
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
        fontSize: 36,
        lineHeight: 42,
        fontFamily: fonts.serif,
        color: colors.primaryDark,
        letterSpacing: -1
    },
    subtitle: {
        marginTop: 14,
        fontSize: 15,
        lineHeight: 24,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    notice: {
        flexDirection: "row",
        gap: 10,
        marginTop: 20,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderMuted,
        borderLeftWidth: 3,
        borderLeftColor: colors.accent,
        backgroundColor: colors.white
    },
    noticeText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    index: {
        marginTop: 22,
        padding: 18,
        borderRadius: 20,
        backgroundColor: colors.surfaceMuted
    },
    indexTitle: {
        marginBottom: 8,
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    indexItem: {
        minHeight: 40,
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    indexNumber: {
        fontSize: 11,
        fontFamily: fonts.regular,
        color: colors.textTertiary
    },
    indexText: {
        flex: 1,
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.primaryDark,
        textDecorationLine: "underline"
    },
    section: {
        marginTop: 30,
        paddingTop: 22,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight
    },
    sectionNumber: {
        fontSize: 11,
        letterSpacing: 1.5,
        fontFamily: fonts.regular,
        color: colors.textTertiary
    },
    sectionTitle: {
        marginTop: 4,
        marginBottom: 8,
        fontSize: 24,
        lineHeight: 30,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    text: {
        marginTop: 8,
        fontSize: 15,
        lineHeight: 25,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    others: {
        marginTop: 36,
        paddingTop: 22,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight
    },
    links: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 18
    },
    link: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.primaryDark,
        textDecorationLine: "underline"
    }
})
