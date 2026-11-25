import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet
} from "react-native"
import { useState, useEffect } from "react"
import { useFonts } from "expo-font"
import {
    Manrope_400Regular,
    Manrope_700Bold
} from "@expo-google-fonts/manrope"
import { Gelasio_400Regular } from "@expo-google-fonts/gelasio"

import colors from "../theme/colors"
import { fonts } from "../theme/fonts"

// Guarda a função que abre o aviso (o AppAlertHost fica no App.js).
let openAlert = null

// Mesmo jeito de usar do Alert.alert do React Native:
// showAlert("Título", "Mensagem", [{ text, style, onPress }])
export function showAlert(title, message, buttons) {
    const alert = {
        title: title,
        message: message,
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: "OK" }]
    }

    if (openAlert) {
        openAlert(alert)
    } else {
        console.log("Aviso:", title, message)
    }
}

export default function AppAlertHost() {
    // Fila: se chegar um aviso com outro aberto, ele aparece depois.
    const [alerts, setAlerts] = useState([])

    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
        Gelasio_400Regular
    })

    useEffect(() => {
        openAlert = (alert) => setAlerts(prev => [...prev, alert])

        return () => {
            openAlert = null
        }
    }, [])

    const alert = alerts[0]

    function pressButton(button) {
        setAlerts(prev => prev.slice(1))

        if (button && button.onPress) {
            button.onPress()
        }
    }

    // Botão voltar do Android: usa o "cancelar" ou o único botão do aviso.
    function closeAlert() {
        const cancel = alert.buttons.find(item => item.style === "cancel")

        if (cancel) {
            pressButton(cancel)
        } else if (alert.buttons.length === 1) {
            pressButton(alert.buttons[0])
        }
    }

    if (!alert || !fontsLoaded) {
        return null
    }

    // Até dois botões ficam lado a lado; mais que isso, um embaixo do outro.
    const column = alert.buttons.length > 2

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={closeAlert}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.brand}>
                        <Text style={styles.brandText}>r</Text>
                        <View style={styles.brandDot} />
                    </View>

                    {alert.title ? (
                        <Text style={styles.title}>{alert.title}</Text>
                    ) : null}

                    {alert.message ? (
                        <Text style={styles.message}>{alert.message}</Text>
                    ) : null}

                    <View style={[styles.buttons, column && styles.buttonsColumn]}>
                        {alert.buttons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    !column && styles.buttonRow,
                                    button.style === "cancel" && styles.buttonCancel,
                                    button.style === "destructive" && styles.buttonDestructive
                                ]}
                                onPress={() => pressButton(button)}
                                accessibilityRole="button"
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        button.style === "cancel" && styles.buttonTextCancel
                                    ]}
                                >
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        padding: 28,
        backgroundColor: "rgba(15,61,46,0.45)"
    },
    card: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.background
    },
    brand: {
        width: 40,
        height: 40,
        marginBottom: 14,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primaryLight
    },
    brandText: {
        fontSize: 22,
        lineHeight: 26,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    brandDot: {
        width: 5,
        height: 5,
        marginTop: 10,
        marginLeft: 1,
        borderRadius: 3,
        backgroundColor: colors.accent
    },
    title: {
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.serif,
        color: colors.primaryDark
    },
    message: {
        marginTop: 8,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: fonts.regular,
        color: colors.textSecondary
    },
    buttons: {
        marginTop: 22,
        flexDirection: "row",
        gap: 10
    },
    buttonsColumn: {
        flexDirection: "column"
    },
    button: {
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primaryDark
    },
    buttonRow: {
        flex: 1
    },
    buttonCancel: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white
    },
    buttonDestructive: {
        backgroundColor: colors.error
    },
    buttonText: {
        fontSize: 14,
        fontFamily: fonts.bold,
        color: colors.white,
        textAlign: "center"
    },
    buttonTextCancel: {
        color: colors.primaryDark
    }
})
