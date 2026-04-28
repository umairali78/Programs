import type { StructuredQueryResponse } from './types'

const now = new Date().toISOString()

const CARRAGEENAN_RESPONSE: StructuredQueryResponse = {
  isDemo: true,
  query: 'What is the current price of carrageenan?',
  summary: 'Semi-refined carrageenan (SRC) from the Philippines and Indonesia is currently trading at **USD 2.20–2.65/kg FOB**, down approximately 8% from the Q3 2024 peak. Refined carrageenan (PRC) commands a premium at **USD 8.50–11.20/kg** depending on grade and application. EU buyers are reporting tighter supply due to elevated ocean temperatures affecting *Kappaphycus alvarezii* yields in Southeast Asia.',
  keyDataPoints: [
    { label: 'SRC FOB Philippines', value: '$2.35/kg', change: '-8.2%', changeDirection: 'down', unit: 'USD/kg', sourceId: 1 },
    { label: 'SRC FOB Indonesia', value: '$2.20/kg', change: '-6.5%', changeDirection: 'down', unit: 'USD/kg', sourceId: 1 },
    { label: 'PRC Food Grade', value: '$9.40/kg', change: '+2.1%', changeDirection: 'up', unit: 'USD/kg', sourceId: 2 },
    { label: 'PRC Technical Grade', value: '$8.50/kg', change: '-1.2%', changeDirection: 'down', unit: 'USD/kg', sourceId: 2 },
    { label: 'Global Market Size (2024)', value: '$1.24B', change: '+5.3%', changeDirection: 'up', unit: 'USD', sourceId: 3 },
    { label: 'Production Volume (2023)', value: '82,400 MT', change: '-3.1%', changeDirection: 'down', unit: 'metric tons', sourceId: 4 },
  ],
  regulatoryContext: 'Carrageenan holds GRAS status in the US (FDA 21 CFR 172.620, 172.626). In the EU, it is approved as food additive E407 (carrageenan) and E407a (processed Eucheuma seaweed). The EFSA re-evaluation panel (2018) maintained its approval for food use. Note: infant formula use remains restricted in the EU following precautionary guidance. No new regulatory changes detected in Q1 2025.',
  marketOutlook: 'Prices are expected to stabilise in Q2 2025 as new Philippine harvest data indicates partial recovery from El Niño impacts. Demand from the food processing sector (dairy alternatives, meat substitutes) remains structurally strong. Emerging biorefinery applications (carrageenan + co-products) could create upward pricing pressure in the premium refined segment by 2026.',
  confidence: 'high',
  confidenceReason: 'Price data sourced from multiple concordant market reports and trade data. Regulatory status confirmed against EUR-Lex and FDA databases.',
  sources: [
    { id: 1, title: 'Tridge Seaweed Commodity Report — Q1 2025', url: 'https://www.tridge.com', type: 'api', provider: 'Tridge', retrievedAt: now },
    { id: 2, title: 'Mintec Hydrocolloid Price Monitor — March 2025', url: 'https://www.mintecglobal.com', type: 'api', provider: 'Mintec', retrievedAt: now },
    { id: 3, title: 'Grand View Research: Carrageenan Market Size 2024', url: 'https://www.grandviewresearch.com', type: 'web', provider: 'Web Search', retrievedAt: now },
    { id: 4, title: 'FAO FishStatJ — Global Seaweed Production 2023', url: 'https://www.fao.org/fishery/statistics', type: 'api', provider: 'FAO FishStatJ', retrievedAt: now },
    { id: 5, title: 'EFSA Carrageenan Re-evaluation 2018', url: 'https://efsa.onlinelibrary.wiley.com', type: 'document', provider: 'Report Bank', retrievedAt: now },
  ],
  charts: [
    {
      type: 'line',
      title: 'SRC Price Trend — 24 Weeks',
      data: [
        { week: 'Oct W1', src_ph: 2.55, src_id: 2.40 }, { week: 'Oct W2', src_ph: 2.58, src_id: 2.42 },
        { week: 'Oct W3', src_ph: 2.60, src_id: 2.44 }, { week: 'Oct W4', src_ph: 2.62, src_id: 2.45 },
        { week: 'Nov W1', src_ph: 2.58, src_id: 2.42 }, { week: 'Nov W2', src_ph: 2.55, src_id: 2.40 },
        { week: 'Nov W3', src_ph: 2.52, src_id: 2.38 }, { week: 'Nov W4', src_ph: 2.50, src_id: 2.36 },
        { week: 'Dec W1', src_ph: 2.48, src_id: 2.34 }, { week: 'Dec W2', src_ph: 2.46, src_id: 2.32 },
        { week: 'Dec W3', src_ph: 2.44, src_id: 2.30 }, { week: 'Dec W4', src_ph: 2.42, src_id: 2.28 },
        { week: 'Jan W1', src_ph: 2.40, src_id: 2.26 }, { week: 'Jan W2', src_ph: 2.38, src_id: 2.24 },
        { week: 'Jan W3', src_ph: 2.36, src_id: 2.22 }, { week: 'Jan W4', src_ph: 2.35, src_id: 2.21 },
        { week: 'Feb W1', src_ph: 2.33, src_id: 2.20 }, { week: 'Feb W2', src_ph: 2.35, src_id: 2.21 },
        { week: 'Feb W3', src_ph: 2.36, src_id: 2.22 }, { week: 'Feb W4', src_ph: 2.35, src_id: 2.21 },
        { week: 'Mar W1', src_ph: 2.34, src_id: 2.20 }, { week: 'Mar W2', src_ph: 2.35, src_id: 2.20 },
        { week: 'Mar W3', src_ph: 2.35, src_id: 2.20 }, { week: 'Mar W4', src_ph: 2.35, src_id: 2.20 },
      ],
      xKey: 'week',
      yKeys: [
        { key: 'src_ph', label: 'SRC Philippines (USD/kg)', color: '#14b8a6' },
        { key: 'src_id', label: 'SRC Indonesia (USD/kg)', color: '#10b981' },
      ],
    },
  ],
  apisQueried: ['Tridge', 'Mintec (cached)', 'FAO FishStatJ', 'EUR-Lex', 'openFDA', 'Web Search'],
  processingMs: 3240,
  relatedQueries: [
    'What are the major carrageenan exporters from the Philippines?',
    'Has the EU changed regulations for carrageenan in infant formula?',
    'What is the carrageenan market size forecast for 2030?',
    'Compare agar vs carrageenan pricing trends for 2024',
  ],
}

