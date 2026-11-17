// Calendário das notificações de promoções e datas especiais.
//
// Regra de frequência (média dos apps de loja: até 1 aviso por dia e,
// em geral, de 2 a 5 por semana — mais que isso as pessoas desativam):
// - no máximo 1 notificação por dia;
// - nas datas especiais vai a campanha da data;
// - nos outros dias, um lembrete "não perca" só às terças, quintas e sábados.
//
// "comprador" é o texto para quem compra (role user) e "empresa" para quem vende.
// "screen" é a tela que abre quando a pessoa toca na notificação.

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).
function getEaster(year) {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    const day = ((h + l - 7 * m + 114) % 31) + 1

    return new Date(year, month - 1, day)
}

// N-ésimo dia da semana do mês (weekday: 0 = domingo ... 6 = sábado).
function getNthWeekday(year, month, weekday, n) {
    const first = new Date(year, month - 1, 1)
    const offset = (weekday - first.getDay() + 7) % 7

    return new Date(year, month - 1, 1 + offset + (n - 1) * 7)
}

function addDays(date, days) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
}

// Campanhas de um ano. Cada uma tem o dia em que a notificação sai.
export function getCampaigns(year) {
    const easter = getEaster(year)
    const mothersDay = getNthWeekday(year, 5, 0, 2)
    const fathersDay = getNthWeekday(year, 8, 0, 2)
    // Black Friday: a sexta depois da 4ª quinta-feira de novembro.
    const blackFriday = addDays(getNthWeekday(year, 11, 4, 4), 1)

    return [
        {
            date: new Date(year, 0, 2),
            comprador: { title: "Ano novo, projeto novo 🎉", body: "Comece o ano reaproveitando: veja os materiais que chegaram no marketplace." },
            empresa: { title: "Ano novo, estoque leve 🎉", body: "Sobrou material do ano passado? Anuncie e transforme sobra em venda." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 0, 25),
            comprador: { title: "Volta às aulas ✏️", body: "Papel, papelão e tecido para os trabalhos da escola por preço de sobra." },
            empresa: { title: "Volta às aulas ✏️", body: "Pais e professores procuram papel e papelão agora. Anuncie os seus." },
            screen: "MarketplaceScreen"
        },
        {
            date: addDays(easter, -51),
            comprador: { title: "Fantasia de Carnaval 🎭", body: "Retalhos de tecido e brilho para montar a fantasia sem gastar muito." },
            empresa: { title: "Carnaval chegando 🎭", body: "Retalhos de tecido saem rápido nesta semana. Publique os seus." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 2, 15),
            comprador: { title: "Dia do Consumidor 🛒", body: "Consumo consciente também é economia: não perca as doações da semana." },
            empresa: { title: "Dia do Consumidor 🛒", body: "Hoje muita gente procura ofertas. Que tal uma doação para atrair compradores?" },
            screen: "MarketplaceScreen"
        },
        {
            date: addDays(easter, -4),
            comprador: { title: "Páscoa criativa 🐰", body: "Embalagens e enfeites de Páscoa com papel e tecido reaproveitados." },
            empresa: { title: "Páscoa chegando 🐰", body: "Papel, papelão e tecido estão em alta para embalagens. Anuncie hoje." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 3, 22),
            comprador: { title: "Dia da Terra 🌎", body: "Cada material reaproveitado é menos lixo no planeta. Veja o seu impacto." },
            empresa: { title: "Dia da Terra 🌎", body: "Veja quanto a sua empresa já deixou de descartar." },
            screen: "ImpactScreen"
        },
        {
            date: addDays(mothersDay, -5),
            comprador: { title: "Presente para a mãe 💐", body: "Um presente feito à mão vale mais. Ache o material no marketplace." },
            empresa: { title: "Dia das Mães chegando 💐", body: "Artesãos estão montando presentes. Anuncie tecido, madeira e papel." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 4, 17),
            comprador: { title: "Dia Mundial da Reciclagem ♻️", body: "Comemore reaproveitando: materiais em doação saem por R$ 0." },
            empresa: { title: "Dia Mundial da Reciclagem ♻️", body: "Sua sobra pode virar o projeto de alguém. Publique um material hoje." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 5, 5),
            comprador: { title: "Dia do Meio Ambiente 🌱", body: "Veja quanto CO₂ as suas compras já evitaram." },
            empresa: { title: "Dia do Meio Ambiente 🌱", body: "Veja o impacto ambiental das vendas da sua empresa." },
            screen: "ImpactScreen"
        },
        {
            date: new Date(year, 5, 8),
            comprador: { title: "Dia dos Namorados ❤️", body: "Presente artesanal com material reaproveitado: criativo e barato." },
            empresa: { title: "Dia dos Namorados ❤️", body: "Artesãos procuram material para presentes. Anuncie as suas sobras." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 5, 20),
            comprador: { title: "Arraiá sustentável 🌽", body: "Bandeirinhas e decoração de festa junina com papel e retalhos." },
            empresa: { title: "Festa junina 🌽", body: "Papel e tecido colorido saem muito em junho. Publique os seus." },
            screen: "MarketplaceScreen"
        },
        {
            date: addDays(fathersDay, -5),
            comprador: { title: "Presente para o pai 👔", body: "Madeira e metal para um presente feito à mão. Veja no marketplace." },
            empresa: { title: "Dia dos Pais chegando 👔", body: "Madeira e metal estão em alta para presentes. Anuncie hoje." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 8, 21),
            comprador: { title: "Dia da Árvore 🌳", body: "Reaproveitar madeira poupa árvores. Veja os retalhos disponíveis." },
            empresa: { title: "Dia da Árvore 🌳", body: "Retalhos de madeira parados? Eles podem virar móveis e brinquedos." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 9, 8),
            comprador: { title: "Dia das Crianças 🧸", body: "Brinquedos com madeira e plástico reaproveitados. Ache o material aqui." },
            empresa: { title: "Dia das Crianças 🧸", body: "Artesãos fazem brinquedos nesta semana. Anuncie madeira e plástico." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 9, 28),
            comprador: { title: "Halloween 🎃", body: "Fantasia e decoração assustadora com sobras de tecido e papelão." },
            empresa: { title: "Halloween chegando 🎃", body: "Tecido preto, papelão e borracha saem rápido agora. Publique." },
            screen: "MarketplaceScreen"
        },
        {
            date: addDays(blackFriday, -1),
            comprador: { title: "Black Friday é amanhã 🖤", body: "Prepare a lista: os melhores materiais vão ser reservados primeiro." },
            empresa: { title: "Black Friday é amanhã 🖤", body: "Anuncie hoje para aparecer amanhã, no dia de mais procura." },
            screen: "MarketplaceScreen"
        },
        {
            date: blackFriday,
            comprador: { title: "É hoje: Black Friday sustentável 🖤", body: "Não perca: doações saem por R$ 0 e as vendas por preço de sobra." },
            empresa: { title: "Black Friday é hoje 🖤", body: "Dia de mais procura do ano. Confira suas reservas e anúncios." },
            screen: "MarketplaceScreen"
        },
        {
            date: addDays(blackFriday, 3),
            comprador: { title: "Última chance: Cyber Monday 💻", body: "Hoje é o último dia da semana de ofertas. Corre no marketplace." },
            empresa: { title: "Cyber Monday 💻", body: "Último dia da semana de ofertas: responda as reservas pendentes." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 11, 5),
            comprador: { title: "Natal reaproveitado 🎄", body: "Enfeites e presentes feitos à mão com material de sobra." },
            empresa: { title: "Começou o mês do Natal 🎄", body: "Dezembro é o mês de mais procura. Deixe seus anúncios em dia." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 11, 18),
            comprador: { title: "Não perca: últimos dias antes do Natal 🎁", body: "Ainda dá tempo de reservar o material do presente." },
            empresa: { title: "Semana do Natal 🎁", body: "Responda as reservas rápido: muita gente quer retirar antes do dia 24." },
            screen: "MarketplaceScreen"
        },
        {
            date: new Date(year, 11, 30),
            comprador: { title: "Sua retrospectiva verde 🌿", body: "Veja quanto material você reaproveitou neste ano." },
            empresa: { title: "Retrospectiva da empresa 🌿", body: "Veja quanto a sua empresa deixou de descartar neste ano." },
            screen: "ImpactScreen"
        }
    ]
}

