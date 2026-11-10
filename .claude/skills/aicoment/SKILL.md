---
name: aicoment
description: Comenta no Trello, nos cards do Bryan (etiqueta cinza com o nome dele) do quadro TCC - SENAI, o trabalho feito no Mobile-RF e no backend-RF desde o último comentário de cada card, no mesmo tom dos comentários anteriores. Use quando Bryan rodar /aicoment (ou aicommit).
argument-hint: (opcional) nome ou parte do nome de um card para comentar só nele
---

# /aicoment — progresso do Bryan nos cards do Trello

Rodar `/aicoment` **é a autorização** para publicar os comentários. Sem o comando, nunca comente no Trello.

## 0. Pré-requisitos
- MCP `trello` (`@delorenj/mcp-server-trello`) conectado. Se as ferramentas `mcp__trello__*` não existirem, pare e mande Bryan rodar o comando de instalação (seção 6) e reiniciar o Claude Code.
- Repositórios: `C:/Users/bryan/Desktop/Mobile-RF` e `C:/Users/bryan/Desktop/backend-RF`.

## 1. Achar os cards do Bryan
1. `list_boards` → quadro **TCC - SENAI** (ou o que tiver "TCC" no nome) → `set_active_board`.
2. `get_board_labels` → etiquetas **cinza** cujo nome contém "Bryan" (ex.: "Bryan M."). No Trello, cinza vem como cor `black`, `black_light` ou `black_dark`.
3. `get_lists` + `get_cards_by_list_id` em cada lista → cards com essa etiqueta. Usuário Trello do Bryan: `bryanmiguelmoreira` (`get_my_cards` ajuda a conferir, mas a etiqueta cinza é o critério).
4. Se `$ARGUMENTS` vier preenchido, fique só com o(s) card(s) cujo nome bate.
5. Ignore cards na lista de concluídos/arquivados, a não ser que tenham trabalho novo de verdade.

## 2. Ler o histórico de cada card
- `get_card` (título, descrição, checklists) e `get_card_comments`.
- O **último comentário** do card define:
  - a **data de corte**: considere só o que foi feito depois dela (card sem comentário: desde a criação do card);
  - o **formato e o tom**: copie a estrutura dos comentários anteriores (português, tamanho, tópicos ou texto corrido, se cita commits, se usa título). Não invente um formato novo.
- Não repita o que já foi comentado antes.

## 3. Levantar o que foi feito desde a data de corte
Nos dois repositórios, só commits do Bryan:
```bash
git -C C:/Users/bryan/Desktop/Mobile-RF log --all --author="Bryan" --since="<data de corte>" --format="%h %ad %s" --date=short
git -C C:/Users/bryan/Desktop/backend-RF log --all --author="Bryan" --since="<data de corte>" --format="%h %ad %s" --date=short
```
- Abra o diff (`git show --stat <hash>`, e o código quando precisar) para entender o que mudou de fato; a mensagem do commit sozinha não basta.
- Ligue cada mudança ao card certo pelo assunto do card (título, descrição, checklist). Uma mudança que não pertence a nenhum card do Bryan não entra.
- **Descarte o que é bobo:** ajuste de estilo, typo, renomeação, merge, troca de URL do túnel, `.md`/skill/AGENTS, formatação, debug. Só entra o que muda o que o app ou a API fazem.
- Card sem nada relevante desde o último comentário: **não comente** e cite isso no resumo final.

## 4. Escrever e publicar
- Português, primeira pessoa do Bryan (o trabalho é dele), objetivo, sem exagero e sem prometer o que não está pronto. Diga o que ficou pendente ou depende de outra pessoa/backend, se for o caso.
- Nada de menção a IA, Claude, co-autoria ou "gerado automaticamente".
- Nunca coloque segredos: tokens, chaves, senhas, `.env`, URLs de túnel, e-mails pessoais.
- `add_comment` em cada card que tiver o que comentar.

## 5. Resumo para o Bryan
No terminal, liste: card → comentário publicado (texto completo) e os cards pulados com o motivo.

## 6. Instalação do MCP (uma vez só)
Bryan gera a chave e o token em https://trello.com/power-ups/admin (API key → link "Token") e roda no terminal, trocando os valores:
```bash
claude mcp add trello --scope user -e TRELLO_API_KEY=SUA_API_KEY -e TRELLO_TOKEN=SEU_TOKEN -- cmd /c npx -y @delorenj/mcp-server-trello@1.8.1
```
Depois, reiniciar o Claude Code e conferir com `claude mcp list` (deve aparecer `trello ... Connected`).
