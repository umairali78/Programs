/* eslint-disable @typescript-eslint/no-explicit-any */
import { subWeeks, subYears, startOfWeek } from 'date-fns'
import { DEMO_REPORT_BANK_CHUNKS, DEMO_REPORT_BANK_DOCUMENTS } from './report-bank'

// In-memory seed for demo mode (no DB required)
// When DB is available, data is seeded there too
export const DEMO_PRICES = generateDemoPrices()
export const DEMO_TRADE_FLOWS = generateDemoTradeFlows()
export const DEMO_REGULATORY = generateDemoRegulatory()
export const DEMO_NEWS = generateDemoNews()
export const DEMO_COMPANIES = generateDemoCompanies()
export const DEMO_ALERTS = generateDemoAlerts()

function generateDemoPrices() {
  const commodities = [
    { id: 'carrageenan_src', label: 'Carrageenan SRC', basePrice: 2.40, unit: 'per_kg' },
    { id: 'carrageenan_prc', label: 'Carrageenan PRC', basePrice: 9.80, unit: 'per_kg' },
    { id: 'agar_food', label: 'Agar Food Grade', basePrice: 10.20, unit: 'per_kg' },
    { id: 'agar_tech', label: 'Agar Technical', basePrice: 8.50, unit: 'per_kg' },
    { id: 'alginate', label: 'Sodium Alginate', basePrice: 5.80, unit: 'per_kg' },
    { id: 'nori', label: 'Dried Nori', basePrice: 18.50, unit: 'per_kg' },
    { id: 'spirulina', label: 'Spirulina', basePrice: 14.20, unit: 'per_kg' },
    { id: 'chlorella', label: 'Chlorella', basePrice: 16.80, unit: 'per_kg' },
    { id: 'kelp_meal', label: 'Kelp Meal', basePrice: 1.65, unit: 'per_kg' },
  ]

  const markets = ['global_avg', 'asia_pacific', 'europe']
  const rows: any[] = []

  for (const commodity of commodities) {
    for (const market of markets) {
      const marketMultiplier = market === 'europe' ? 1.12 : market === 'asia_pacific' ? 0.96 : 1.0
      let price = commodity.basePrice * marketMultiplier

      for (let w = 23; w >= 0; w--) {
        const weekDate = startOfWeek(subWeeks(new Date(), w))
        // Simulate realistic price movement
        const trend = w > 16 ? 0.003 : w > 8 ? -0.004 : -0.001
        const noise = (Math.random() - 0.5) * 0.04
        price = Math.max(price * (1 + trend + noise), commodity.basePrice * 0.7)

        rows.push({
          id: `demo-price-${commodity.id}-${market}-${w}`,
          commodity: commodity.id,
          priceUsd: price.toFixed(4),
          unit: commodity.unit,
          market,
          source: 'demo_seed',
          weekDate,
          isDemo: true,
        })
      }
    }
  }
  return rows
}

function generateDemoTradeFlows() {
  const exporters = [
    { iso3: 'CHN', name: 'China' },
    { iso3: 'IDN', name: 'Indonesia' },
    { iso3: 'PHL', name: 'Philippines' },
    { iso3: 'JPN', name: 'Japan' },
    { iso3: 'KOR', name: 'South Korea' },
    { iso3: 'MYS', name: 'Malaysia' },
    { iso3: 'MAR', name: 'Morocco' },
    { iso3: 'NOR', name: 'Norway' },
    { iso3: 'TZA', name: 'Tanzania' },
    { iso3: 'ZAF', name: 'South Africa' },
    { iso3: 'CHL', name: 'Chile' },
  ]
  const importers = [
    { iso3: 'DEU', name: 'Germany' },
    { iso3: 'USA', name: 'United States' },
    { iso3: 'FRA', name: 'France' },
    { iso3: 'GBR', name: 'United Kingdom' },
    { iso3: 'JPN', name: 'Japan' },
    { iso3: 'NLD', name: 'Netherlands' },
    { iso3: 'ESP', name: 'Spain' },
    { iso3: 'CAN', name: 'Canada' },
    { iso3: 'AUS', name: 'Australia' },
  ]
  const hsCodes = ['1212.21', '1212.29', '1302.31']
  const baseValues: Record<string, number> = {
    CHN: 1_410_000_000, IDN: 210_000_000, PHL: 168_000_000, JPN: 145_000_000,
    KOR: 132_000_000, MYS: 64_000_000, MAR: 41_000_000, NOR: 89_000_000,
    TZA: 28_000_000, ZAF: 34_000_000, CHL: 56_000_000,
  }

  const rows: any[] = []
  for (const year of [2020, 2021, 2022, 2023]) {
    const growthFactor = 1 + (year - 2020) * 0.06
    for (const exp of exporters) {
      for (const imp of importers) {
        if (exp.iso3 === imp.iso3) continue
        for (const hs of hsCodes) {
          const base = (baseValues[exp.iso3] ?? 10_000_000) * growthFactor
          const share = (Math.random() * 0.15 + 0.02)
          const noise = (Math.random() - 0.5) * 0.1
          const valueUsd = base * share * (1 + noise) / importers.length
          const netWeightKg = valueUsd / (hs === '1302.31' ? 8.5 : 2.4)
          rows.push({
            id: `demo-flow-${exp.iso3}-${imp.iso3}-${hs}-${year}`,
            year,
            reporterIso3: exp.iso3,
            partnerIso3: imp.iso3,
            hsCode: hs,
            flowType: 'export',
            valueUsd: valueUsd.toFixed(2),
            netWeightKg: netWeightKg.toFixed(2),
            source: 'demo_seed',
            isDemo: true,
          })
        }
      }
    }
  }
  return rows
}

