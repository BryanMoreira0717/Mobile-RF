import { Appearance } from "react-native";

// Paleta igual à do FrontEnd-RF (tokens --buyer-* do index.css):
// papel quente, verde floresta e âmbar só para detalhes.
const claro = {
  // Marca / Primária
  primary: "#1B4B3A",       // verde (ícones, destaques, links)
  primaryDark: "#0F3D2E",   // verde floresta (botões, títulos, navbar)
  primaryDeep: "#1B4B3A",   // verde usado em valores de destaque (ex: total)
  primaryLight: "#EEF1E8",  // verde bem claro (chips, avisos, item selecionado)

  // Acento
  accent: "#D97706",        // âmbar (ponto da marca, contadores)
  warningLight: "#FEF3C7",  // âmbar bem claro (fundo de badges de pendência)
  warningText: "#92400E",   // texto em cima do warningLight

  // Erro
  error: "#9F1239",         // texto e ícones de erro / ações destrutivas
  errorLight: "#FFF1F2",    // fundo de mensagens de erro

  // Neutros / Texto
  background: "#FAF9F5",    // fundo geral das telas (papel)
  white: "#ffffff",         // cards e campos
  surfaceMuted: "#F0EFE7",  // painéis quietos (filtros, preferências)
  textPrimary: "#0F3D2E",   // texto principal (títulos, valores)
  textSecondary: "#4B5A55", // texto secundário (labels, descrições)
  textTertiary: "#73786D",  // texto terciário / placeholder
  textLight: "#E7E4DA",     // texto sobre áreas de upload/placeholder

  // Navbar verde (navegação de baixo do site)
  railText: "#E7EEE2",      // ícones e textos inativos sobre o verde
  railLine: "#1F5241",      // linha de cima da barra

  // Textos suaves em cima das faixas verdes (tela inicial)
  onPrimarySoft: "#D8DFD1",
  onPrimaryMuted: "#BEC9B8",

  // Bordas / Divisores
  border: "#C9CEC3",        // borda de campos e botões de contorno
  borderLight: "#E7E4DA",   // divisores e borda de cards
  borderMuted: "#D9D5C8",   // borda em cards de pagamento

  // Extras (telas de pagamento)
  textMuted: "#4B5A55",     // texto de cabeçalho em card de pagamento
  textDark: "#0F3D2E",      // texto "Total" em tela de checkout
}

// Escuro: os pares se invertem. O que era verde escuro (títulos, botões)
// vira verde claro, e o que era branco (cards, texto dos botões) vira escuro.
const escuro = {
  primary: "#7FC7A0",
  primaryDark: "#9ED6B6",
  primaryDeep: "#A8DDBF",
  primaryLight: "#1F3329",

  accent: "#F59E0B",
  warningLight: "#3A2A0B",
  warningText: "#FCD34D",

  error: "#FB7185",
  errorLight: "#3B1219",

  background: "#0E1512",
  white: "#17211C",
  surfaceMuted: "#1E2A24",
  textPrimary: "#E6EEE9",
  textSecondary: "#AEBDB5",
  textTertiary: "#7F8F87",
  textLight: "#2A3832",

  railText: "#24453A",
  railLine: "#7FC7A0",

  onPrimarySoft: "#24453A",
  onPrimaryMuted: "#3A5E50",

  border: "#33443B",
  borderLight: "#26332C",
  borderMuted: "#2E3D35",

  textMuted: "#AEBDB5",
  textDark: "#E6EEE9",
}

// Retrô: papel envelhecido, marrom café e laranja anos 70.
const retro = {
  primary: "#8A4B1F",
  primaryDark: "#5A2E14",
  primaryDeep: "#7A3E17",
  primaryLight: "#F0DDB8",

  accent: "#D9622B",
  warningLight: "#F8E0B0",
  warningText: "#8A3B12",

  error: "#A12A2A",
  errorLight: "#F7DCD3",

  background: "#F3E7CF",
  white: "#FBF4E4",
  surfaceMuted: "#EADBBE",
  textPrimary: "#3E2412",
  textSecondary: "#6B4A32",
  textTertiary: "#8E7259",
  textLight: "#E7D6B8",

  railText: "#F3E2C4",
  railLine: "#6E3A1C",

  onPrimarySoft: "#E9D3B0",
  onPrimaryMuted: "#D2B48C",

  border: "#CDB48C",
  borderLight: "#E2CFAC",
  borderMuted: "#D6BF98",

  textMuted: "#6B4A32",
  textDark: "#3E2412",
}

export const palettes = { claro, escuro, retro }

// choice = o que a pessoa escolheu (automatico, claro, escuro, retro).
// name = a paleta que está na tela agora.
export const theme = { choice: "automatico", name: "claro" }

// As telas leem as cores quando abrem pela primeira vez, então o App
// chama isto antes de abrir qualquer tela.
export function applyTheme(choice) {
  let name = choice

  // Automático (ou valor desconhecido): segue o modo do celular.
  if (choice === "automatico" || !palettes[choice]) {
    name = Appearance.getColorScheme() === "dark" ? "escuro" : "claro"
  }

  theme.choice = palettes[choice] ? choice : "automatico"
  theme.name = name

  Object.assign(colors, palettes[name])
}

const colors = { ...claro }

export default colors;
