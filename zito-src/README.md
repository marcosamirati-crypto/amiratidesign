# Survival or Dice — a mesa digital do RPG do Zito

Plataforma multiplayer para jogar *Survival or Dice*, o RPG de mesa criado por **Zito**. Cada jogador usa o próprio celular como HUD do personagem; o Mestre conduz por um centro de comando com narração por voz, prévia de alterações, mapa e histórico.

Duas versões, o mesmo código:

| Versão | Endereço | Quem entra |
|---|---|---|
| **Site aberto (principal)** | **https://marcosamirati.com/zito** | Qualquer pessoa, sem conta |
| Página no Claude | https://claude.ai/artifact/Mgaqqso1yN23brLbfhDfuT | Pessoas convidadas com conta Claude |

**Fonte da verdade da lore:** `ZITO_UNIVERSE_BIBLE.md`

---

## Site aberto: como funciona

```
 celular do Mestre (servidor da mesa)          celulares dos jogadores
 ┌────────────────────────────────┐            ┌──────────────────────┐
 │ banco da mesa + regras de acesso│◀──cifrado──▶│ HUD, ficha, mochila  │
 │ (guardado no próprio aparelho)  │  Supabase  │ só recebe o que pode │
 └────────────────────────────────┘  Realtime   └──────────────────────┘
                 │
                 └── /api/zito/ai  (Claude, chave só no servidor do portfólio)
```

- **O celular do Mestre é o servidor.** Ele guarda as mesas, aplica as mesmas regras de acesso da versão no Claude e empurra as mudanças em tempo real. Só ele altera o estado oficial.
- **Rede:** canal de broadcast do Supabase Realtime do portfólio (`sod-CÓDIGO`). Nada é gravado no Supabase; ele só retransmite.
- **Criptografia ponta a ponta:** cada aparelho tem um par de chaves (ECDH P-256). Cada jogador combina uma chave só sua com o Mestre (AES-GCM). Um jogador não lê o que vai para outro, e ninguém fala em nome de outro aparelho: o id é a impressão digital da chave.
- **Convite:** `marcosamirati.com/zito#CÓDIGO.impressão` (QR na tela do Mestre). O jogador só aceita o Mestre cuja impressão bate com o convite.
- **Persistência:** no aparelho do Mestre, com **backup em arquivo** (Mais → Sessão → Baixar backup). O backup leva a chave do Mestre: restaurado em outro celular, os convites antigos continuam valendo.
- **Voz:** reconhecimento de fala do próprio navegador (Chrome/Android; Safari no iPhone 14.5+). Leitura em voz alta pela síntese do navegador.
- **IA:** rota `/api/zito/ai` do portfólio, com a `ANTHROPIC_API_KEY` que já existe na Vercel. Só três tarefas fixas (interpretar, crônica, códice), com limite por aparelho. Sem a chave, entra o intérprete local em português.

### Para jogar
1. **Mestre:** abra `marcosamirati.com/zito` → *Sou o Mestre* → *Criar sessão*. Toque no código para mostrar o QR. Mantenha a página aberta durante o jogo (a tela fica acesa sozinha onde o navegador permite).
2. **Jogadores:** apontam a câmera para o QR, ou abrem o link e digitam o código.
3. No fim da sessão: *Mais → Sessão → Baixar backup*.

### Limites honestos do site aberto
- **Sem o celular do Mestre aberto, a mesa não abre.** Os pedidos dos jogadores ficam guardados e seguem quando ele volta.
- **Os dados moram no aparelho do Mestre.** Limpar os dados do navegador apaga as mesas; por isso o backup.
- **A rota `/api/zito/codex` é pública.** Quem souber o endereço lê o bestiário. Os jogadores não o recebem pelo app.
- **Duas abas de Mestre na mesma mesa** disputam o canal. Use uma só.
- Próximo passo possível: guardar as mesas no banco do Supabase (precisa rodar uma migração SQL no painel).

### Desenvolvimento
```bash
npm install
npm run build                     # gera dist/ (Claude) e dist-site/ (site)
node testkit/server-site.mjs &    # site em http://localhost:8788/zito com retransmissor local
python3 testkit/e2e-site.py       # Mestre + 2 jogadores, 38 verificações
npm run publicar                  # copia dist-site/ para ../public/zito
```

---

# Versão na página do Claude

## 1. Como funciona (arquitetura)

A aplicação roda como página do Claude com capacidades reais da plataforma. Não há servidor próprio para configurar.

