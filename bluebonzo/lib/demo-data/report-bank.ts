export const DEMO_REPORT_BANK_DOCUMENTS = [
  { id: 'kb-1', name: 'EU Seaweed Arsenic Limits and EFSA Opinions 2025', pages: 42, tags: ['eu', 'efsa', 'arsenic', 'regulatory'], addedDaysAgo: 1, category: 'Regulatory' },
  { id: 'kb-2', name: 'UN Comtrade Seaweed HS 121221 121229 130231 Trade Pack', pages: 64, tags: ['trade', 'comtrade', 'exports', 'imports'], addedDaysAgo: 2, category: 'Trade Data' },
  { id: 'kb-3', name: 'FAO Global Seaweed Production and Aquaculture Statistics', pages: 78, tags: ['fao', 'production', 'aquaculture'], addedDaysAgo: 3, category: 'Market Research' },
  { id: 'kb-4', name: 'Carrageenan SRC and PRC Pricing Monitor Southeast Asia', pages: 28, tags: ['carrageenan', 'pricing', 'indonesia', 'philippines'], addedDaysAgo: 4, category: 'Pricing' },
  { id: 'kb-5', name: 'PubMed Literature Review Seaweed Iodine Arsenic Heavy Metals', pages: 55, tags: ['pubmed', 'scientific', 'iodine', 'arsenic'], addedDaysAgo: 5, category: 'Scientific' },
  { id: 'kb-6', name: 'NOAA ERDDAP SST Chlorophyll Cultivation Risk Brief', pages: 31, tags: ['noaa', 'sst', 'chlorophyll', 'climate'], addedDaysAgo: 6, category: 'Scientific' },
  { id: 'kb-7', name: 'Codex Alimentarius Seaweed Contaminants Standards', pages: 26, tags: ['codex', 'regulatory', 'contaminants'], addedDaysAgo: 7, category: 'Regulatory' },
  { id: 'kb-8', name: 'WTO SPS Seaweed Import Notification Tracker', pages: 34, tags: ['wto', 'sps', 'tariff', 'regulatory'], addedDaysAgo: 8, category: 'Regulatory' },
  { id: 'kb-9', name: 'Philippines Kappaphycus Supplier and Export Certification Brief', pages: 46, tags: ['philippines', 'kappaphycus', 'suppliers'], addedDaysAgo: 9, category: 'Company Reports' },
  { id: 'kb-10', name: 'Indonesia Eucheuma Cottonii Yield Climate Impact Note', pages: 38, tags: ['indonesia', 'eucheuma', 'climate'], addedDaysAgo: 10, category: 'Market Research' },
  { id: 'kb-11', name: 'Agar Supply Chain Gelidium Gracilaria Korea Japan Morocco', pages: 52, tags: ['agar', 'gelidium', 'gracilaria', 'trade'], addedDaysAgo: 11, category: 'Market Research' },
  { id: 'kb-12', name: 'Alginate Market China Norway North Atlantic Inputs', pages: 49, tags: ['alginate', 'china', 'norway', 'pricing'], addedDaysAgo: 12, category: 'Pricing' },
  { id: 'kb-13', name: 'Seaweed Biostimulants Market and Scientific Validation Pack', pages: 67, tags: ['biostimulants', 'scientific', 'market'], addedDaysAgo: 13, category: 'Scientific' },
  { id: 'kb-14', name: 'Nori Wakame Kombu Premium Edible Seaweed Export Outlook', pages: 44, tags: ['nori', 'wakame', 'kombu', 'japan'], addedDaysAgo: 14, category: 'Market Research' },
  { id: 'kb-15', name: 'Enterprise Supplier Audit Template Seaweed Processors', pages: 19, tags: ['supplier', 'audit', 'certification'], addedDaysAgo: 15, category: 'Company Reports' },
]

export const DEMO_REPORT_BANK_CHUNKS = DEMO_REPORT_BANK_DOCUMENTS.map((doc, index) => ({
  id: `kb-chunk-${index + 1}`,
  documentId: doc.id,
  content: `${doc.name}. This curated demo knowledge-base entry summarizes source material for ${doc.tags.join(', ')} and is intended as seed reference context for BlueBonzo market intelligence answers.`,
  chunkIndex: 0,
  tokenCount: 48,
}))
