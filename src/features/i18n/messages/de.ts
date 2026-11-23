import type { Messages } from "@/features/i18n/messages/en";

/** German UI text. Domain terms follow the German column of docs/glossary.md. */
export const de: Messages = {
  app: {
    tagline:
      "Monte-Carlo-Simulation von ETF-Sparplänen auf historischen Daten — Hebel, Kosten und deutsche Steuern.",
    views: "Ansichten",
    simulation: "Simulation",
    marketAndData: "Markt & Daten",
    loading: "Historische Daten werden geladen…",
    loadError: (error) => `Die historischen Daten konnten nicht geladen werden: ${error}`,
  },
  language: {
    label: "Sprache",
  },
  theme: {
    switchToDark: "Zum dunklen Design wechseln",
    switchToLight: "Zum hellen Design wechseln",
  },
  scenarioNames: {
    buyAndHold: "1× Buy and Hold",
    leveraged: "2× Buy and Hold",
    leveragedSma: "2× mit 10-Monats-SMA",
    numbered: (n) => `Szenario ${n}`,
    copy: (name) => `${name} (Kopie)`,
  },
  mobile: {
    view: "Ansicht",
    results: "Ergebnisse",
    settings: "Einstellungen",
    simulating: "Simuliert",
  },
  status: {
    simulating: (count) =>
      `${count} ${count === 1 ? "Szenario wird" : "Szenarien werden"} simuliert…`,
    analysing: (name) => `„${name}“ wird analysiert…`,
  },
  common: {
    about: (label) => `Über ${label}`,
    recommended: "Empfohlen:",
    notRecommended: "Nicht empfohlen",
    value: (label) => `Wert für ${label}`,
    updating: "Aktualisiert",
    analysing: "Wird analysiert…",
    simulating: "Wird simuliert…",
    noData: "Keine Daten.",
    best: "Bester",
    current: "Aktuell",
    legend: "Legende",
    median: "Median",
    paidIn: "Eingezahlt",
  },
  units: {
    months: "Mon.",
    years: "J.",
  },
  errors: {
    periodShorterThanHorizon: (years) =>
      `Der gewählte Zeitraum (${years} Jahre) ist kürzer als die Anlagedauer plus ein Vorlaufjahr. Nutze zufällige Ausschnitte oder eine kürzere Anlagedauer.`,
    periodShorterThanTwoYears: (years) =>
      `Der gewählte Zeitraum (${years} Jahre) ist kürzer als 2 Jahre.`,
    noPaths: "Keine Pfade.",
  },
  scenarioBar: {
    scenarios: "Szenarien",
    reorder: (name) => `${name} verschieben`,
    reorderHint: "Ziehen zum Verschieben (oder fokussieren, Leertaste und dann die Pfeiltasten)",
    show: (name) => `${name} anzeigen`,
    hideHint: "In Diagramm und Tabelle ausblenden",
    showHint: "In Diagramm und Tabelle einblenden",
    new: "Neu",
    duplicate: "Duplizieren",
    remove: "Szenario löschen",
    pickedUp: (name, position, count) => `${name} aufgenommen, Position ${position} von ${count}.`,
    movedTo: (name, position) => `${name} auf Position ${position} verschoben.`,
    droppedAt: (name, position) => `${name} auf Position ${position} abgelegt.`,
    dropped: (name) => `${name} abgelegt.`,
    cancelled: (name) => `Verschieben von ${name} abgebrochen.`,
    instructions:
      "Zum Verschieben Leertaste oder Enter drücken, mit den Pfeiltasten bewegen, dann wieder Leertaste oder Enter. Escape bricht ab.",
  },
  scenarioEditor: {
    title: "Szenario-Einstellungen",
    description:
      "Was du je Szenario wählst. Kosten, Steuern und der Datenzeitraum gelten für alle.",
    name: "Name",
    index: "Index",
    indexHelp:
      "MSCI World: nur Industrieländer (~23 Länder, ~70 % USA). MSCI ACWI (≈ FTSE All-World): World + Schwellenländer. S&P 500: 500 große US-Unternehmen.",
    indexRecommendation:
      "S&P 500 für die längste Historie (seit 1871, viele Crashs); MSCI-Daten beginnen erst 2001.",
  },
  globalSettings: {
    title: "Simulation",
    description: "Gilt für alle Szenarien.",
    seed: "Seed",
    seedHelp:
      "Startwert des Zufallsgenerators. Gleicher Seed = gleiche Pfade = reproduzierbare Ergebnisse.",
  },
  sharedSettings: {
    title: "Kosten & Steuern",
    description:
      "Gilt für alle Szenarien: Fakten zu deinen Produkten, deinem Broker und deiner Steuersituation.",
  },
  historicalPeriod: {
    label: "Historischer Zeitraum",
    help: "Nur Monate in diesem Zeitraum werden für die Pfade verwendet. Indizes mit kürzerer Historie nutzen den Teil des Zeitraums, den sie abdecken.",
    recommendation: "Der ganze Zeitraum: mehr Marktphasen machen die Verteilung robuster.",
    indexFrom: (name, year) => `${name} ab ${year}`,
    euroFrom: (year) => `In Euro ab ${year}: für frühere Monate gibt es keinen Wechselkurs.`,
  },
  groups: {
    savingsPlan: "Sparplan",
    etfMix: "ETF-Mix & Hebel",
    strategy: "Strategie",
    productCosts: "Produktkosten",
    tradingCosts: "Handelskosten",
    germanTaxes: "Deutsche Steuern",
  },
  fields: {
    monthlyContribution: {
      label: "Monatliche Sparrate",
      help: "Betrag, der jeden Monat am selben Tag investiert wird (Sparplan / Cost-Average).",
    },
    initialInvestment: {
      label: "Einmalanlage",
      help: "Einmaliger Betrag, der zu Beginn investiert wird.",
    },
    leveragedShare: {
      label: "Anteil im Hebel-ETF",
      help: "Teil jeder Einzahlung, der in den Hebel-ETF fließt; der Rest geht in den 1×-ETF. 0 % = nur 1×, 100 % = nur gehebelt. Kein Rebalancing.",
      recommendation:
        "Hängt von deiner Risikotoleranz ab. Vergleiche 0 %, 50 % und 100 % als eigene Szenarien.",
    },
    leverage: {
      label: "Hebelfaktor",
      help: "Täglich zurückgesetzter Faktor des Hebel-ETFs (echte Produkte: 2× oder 3×). Mit Volatilitätsverlust: Der tägliche Reset verliert in schwankenden Märkten an Wert, etwa (L²−L)/2 × Varianz pro Jahr.",
      recommendation: "Den Faktor mit dem besten Median zeigt der Werte-Explorer unten.",
    },
    strategy: {
      label: "Timing",
      help: "Buy and Hold verkauft nie. SMA verkauft alles, wenn der Index einen Monat unter seinem gleitenden Durchschnitt schließt, und kauft zurück, wenn er darüber schließt.",
      recommendation:
        "Buy and Hold für 1×. SMA kann das Crash-Risiko von Hebel-ETFs senken, löst aber Steuern und Kosten aus.",
      options: { buyAndHold: "Buy and Hold", sma: "SMA-Trendfilter" },
    },
    smaMonths: {
      label: "SMA-Fenster",
      help: "Länge des gleitenden Durchschnitts in Monaten (10 Monate ≈ 200 Handelstage).",
      recommendation: "10 Monate (klassische 200-Tage-Linie).",
    },
    borrowFromFuture: {
      label: "Kredit bei deinem zukünftigen Ich",
      help: "Nimm einen Kredit in Höhe der nächsten N Sparraten auf und investiere ihn sofort; die Sparraten tilgen dann den Kredit. Vergleicht „so früh wie möglich investieren“ mit dem normalen Sparplan.",
      recommendation: "Standardmäßig aus. Lohnt sich nur, wenn die Rendite den Kreditzins schlägt.",
    },
    loanMonths: {
      label: "Kreditlaufzeit",
      help: "Anzahl künftiger Sparraten, die geliehen und sofort investiert werden.",
    },
    loanRate: {
      label: "Kreditzins",
      help: "Jährlicher Zinssatz des Kredits (z. B. Ratenkredit oder Lombardkredit).",
      recommendation: "Deutsche Ratenkredite: ~5–8 %.",
    },
    terUnleveraged: {
      label: "TER 1×-ETF",
      help: "Gesamtkostenquote pro Jahr des ungehebelten ETFs, monatlich abgezogen.",
      recommendation: "0,07–0,25 % für große World- / S&P-500-ETFs. Standard 0,20 %.",
    },
    terLeveraged: {
      label: "TER Hebel-ETF",
      help: "Gesamtkostenquote pro Jahr des Hebel-ETFs.",
      recommendation: "Typisch 0,35–0,75 %. Standard 0,60 %.",
    },
    includeSofr: {
      label: "SOFR-Finanzierung einrechnen",
      help: "Ein Hebel-ETF leiht sich (L − 1) × sein Vermögen und zahlt darauf den kurzfristigen Zins (SOFR; historisch der Zins für 3-monatige T-Bills).",
      recommendation:
        "Eingeschaltet lassen. Echte Hebel-ETFs zahlen immer Finanzierung; ausgeschaltet zeigt nur ihren Einfluss.",
    },
    financingSpread: {
      label: "Finanzierungsaufschlag auf SOFR",
      help: "Zusätzliche jährliche Swap-Kosten über SOFR auf den geliehenen Teil.",
      recommendation: "0,3–1 % bei echten Produkten. Standard 0,5 %.",
    },
    orderFee: {
      label: "Ordergebühr",
      help: "Feste Gebühr pro Order (jeder monatliche Kauf, jeder Verkauf).",
      recommendation: "0–1,50 € für Sparpläne bei deutschen Onlinebrokern. Standard 1 €.",
    },
    bidAskSpread: {
      label: "Geld-Brief-Spanne",
      help: "Differenz zwischen Kauf- und Verkaufskurs. Die Hälfte davon wird bei jedem Kauf und jedem Verkauf bezahlt.",
      recommendation: "0,02–0,2 % für liquide ETFs. Standard 0,10 %.",
    },
    taxesEnabled: {
      label: "Deutsche Steuern anwenden",
      help: "Abgeltungsteuer auf realisierte Gewinne, Vorabpauschale jedes Jahr, Verlustvortrag.",
      recommendation:
        "Eingeschaltet lassen; nur ausschalten, um den Einfluss der Steuern zu sehen.",
    },
    taxRate: {
      label: "Steuersatz",
      help: "Abgeltungsteuer 25 % + 5,5 % Solidaritätszuschlag = 26,375 %. Mit Kirchensteuer ≈ 27,8–28 %.",
      recommendation: "26,375 % (27,82 % / 27,99 % mit Kirchensteuer).",
    },
    partialExemption: {
      label: "Teilfreistellung (30 %)",
      help: "30 % der Gewinne von Aktienfonds (≥ 51 % Aktien) sind steuerfrei. Auch für Hebel-ETFs angenommen.",
      recommendation: "Ein für Aktien-ETFs.",
    },
    allowance: {
      label: "Sparerpauschbetrag",
      help: "Freibetrag pro Jahr: Kapitalerträge bis zu diesem Betrag sind steuerfrei.",
      recommendation: "1.000 € für Ledige, 2.000 € für zusammen veranlagte Paare.",
    },
    baseRate: {
      label: "Basiszins",
      help: "Basiszins für die Vorabpauschale (Wert zu Jahresbeginn × Basiszins × 0,7, höchstens der Jahresgewinn). Jährlich von der Bundesbank festgelegt.",
      recommendation: "Letzte Jahre: 2,29 % (2024), 2,53 % (2025). Standard 2,5 %.",
    },
    currency: {
      label: "Währung",
      help: "Währung, in der du investierst und Steuern zahlst. In Euro wird die Indexrendite jedes Monats mit der Änderung des Euro-Dollar-Kurses im selben Monat umgerechnet (vor 1999 über die D-Mark). Hebel-ETFs hebeln die Dollar-Rendite; der Währungseffekt wird nicht gehebelt. Bargeld erhält den deutschen bzw. Euro-Geldmarktzins.",
      recommendation:
        "Euro für Anleger in Deutschland: Das Währungsrisiko von US- und Welt-Aktien gehört zu deinem Ergebnis. US-Dollar zeigt den Index allein und die längere Historie.",
      options: { EUR: "Euro", USD: "US-Dollar" },
    },
    horizonYears: {
      label: "Anlagedauer",
      help: "Wie lange du investierst. Alle Szenarien nutzen dieselbe Anlagedauer.",
    },
    sampling: {
      label: "Pfaderzeugung",
      help: "Historische Zeitfenster: jeder echte N-Jahres-Zeitraum der Historie (wenige, überlappende Pfade). Zufällige Ausschnitte: Tausende Pfade aus zufälligen Blöcken der Historie zusammengesetzt (Block-Bootstrap).",
      recommendation:
        "Zufällige Ausschnitte für robuste Verteilungen; historische Zeitfenster, um zu sehen, was wirklich passiert ist.",
      options: {
        bootstrap: "Zufällige Ausschnitte (Block-Bootstrap)",
        rolling: "Historische Zeitfenster",
      },
    },
    blockMonths: {
      label: "Mittlere Blocklänge",
      help: "Durchschnittliche Länge der zufälligen Historienblöcke. Blöcke halten Crashs, Volatilitätsphasen und Zinsen zusammen; einzelne Monate würden sie zerstören.",
      recommendation: "12–36 Monate. Standard 24.",
    },
    paths: {
      label: "Anzahl Pfade",
      help: "Wie viele zufällige Pfade je Szenario simuliert werden. Mehr Pfade = glattere Perzentile, langsamer.",
      recommendation: "2.000 oder mehr.",
    },
  },
  goals: {
    median: {
      short: "Median",
      help: "Das typische Ergebnis: Die Hälfte der Pfade endet darüber, die Hälfte darunter.",
    },
    badCase: {
      short: "Schlechter Fall (P10)",
      help: "Das Ergebnis, unter dem nur 1 von 10 Pfaden endet: wie schlimm es in einem schlechten Jahrzehnt wird.",
    },
    loss: {
      short: "Verlustwahrscheinlichkeit",
      help: "Wie oft du mit weniger endest, als du eingezahlt hast.",
    },
  },
  explorer: {
    title: "Werte-Explorer: Was lohnt sich?",
    description: (name) =>
      `„${name}“ für jeden Wert eines Schiebereglers simuliert, alles andere unverändert, auf denselben Pfaden (bis zu 500). Endwert nach Steuern.`,
    diagram: "Diagramm",
    distribution: "Verteilung",
    tradeoff: "Abwägung",
    exploredSlider: "Untersuchter Schieberegler",
    optimiseFor: "Optimieren für",
    months: (n) => `${n} Monate`,
    assumeShare: (percent) => `${percent} % im Hebel-ETF`,
    assumeLeverage: (factor) => `einen ${factor}×-Hebel-ETF`,
    assumeSma: "den SMA-Trendfilter",
    assumptionNote: (parts) =>
      `Dieser Schieberegler wirkt mit den aktuellen Einstellungen des Szenarios nicht, daher nimmt der Explorer ${parts.join(" und ")} an.`,
    metric: {
      median: "Median",
      badCase: "im schlechten Fall (P10)",
      loss: "Verlustwahrscheinlichkeit",
    },
    has: {
      median: (value) => `${value} hat den höchsten Median`,
      badCase: (value) => `${value} hat den besten schlechten Fall (P10)`,
      loss: (value) => `${value} hat die geringste Verlustwahrscheinlichkeit`,
    },
    alsoMedian: (amount) => `, Median ${amount}`,
    alsoLoss: (percent) => `, ${percent} Verlustwahrscheinlichkeit`,
    isCurrent: " — das ist deine aktuelle Einstellung.",
    vsCurrent: (amount, value) => ` statt ${amount} bei deinem aktuellen Wert ${value}.`,
    compareMedian: (best, now) => `Median ${best} statt ${now}`,
    compareBadCase: (best, now) => `schlechter Fall (P10) ${best} statt ${now}`,
    compareLoss: (best, now) => `Verlustwahrscheinlichkeit ${best} statt ${now}`,
    use: (value) => `${value} übernehmen`,
    goodCase: "Guter Fall (P90)",
    badCase: "Schlechter Fall (P10)",
    chanceOfLoss: "Verlustwahrscheinlichkeit",
    medianOf: (name) => `${name} (Median)`,
    finalValueBy: (slider) => `Endwert nach Steuern je ${slider}`,
    finalValueLog: "Endwert nach Steuern (log)",
    distributionNote:
      "Die Bänder enthalten die mittleren 90 %, 80 % und 50 % der Pfade. Ein breiteres Band bedeutet mehr Unsicherheit; ein Wert lohnt sich, wenn sein Median steigt, ohne dass sein schlechtes Ende unter die Einzahlungen fällt.",
    oneValue: (slider) => `Ein Wert für ${slider}`,
    medianVsLossBy: (slider) => `Median gegen Verlustwahrscheinlichkeit je ${slider}`,
    lossAxis: "Verlustwahrscheinlichkeit (weniger ist besser)",
    medianLog: "Median-Endwert (log)",
    tradeoffNote:
      "Oben links ist besser: mehr Median für weniger Risiko. Wo die Linie flach wird oder nach rechts knickt, bringt mehr Risiko keinen höheren Median mehr.",
  },
  insight: {
    chartBest: (goal, slider, best) => `${goal} je ${slider}; am besten bei ${best}`,
    chartCalculating: (goal, slider) => `${goal} je ${slider}: wird berechnet`,
    byValue: (goal) => `${goal} je Wert`,
    best: (value) => `am besten ${value}`,
    calculating: " · wird berechnet…",
    explore: "Erkunden",
    exploreSlider: (slider) => `${slider} erkunden`,
    exploreHint: "Das Diagramm dieses Schiebereglers im Werte-Explorer öffnen",
  },
  fanChart: {
    title: "Vermögen im Zeitverlauf",
    description:
      "Median jedes Szenarios. Bänder für das ausgewählte Szenario: P25–P75 (dunkel) und P10–P90 (hell). Vor den Steuern des Endverkaufs.",
    yearTick: (years) => `${years} J.`,
    year: (year) => `Jahr ${year}`,
  },
  results: {
    title: "Endwert nach Steuern — Perzentile",
    description:
      "Nach dem Verkauf aller Anteile am Ende der Anlagedauer und Zahlung aller Steuern und Kredite. P5 = nur 5 % der Pfade endeten niedriger.",
    yearlyReturnNote: "Dargestellt als geldgewichtete Jahresrendite jedes Perzentils.",
    unit: "Einheit",
    perYear: "% p. a.",
    scenario: "Szenario",
    medianPerYear: "Median p. a.",
    lossShort: "P(Verlust)",
    fees: "Gebühren",
    taxes: "Steuern",
    paths: "Pfade",
    shading:
      "Die Schattierung vergleicht die Szenarien je Perzentil: heller = niedriger, dunkler = höher;",
    isBest: "= am besten.",
    footnote:
      "Median p. a. = geldgewichtete Jahresrendite des Median-Pfads. P(Verlust) = Anteil der Pfade, die unter dem eingezahlten Betrag enden. Gebühren und Steuern sind Mediane über alle Pfade.",
  },
  distributionChart: {
    legend: "Legende des Perzentil-Diagramms",
    paidInZero: "Eingezahlt (0 % p. a.)",
    yearlyReturn: "Jahresrendite",
    finalValue: "Endwert nach Steuern",
    chartLabel: (measure) => `${measure} je Perzentil, P1 bis P99, je Szenario`,
    endedLower: (percentile) => `${percentile} % der Pfade endeten niedriger.`,
  },
  factors: {
    title: "Was jeder Faktor kostet",
    description: (name) =>
      `Um wie viel der Median-Endwert von „${name}“ ohne den jeweiligen Faktor höher wäre (bis zu 1.000 Pfade).`,
    medianFinalValue: "Median-Endwert:",
    medianCost: "Median-Kosten",
    names: {
      ter: "TER",
      sofr: "SOFR-Finanzierung",
      spread: "Finanzierungsaufschlag",
      trading: "Ordergebühren + Spanne",
      taxes: "Steuern",
    },
  },
  market: {
    title: "Aktueller Markt",
    description: (month) => `Stand des letzten Datenmonats (${month}), Gesamtrendite in USD.`,
    index: "Index",
    phases: {
      bull: { label: "Bullenmarkt", text: "Weniger als 10 % unter dem Allzeithoch." },
      correction: { label: "Korrektur", text: "10–20 % unter dem Allzeithoch." },
      bear: { label: "Bärenmarkt", text: "20 % oder mehr unter dem Allzeithoch." },
    },
    distanceFromHigh: "Abstand zum Allzeithoch",
    aboveSma: (months) => `Über dem ${months}-Monats-SMA`,
    belowSma: (months) => `Unter dem ${months}-Monats-SMA`,
    keyIndicators: "Kennzahlen",
    trailing: (years) => `${years} J.${years > 1 ? " p. a." : ""}`,
    volatility12m: "Volatilität 12 Monate",
    longTerm: (value) => `(langfristig ${value})`,
    shortRate: "Kurzfristzins",
    indicatorsNote:
      "Hohe Volatilität erhöht den Verlust von Hebel-ETFs; der Kurzfristzins (3-monatige T-Bills, Ersatz für SOFR) ist, was sie auf geliehenes Geld zahlen. Die SMA-Strategie ist investiert, solange der Index über seinem SMA liegt. Keine Anlageberatung.",
    timeFrame: "Zeitraum",
    timeFrameTab: (years) => (years === undefined ? "Max" : `${years} J.`),
    since: (month) => `seit ${month}`,
    lastYears: (years) => `letzte ${years} Jahre`,
    indexLegend: (name, range, log) =>
      `${name} (${range}, Start = 100${log ? ", logarithmisch" : ""})`,
    sma: (months) => `${months}-Monats-SMA`,
    bearMarket: "Bärenmarkt",
    selectedTimeFrame: "Gewählter Zeitraum",
    totalReturn: "Gesamtrendite",
    cagr: "CAGR",
    volatility: "Volatilität",
    maxDrawdown: "Max. Drawdown",
  },
  cycles: {
    title: "Bären- und Bullenmärkte",
    description: (name) =>
      `${name}: Rückgänge von 20 % oder mehr vom Allzeithoch, vom Hoch bis zum Tiefpunkt, bevor das Hoch wieder erreicht wurde. Bullenmärkte laufen vom Tief eines Bärenmarkts bis zum nächsten Hoch.`,
    bearMarketsSince: (year) => `Bärenmärkte seit ${year}`,
    medianDecline: (value) => `Median-Rückgang ${value}`,
    medianRecovery: "Mediane Erholungsdauer",
    peakToHigh: "Hoch bis neues Allzeithoch",
    currentBull: "Aktueller Bullenmarkt",
    bullSince: (month, duration) => `seit ${month} · ${duration}`,
    medianBull: "Medianer Bullenmarkt",
    completed: (duration, count) => `${duration} · ${count} abgeschlossen`,
    noBearMarket: (month) => `Kein Bärenmarkt in diesem Zeitraum (seit ${month}).`,
    peak: "Hoch",
    low: "Tief",
    decline: "Rückgang",
    peakToLow: "Hoch bis Tief",
    recovered: "Erholt",
    peakToRecovery: "Hoch bis Erholung",
    firstMonth: "Erster Datenmonat; das Hoch kann früher liegen",
    ongoing: "andauernd",
    note: "Auf Basis monatlicher Gesamtrenditen; kurze Crashs wirken daher milder als in Tagesschlusskursen.",
    averageNote:
      " Dieser Index nutzt monatliche Durchschnittskurse: z. B. bleiben 2020 und 2022 hier knapp über −20 %.",
  },
  dataBasis: {
    title: "Datenbasis",
    description:
      "Monatliche Gesamtrenditen (Dividenden reinvestiert) in USD. Kurzfristzins (Ersatz für SOFR): 3-monatige US-T-Bills (FRED TB3MS), 1926–1933 1-monatige T-Bills, davor der langfristige Zins.",
    index: "Index",
    period: "Zeitraum",
    months: "Monate",
    cagr: "CAGR",
    volatility: "Volatilität",
    dailyFrom: "Tagesdaten ab",
    source: "Quelle",
    euro: (from, to) => `Euro (${from} – ${to})`,
    euroText:
      "Simulationen in Euro rechnen die Rendite jedes Monats mit der Änderung des Euro-Dollar-Kurses im selben Monat um und verzinsen Bargeld mit dem 3-Monats-Geldmarktzins (Deutschland, Euroraum).",
    pathsTitle: "Wie Pfade erzeugt werden",
    historicalWindows: "Historische Zeitfenster",
    historicalWindowsText: "spielen jeden echten Zeitraum der gewählten Länge nach.",
    randomSlicing: "Zufällige Ausschnitte",
    randomSlicingText:
      "nutzen einen stationären Block-Bootstrap: Jeder Pfad wird aus zufälligen zusammenhängenden Blöcken der Historie (mittlere Länge einstellbar) statt aus einzelnen zufälligen Monaten zusammengesetzt, damit Crashs, Volatilitätsphasen und Zinsen zusammenbleiben. Das ist wichtig für Hebel-ETFs (Volatilitätsverlust) und SMA-Strategien (Trends).",
    assumptionsTitle: "Annahmen & Grenzen",
    assumptions: [
      "Renditen in Euro (oder US-Dollar, siehe Währungseinstellung); Hebel-ETFs sind dollarbasiert, ihr Währungseffekt wird nicht gehebelt. Inflation wird ignoriert.",
      "Der S&P 500 nutzt monatliche Durchschnittskurse (glättet Monatsrenditen); SMA-Signale wirken einen Monat später.",
      "Hebel-ETFs: täglicher Reset, Verlust aus der realisierten Varianz der Tagesrenditen desselben Monats (geschätzt, wo keine Tagesdaten vorliegen), Finanzierung auf (L − 1).",
      "Deutsche Steuern: 26,375 %, 30 % Teilfreistellung, Sparerpauschbetrag, Vorabpauschale, Verlustvortrag.",
      "Vergangene Renditen garantieren keine zukünftigen. Keine Anlageberatung.",
    ],
  },
  datasets: {
    sp500: {
      name: "S&P 500",
      description: "500 große US-Unternehmen. Längste Historie (seit 1871).",
      source:
        "Robert Shiller, Monatsdurchschnitte von Kurs + Dividenden (datasets/s-and-p-500). Dividenden ab Mitte 2023 aus der letzten bekannten Rendite fortgeschrieben. Tägliche Varianz des US-Gesamtmarkts (Kenneth French) ab 1926-07; frühere und neuere Monate geschätzt (×1,27 quadrierte Monatsrendite).",
    },
    "us-market": {
      name: "US-Gesamtmarkt",
      description:
        "Alle börsennotierten US-Aktien, nach Marktwert gewichtet (~4.000 Unternehmen, wie ein Total-Market-ETF). Monatsenddaten seit 1926.",
      source:
        "Kenneth French Data Library (CRSP value-weighted market, Mkt-RF + RF), monatliche Gesamtrenditen; Varianz aus Tagesrenditen.",
    },
    "msci-world": {
      name: "MSCI World",
      description:
        "~1.400 große und mittlere Unternehmen in 23 Industrieländern. Keine Schwellenländer.",
      source:
        "MSCI-Index 990100, Net Total Return, USD, tägliche Stände (msci.com); Monat = letzter Stand des Monats.",
    },
    "msci-acwi": {
      name: "MSCI ACWI (All World)",
      description:
        "MSCI World plus ~24 Schwellenländer (~2.500 Aktien). Vergleichbar mit dem FTSE All-World.",
      source:
        "MSCI-Index 892400, Net Total Return, USD, tägliche Stände (msci.com); Monat = letzter Stand des Monats.",
    },
    eur: {
      name: "Euro",
      source:
        "Wechselkurs: Deutsche Bundesbank, DM je US-Dollar (Frankfurter Fixing, umgerechnet mit 1,95583 DM je Euro) bis 1998, EZB-Referenzkurs ab 1999; letzter Kurs jedes Monats. Euro-Kurzfristzins: 3-Monats-Geldmarktzins für Deutschland (OECD über FRED IR3TIB01DEM156N), letzte Monate fortgeschrieben.",
    },
  },
};
