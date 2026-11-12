# Personal Investor: painel de tendências B3

Painel de estudo de investimentos para acompanhar a tendência do Ibovespa e das ações da B3 a partir de notícias do dia. Mostra cenários com probabilidades, os 10 papéis com maior chance de queda e de subida, um radar de notícias, a agenda do dia e uma aba que compara o que foi previsto com o que aconteceu.

> **Material de estudo.** As probabilidades são estimativas subjetivas feitas a partir de notícias e podem estar erradas. Nada aqui é ordem de compra ou venda nem consultoria financeira habilitada.

## Como abrir

A página carrega os dados com `fetch`, então precisa de um servidor HTTP (abrir o arquivo direto no navegador não funciona):

```bash
npx serve .
# ou
python3 -m http.server 8000
```

Depois acesse `http://localhost:3000` (serve) ou `http://localhost:8000` (Python).

## Estrutura

```
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

### Como ler as probabilidades

- A chance é de **direção**, não de tamanho: 70% de queda quer dizer "70% de chance de fechar em baixa", sem dizer quanto.
- A referência é o **fechamento do pregão anterior**. Para quem divulga balanço depois do fechamento, o horizonte passa a ser o pregão seguinte, medido contra o fechamento do dia.
- Os dados são uma foto do momento da atualização, sem cotação em tempo real.

### Atualizar o histórico

Depois do fechamento, preencha em `historico.json` os campos `realizado` (variação no fechamento, por exemplo `"−3,2%"`) e `resultado` (`"Acertou"` ou `"Errou"`). O placar da aba "Previsto x realizado" calcula sozinho a taxa de acerto e a confiança média das previsões avaliadas.

## Origem dos dados

Os arquivos de 12/11/2026 foram montados a partir do relatório da tarefa agendada "Radar pré-mercado B3" e de buscas em fontes públicas (InfoMoney, Money Times, Seu Dinheiro, BPMoney, CNN Brasil, CNBC, Yahoo Finance e outras). Cada linha cita suas fontes.
