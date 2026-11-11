// Paleta igual à do FrontEnd-RF (tokens --buyer-* do index.css):
// papel quente, verde floresta e âmbar só para detalhes.
const colors = {
  // Marca / Primária
  primary: "#1B4B3A",       // verde (ícones, destaques, links)
  primaryDark: "#0F3D2E",   // verde floresta (botões, títulos, navbar)
  primaryDeep: "#1B4B3A",   // verde usado em valores de destaque (ex: total)
  primaryLight: "#EEF1E8",  // verde bem claro (chips, avisos, item selecionado)

  // Acento
  accent: "#D97706",        // âmbar (ponto da marca, contadores)
  warningLight: "#FEF3C7",  // âmbar bem claro (fundo de badges de pendência)

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

  // Bordas / Divisores
  border: "#C9CEC3",        // borda de campos e botões de contorno
  borderLight: "#E7E4DA",   // divisores e borda de cards
  borderMuted: "#D9D5C8",   // borda em cards de pagamento

  // Extras (telas de pagamento)
  textMuted: "#4B5A55",     // texto de cabeçalho em card de pagamento
  textDark: "#0F3D2E",      // texto "Total" em tela de checkout
}

export default colors;