// Lembretes dos dias comuns (vão girando).
const reminders = [
    {
        comprador: { title: "Não perca as doações de hoje", body: "Materiais em doação saem por R$ 0. Reserve antes de outra pessoa." },
        empresa: { title: "Tem sobra parada aí?", body: "Anuncie em poucos minutos e transforme sobra em venda." },
        screenComprador: "MarketplaceScreen",
        screenEmpresa: "NewMaterialScreen"
    },
    {
        comprador: { title: "Não perca a promoção da semana", body: "Retirada sem frete: busque o material direto na empresa." },
        empresa: { title: "Compradores esperando ⏳", body: "Confira se há reservas novas para aceitar." },
        screenComprador: "MarketplaceScreen",
        screenEmpresa: "ReservationRequestsScreen"
    },
    {
        comprador: { title: "Seu próximo projeto está perto", body: "Veja no mapa as empresas com material disponível na sua região." },
        empresa: { title: "Madeira, tecido e metal em alta", body: "São os materiais mais procurados. Tem algum sobrando?" },
        screenComprador: "MapScreen",
        screenEmpresa: "NewMaterialScreen"
    },
    {
        comprador: { title: "Chegou material novo", body: "Madeira, tecido, metal... o que você procura hoje?" },
        empresa: { title: "Seu impacto cresceu?", body: "Veja quanto a sua empresa já reaproveitou." },
        screenComprador: "MarketplaceScreen",
        screenEmpresa: "ImpactScreen"
    },
    {
        comprador: { title: "Já viu o seu impacto? 🌱", body: "Veja quanto CO₂ e água as suas compras já pouparam." },
        empresa: { title: "Anúncio com foto vende mais 📸", body: "Revise seus anúncios e deixe tudo atualizado." },
        screenComprador: "ImpactScreen",
        screenEmpresa: "MyAdvertisementsScreen"
    }
]

