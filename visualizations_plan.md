# Visualization Plan — Born Displaced

## Tableau Dashboard (4 viz — interactive e linked)

**VIZ 1 — Choropleth world map**
Mappa mondiale colorata per `total_displaced` o `mortality_1t4`, con slider temporale 2010–2022 e toggle tra le due metriche. Cliccando un paese filtra tutte le altre viz del dashboard.

**VIZ 2 — Bubble scatter: displacement vs mortality**
Asse X: `log(total_displaced)`, asse Y: `mortality_1t4`, dimensione bolla: `gdp_per_capita`, colore: regione geografica. Anno controllato dallo slider della mappa. Hover mostra tooltip country-level.

**VIZ 3 — Sparklines: trend mortalità per paese**
Griglia di sparkline una per paese o per regione, 2010–2022. Highlighting del paese selezionato dalla mappa. Variante line chart accettabile per le guidelines.

**VIZ 4 — Parallel coordinates: 5 variabili chiave**
Assi paralleli: `total_displaced` · `gdp_per_capita` · `unemployment_rate` · `inflation_cpi` · `mortality_1t4`. Ogni linea è un paese-anno. Filtrabile per range su ogni asse. Svela la mediazione macroeconomica visivamente.

---

## Python / Plotly (2 viz)

**VIZ 5 — Explanatory view per non-esperti**
Pictogram chart o unit chart: una figura stilizzata per ogni X bambini morti in zone ad alto sfollamento vs basso sfollamento. Titolo narrativo, nessun jargon statistico.

**VIZ 6 — Creative: radial timeline**
Grafico a spirale polare per i top-10 paesi per sfollamento. Ogni braccio radiale è un anno (2010→2022), il raggio è `mortality_1t4`, il colore è `total_displaced`. Si vede come la crisi si avvita o si allenta nel tempo per ogni paese.

---

## White hat / Black hat (2 viz statiche, Python)

**VIZ 7 — White hat**
Scatter `log(total_displaced)` vs `mortality_1t4` con bande di confidenza UNICEF visibili, colore per regione, annotazioni sui casi outlier, nota metodologica sulle limitazioni dei dati UNHCR, titolo neutro.

**VIZ 8 — Black hat**
Stesso scatter ma: asse Y troncato (parte da 5 invece di 0), titolo manipolativo, cherry-pick dei soli anni peggiori per i paesi in crisi, nessuna menzione degli intervalli di confidenza, correlazione presentata come causalità diretta.

---

## JavaScript — WordPress (1 componente originale)

**JS — Country Story Card**
Widget interattivo embedded nella pagina WordPress: dropdown per selezionare un paese, card animata con mini line chart mortalità 2010–2022, barra displacement, badge con GDP e livello di crisi.

---

## Riepilogo

| # | Viz | Tool | Interactive | Linked | Requisito |
|---|---|---|---|---|---|
| 1 | Choropleth map | Tableau | ✅ | ✅ | base |
| 2 | Bubble scatter | Tableau | ✅ | ✅ | research question |
| 3 | Sparklines | Tableau | ✅ | ✅ | unico line chart |
| 4 | Parallel coordinates | Tableau | ✅ | ✅ | mediazione macro |
| 5 | Pictogram explanatory | Python | — | — | non-expert view |
| 6 | Radial timeline | Python | — | — | creative |
| 7 | White hat scatter | Python | — | — | ethics |
| 8 | Black hat scatter | Python | — | — | ethics |
| JS | Country Story Card | JavaScript | ✅ | — | JS component |

**Tool usati:** Python + Tableau + JavaScript = 3 ✅  
**Viz interactive e linked:** 4 ✅  
**Viz totali:** 8 ✅