function generateDemoRegulatory() {
  return [
    {
      id: 'reg-eu-novel-food',
      jurisdiction: 'EU',
      category: 'food_safety',
      title: 'EU Novel Food Regulation 2015/2283',
      summary: 'Regulation establishing a framework for novel foods and novel food ingredients in the EU. Seaweed species not traditionally consumed in the EU require Novel Food authorisation before market placement. Current authorised novel seaweed species include Schizochytrium sp. and certain algae-derived oils.',
      documentUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32015R2283',
      hsCodesCovered: JSON.stringify(['1212.21', '1212.29']),
      effectiveDate: new Date('2018-01-01'),
      source: 'EUR-Lex',
      isDemo: true,
    },
    {
      id: 'reg-fda-carrageenan',
      jurisdiction: 'USA',
      category: 'food_safety',
      title: 'FDA 21 CFR 172.620 — Carrageenan GRAS Status',
      summary: 'Carrageenan is affirmed as Generally Recognized as Safe (GRAS) for use as a stabilizer, thickener, and emulsifier in food products. Maximum usage levels vary by food category. Note: use in infant formula has been restricted pending further safety review.',
      documentUrl: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-172/subpart-G/section-172.620',
      hsCodesCovered: JSON.stringify(['1302.31']),
      effectiveDate: new Date('1985-04-01'),
      source: 'openFDA',
      isDemo: true,
    },
    {
      id: 'reg-eu-arsenic',
      jurisdiction: 'EU',
      category: 'food_safety',
      title: 'Commission Regulation (EU) 2023/2232 — Arsenic MRLs',
      summary: 'Sets maximum levels for inorganic arsenic in food, including seaweed products. Food supplements from seaweed: max 0.1 mg/kg inorganic arsenic. Hijiki seaweed products: effectively prohibited for human consumption in EU due to high inorganic arsenic content.',
      documentUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R2232',
      hsCodesCovered: JSON.stringify(['1212.21', '1212.29']),
      effectiveDate: new Date('2024-02-01'),
      source: 'EUR-Lex',
      isDemo: true,
    },
    {
      id: 'reg-wto-sps',
      jurisdiction: 'WTO',
      category: 'import_tariff',
      title: 'WTO SPS Committee Notifications — Seaweed 2024',
      summary: 'Several WTO members have submitted SPS notifications related to seaweed products in 2024, including new heavy metal testing requirements and updated phytosanitary inspection protocols for dried seaweed imports.',
      documentUrl: 'https://spsims.wto.org',
      effectiveDate: new Date('2024-01-01'),
      source: 'WTO Tariff Data',
      isDemo: true,
    },
    {
      id: 'reg-codex-algae',
      jurisdiction: 'CODEX',
      category: 'food_safety',
      title: 'Codex Alimentarius — Code of Practice for Edible Seaweed',
      summary: 'Codex General Standard for Contaminants provides reference levels for heavy metals in seaweed. These serve as a baseline for many national regulations. Updated in 2023 to include limits for cadmium and mercury in addition to arsenic.',
      documentUrl: 'https://www.fao.org/fao-who-codexalimentarius',
      effectiveDate: new Date('2023-07-01'),
      source: 'FAO/WHO Codex',
      isDemo: true,
    },
  ]
}

