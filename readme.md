<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:064e3b,100:10b981&height=200&section=header&text=Reaproveita%20Franca&fontSize=42&fontColor=ffffff&fontAlignY=38&desc=Economia%20Circular%20para%20Franca%20-%20SP&descAlignY=58&descSize=18&animation=fadeIn" width="100%"/>

<a href="#">
  <img src="https://readme-typing-svg.demolab.com/?font=Manrope&weight=600&size=20&pause=1200&color=10B981&center=true&vCenter=true&width=650&lines=Conectando+ind%C3%BAstrias+a+artes%C3%A3os+e+cooperativas;Transformando+res%C3%ADduos+em+oportunidades;Reduzindo+desperd%C3%ADcio%2C+gerando+impacto" alt="Typing SVG" />
</a>

<br/>

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

</div>

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Como funciona](#como-funciona)
- [Funcionalidades do app](#funcionalidades-do-app)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Paleta de cores e tipografia](#paleta-de-cores-e-tipografia)
- [Visão de futuro](#visão-de-futuro)
- [Licença](#licença)

## Sobre o projeto

O **Reaproveita Franca** é uma plataforma de **economia circular** que conecta empresas geradoras de resíduos industriais — com foco inicial no polo calçadista de Franca (SP) — a pessoas e organizações interessadas em reaproveitar esses materiais: artesãos, cooperativas, escolas, ONGs e pequenas empresas.

A proposta vai além de um simples mural de anúncios de resíduos: o objetivo é **reduzir o desperdício industrial**, **incentivar o reaproveitamento de materiais** e **gerar benefícios econômicos e ambientais** para todos os envolvidos, com espaço para evoluir e incorporar novos serviços com o tempo.

## Como funciona

**Tipo de negociação**
Cada anúncio pode ser de:
- **Venda** — com preço definido pela empresa;
- **Doação** — apenas com as condições para retirada.

**Quem pode anunciar**
Somente **empresas cadastradas** podem publicar resíduos, o que aumenta a confiabilidade da plataforma e o controle sobre os anúncios.

**Quem pode reservar**
Qualquer usuário cadastrado pode reservar materiais — pessoas físicas, artesãos, escolas, cooperativas, ONGs ou pequenas empresas. A empresa anunciante decide se aceita ou recusa cada solicitação de reserva.

**Pagamento**
Realizado dentro da própria plataforma, que funciona como um **marketplace**, trazendo mais segurança tanto para quem anuncia quanto para quem reserva.

**Transporte**
A plataforma conecta as partes; retirada, entrega, local e horário são combinados diretamente entre comprador e vendedor. Como evolução futura, está prevista a integração com transportadoras.

**Publicação dos anúncios**
Os anúncios ficam disponíveis imediatamente, sem aprovação prévia, e devem conter fotos, descrição, categoria, quantidade, peso, localização e estado de conservação do material.

## Funcionalidades do app

- **Tela inicial**, com a proposta de valor do app e indicadores de impacto (toneladas desviadas de aterros, empresas parceiras, negociações concluídas).
- **Seleção de tipo de conta** — Empresa ou Comprador/Artesão.
- **Login** com abas dedicadas para Empresa (CNPJ) e Comprador/Artesão (CPF), com opções de login social (Google/LinkedIn) para compradores.
- **Cadastro de comprador/artesão**, com upload de foto de perfil via câmera ou galeria.
- **Cadastro de empresa em 3 etapas**, com barra de progresso:
  1. Dados da empresa e do responsável legal (nome, e-mail, CNPJ, CPF, telefone, senha);
  2. Endereço e foto (CEP, logradouro, número, bairro, complemento);
  3. Revisão e confirmação dos dados antes do registro final.

## Tecnologias

- [React Native](https://reactnative.dev/) `0.86.3` + [React](https://react.dev/) `19.2.3`
- [Expo](https://expo.dev/) SDK `57`
- [React Navigation](https://reactnavigation.org/) (native-stack, stack e drawer)
- [axios](https://axios-http.com/) — comunicação com a API

## Estrutura do projeto

```
Mobile-RF/
├── App.js                     # Ponto de entrada e configuração das rotas (Stack Navigator)
├── index.js                   # Registro do componente raiz (registerRootComponent)
├── app.json                   # Configuração do Expo (nome, ícones, splash, plugins)
├── package.json
├── LICENSE
├── assets/
└── src/
    ├── contexts/
    ├── theme/
    └── pages/
    └── components/
    └── services/
```

## Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) (LTS recomendado)
- [Expo Go](https://expo.dev/go) instalado no celular (Android/iOS) **ou** um emulador Android/iOS configurado

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/BryanMoreira0717/Mobile-RF.git
cd Mobile-RF

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento do Expo
npx expo start
```

Scripts disponíveis (`package.json`):

| Comando         | Descrição                                   |
|-----------------|----------------------------------------------|
| `npx expo start`     | Inicia o Metro Bundler / Expo Dev Tools      |
| `npx expo start --android` | Abre o app no emulador/dispositivo Android |
| `npx expo start --ios`   | Abre o app no simulador/dispositivo iOS      |
| `npx expo start --web`   | Abre o app no navegador (via `react-native-web`) |

Depois de rodar `npx expo start`, escaneie o QR code exibido com o app **Expo Go** para abrir o projeto no seu celular.

## Paleta de cores e tipografia

O tema visual do app é centralizado em `src/theme/`:

<div align="center">

| Cor | Hex | Uso |
|---|---|---|
| ![#10b981](https://placehold.co/15x15/10b981/10b981.png) | `#10b981` | Primária — botões, ícones, destaques |
| ![#064e3b](https://placehold.co/15x15/064e3b/064e3b.png) | `#064e3b` | Primária escura — logo, títulos |
| ![#ECFDF5](https://placehold.co/15x15/ECFDF5/ECFDF5.png) | `#ECFDF5` | Primária clara — hero, badges |
| ![#d97706](https://placehold.co/15x15/d97706/d97706.png) | `#d97706` | Destaque — labels, valores |

</div>

**Tipografia**: família **Manrope**, nos pesos Regular, Medium, SemiBold e Bold, carregada via `@expo-google-fonts/manrope`.

## Visão de futuro

O Reaproveita Franca é pensado como uma plataforma de economia circular com espaço para crescer além da negociação de resíduos, incluindo futuramente:

- Indicadores **ESG**;
- Logística integrada, com possível integração a transportadoras;
- Dashboard ambiental com indicadores inteligentes de impacto;
- Integração com **ERPs**;

## Licença

Distribuído sob a licença **MIT** — veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

Copyright (c) 2026 Bryan Moreira