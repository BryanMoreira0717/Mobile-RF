---
name: figmaread
description: Lê uma página da página Mobile do Figma do Reaproveita Franca (pelo nome que Bryan informar) e cria a tela React Native no Mobile-RF, copiando fielmente o jeito de codar do Bryan. Use quando Bryan rodar /figmaread <nome da página>.
argument-hint: <nome da página no Figma, ex: "Pagamento / PIX">
---

# /figmaread — Figma → tela do Mobile-RF

Argumento: `$ARGUMENTS` = nome (ou parte do nome) da página no Figma. Sem argumento, pergunte qual página.

## 0. Regras que valem acima de tudo
1. **Jeito de codar do Bryan é lei.** Se ele não usa uma função, hook, lib ou padrão, NÃO use — mesmo que facilite. Ele precisa explicar cada linha no TCC. Na dúvida entre "mais elegante" e "igual ao que ele já fez", escolha o que ele já fez.
2. Rodar `/figmaread <página>` autoriza (exceção ao `AGENTS.md`) somente:
   - criar o(s) arquivo(s) novo(s) da tela;
   - registrar a tela no `App.js` (import + `<Stack.Screen>`), no mesmo formato dos existentes;
   - adicionar métodos novos ao objeto `sheets` em `src/services/axios.js`, se a tela precisar de rota do backend.
   - **ligar a tela ao fluxo (sempre):** ver quais telas levam a ela e para onde ela leva (protótipo do Figma, código existente, contrato do backend) e fazer essas navegações nos arquivos de origem/destino, inclusive passando os params necessários. Se não houver ligação definida, deduzir pelo fluxo do app e avisar. Corrigir o que quebrar esse caminho, explicando na entrega.
   Qualquer outra alteração em arquivo existente (outra tela, NavBar, tema, package.json, libs novas) → **pergunte antes**. Não faça commit/push.
3. Não invente endpoint. Contrato de backend só depois de conferir em `C:/Users/bryan/Desktop/backend-RF` (routes/controllers/services e `docs/`). Não altere o backend.
4. Ao final, **devolva a diff** (`git diff` dos arquivos alterados + conteúdo dos arquivos novos, via `git diff --no-index /dev/null <arquivo>` ou equivalente).

## 1. Encontrar a página no Figma
- fileKey: `oKjqeMhVdtDDLqLOTxIVis` (o link colado por Bryan tem `l`/`VIS` trocados e dá "no edit access"; use este). Página Mobile: `39:2`.
- Procure `$ARGUMENTS` em [references/paginas-mobile.md](references/paginas-mobile.md). Prefira os frames `RASCUNHO / ...` (redesign atual) aos `mobile-*` antigos.
- Se não achar ou houver mais de um candidato (ex.: versão comprador vs. empresa), rode `get_metadata` no `39:2` (resultado é grande: filtre com python `-I`) e pergunte a Bryan qual usar. Se achar páginas novas, atualize o índice.

## 2. Ler o design
1. `create_session` com o fileKey e uma descrição curta; reuse o `sessionId` em todas as chamadas.
2. Carregue `skill://figma/figma-design-to-code/SKILL.md` (get_figma_skill) e siga-o; passe `skillNames: "resource:figma-design-to-code"`, `clientFrameworks: "react-native"`, `clientLanguages: "javascript"`.
3. `get_design_context` no node da página (com screenshot). Se vier esparso, peça os filhos visíveis em paralelo.
4. O código retornado é **referência visual**, não código final: é React/Tailwind web. Traduza para React Native no estilo do Bryan. Nunca deixe URL temporária do Figma no código.
5. Componentes de fundação (`629:2`): RF/Nav → use `src/components/NavBar.js` existente; botões/campos/badges → recrie como nas telas existentes (não há biblioteca de componentes).
6. Ícones: use `MaterialCommunityIcons` de `@expo/vector-icons` com o nome mais próximo, como Bryan faz. Só baixe SVG/imagem se for um asset de verdade (logo, ilustração) e use `react-native-svg`/`Image` como o projeto já usa.

## 3. Estudar o estilo antes de escrever
Leia antes de codar (não pule):
- Uma tela **commitada pelo Bryan**, como referência principal: `git show HEAD:src/pages/materialScreens/MaterialPublishedScreen.js` e a tela mais parecida com a nova (ex.: `git show HEAD:src/pages/materialScreens/NewMaterialScreen.js` para formulários).
- `src/theme/colors.js`, `src/theme/fonts.js`, `src/services/axios.js`, `App.js`, `src/components/NavBar.js`.
- Arquivos untracked/não commitados (marketplace, MercadoPagoCard, MaterialDetails) podem ter trechos escritos por IA: use para entender fluxo/contrato, **não** como fonte de estilo quando divergirem do código commitado.

Padrões observados no código do Bryan (confira de novo, podem evoluir):
- Arquivo em `src/pages/<area>Screen/<Nome>Screen.js`; `export default function NomeScreen({ navigation, route })`.
- Imports na ordem: `react-native` (lista multilinha), `SafeAreaView` de `react-native-safe-area-context`, hooks do `react`, ícones, `useFonts` + `Manrope_*`, depois linha em branco e `colors`, `{ fonts }`, `NavBar`, `api` (`import api from "../../services/axios"`).
- 4 espaços, aspas duplas, **sem ponto e vírgula**, funções com `function nome() {}` (não arrow para handlers), `async function` + `try/catch/finally`.
- `useFonts` com guard `fontError` (texto "Não foi possível carregar as fontes.") e `!fontsLoaded` (`ActivityIndicator` com `colors.primary`) antes do return principal.
- Sessão: `AsyncStorage.getItem("@user")` + `JSON.parse`; aguardar carregamento e tratar usuário ausente antes de `user.role`; role desconhecido nunca vira admin.
- JSX com props quebradas uma por linha; `accessibilityRole`/`accessibilityLabel` em botões; botão Voltar com `chevron-left` + `goBack()` com fallback `navigation.navigate("DashboardScreen")`.
- Erros com `Alert.alert(titulo, mensagem)` e `error.response?.data?.error`; `console.log("Erro ao ...:", error.message)`.
- `const styles = StyleSheet.create({...})` no fim; nomes como `background`, `loading`, `scrollContent`, `title`, `subtitle`, `button`, `buttonText`, `buttonOutline`; valores numéricos diretos; cores sempre de `colors` (se faltar cor do Figma, proponha adicionar ao tema em vez de hardcode — e pergunte).
- Chamadas de API sempre pelo objeto `sheets` (`api.nomeDoMetodo(...)`), nunca axios cru na tela.

## 4. Implementar
- Layout em flexbox (não posições absolutas do Figma), `ScrollView` com `contentContainerStyle`, `SafeAreaView` com `edges`.
- Estados de carregamento / erro / vazio quando houver dados da API; proteção contra clique repetido (`if (saving) return`) como nas telas existentes.
- Dados que ainda não têm API: deixe exemplo estático explícito (como `historicoExemplo`) e avise.

## 5. Antes de entregar
- Compare com o screenshot: espaçamentos, tamanhos de fonte, cores, ordem dos blocos, textos (copie os textos do Figma exatamente, com acentos).
- **Sugestões:** liste separadamente as alterações que achar pertinentes (incoerência de regra de negócio, contrato do backend, acessibilidade, protótipo que não bate com o fluxo real — ex.: doação não abre pagamento) e **não aplique sem Bryan aprovar**.
- Entregue: resumo curto, sugestões, o que não foi verificado (ex.: não rodei no aparelho), e a diff completa.