function generateDemoNews() {
  const twoWeeksAgo = subWeeks(new Date(), 2)
  const oneWeekAgo = subWeeks(new Date(), 1)
  const oneMonthAgo = subWeeks(new Date(), 4)
  const threeWeeksAgo = subWeeks(new Date(), 3)

  return [
    {
      id: 'news-1',
      title: 'Indonesia Reports 12% Decline in Kappaphycus Yields Due to Ocean Warming',
      summary: 'Indonesia\'s Bureau of Fisheries has reported a significant decline in Kappaphycus alvarezii yields across the Sulawesi and Maluku growing regions. Rising sea surface temperatures linked to El Niño conditions are reducing carrageenan content and increasing disease susceptibility. Analysts expect SRC prices to firm in Q2 2025.',
      source: 'FAO Globefish',
      category: 'trade',
      sentiment: 'negative',
      isDemo: true,
      publishedAt: subWeeks(new Date(), 1),
    },
    {
      id: 'news-2',
      title: 'EU Approves €280M Funding Package for Atlantic Seaweed Farming Initiative',
      summary: 'The European Commission has approved a major funding package under the European Maritime, Fisheries and Aquaculture Fund (EMFAF) to support seaweed cultivation in Ireland, France, Norway and Portugal. The initiative targets 50,000 tonnes of additional European seaweed production by 2030.',
      source: 'European Commission',
      category: 'investment',
      sentiment: 'positive',
      isDemo: true,
      publishedAt: subWeeks(new Date(), 2),
    },
    {
      id: 'news-3',
      title: 'EFSA Publishes New Opinion on Seaweed Iodine Content in Food Supplements',
      summary: 'The European Food Safety Authority has published an updated scientific opinion on iodine from seaweed in food supplements, recommending maximum daily doses of 150μg iodine. This has implications for kelp-based supplement products and may require reformulation for EU market compliance.',
      source: 'EFSA Journal',
      category: 'regulation',
      sentiment: 'neutral',
      isDemo: true,
      publishedAt: threeWeeksAgo,
    },
    {
      id: 'news-4',
      title: 'Urchin Raises $65M Series B to Scale Seaweed Biomass Platform Globally',
      summary: 'Seaweed biotech startup Urchin has closed a $65M Series B funding round led by Breakthrough Energy Ventures and Prelude Ventures. The company plans to use funding to expand cultivation operations in the Philippines, Chile and Namibia, targeting 500,000 tonnes of seaweed biomass by 2027.',
      source: 'TechCrunch',
      category: 'investment',
      sentiment: 'positive',
      isDemo: true,
      publishedAt: oneMonthAgo,
    },
    {
      id: 'news-5',
      title: 'China\'s Seaweed Processing Industry Faces Overcapacity as Demand Growth Slows',
      summary: 'Chinese carrageenan and agar processors are facing margin compression as processing capacity has grown faster than demand. Industry analysts estimate 15-20% overcapacity in the carrageenan refining sector, creating downward pressure on refined product prices for the remainder of 2025.',
      source: 'Undercurrent News',
      category: 'trade',
      sentiment: 'negative',
      isDemo: true,
      publishedAt: subWeeks(new Date(), 3),
    },
    {
      id: 'news-6',
      title: 'New Study Confirms Seaweed-Based Biostimulants Increase Crop Yields by 18%',
      summary: 'A peer-reviewed study published in Nature Plants confirms that seaweed-derived biostimulant applications increase average crop yields by 18% across wheat, maize and soybean in field trials across 12 countries. The findings are expected to accelerate regulatory approval processes for agricultural seaweed extracts in the EU and US.',
      source: 'Nature Plants',
      category: 'research',
      sentiment: 'positive',
      isDemo: true,
      publishedAt: oneWeekAgo,
    },
    {
      id: 'news-7',
      title: 'Tanzania Launches National Seaweed Development Strategy to Double Export Revenue',
      summary: 'The Tanzanian Ministry of Fisheries has launched a 5-year National Seaweed Strategy targeting USD 200M in annual seaweed exports by 2030, up from current USD 85M. The strategy includes plans for certification support, processing facility development and market access programs for smallholder farmers in Zanzibar and Pemba.',
      source: 'FAO',
      category: 'trade',
      sentiment: 'positive',
      isDemo: true,
      publishedAt: subWeeks(new Date(), 5),
    },
    {
      id: 'news-8',
      title: 'Seaweed Carbon Sequestration: First VCM Credits Verified Under New Blue Carbon Standard',
      summary: 'Running Tide has become the first seaweed cultivation company to receive verified carbon credits under the new Verra Blue Carbon Standard. The 12,000 tonne CO2-equivalent credits were sold at USD 120/tonne to Microsoft and Stripe. This development opens a major new revenue stream for seaweed farms globally.',
      source: 'Carbon Brief',
      category: 'sustainability',
      sentiment: 'positive',
      isDemo: true,
      publishedAt: twoWeeksAgo,
    },
    {
      id: 'news-9',
      title: 'Japan\'s Nori Industry Reports Record Export Season Despite Climate Challenges',
      summary: 'Japan\'s nori industry associations report record export revenues of JPY 32 billion in fiscal year 2024, driven by strong demand from South Korea, the US and Australia. Premium Japanese nori products are commanding 40-60% price premiums over Korean alternatives in international markets.',
      source: 'Japan Fisheries Agency',
      category: 'trade',
      sentiment: 'positive',
      isDemo: true,
      publishedAt: subWeeks(new Date(), 6),
    },
    {
      id: 'news-10',
      title: 'WHO Revises Daily Iodine Intake Guidelines: Implications for Seaweed Food Products',
      summary: 'The World Health Organization has updated daily recommended iodine intake levels, with increased attention on high-iodine food sources including seaweed. The revision is expected to prompt regulators in Asia and Europe to revisit labelling requirements for seaweed food products with high natural iodine content.',
      source: 'World Health Organization',
      category: 'regulation',
      sentiment: 'neutral',
      isDemo: true,
      publishedAt: subWeeks(new Date(), 7),
    },
  ]
}