const REGULATORY_RESPONSE: StructuredQueryResponse = {
  isDemo: true,
  query: 'EU arsenic limits for seaweed food products',
  summary: 'The EU has specific maximum residue levels (MRLs) for arsenic in seaweed and seaweed-derived products. Commission Regulation (EC) No 629/2008 and subsequent amendments set **total arsenic limits of 1–3 mg/kg** for most food applications. Inorganic arsenic (the more toxic form) is regulated at **0.1–0.3 mg/kg** for specific seaweed products used as food supplements. EFSA published updated guidance in 2023 recommending tighter inorganic arsenic limits.',
  keyDataPoints: [
    { label: 'Total Arsenic (food)', value: '3 mg/kg', changeDirection: 'neutral', sourceId: 1 },
    { label: 'Inorganic As (food suppl.)', value: '0.1 mg/kg', changeDirection: 'neutral', sourceId: 1 },
    { label: 'EU Regulation', value: 'EC 629/2008 + 2021 amendment', changeDirection: 'neutral', sourceId: 2 },
    { label: 'EFSA Re-evaluation', value: 'Published Dec 2023', changeDirection: 'neutral', sourceId: 3 },
    { label: 'Compliance Rate (EU imports)', value: '94.2%', changeDirection: 'up', sourceId: 4 },
  ],
  regulatoryContext: '**EC 629/2008** (as amended by Regulation (EU) 2023/2232) establishes MRLs for arsenic in seaweed products. Key limits: (1) Total arsenic ≤ 3 mg/kg wet weight for dried seaweed for human consumption; (2) Inorganic arsenic ≤ 0.1 mg/kg for food supplements from seaweed; (3) Spirulina and Chlorella: total As ≤ 1 mg/kg. EFSA opinion (Dec 2023) called for further reduction of inorganic arsenic exposure, suggesting potential for tighter limits in 2025–2026. Hijiki seaweed remains effectively banned in the EU for human consumption due to high inorganic arsenic content.',
  marketOutlook: 'Tightening arsenic regulations represent an emerging market risk for Asian seaweed exporters. Companies sourcing from regions with naturally elevated heavy metal concentrations (coastal Indonesia, Bangladesh) should implement batch-testing protocols. Demand for certified low-arsenic seaweed (Norway, Iceland) is rising among EU food manufacturers.',
  confidence: 'high',
  confidenceReason: 'Regulatory data confirmed directly from EUR-Lex and EFSA databases. Compliance data from RASFF notifications database.',
  sources: [
    { id: 1, title: 'Commission Regulation (EU) 2023/2232 — MRLs for contaminants', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R2232', type: 'api', provider: 'EUR-Lex', retrievedAt: now },
    { id: 2, title: 'Commission Regulation (EC) No 629/2008', url: 'https://eur-lex.europa.eu', type: 'api', provider: 'EUR-Lex', retrievedAt: now },
    { id: 3, title: 'EFSA Scientific Opinion on Arsenic in Food — Dec 2023', url: 'https://efsa.onlinelibrary.wiley.com', type: 'api', provider: 'EFSA Open Data', retrievedAt: now },
    { id: 4, title: 'RASFF Seaweed Import Alerts 2023-2024', url: 'https://webgate.ec.europa.eu/rasff-window', type: 'web', provider: 'Web Search', retrievedAt: now },
  ],
  charts: [],
  apisQueried: ['EUR-Lex CELLAR', 'EFSA Open Data', 'Web Search'],
  processingMs: 2180,
  relatedQueries: [
    'What testing is required for seaweed imported into the EU?',
    'Which EU regulations apply to seaweed used in cosmetics?',
    'What is the EFSA Novel Food approval process for new seaweed species?',
    'Compare EU vs US regulations for seaweed heavy metal limits',
  ],
}

const TRADE_FLOW_RESPONSE: StructuredQueryResponse = {
  isDemo: true,
  query: 'Top seaweed exporters and trade flows',
  summary: 'China dominates global seaweed exports with **USD 1.4 billion** in annual trade (2023), accounting for approximately 58% of global seaweed export value. Indonesia and the Philippines are the leading producers of hydrocolloid-grade raw material (*Kappaphycus, Eucheuma*), with combined export value of **USD 380 million**. Japan and South Korea lead in high-value processed seaweed (nori, kombu, wakame) targeting premium consumer markets in the US, EU, and Asia.',
  keyDataPoints: [
    { label: 'Global Seaweed Trade (2023)', value: '$2.4B', change: '+7.2%', changeDirection: 'up', sourceId: 1 },
    { label: 'China Export Value', value: '$1.41B', change: '+4.1%', changeDirection: 'up', sourceId: 1 },
    { label: 'Indonesia Export Volume', value: '198,000 MT', change: '-5.2%', changeDirection: 'down', sourceId: 1 },
    { label: 'Philippines Export Volume', value: '142,000 MT', change: '-8.4%', changeDirection: 'down', sourceId: 1 },
    { label: 'EU Import Value', value: '$312M', change: '+11.3%', changeDirection: 'up', sourceId: 2 },
    { label: 'US Import Value', value: '$189M', change: '+9.7%', changeDirection: 'up', sourceId: 2 },
  ],
  marketOutlook: 'Global seaweed trade is projected to grow at 8.4% CAGR through 2030, driven by expanding applications in food, pharma, and agriculture. Southeast Asian production faces structural headwinds from climate change (rising SST, disease outbreaks), creating opportunities for emerging producers in East Africa (Tanzania, Mozambique) and Atlantic Europe (Ireland, Norway).',
  confidence: 'high',
  confidenceReason: 'UN Comtrade data for 2023 confirmed. Production data cross-referenced with FAO FishStatJ annual release.',
  sources: [
    { id: 1, title: 'UN Comtrade Plus — Seaweed Trade Flows 2023 (HS 1212.21, 1212.29)', url: 'https://comtradeplus.un.org', type: 'api', provider: 'UN Comtrade Plus', retrievedAt: now },
    { id: 2, title: 'FAO FishStatJ — Global Aquatic Production 2023', url: 'https://www.fao.org/fishery/statistics', type: 'api', provider: 'FAO FishStatJ', retrievedAt: now },
    { id: 3, title: 'UNCTAD STAT — Seaweed Trade Analysis', url: 'https://unctadstat.unctad.org', type: 'api', provider: 'UNCTAD STAT', retrievedAt: now },
  ],
  charts: [
    {
      type: 'bar',
      title: 'Top Seaweed Exporters by Value (2023, USD Million)',
      data: [
        { country: 'China', value: 1410 },
        { country: 'Indonesia', value: 210 },
        { country: 'Philippines', value: 168 },
        { country: 'Japan', value: 145 },
        { country: 'South Korea', value: 132 },
        { country: 'Norway', value: 89 },
        { country: 'Malaysia', value: 64 },
        { country: 'Morocco', value: 41 },
      ],
      xKey: 'country',
      yKeys: [{ key: 'value', label: 'Export Value (USD M)', color: '#14b8a6' }],
    },
  ],
  apisQueried: ['UN Comtrade Plus', 'FAO FishStatJ', 'UNCTAD STAT'],
  processingMs: 4120,
  relatedQueries: [
    'What HS codes cover seaweed trade?',
    'Which countries are the biggest importers of dried Kappaphycus?',
    'How has Indonesian seaweed production changed since 2020?',
    'What tariffs apply to seaweed imports into the European Union?',
  ],
}

const MARKET_SIZE_RESPONSE: StructuredQueryResponse = {
  isDemo: true,
  query: 'Global seaweed market size and growth',
  summary: 'The global seaweed market was valued at **USD 16.7 billion in 2023** and is projected to reach **USD 30.2 billion by 2030**, growing at a CAGR of 8.9%. Food applications (edible seaweed, hydrocolloids) represent the largest segment at 47% of total market value. The fastest-growing segments are seaweed-based biostimulants (agricultural applications, 14.2% CAGR) and seaweed-derived pharmaceuticals (12.1% CAGR). The blue bioeconomy push from EU and ASEAN governments is accelerating investment.',
  keyDataPoints: [
    { label: 'Market Size 2023', value: '$16.7B', change: '+8.4%', changeDirection: 'up', sourceId: 1 },
    { label: 'Projected 2030', value: '$30.2B', changeDirection: 'neutral', sourceId: 1 },
    { label: 'CAGR 2024–2030', value: '8.9%', changeDirection: 'up', sourceId: 1 },
    { label: 'Food Segment Share', value: '47%', changeDirection: 'neutral', sourceId: 2 },
    { label: 'Biostimulants CAGR', value: '14.2%', change: 'Fastest growing', changeDirection: 'up', sourceId: 2 },
    { label: 'VC Investment 2024', value: '$340M', change: '+22%', changeDirection: 'up', sourceId: 3 },
  ],
  marketOutlook: 'Key growth drivers: (1) Surging demand for plant-based food ingredients; (2) EU Blue Bioeconomy strategy funding (€ 830M through 2027); (3) Carbon sequestration credits emerging for seaweed cultivation; (4) Pharmaceutical pipeline — fucoidan and carrageenan-derived antivirals in Phase 2/3 trials. Key risks: supply chain concentration in SE Asia, regulatory uncertainty for novel food applications, and climate impacts on cultivation yields.',
  confidence: 'medium',
  confidenceReason: 'Market size data synthesised from multiple analyst reports with varying methodologies. Cross-referenced with trade data for validation.',
  sources: [
    { id: 1, title: 'Grand View Research: Seaweed Market Size Report 2024', url: 'https://www.grandviewresearch.com', type: 'web', provider: 'Web Search', retrievedAt: now },
    { id: 2, title: 'Mordor Intelligence: Seaweed Market Analysis 2024–2029', url: 'https://www.mordorintelligence.com', type: 'web', provider: 'Web Search', retrievedAt: now },
    { id: 3, title: 'Crunchbase: Seaweed Tech Investment 2024', url: 'https://www.crunchbase.com', type: 'api', provider: 'Crunchbase', retrievedAt: now },
    { id: 4, title: 'World Bank PROBLUE: Blue Economy Report 2024', url: 'https://www.worldbank.org/en/programs/problue', type: 'document', provider: 'Report Bank', retrievedAt: now },
  ],
  charts: [
    {
      type: 'area',
      title: 'Global Seaweed Market Size Forecast (USD Billion)',
      data: [
        { year: '2020', value: 13.2 }, { year: '2021', value: 14.1 }, { year: '2022', value: 15.3 },
        { year: '2023', value: 16.7 }, { year: '2024', value: 18.2 }, { year: '2025', value: 19.8 },
        { year: '2026', value: 21.5 }, { year: '2027', value: 23.5 }, { year: '2028', value: 25.6 },
        { year: '2029', value: 27.8 }, { year: '2030', value: 30.2 },
      ],
      xKey: 'year',
      yKeys: [{ key: 'value', label: 'Market Size (USD B)', color: '#14b8a6' }],
    },
  ],
  apisQueried: ['Web Search', 'Crunchbase', 'Report Bank'],
  processingMs: 5680,
  relatedQueries: [
    'Which seaweed biotech startups have raised the most funding?',
    'What is the market size for seaweed biostimulants specifically?',
    'Compare seaweed market growth to conventional hydrocolloids',
    'What is the outlook for seaweed in the EU blue bioeconomy?',
  ],
}

const SUPPLIER_RESPONSE: StructuredQueryResponse = {
  isDemo: true,
  query: 'Certified seaweed suppliers in Philippines',
  summary: 'The Philippines is the second-largest seaweed producer globally, with approximately **142,000 metric tonnes** of dried seaweed exported annually. Major certified suppliers are concentrated in the Zamboanga Peninsula, Davao Region, and Visayas. **47 Philippine suppliers** hold active ASC certification for seaweed products, with an additional 23 companies in the MSC certification pipeline. USDA organic-certified seaweed operations number **8 active registrations** as of Q1 2025.',
  keyDataPoints: [
    { label: 'ASC-Certified Suppliers (PH)', value: '47 active', changeDirection: 'up', sourceId: 1 },
    { label: 'MSC In-pipeline', value: '23 companies', changeDirection: 'up', sourceId: 1 },
    { label: 'USDA NOP Certified (PH)', value: '8 operations', changeDirection: 'neutral', sourceId: 2 },
    { label: 'Export-Registered (BFAR)', value: '312 companies', changeDirection: 'neutral', sourceId: 3 },
    { label: 'Primary Species', value: 'Kappaphycus alvarezii', changeDirection: 'neutral', sourceId: 3 },
    { label: 'Main Regions', value: 'Zamboanga, Davao, Palawan', changeDirection: 'neutral', sourceId: 3 },
  ],
  regulatoryContext: 'Philippine seaweed exports must comply with BFAR (Bureau of Fisheries and Aquatic Resources) phytosanitary certification. EU imports require EU organic certification or equivalent. Key quality standards: moisture content ≤ 38% for SRC, salt content ≤ 3% (EU requirement). Philippine exporters are exempt from EU tariffs under GSP+ scheme (0% duty on HS 1212.21 and 1212.29).',
  confidence: 'medium',
  confidenceReason: 'ASC certification data confirmed. USDA NOP database checked. BFAR export registration data from official sources but may lag by 60 days.',
  sources: [
    { id: 1, title: 'ASC Seaweed Standard — Certified Units Registry (2025)', url: 'https://asc-aqua.org', type: 'web', provider: 'Web Search', retrievedAt: now },
    { id: 2, title: 'USDA Organic Integrity Database — Philippines', url: 'https://organic.ams.usda.gov/integrity/', type: 'api', provider: 'USDA Organic DB', retrievedAt: now },
    { id: 3, title: 'BFAR Philippine Fisheries Profile 2024', url: 'https://www.bfar.da.gov.ph', type: 'web', provider: 'Web Search', retrievedAt: now },
    { id: 4, title: 'WTO Tariff Data — HS 1212.21, Philippines GSP+', url: 'https://tariffdata.wto.org', type: 'api', provider: 'WTO Tariff Data', retrievedAt: now },
  ],
  charts: [],
  apisQueried: ['USDA Organic DB', 'WTO Tariff Data', 'Web Search', 'Report Bank'],
  processingMs: 2890,
  relatedQueries: [
    'What certifications do I need to export seaweed from Philippines to EU?',
    'Compare Philippines vs Indonesia as sourcing origins for carrageenan',
    'What are the tariff rates for Philippines seaweed exports to different markets?',
    'Which Philippine seaweed cooperatives have international certifications?',
  ],
}

const AGAR_RESPONSE: StructuredQueryResponse = {
  isDemo: true,
  query: 'What is the current agar price and market overview?',
  summary: 'Food-grade agar is trading at **USD 8.20–12.50/kg** depending on gel strength (500–900 g/cm²) and country of origin. Japan and Spain maintain premium pricing positions. Chilean agar (*Gracilaria chilensis*) offers a competitive mid-market option at **USD 7.80–9.50/kg**. Global agar production in 2023 was approximately **19,500 metric tonnes**, with demand growing steadily at 6.2% annually driven by vegetarian/vegan food applications and pharmaceutical excipient use.',
  keyDataPoints: [
    { label: 'Food Grade Agar (JP)', value: '$12.50/kg', change: '+1.8%', changeDirection: 'up', sourceId: 1 },
    { label: 'Food Grade Agar (ES)', value: '$10.80/kg', change: '+0.9%', changeDirection: 'up', sourceId: 1 },
    { label: 'Food Grade Agar (CL)', value: '$8.50/kg', change: '-2.3%', changeDirection: 'down', sourceId: 1 },
    { label: 'Bacteriological Grade', value: '$18–35/kg', changeDirection: 'neutral', sourceId: 2 },
    { label: 'Global Production (2023)', value: '19,500 MT', change: '+3.8%', changeDirection: 'up', sourceId: 3 },
    { label: 'Market CAGR', value: '6.2%', changeDirection: 'up', sourceId: 4 },
  ],
  marketOutlook: 'Agar demand is structurally supported by growth in plant-based food products where it serves as a gelatin substitute. Bacteriological-grade agar for microbiological media is experiencing price pressure from synthetic alternatives. Morocco (*Gelidium*) is emerging as a competitive new source for European buyers. Supply from Spain remains constrained by quotas on *Gelidium* harvesting.',
  confidence: 'high',
  confidenceReason: 'Price data from multiple market sources. Production data confirmed with FAO FishStatJ 2023 release.',
  sources: [
    { id: 1, title: 'Tridge Agar Price Monitor — Q1 2025', url: 'https://www.tridge.com', type: 'api', provider: 'Tridge', retrievedAt: now },
    { id: 2, title: 'Sigma-Aldrich / Merck Agar Product Pricing', url: 'https://www.sigmaaldrich.com', type: 'web', provider: 'Web Search', retrievedAt: now },
    { id: 3, title: 'FAO FishStatJ — Agar Production Statistics 2023', url: 'https://www.fao.org/fishery/statistics', type: 'api', provider: 'FAO FishStatJ', retrievedAt: now },
    { id: 4, title: 'MarketsandMarkets: Agar Market 2024–2029', url: 'https://www.marketsandmarkets.com', type: 'web', provider: 'Web Search', retrievedAt: now },
  ],
  charts: [
    {
      type: 'bar',
      title: 'Agar Price by Origin & Grade (USD/kg)',
      data: [
        { origin: 'Japan (Food)', min: 11.5, max: 12.5 },
        { origin: 'Spain (Food)', min: 10.2, max: 11.5 },
        { origin: 'Morocco (Food)', min: 9.0, max: 10.5 },
        { origin: 'Chile (Food)', min: 7.8, max: 9.5 },
        { origin: 'Indonesia (Food)', min: 7.2, max: 8.8 },
        { origin: 'Bacteriological', min: 18.0, max: 35.0 },
      ],
      xKey: 'origin',
      yKeys: [
        { key: 'min', label: 'Min Price (USD/kg)', color: '#10b981' },
        { key: 'max', label: 'Max Price (USD/kg)', color: '#14b8a6' },
      ],
    },
  ],
  apisQueried: ['Tridge', 'FAO FishStatJ', 'Web Search'],
  processingMs: 2650,
  relatedQueries: [
    'What is the difference between food-grade and bacteriological agar?',
    'Which species of red algae are used to produce agar commercially?',
    'How has the Japanese agar market changed since COVID-19?',
    'What are the main applications driving agar demand growth?',
  ],
}

const INVESTMENT_RESPONSE: StructuredQueryResponse = {
  isDemo: true,
  query: 'Recent seaweed biotech investment and funding rounds',
  summary: 'The seaweed technology sector attracted **USD 340 million** in venture capital and strategic investment in 2024, up 22% from 2023. The largest rounds were led by Urchin (USD 65M, seaweed biomass platform), Running Tide (USD 55M, carbon sequestration), and Atlantic Aquafarming (USD 42M, Canadian kelp farming). European investment is concentrated in the Netherlands, Norway, and Ireland. The EU Blue Bioeconomy strategy has allocated EUR 830M to support seaweed-related initiatives through 2027.',
  keyDataPoints: [
    { label: 'Total VC (2024)', value: '$340M', change: '+22%', changeDirection: 'up', sourceId: 1 },
    { label: 'Largest Round', value: '$65M (Urchin)', changeDirection: 'up', sourceId: 1 },
    { label: 'EU Blue Bioeconomy Fund', value: '€830M (2024–2027)', changeDirection: 'up', sourceId: 2 },
    { label: 'Active Seaweed Startups', value: '240+ globally', change: '+18%', changeDirection: 'up', sourceId: 1 },
    { label: 'Carbon Credit Projects', value: '12 active', changeDirection: 'up', sourceId: 3 },
  ],
  marketOutlook: 'Investment momentum is accelerating, particularly in: (1) seaweed-based carbon removal (several projects in voluntary carbon market); (2) alternative protein from macroalgae; (3) seaweed bioplastics and packaging. Key bottleneck: downstream processing capacity lags cultivation growth. Companies that integrate cultivation + extraction are commanding higher valuations.',
  confidence: 'medium',
  confidenceReason: 'Investment data from Crunchbase and public announcements. Some rounds may not be publicly disclosed.',
  sources: [
    { id: 1, title: 'Crunchbase: Seaweed/Marine Biotech Investment 2024', url: 'https://www.crunchbase.com', type: 'api', provider: 'Crunchbase', retrievedAt: now },
    { id: 2, title: 'European Commission Blue Bioeconomy Strategy 2024', url: 'https://blue-bioeconomy.ec.europa.eu', type: 'web', provider: 'Web Search', retrievedAt: now },
    { id: 3, title: 'Verra VCS: Marine Carbon Projects Registry', url: 'https://registry.verra.org', type: 'web', provider: 'Web Search', retrievedAt: now },
  ],
  charts: [
    {
      type: 'bar',
      title: 'Seaweed Sector Investment by Year (USD Million)',
      data: [
        { year: '2019', value: 42 }, { year: '2020', value: 68 },
        { year: '2021', value: 145 }, { year: '2022', value: 198 },
        { year: '2023', value: 278 }, { year: '2024', value: 340 },
      ],
      xKey: 'year',
      yKeys: [{ key: 'value', label: 'Investment (USD M)', color: '#14b8a6' }],
    },
  ],
  apisQueried: ['Crunchbase', 'Web Search'],
  processingMs: 3450,
  relatedQueries: [
    'Which seaweed companies are publicly listed?',
    'What are the biggest seaweed M&A deals in the last 2 years?',
    'How does seaweed compare to other blue economy investment sectors?',
    'Which EU grants are available for seaweed farming projects?',
  ],
}

const DEFAULT_RESPONSE: StructuredQueryResponse = {
  isDemo: true,
  query: 'Tell me about the seaweed industry',
  summary: 'The global seaweed industry is a **USD 16.7 billion market** (2023) covering farming, processing, and trading of marine macroalgae across food, pharmaceutical, cosmetic, and agricultural applications. Over 35 million tonnes of seaweed are produced annually, with 97% coming from aquaculture. China, Indonesia, and the Philippines are the dominant producers. The industry is at an inflection point driven by sustainability credentials, blue bioeconomy investment, and novel applications in bioplastics, animal feed, and carbon sequestration.',
  keyDataPoints: [
    { label: 'Global Market Size', value: '$16.7B', change: '+8.4%', changeDirection: 'up', sourceId: 1 },
    { label: 'Global Production', value: '35M+ MT/year', changeDirection: 'neutral', sourceId: 2 },
    { label: 'Number of Species Used', value: '500+', changeDirection: 'neutral', sourceId: 2 },
    { label: 'Aquaculture Share', value: '97%', changeDirection: 'up', sourceId: 2 },
    { label: 'Key Applications', value: 'Food, Pharma, Agri, Cosmetics', changeDirection: 'neutral', sourceId: 1 },
    { label: 'Market CAGR (2024–2030)', value: '8.9%', changeDirection: 'up', sourceId: 1 },
  ],
  marketOutlook: 'The seaweed industry is entering a golden decade. Climate pressures are expanding cultivation into new geographies. Regulatory frameworks are becoming clearer for novel food applications. Carbon markets are creating new revenue streams for seaweed farmers. The biggest challenges remain supply chain fragmentation, quality consistency, and downstream processing bottlenecks.',
  confidence: 'high',
  confidenceReason: 'Data aggregated from FAO, UN Comtrade, multiple market research sources and Report Bank.',
  sources: [
    { id: 1, title: 'Grand View Research: Seaweed Market Report 2024', url: 'https://www.grandviewresearch.com', type: 'web', provider: 'Web Search', retrievedAt: now },
    { id: 2, title: 'FAO: The State of World Fisheries and Aquaculture 2024', url: 'https://www.fao.org', type: 'api', provider: 'FAO FishStatJ', retrievedAt: now },
    { id: 3, title: 'World Bank PROBLUE: Blue Economy Overview', url: 'https://www.worldbank.org', type: 'document', provider: 'Report Bank', retrievedAt: now },
  ],
  charts: [
    {
      type: 'pie',
      title: 'Global Seaweed Market by Application (2023)',
      data: [
        { name: 'Food & Beverages', value: 47 },
        { name: 'Agriculture (Biostimulants)', value: 18 },
        { name: 'Pharmaceutical', value: 14 },
        { name: 'Cosmetics', value: 11 },
        { name: 'Animal Feed', value: 7 },
        { name: 'Other', value: 3 },
      ],
      xKey: 'name',
      yKeys: [{ key: 'value', label: 'Market Share (%)', color: '#14b8a6' }],
    },
  ],
  apisQueried: ['FAO FishStatJ', 'Web Search', 'Report Bank'],
  processingMs: 2100,
  relatedQueries: [
    'What is the carrageenan market size?',
    'How has seaweed farming changed in the last decade?',
    'Which countries have the most seaweed farms?',
    'What regulations apply to seaweed food products in the EU?',
  ],
}

const DEMO_RESPONSES: Array<{ keywords: string[]; response: StructuredQueryResponse }> = [
  { keywords: ['carrageenan', 'kappa', 'iota', 'lambda', 'src', 'prc'], response: CARRAGEENAN_RESPONSE },
  { keywords: ['arsenic', 'heavy metal', 'contaminant', 'regulation', 'eu rule', 'eu law', 'limit', 'efsa', 'eur-lex', 'regulatory', 'compliance', 'standard'], response: REGULATORY_RESPONSE },
  { keywords: ['trade', 'export', 'import', 'flow', 'comtrade', 'exporter', 'importer', 'volume', 'country'], response: TRADE_FLOW_RESPONSE },
  { keywords: ['market size', 'market value', 'global market', 'forecast', 'cagr', 'growth rate', 'billion', 'projection', 'outlook'], response: MARKET_SIZE_RESPONSE },
  { keywords: ['agar', 'gelidium', 'gracilaria', 'bacteriological', 'gel strength'], response: AGAR_RESPONSE },
  { keywords: ['supplier', 'certified', 'asc', 'msc', 'organic', 'source', 'producer', 'philippines', 'indonesia'], response: SUPPLIER_RESPONSE },
  { keywords: ['investment', 'funding', 'venture', 'startup', 'biotech', 'capital', 'raise', 'round', 'seed', 'series'], response: INVESTMENT_RESPONSE },
]

export function getDemoResponse(query: string): StructuredQueryResponse {
  const q = query.toLowerCase()
  for (const { keywords, response } of DEMO_RESPONSES) {
    if (keywords.some(kw => q.includes(kw))) {
      return { ...response, query, processingMs: Math.floor(Math.random() * 2000) + 1500 }
    }
  }
  return { ...DEFAULT_RESPONSE, query, processingMs: Math.floor(Math.random() * 1500) + 1000 }
}