| Necessidade | Como foi resolvida |
|---|---|
| Persistência e sincronização em tempo real | Capacidade `db` (banco de documentos compartilhado, com assinaturas ao vivo) |
| Quem está conectado, rolagens ao vivo | Capacidade `room` (presença e eventos efêmeros por sala `mesa-CÓDIGO`) |
| Identidade de cada participante | Capacidade `user` (id opaco por pessoa) |
| Transcrição de voz | Capacidade `dictation` (ditado da plataforma) + microfone do teclado do celular como alternativa |
| Interpretação da narração e crônica | Capacidade `sample` (Claude), com intérprete local em português como reserva |
| Ouvir introduções e registros | Capacidade `tts` (onde o navegador oferece) |

### Autoridade
O **dono da página é o Mestre** (`user.isOwner()`). Código de sala não dá poder nenhum. O celular do Mestre é a autoridade: só ele escreve o estado oficial. Jogadores mandam **pedidos** (gastar dados, fixar defesa, equipar, distribuir pontos); o Mestre aplica automaticamente o que as regras da sessão permitem e o resto aparece para aprovação.

### Mapa do banco
| Caminho | Quem lê | Quem escreve | Conteúdo |
|---|---|---|---|
| `sessions/{sid}` | todos | Mestre | sessão, abertura, mapa conhecido pelo grupo |
| `sessions/{sid}/roster/{uid}` | todos | Mestre | quem está na mesa |
| `sessions/{sid}/log/{eid}` | todos | Mestre | acontecimentos públicos |
| `pc/{uid}/s/{sid}` | o próprio jogador + Mestre | Mestre | ficha oficial |
| `pc/{uid}/s/{sid}/inbox/{eid}` | o próprio jogador + Mestre | Mestre | acontecimentos individuais |
| `req/{uid}` e abaixo | o próprio jogador + Mestre | o próprio jogador | pedido de entrada, rascunho, ações, arrumação da mochila |
| `gm/...` | só o Mestre | só o Mestre | segredos, mapa completo, auditoria, bíblia, bestiário |

Regras declaradas na página (em vigor, conferidas na plataforma):
```json
[{"path":"","read":"view","write":"owner"},
 {"path":"sessions","read":"view","write":"owner"},
 {"path":"pc","read":"owner","write":"owner"},
 {"path":"pc/{self}","read":"view","write":"owner"},
 {"path":"req","read":"owner","write":"owner"},
 {"path":"req/{self}","read":"view","write":"interact"},
 {"path":"gm","read":"owner","write":"owner"}]
```

## 2. Configuração (uma vez)

1. Abra a página publicada logado na conta do Mestre (a conta dona da página).
2. **Compartilhe** a página pelo menu *Compartilhar* do Claude com cada jogador:
   - Em planos com equipe (Team/Enterprise): nível **Contribuidor**.
   - Em plano individual: o menu pode oferecer só **Editor** para convidados. Funciona, mas um Editor também pode publicar versões da página. Convide só pessoas de confiança.
   - **Visualizador ou Comentador não serve**: esses níveis não escrevem nada, então o jogador não consegue enviar a ficha.
3. Cada jogador precisa de uma conta Claude e abre o link convidado.

> Quer que o **Zito** seja o Mestre? O Mestre é sempre o dono da página. Duas saídas: publicar uma cópia a partir da conta do Zito, ou trocar `"owner"` por `"admin"` nas regras acima e dar ao Zito o nível Editor (aí jogadores precisam ser Contribuidores, não Editores).

## 3. Jogando

**Mestre**
1. Abra a página → *Criar sessão*. Aparecem código de 4 letras, QR e link.
2. Aba **Mapa** → *Local* → toque no mapa para criar o ponto de partida → marque *O grupo* e *Local inicial*.
3. Toque no código no topo para mostrar o QR aos jogadores.
4. Na aba **Mesa**, cada ficha chega com a validação das regras (9,7,5,5,5,5,3, 8 pontos, Sorte, 2 perícias). Escolha o local e *Aprovar ficha*.
5. Aba **Narrar**: fale (botão *Falar*) ou digite. *Interpretar* mostra a prévia: cada trecho classificado (narração, alteração, decisão, hipótese, pergunta, diálogo, não confirmado) e as alterações sugeridas, editáveis. Escolha quem vê o registro (todos, alguns, só o Mestre) e *Aplicar*. Tudo pode ser desfeito.
6. **Registro**: histórico público, individual, do Mestre e de alterações (com *Desfazer*), busca e *Gerar crônica*.
7. **Mais**: estado e modo da sessão (Campanha ou *Prisioneiros*), abertura narrativa, descansos, raças liberadas, contadores de recurso, fome/sede (propostas), aprovações automáticas, ferramentas de dificuldade/deslocamento/Sorte, bestiário e códice.

