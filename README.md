# Personal Investor: painel de tendências B3

Painel de estudo de investimentos para acompanhar a tendência do Ibovespa e das ações da B3 a partir de notícias do dia. A aba Hoje traz o relatório pré-mercado mais recente, com cenários e probabilidades; as outras abas comparam o que foi previsto com o que aconteceu e analisam um papel sob demanda.

> **Material de estudo.** As probabilidades são estimativas subjetivas feitas a partir de notícias e podem estar erradas. Nada aqui é ordem de compra ou venda nem consultoria financeira habilitada.

## Como abrir

A página carrega os dados com `fetch`, então precisa de um servidor HTTP (abrir o arquivo direto no navegador não funciona). O jeito recomendado é o `servidor.py`, que só usa a biblioteca padrão do Python:

```bash
python servidor.py
```

Depois acesse `http://localhost:8000`. No Windows, se `python` não for encontrado, use `py servidor.py`.

### Chave da brapi no `.env`

Para consultar qualquer papel na aba "Analisar papel", crie uma chave gratuita em [brapi.dev](https://brapi.dev/dashboard), copie o `.env.example` para `.env` e cole a chave:

```
BRAPI_TOKEN=sua_chave_aqui
```

O `servidor.py` lê o `.env` a cada consulta (não precisa reiniciar). O `.env` tem prioridade: se ele tem a linha `BRAPI_TOKEN`, vale o que está nela, mesmo vazia; a variável de ambiente `BRAPI_TOKEN` do sistema só é usada quando o `.env` não tem essa linha. O servidor faz a chamada à brapi por você, então a chave não vai para o navegador. O `.env` está no `.gitignore` e o servidor se recusa a entregar arquivos ocultos como `.env` e `.git`.

Se o `.env` não existir ou estiver sem `BRAPI_TOKEN`, a aba mostra o campo "Chave da brapi" para você colar uma chave pessoal, que fica salva só no navegador. Com a chave no `.env`, esse campo some. O mesmo campo aparece se você usar `python -m http.server 8000` ou `npx serve .`, que não leem o `.env`.

## Estrutura

```
servidor.py         Servidor local: serve a página e repassa as cotações à brapi com a chave do .env
.env.example        Modelo do .env (copie para .env e cole a chave da brapi)
index.html          Página de entrada: define as cores e fontes e carrega o painel
painel/index.html   O painel em si (estilo, marcação e desenhos)
data/*.json         Os dados exibidos, um arquivo por bloco
```

O painel nasceu como um dashboard do Claude. O `index.html` da raiz traz uma versão mínima da API `dash` daquele ambiente (`data`, `calc`, `draw`, `onData`, `setLink`), o que permite rodar o mesmo `painel/index.html` aqui sem alterações.

## Dados

| Arquivo | Conteúdo |
|---|---|
| `resumo.json` | Data do pregão, hora da atualização e base da leitura |
| `mercado.json` | Cenários do Ibovespa (queda, lateral, alta) com a chance do relatório e a atual |
| `acoes.json` | Top 10 de queda e de subida: chance, motivo, gatilho, evidência, horizonte, fontes e, na lista de queda, a leitura do que pode vir depois |
| `noticias.json` | Radar de notícias com estado (confirmado, em andamento, não confirmado) e efeito para o investidor brasileiro |
| `agenda.json` | Eventos do dia em horário de Brasília |
| `indicadores.json` | Retrato da manhã, cada número com hora e fonte |
| `leitura.json` | Notas: o que mudou, contra-argumento, divergências e lacunas |
| `historico.json` | Cada previsão registrada, para a aba "Previsto x realizado" |
| `fechamento.json` | Relatório do último fechamento: Ibovespa, dólar, maiores altas e baixas e acertos do dia |
| `analises/*.json` | Análises de papéis escritas pelo Claude sob demanda, usadas pela aba "Analisar papel" |

### Como ler as probabilidades

- A chance é de **direção**, não de tamanho: 70% de queda quer dizer "70% de chance de fechar em baixa", sem dizer quanto.
- A referência é o **fechamento do pregão anterior**. Para quem divulga balanço depois do fechamento, o horizonte passa a ser o pregão seguinte, medido contra o fechamento do dia.
- Os dados são uma foto do momento da atualização, sem cotação em tempo real.

### Rotina de fechamento

Uma tarefa agendada do Claude, "Fechamento de mercado B3", roda em dias úteis às 18h47 (Brasília). Ela busca os fechamentos, avalia as previsões pendentes do dia em `historico.json`, escreve `fechamento.json`, guarda uma cópia em `data/fechamentos/AAAA-MM-DD.json` e faz commit aqui.

Regra de avaliação: previsão de queda acerta com variação negativa no fechamento e previsão de subida acerta com variação positiva (0,00% conta como erro para as duas). Para o Ibovespa vale a faixa do cenário: queda abaixo de −0,5%, lateral entre −0,5% e +0,5%, alta acima de +0,5%. Sem fechamento confiável, o resultado fica "Sem dado" e não entra no placar.

### Atualizar o histórico à mão

Depois do fechamento, preencha em `historico.json` os campos `realizado` (variação no fechamento, por exemplo `"−3,2%"`) e `resultado` (`"Acertou"` ou `"Errou"`). O placar da aba "Previsto x realizado" calcula sozinho a taxa de acerto e a confiança média das previsões avaliadas.

## Aba "Analisar papel"

Digite o código de um papel (por exemplo, `PETR4`) e a página mostra:

1. **Leitura técnica automática.** Busca dois anos de cotações na [brapi.dev](https://brapi.dev) e avalia 11 sinais: variação do dia, preço contra as médias de 20, 50 e 200 dias, cruzamento das médias de 50 e 200, IFR de 14 dias, retorno em 1 e 3 meses, posição na faixa de 52 semanas, volume e volatilidade. Cada sinal puxa para subida, para queda ou fica neutro, com o motivo escrito ao lado. O placar dá o viés: subida (2 sinais ou mais de saldo positivo), queda (2 ou mais de saldo negativo) ou indefinição.
2. **Gráfico do último ano** com as médias de 50 e 200 dias.
3. **Leitura do Claude**, com notícias, balanço e valuation, quando existir `data/analises/TICKER.json`.
4. **No painel de hoje**: se o papel está no top 10 do dia ou aparece no radar de notícias.

Sem chave, a brapi só libera `PETR4`, `VALE3`, `ITUB4` e `MGLU3`. O plano gratuito com chave libera todos os papéis, mas só 3 meses de histórico: a aba tenta 2 anos, depois 1 ano e por fim 3 meses, e nesse caso deixa de fora os sinais que pedem mais tempo (média de 200 dias e cruzamento das médias), com um aviso. Para os outros papéis, coloque a chave no `.env` e rode `python servidor.py` (veja "Como abrir"), ou cole a chave no campo "Chave da brapi" da aba, que a salva só no navegador (localStorage). O link `/#papel=PETR4` abre a aba já com o papel analisado.

### Pedir a análise do Claude

No chat do Claude Code, peça `analise TICKER`. O Claude pesquisa notícias e fundamentos e grava `data/analises/TICKER.json` no formato abaixo, além de acrescentar o papel em `data/analises/index.json` (que alimenta os atalhos da aba):

```json
{
  "ticker": "PETR4",
  "empresa": "Petrobras",
  "data": "12/11/2026",
  "hora": "18:30",
  "preco_ref": "R$ 44,86",
  "vies": "Subida | Queda | Lateral",
  "chance": 60,
  "horizonte": "Próximas 4 semanas",
  "resumo": "Uma ou duas frases com a conclusão.",
  "a_favor_subida": ["..."],
  "a_favor_queda": ["..."],
  "o_que_observar": ["..."],
  "fontes": [{ "nome": "InfoMoney", "url": "https://..." }]
}
```

Os sinais técnicos são regras mecânicas sobre o preço passado: não consideram notícias e não garantem o futuro.

## Radar pré-mercado

A aba **Hoje** do painel mostra sempre o relatório pré-mercado mais recente (`radar/index.html`), gerado pela tarefa agendada "Radar pré-mercado B3" em dias úteis às 8h13. Os relatórios de dias anteriores ficam em **Relatórios anteriores**, no canto das abas (`radar/anteriores.html`).

```
radar/index.html                  Relatório mais recente (aparece na aba Hoje)
radar/anteriores.html             Lista de todos os relatórios, por data
radar/historico.js                Barra no topo de cada relatório para navegar entre as datas
radar/relatorios/AAAA-MM-DD.html  Um relatório por dia, nunca apagado
radar/relatorios/index.json       Lista dos relatórios, do mais recente ao mais antigo
```

A cada execução, a tarefa grava o relatório do dia em `radar/relatorios/`, acrescenta a data no topo do `index.json`, troca o `radar/index.html` pelo relatório novo e faz commit na `main`. O mesmo conteúdo vai para o artefato fixo do Claude (https://claude.ai/artifact/Kx6nMLhv2AL38F5gP85doz).

Os arquivos `resumo.json`, `mercado.json`, `acoes.json`, `noticias.json`, `agenda.json`, `indicadores.json` e `leitura.json` alimentavam a antiga aba Hoje (versão de 12/11/2026). Eles continuam no repositório, e a aba "Analisar papel" ainda usa `acoes.json` e `noticias.json`.

## Origem dos dados

Os arquivos de 12/11/2026 foram montados a partir do relatório da tarefa agendada "Radar pré-mercado B3" e de buscas em fontes públicas (InfoMoney, Money Times, Seu Dinheiro, BPMoney, CNN Brasil, CNBC, Yahoo Finance e outras). Cada linha cita suas fontes.
