import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"

import { getPromotionsSchedule } from "./promotionCalendar"

// As promoções ficam agendadas no próprio celular: chegam mesmo com o app
// fechado. Toda vez que o painel abre, a agenda dos próximos 30 dias é refeita.
const DAYS_AHEAD = 30
const PREFIX = "promo-"

// Apaga só as notificações de promoção que ainda não saíram.
export async function cancelPromotions() {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync()

        for (const item of scheduled) {
            if (item.identifier.startsWith(PREFIX)) {
                await Notifications.cancelScheduledNotificationAsync(item.identifier)
            }
        }
    } catch (error) {
        console.log("Erro ao cancelar promoções:", error.message)
    }
}

// Agenda as promoções de comprador (user) ou empresa (company).
// Respeita a chave "@promoNotifications" ("off" = desligadas no app).
export async function schedulePromotions(role) {
    try {
        await cancelPromotions()

        if (role !== "user" && role !== "company") return

        const preference = await AsyncStorage.getItem("@promoNotifications")

        if (preference === "off") return

        const permission = await Notifications.getPermissionsAsync()

        if (permission.status !== "granted") return

        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("promocoes", {
                name: "Promoções e datas especiais",
                importance: Notifications.AndroidImportance.DEFAULT,
                sound: "default"
            })
        }

        const list = getPromotionsSchedule(new Date(), DAYS_AHEAD, role)

        for (let i = 0; i < list.length; i++) {
            await Notifications.scheduleNotificationAsync({
                identifier: PREFIX + i,
                content: {
                    title: list[i].title,
                    body: list[i].body,
                    data: { screen: list[i].screen },
                    sound: true,
                    color: "#0F3D2E"
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: list[i].date,
                    channelId: "promocoes"
                }
            })
        }
    } catch (error) {
        console.log("Erro ao agendar promoções:", error.message)
    }
}

// Mostra uma promoção daqui a 5 segundos (botão de teste na tela de notificações).
export async function sendTestPromotion(role) {
    const permission = await Notifications.requestPermissionsAsync()

    if (permission.status !== "granted") {
        throw new Error("Notificações não permitidas.")
    }

    const list = getPromotionsSchedule(new Date(), DAYS_AHEAD, role)
    const example = list[0] || {
        title: "Não perca as doações de hoje",
        body: "Materiais em doação saem por R$ 0.",
        screen: "MarketplaceScreen"
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("promocoes", {
            name: "Promoções e datas especiais",
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: "default"
        })
    }

    await Notifications.scheduleNotificationAsync({
        identifier: "teste-" + Date.now(),
        content: {
            title: example.title,
            body: example.body,
            data: { screen: example.screen },
            sound: true,
            color: "#0F3D2E"
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5,
            channelId: "promocoes"
        }
    })
}
