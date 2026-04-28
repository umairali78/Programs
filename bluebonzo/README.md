# BlueBonzo AI

Market intelligence workspace for seaweed pricing, trade, regulation, science, environmental context, and private Report Bank retrieval.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your configured account, or `demo@bluebonzo.ai` / `demo123` when no database is configured.

## Live APIs

Live API wiring lives in `lib/live-apis/`.

Currently wired:

- `UN Comtrade Plus`: seaweed HS code trade flow context for `121221`, `121229`, and `130231`.
- `PubMed / NCBI E-utilities`: seaweed science and contaminant literature.
- `OpenAlex`: broader research index and citation metadata.
- `NOAA ERDDAP`: sea surface temperature / chlorophyll dataset discovery for cultivation-risk context.
- `WTO tariff context`: normalized tariff-reference placeholder with WTO source citation.

Optional environment variables:

```bash
COMTRADE_API_KEY=
PUBMED_API_KEY=
NCBI_EMAIL=
OPENALEX_EMAIL=
WTO_API_KEY=
```

To add another API:

1. Add its normalized result function in `lib/live-apis/providers.ts`.
2. Add the provider key to `LiveProvider` in `lib/live-apis/types.ts`.
3. Add routing keywords in `classifyQueryForLiveApis()` in `lib/live-apis/index.ts`.
4. Wrap the call with `withSourceBudget()` so slow external services cannot block the UI.
5. Use `withApiCache()` for DB-backed TTL caching and stale fallback.

## Report Bank

Users add reports from `/report-bank` in the app. Supported upload types are PDF, DOCX, XLSX, CSV, TXT, and Markdown.

The upload pipeline validates the file, stores it in Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, extracts text, chunks it, infers category/tags, and persists metadata/chunks in:

- `report_bank_documents`
- `report_bank_chunks`

Good seed material for a robust reference data center:

- Regulatory: EFSA opinions, EUR-Lex decisions, FDA import alerts, Codex standards, WTO SPS notices.
- Trade/pricing: Comtrade exports, FAO FishStat reports, supplier price sheets, hydrocolloid pricing reports.
- Scientific: PubMed/OpenAlex papers on carrageenan, agar, alginate, iodine, arsenic, cultivation, and processing.
- Market: FAO/World Bank/UNCTAD/industry market outlooks.
- Company: supplier audits, certifications, annual reports, investor decks, internal procurement notes.

For best retrieval, name files clearly and include region/species in the title, for example `EU_Seaweed_Arsenic_EFSA_2025.pdf` or `Indonesia_Kappaphycus_Export_Prices_Q1_2026.xlsx`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