// Dias dos lembretes: terça (2), quinta (4) e sábado (6).
const REMINDER_WEEKDAYS = [2, 4, 6]

// Horário de envio: campanha às 10h, lembrete às 19h.
const CAMPAIGN_HOUR = 10
const REMINDER_HOUR = 19

// Lista das notificações dos próximos "days" dias para o tipo de conta.
// Nunca mais de uma por dia e nunca no passado.
export function getPromotionsSchedule(now, days, role) {
    const audience = role === "company" ? "empresa" : "comprador"
    const list = []
    const campaigns = [
        ...getCampaigns(now.getFullYear()),
        ...getCampaigns(now.getFullYear() + 1)
    ]

    for (let i = 0; i < days; i++) {
        const day = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), i)
        const campaign = campaigns.find(item => sameDay(item.date, day))

        let item = null

        if (campaign) {
            const date = new Date(day)
            date.setHours(CAMPAIGN_HOUR, 0, 0, 0)

            item = { date, ...campaign[audience], screen: campaign.screen }
        } else if (REMINDER_WEEKDAYS.includes(day.getDay())) {
            // Gira os textos pelo número do dia, para não repetir em seguida.
            const index = Math.floor(day.getTime() / 86400000) % reminders.length
            const reminder = reminders[index]
            const date = new Date(day)
            date.setHours(REMINDER_HOUR, 0, 0, 0)

            item = {
                date,
                ...reminder[audience],
                screen: audience === "empresa" ? reminder.screenEmpresa : reminder.screenComprador
            }
        }

        if (item && item.date > now) {
            list.push(item)
        }
    }

    return list
}