function generateDemoCompanies() {
  return [
    { id: 'c1', name: 'CP Kelco', country: 'United States', countryIso3: 'USA', sector: 'processing', species: JSON.stringify(['Kappaphycus alvarezii', 'Macrocystis pyrifera']), description: 'Global leader in hydrocolloid production including carrageenan, pectin and xanthan gum. Operations in Denmark, USA, Brazil and China. Annual revenue ~$800M.', website: 'https://www.cpkelco.com', employeeRange: '2000-5000', revenueRange: '$500M-$1B', certifications: JSON.stringify(['ISO 9001', 'FSSC 22000', 'Halal', 'Kosher']), isDemo: true },
    { id: 'c2', name: 'Cargill Texturizing Solutions', country: 'Netherlands', countryIso3: 'NLD', sector: 'processing', species: JSON.stringify(['Eucheuma cottonii', 'Gelidium sesquipedale']), description: 'Division of Cargill producing carrageenan, agar and other seaweed-derived hydrocolloids for food and pharmaceutical applications globally.', website: 'https://www.cargill.com', employeeRange: '10000+', revenueRange: '$1B+', certifications: JSON.stringify(['ISO 9001', 'BRC', 'FSSC 22000']), isDemo: true },
    { id: 'c3', name: 'Marine Hydrocolloids Philippines', country: 'Philippines', countryIso3: 'PHL', sector: 'processing', species: JSON.stringify(['Kappaphycus alvarezii', 'Kappaphycus striatum']), description: 'Leading Philippine processor and exporter of semi-refined and refined carrageenan. Operates 3 processing facilities in the Visayas region. Serves European and American food manufacturers.', website: 'https://mhp.com.ph', employeeRange: '500-2000', revenueRange: '$50M-$200M', certifications: JSON.stringify(['FSSC 22000', 'Halal', 'BFAR Certified']), isDemo: true },
    { id: 'c4', name: 'PT Surya Indoalgas', country: 'Indonesia', countryIso3: 'IDN', sector: 'processing', species: JSON.stringify(['Kappaphycus alvarezii', 'Sargassum']), description: 'Major Indonesian seaweed processor and exporter with integrated farming operations in Sulawesi and Maluku. Produces SRC, PRC, and alginate products for global markets.', website: 'https://surya-indoalgas.com', employeeRange: '200-500', revenueRange: '$10M-$50M', certifications: JSON.stringify(['Halal', 'ISO 22000']), isDemo: true },
    { id: 'c5', name: 'Olmix Group', country: 'France', countryIso3: 'FRA', sector: 'biotech', species: JSON.stringify(['Ulva', 'Ascophyllum nodosum']), description: 'European leader in seaweed-based animal feed supplements and agricultural biostimulants. Operates certified organic seaweed harvest operations in Brittany. Pioneer in seaweed-based veterinary applications.', website: 'https://www.olmix.com', employeeRange: '200-500', revenueRange: '$50M-$200M', certifications: JSON.stringify(['EU Organic', 'ISO 9001', 'AHV Certified']), isDemo: true },
    { id: 'c6', name: 'Seaweed & Co.', country: 'United Kingdom', countryIso3: 'GBR', sector: 'farming', species: JSON.stringify(['Laminaria digitata', 'Saccharina latissima', 'Palmaria palmata']), description: 'UK\'s leading certified organic seaweed producer and ingredient supplier. Harvests and cultivates multiple Atlantic species in Scotland and Northern Ireland for food, nutraceutical and cosmetic markets.', website: 'https://seaweedandco.com', employeeRange: '50-200', revenueRange: '$1M-$10M', certifications: JSON.stringify(['EU Organic', 'USDA Organic', 'Marine Stewardship']), isDemo: true },
    { id: 'c7', name: 'Havsbruk AS', country: 'Norway', countryIso3: 'NOR', sector: 'farming', species: JSON.stringify(['Saccharina latissima', 'Alaria esculenta', 'Ulva lactuca']), description: 'Norwegian offshore kelp cultivation company developing large-scale sustainable seaweed farms in Norwegian fjords. Targets food ingredient and biostimulant markets. Backed by aquaculture industry investors.', website: 'https://havsbruk.no', employeeRange: '10-50', revenueRange: '$1M-$10M', certifications: JSON.stringify(['ASC in process', 'EU Organic']), isDemo: true },
    { id: 'c8', name: 'Algaia', country: 'France', countryIso3: 'FRA', sector: 'biotech', species: JSON.stringify(['Laminaria digitata', 'Ascophyllum nodosum', 'Sargassum muticum']), description: 'French biotech specializing in alginate and seaweed extract production for food, cosmetic and agricultural applications. Operates certified organic seaweed processing facility in Brittany. Known for innovative Algiactif® biostimulant range.', website: 'https://www.algaia.com', employeeRange: '50-200', revenueRange: '$10M-$50M', certifications: JSON.stringify(['EU Organic', 'ISO 9001', 'Cosmos Organic']), isDemo: true },
    { id: 'c9', name: 'Blue Evolution', country: 'United States', countryIso3: 'USA', sector: 'farming', species: JSON.stringify(['Saccharina latissima', 'Palmaria mollis', 'Porphyra']), description: 'US regenerative ocean farming company cultivating seaweed off Alaska and Maine coastlines. Sells directly to food manufacturers and retailers. Leading voice on seaweed as climate solution in North America.', website: 'https://blueevolution.com', employeeRange: '10-50', revenueRange: '$1M-$10M', certifications: JSON.stringify(['USDA Organic', 'MSC', 'Non-GMO Project']), isDemo: true },
    { id: 'c10', name: 'Running Tide', country: 'United States', countryIso3: 'USA', sector: 'biotech', species: JSON.stringify(['Saccharina latissima', 'Macrocystis pyrifera']), description: 'Ocean-based carbon removal company using seaweed to sequester atmospheric CO2. First company to sell verified seaweed carbon credits on the voluntary carbon market. Partners include Microsoft, Stripe and Shopify.', website: 'https://www.runningtide.com', employeeRange: '50-200', revenueRange: '$10M-$50M', certifications: JSON.stringify(['Verra VCS', 'Gold Standard']), isDemo: true },
    { id: 'c11', name: 'Ceva Santé Animale Marine', country: 'France', countryIso3: 'FRA', sector: 'biotech', species: JSON.stringify(['Asparagopsis taxiformis']), description: 'Leading developer of Asparagopsis-based methane reduction supplements for livestock. Clinical trials show 80%+ reduction in bovine enteric methane. EU regulatory approval sought for 2025.', website: 'https://www.ceva.com', employeeRange: '1000-5000', revenueRange: '$200M-$500M', certifications: JSON.stringify(['ISO 9001', 'GMP+']), isDemo: true },
    { id: 'c12', name: 'Takara Foods', country: 'Japan', countryIso3: 'JPN', sector: 'processing', species: JSON.stringify(['Porphyra yezoensis', 'Saccharina japonica', 'Undaria pinnatifida']), description: 'Leading Japanese processor and exporter of premium dried seaweed products including nori sheets, wakame and kombu. Supplies Japanese food service chains and retail worldwide. Strong position in US and Australian premium markets.', website: 'https://www.takara-foods.co.jp', employeeRange: '200-500', revenueRange: '$50M-$200M', certifications: JSON.stringify(['ISO 22000', 'FSSC 22000', 'Halal', 'JAS Organic']), isDemo: true },
    { id: 'c13', name: 'Kelpak International', country: 'South Africa', countryIso3: 'ZAF', sector: 'biotech', species: JSON.stringify(['Ecklonia maxima']), description: 'Pioneer of seaweed-based biostimulants, operating since 1981. Kelpak liquid biostimulant made from Ecklonia maxima is approved in 60+ countries for use on crops, fruit and vegetables. Strong position in EU sustainable agriculture market.', website: 'https://www.kelpak.com', employeeRange: '50-200', revenueRange: '$10M-$50M', certifications: JSON.stringify(['EU Organic Input', 'CDFA Organic Input', 'OMRI Listed']), isDemo: true },
    { id: 'c14', name: 'Kaigai Foods Ltd', country: 'Tanzania', countryIso3: 'TZA', sector: 'trading', species: JSON.stringify(['Eucheuma cottonii', 'Spinosum']), description: 'East African seaweed trader and consolidator sourcing from smallholder farmers in Zanzibar and Pemba. Exports dried Eucheuma to European and Asian processors. Supports farmer certification programs.', website: null, employeeRange: '10-50', revenueRange: '$1M-$10M', certifications: JSON.stringify(['Fair Trade in progress']), isDemo: true },
    { id: 'c15', name: 'AquaFarm Morocco', country: 'Morocco', countryIso3: 'MAR', sector: 'farming', species: JSON.stringify(['Gelidium sesquipedale', 'Gracilaria multipartita']), description: 'Moroccan seaweed harvesting and farming operation targeting agar production. Morocco holds some of the world\'s most productive Gelidium beds. Currently supplying Spanish and French agar manufacturers.', website: null, employeeRange: '50-200', revenueRange: '$1M-$10M', certifications: JSON.stringify(['ISO 22000']), isDemo: true },
  ]
}

