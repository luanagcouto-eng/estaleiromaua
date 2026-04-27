# 📋 Painel Operacional — Controle de Juntas P84

> Sistema web interativo para análise e controle de inspeção de juntas de soldagem do projeto **P84 (FPSO)** — Estaleiro Mauá / Seatrium.

---

## 🖥️ Visão Geral

O **Painel Operacional P84** é uma aplicação frontend desenvolvida em HTML, CSS e JavaScript puro, com integração ao banco de dados **Supabase**. Permite importar planilhas Excel com dados de inspeção, aplicar filtros, calcular métricas de aprovação e visualizar os resultados em tabelas e gráficos interativos.

---

## ✨ Funcionalidades

- 📂 **Importação de Excel** via drag & drop ou seleção de arquivo (`.xlsx`, `.xls`, `.xlsm`)
- 🔍 **Filtros dinâmicos** por Etapa, Desenho e Peça
- 📊 **Dashboard** com resumo geral e tabelas de análise por peça
- 📈 **Gráficos** com Top 10 por aprovação e avanço em toneladas
- ⚖️ **Cálculo de avanço em toneladas** com pesos carregados do Supabase
- 🖨️ **Impressão** otimizada em modo paisagem
- 🎨 **Indicadores visuais** de status por faixa de aprovação

---

## 🧰 Tecnologias Utilizadas

| Biblioteca       | Versão   | Finalidade                    |
|------------------|----------|-------------------------------|
| TailwindCSS      | CDN      | Estilização responsiva        |
| SheetJS (XLSX)   | 0.18.5   | Leitura de arquivos Excel     |
| Chart.js         | CDN      | Geração de gráficos           |
| Supabase JS      | v2       | Acesso ao banco de dados      |

---

## 🚀 Como Usar

1. **Abra o arquivo** `index.html` em um navegador moderno (Chrome, Edge, Firefox).
2. **Carregue a planilha** arrastando o arquivo Excel para a área indicada ou clicando para selecionar.
3. **Aplique os filtros** desejados:
   - **Etapa:** Fabricação (Workshop), Montagem (Assembly), Primária ou Secundária
   - **Desenho:** Selecione um Assembly Drawing específico ou "TODOS"
   - **Peça:** Digite o código da peça para filtrar
4. Clique em **▶ ATUALIZAR CONTROLE** para processar os dados.
5. Navegue entre as abas **DASHBOARD** e **GRÁFICOS** para visualizar os resultados.
6. Use o botão **IMPRIMIR** para gerar uma versão impressa do painel.

---

## 📁 Estrutura do Arquivo Excel Esperado

A planilha deve conter as seguintes colunas (identificadas automaticamente nas primeiras 20 linhas):

| Coluna           | Descrição                                      |
|------------------|------------------------------------------------|
| `JUNTAS_SITE`    | Local da junta — filtrado por `MAUÁ`           |
| `ASSEMBLY DRAWING` | Código do desenho de montagem               |
| `ITEM_1`         | Identificador da peça                          |
| `STAGE`          | Etapa (Workshop / Assembly)                    |
| Coluna `AN`      | Resultado FIT-UP                               |
| Coluna `AS`      | Resultado WELDING                              |
| Coluna `BL`      | Resultado VISUAL TEST                          |
| Coluna `AY`      | Resultado WELD 1º Reparo                       |
| Coluna `BE`      | Resultado WELD 2º Reparo                       |
| Coluna `BP`      | Resultado VISUAL 1º Reparo                     |
| Coluna `BT`      | Resultado VISUAL 2º Reparo                     |

> Os resultados de inspeção devem conter o valor `A` para indicar **Aprovado**.

---

## 📊 Métricas Calculadas

### Percentuais de Aprovação

$$
\text{Percentual} = \frac{\text{Qtd Aprovadas}}{\text{Total de Juntas}}
$$

### Avanço em Toneladas

$$
\text{Avanço (ton)} = (\%FitUp \times 0.4 \times Peso) + (\%Welding \times 0.5 \times Peso)
$$

> Os pesos por peça são carregados da tabela `EstaticoPesoP84` no Supabase.

---

## 🎨 Legenda de Status

| Cor       | Faixa de Aprovação |
|-----------|--------------------|
| 🟢 Verde  | ≥ 80%              |
| 🟠 Laranja | ≥ 50%             |
| 🔴 Vermelho | < 50%            |

---

## 🗂️ Abas do Painel

### Dashboard

- **Resumo Geral:** Cards com totais e percentuais de aprovação
- **Análise por Peça (Valores Absolutos):** Tabela com contagens por inspeção
- **Análise por Peça (Percentuais):** Tabela com percentuais e avanço em toneladas

### Gráficos

- Total de aprovadas por inspeção (Resumo)
- TOP 10: % Aprovação por Peça — FIT-UP
- TOP 10: % Aprovação por Peça — WELDING
- TOP 10: % Aprovação por Peça — VISUAL TEST
- TOP 10: Avanço Total em Toneladas por Peça

---

## 🔌 Integração Supabase

Os pesos das peças são carregados automaticamente ao abrir o painel a partir da tabela `EstaticoPesoP84`, com os campos:

| Campo    | Descrição                        |
|----------|----------------------------------|
| `ITEM_1` | Código da peça                   |
| `Peso`   | Peso em toneladas                |
| `Stage`  | Etapa (Workshop / Assembly)      |

---

## ⚠️ Requisitos

- Navegador moderno com suporte a ES6+
- Conexão com internet (para carregar CDNs e Supabase)
- Arquivo Excel no formato esperado

---

## 📌 Observações

- O filtro `JUNTAS_SITE = MAUÁ` é aplicado automaticamente.
- A identificação das colunas é feita de forma automática nas primeiras 20 linhas da planilha.
- O agrupamento de peças remove os 2 últimos caracteres do `ITEM_1` para consolidar variantes.

---

## 👥 Projeto

**P84 — FPSO | Seatrium | Estaleiro Mauá**