**Jogador**
1. Escaneie o QR ou abra o link e digite o código.
2. Boas-vindas → nome de jogador → personagem (identidade, atributos, Sorte em D100, perícias, aparência e retrato) → *Enviar ao Mestre*.
3. Introdução personalizada assinada — Zito → **HUD**: Vida, Sanidade, Bem-Estar em células, reserva de dados, rolador, Sorte, deslocamento, carga, condições, habilidades. **Ficha**, **Mochila** (espaços com arrastar, mover, dividir; equipar), **Mapa** (só o que você conhece; a Bruma some quando você está dentro dela) e **Diário**.

## 4. Voz

- O botão *Falar* usa o ditado da plataforma. Ele funciona no Chrome (computador ou Android) e no app do Claude para computador. **No app de celular do Claude e no Safari a plataforma não oferece o ditado**; a tela avisa e o Mestre usa o **microfone do teclado do celular**, que transcreve direto no campo de narração.
- A página não pode acessar o microfone por conta própria (o navegador bloqueia dentro do Claude), por isso não há outra API de voz.

## 5. Interpretação por IA

- Com Claude disponível, a narração vai para o Claude com instruções fechadas: usar só os personagens e lugares da mesa, nunca transformar hipótese, pergunta, diálogo, boato ou negação em alteração, não inventar itens nem números. A resposta vira uma **prévia**; nada é aplicado sem o Mestre.
- Sem Claude, entra o **intérprete local em português** (regras de linguagem para deslocamento, dano, cura, XP, itens, conteúdo de recipiente, perdas, condições e fraturas).
- O Claude também escreve a **crônica** (só com fatos dos registros) e responde perguntas no **Códice** usando só a bíblia, citando a fonte.

## 6. Testes

`testkit/` traz um servidor de teste que reproduz o contrato de `db`, `room` e `user` **com as mesmas regras de acesso** e um teste com três navegadores (Mestre, Jogador 1, Jogador 2):

```bash
npm install
node build.mjs
node testkit/server.mjs &          # http://localhost:8787
python3 testkit/e2e.py             # Playwright + Chrome
```

Resultado da última execução: **31 de 31 verificações**, incluindo o fluxo completo da Fase 6, mensagens individuais, Bruma invisível por dentro, cinco testes de permissão, gasto de reserva aprovado automaticamente, reconexão após queda, cliques concorrentes, persistência ao recarregar e desfazer.

Na plataforma real foram conferidos: regras em vigor, bestiário invisível até para Editor, escrita de Contribuidor na sessão recusada.

**Ainda não testado em celulares reais**: a sessão com pessoas de verdade, o ditado da plataforma e a interpretação pelo Claude dependem de contas convidadas. É o primeiro teste a fazer.

## 7. Lore: como atualizar

1. Atualize `ZITO_UNIVERSE_BIBLE.md` com o documento novo (etiqueta + fonte).
2. Regras numéricas vivem em `src/lore.js`. Mude lá, rode `node build.mjs` e republique `dist/`.
3. Bíblia resumida e bestiário do Mestre ficam no banco (`gm/codex`, `gm/bestiario`), legíveis só pelo dono. Atualize pelo Claude (`db_write`) ou pela aba **Mais → Códice → Notas de lore**.

## 8. Código

```
src/lore.js       motor de regras (atributos, derivados, dados, crítico, Sorte, XP, dificuldade, movimento)
src/rt.js         capacidades da plataforma e mapa de caminhos
src/apply.js      autoridade do Mestre: criar ficha, aplicar alterações, auditoria, desfazer, registro com visibilidade
src/interpret.js  intérprete de narração (Claude + local em português)
src/player.js     entrada, criação, HUD, ficha, mochila, mapa, diário
src/master.js     mesa, narração, mapa, registro, sessão, ferramentas, bestiário, códice
src/map.js        mapa provisório e a regra da Bruma
src/dice.js       bandeja de dados, defesa fixa, Sorte
src/portrait.js   retrato de campo (proposta)
src/mist.js       a Bruma em canvas
src/app.css       sistema visual
```

## 9. Estado das funcionalidades

| Funcionalidade | Estado |
|---|---|
| Sala com código, link e QR | Pronto |
| Criação de personagem pelas regras de Zito | Pronto |
| HUD, ficha, mochila, mapa, diário | Pronto |
| Centro de comando, edição, auditoria, desfazer | Pronto |
| Narração por texto com prévia e confirmação | Pronto |
| Narração por voz | Pronto onde a plataforma oferece ditado; teclado do celular no resto |
| Interpretação pelo Claude | Pronto; depende da permissão do Claude na conta do Mestre |
| Visibilidade pública / individual / Mestre / descoberta | Pronto |
| Mapa com descoberta e Bruma | Pronto, esquemático (não há mapa oficial) |
| PWA instalável | Não. A página vive dentro do Claude; no computador o app do Claude pode instalá-la |
| Fome, sede, moeda | Desligados: não existem na lore. Propostas ativáveis pelo Mestre |