function generateDemoAlerts() {
  return [
    {
      id: 'alert-1',
      userId: 'demo-user',
      title: 'EU Amends Maximum Arsenic Levels for Seaweed Food Supplements',
      summary: 'Commission Regulation (EU) 2024/1823 published in the Official Journal amends maximum levels for inorganic arsenic in food supplements from seaweed from 0.3 mg/kg to 0.1 mg/kg. Applies from 1 March 2025. Companies selling seaweed-based food supplements in the EU must test and reformulate if necessary.',
      severity: 'high',
      source: 'EUR-Lex CELLAR',
      sourceUrl: 'https://eur-lex.europa.eu',
      jurisdiction: 'EU',
      isRead: false,
      isDemo: true,
    },
    {
      id: 'alert-2',
      userId: 'demo-user',
      title: 'FDA Issues Import Alert on Hijiki Seaweed Products',
      summary: 'FDA has issued an updated import alert (IA 16-128) for hijiki seaweed (Sargassum fusiforme) products from Japan, China and South Korea citing elevated inorganic arsenic content exceeding 1 mg/kg. Products subject to automatic detention without physical examination.',
      severity: 'high',
      source: 'openFDA',
      sourceUrl: 'https://www.fda.gov/safety/import-alerts',
      jurisdiction: 'USA',
      isRead: false,
      isDemo: true,
    },
    {
      id: 'alert-3',
      userId: 'demo-user',
      title: 'EFSA Novel Food Application Approved: Schizochytrium Oil for EU Market',
      summary: 'EFSA has approved a new Novel Food application for DHA-rich oil from Schizochytrium sp. for use in food supplements up to 2g/day. This expands the authorised use conditions and may open new product formulation opportunities for seaweed-derived omega-3 supplements.',
      severity: 'medium',
      source: 'EFSA Open Data',
      sourceUrl: 'https://efsa.onlinelibrary.wiley.com',
      jurisdiction: 'EU',
      isRead: true,
      isDemo: true,
    },
    {
      id: 'alert-4',
      userId: 'demo-user',
      title: 'WTO SPS Notification: South Korea New Phytosanitary Requirements for Seaweed',
      summary: 'South Korea has notified the WTO SPS Committee of new phytosanitary inspection requirements for imported dried seaweed, including mandatory testing for 12 pesticide residues. Requirements apply from Q3 2025. Exporters should update testing protocols accordingly.',
      severity: 'medium',
      source: 'WTO Tariff Data',
      sourceUrl: 'https://spsims.wto.org',
      jurisdiction: 'WTO',
      isRead: false,
      isDemo: true,
    },
    {
      id: 'alert-5',
      userId: 'demo-user',
      title: 'USDA Organic: Updated Seaweed Handling Requirements for NOP Certification',
      summary: 'USDA Agricultural Marketing Service has published updated guidance for organic certification of seaweed harvesting operations under the National Organic Program. Key change: wild-harvested seaweed now requires formal environmental impact assessment and harvest plan approval for NOP certification.',
      severity: 'low',
      source: 'USDA Organic DB',
      sourceUrl: 'https://organic.ams.usda.gov',
      jurisdiction: 'USA',
      isRead: true,
      isDemo: true,
    },
  ]
}

// DB seeding function (only called when DATABASE_URL is set)
export async function seedDemoData(): Promise<void> {
  const { isDbAvailable, db } = await import('@/lib/db/client')
  if (!isDbAvailable() || !db) return

  const { marketPrices, tradeFlows, regulatoryFrameworks, regulatoryAlerts, marketNews, companies, reportBankDocuments, reportBankChunks } = await import('@/lib/db/schema')
  const { sql } = await import('drizzle-orm')

  // Guard: skip if already seeded
  const priceCount = await db.execute(sql`SELECT COUNT(*) as count FROM market_prices WHERE is_demo = true`)
  const rows = priceCount.rows as Array<{ count: string }>
  if (parseInt(rows[0]?.count ?? '0', 10) > 0) return

  console.log('[BlueBonzo] Seeding demo data...')

  // Seed in batches to avoid Neon serverless timeout
  for (let i = 0; i < DEMO_PRICES.length; i += 50) {
    await db.insert(marketPrices).values(DEMO_PRICES.slice(i, i + 50)).onConflictDoNothing()
  }
  for (let i = 0; i < DEMO_TRADE_FLOWS.length; i += 50) {
    await db.insert(tradeFlows).values(DEMO_TRADE_FLOWS.slice(i, i + 50)).onConflictDoNothing()
  }
  await db.insert(regulatoryFrameworks).values(DEMO_REGULATORY as any).onConflictDoNothing()
  await db.insert(marketNews).values(DEMO_NEWS as any).onConflictDoNothing()
  await db.insert(companies).values(DEMO_COMPANIES as any).onConflictDoNothing()
  await db.insert(regulatoryAlerts).values(DEMO_ALERTS as any).onConflictDoNothing()
  await db.insert(reportBankDocuments).values(DEMO_REPORT_BANK_DOCUMENTS.map((doc) => ({
    id: doc.id,
    uploadedById: 'demo-user',
    filename: `${doc.id}.md`,
    originalName: `${doc.name}.md`,
    mimeType: 'text/markdown',
    fileSize: doc.pages * 18000,
    blobUrl: `demo://report-bank/${doc.id}`,
    blobKey: `demo/${doc.id}.md`,
    tags: JSON.stringify(doc.tags),
    category: doc.category.toLowerCase().replace(/\s+/g, '_'),
    visibility: 'community',
    processingStatus: 'ready',
    chunkCount: Math.max(1, Math.round(doc.pages * 0.75)),
    isDemo: 1,
    createdAt: subWeeks(new Date(), Math.ceil(doc.addedDaysAgo / 7)),
  }))).onConflictDoNothing()
  await db.insert(reportBankChunks).values(DEMO_REPORT_BANK_CHUNKS as any).onConflictDoNothing()

  console.log('[BlueBonzo] Demo data seeded successfully')
}
