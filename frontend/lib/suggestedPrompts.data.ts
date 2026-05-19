/**
 * Large curated catalog of research prompts (companies × themes × year).
 * Built once at module load; sampled randomly in suggestedPrompts.ts.
 */

const COMPANIES = [
  'OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta',
  'NVIDIA', 'AMD', 'Intel', 'TSMC', 'ASML', 'Broadcom', 'Qualcomm',
  'Tesla', 'BYD', 'Toyota', 'Ford', 'Rivian', 'Uber', 'Airbnb',
  'SpaceX', 'Blue Origin', 'Boeing', 'Lockheed Martin',
  'Stripe', 'Shopify', 'PayPal', 'Visa', 'Mastercard', 'Coinbase',
  'Netflix', 'Disney', 'Spotify', 'Adobe', 'Salesforce', 'Oracle', 'SAP',
  'Palantir', 'Snowflake', 'Databricks', 'MongoDB', 'Cloudflare',
  'ByteDance', 'Samsung', 'Sony', 'Nintendo', 'Arm Holdings',
  'JPMorgan Chase', 'Goldman Sachs', 'Berkshire Hathaway', 'BlackRock',
  'Johnson & Johnson', 'Pfizer', 'Moderna', 'Novo Nordisk', 'Lilly',
  'Walmart', 'Costco', 'Nike', 'LVMH', 'Coca-Cola',
  'ExxonMobil', 'Chevron', 'NextEra Energy',
  'Mistral AI', 'Cohere', 'xAI', 'Perplexity', 'Hugging Face',
  'Figure AI', 'Boston Dynamics', 'Anduril',
  'ServiceNow', 'Workday', 'Atlassian', 'Zoom', 'Slack',
  'Robinhood', 'SoFi', 'Block', 'Square', 'Adyen',
  'Shein', 'Temu', 'ASOS', 'Inditex',
  'OpenAI', 'DeepMind', 'Scale AI', 'Weights & Biases',
  'Canva', 'Figma', 'Notion', 'Airtable',
  'CrowdStrike', 'Palo Alto Networks', 'Zscaler', 'Fortinet',
  'Equinix', 'Digital Realty', 'CoreWeave', 'Lambda Labs',
];

const TOPICS = [
  'AI agents and tool use',
  'reasoning models and test-time compute',
  'enterprise AI adoption',
  'AI coding assistants',
  'multimodal models (text, image, video)',
  'open-weight vs closed LLMs',
  'AI safety and alignment',
  'EU AI Act compliance',
  'US AI executive orders and regulation',
  'hyperscaler AI capex',
  'GPU supply and pricing',
  'custom AI chips (TPU, Trainium, Maia)',
  'data center power and cooling',
  'vector databases and RAG',
  'AI inference cost optimization',
  'synthetic data for training',
  'AI in healthcare diagnostics',
  'autonomous vehicles (L4 deployment)',
  'humanoid robotics',
  'quantum computing commercialization',
  'semiconductor export controls (US–China)',
  'CHIPS Act impact',
  'stablecoins and crypto regulation',
  'Bitcoin ETF flows',
  'Fed interest rate path',
  'inflation and consumer spending',
  'commercial real estate stress',
  'gen-Z consumer brands',
  'fast fashion and Shein',
  'renewable energy grid storage',
  'nuclear SMRs for data centers',
  'cybersecurity and ransomware',
  'SaaS multiples and AI disruption',
  'vertical SaaS vs horizontal AI',
  'IPO market for tech',
  'venture funding for AI startups',
  'Big Tech antitrust cases',
  'TikTok ban and social media regulation',
  'Apple App Store policy',
  'Google Search vs AI answers',
  'Microsoft Copilot monetization',
  'Amazon AWS AI services',
  'Meta open-source Llama ecosystem',
  'Tesla FSD and robotaxi economics',
  'Starlink and satellite internet',
  'defense tech and drones',
  'climate tech carbon capture',
  'GLP-1 drugs market',
  'weight-loss drug supply chain',
  'India as a manufacturing hub',
  'Mexico nearshoring trend',
];

const COMPANY_TEMPLATES = [
  '{name} — competitive moat and key risks in {year}',
  '{name} — revenue drivers and margin outlook for {year}',
  '{name} — latest product strategy and market position',
  'What threatens {name}\'s growth in {year}?',
  '{name} — AI strategy and monetization in {year}',
  '{name} — valuation vs peers: bull and bear case',
  'Supply chain and geopolitical exposure: {name}',
];

const TOPIC_TEMPLATES = [
  '{topic} — state of the market in {year}',
  '{topic} — winners, losers, and 12-month outlook',
  'How {topic} is reshaping enterprise software in {year}',
  'Investment thesis: who benefits from {topic} in {year}?',
  '{topic} — regulatory and ethical risks in {year}',
];

const COMPARISONS: [string, string][] = [
  ['OpenAI', 'Anthropic'],
  ['OpenAI', 'Google Gemini'],
  ['NVIDIA', 'AMD'],
  ['NVIDIA', 'custom cloud chips'],
  ['AWS', 'Microsoft Azure'],
  ['AWS', 'Google Cloud'],
  ['Apple', 'Samsung mobile AI'],
  ['Tesla', 'BYD'],
  ['Tesla', 'legacy automakers EV transition'],
  ['Meta', 'TikTok'],
  ['Stripe', 'Adyen'],
  ['Palantir', 'traditional defense contractors'],
  ['Snowflake', 'Databricks'],
  ['Intel', 'TSMC foundry model'],
  ['SpaceX', 'Blue Origin'],
  ['Bitcoin', 'Ethereum'],
  ['ChatGPT', 'Perplexity'],
  ['Copilot', 'GitHub vs Cursor vs Codeium'],
  ['Llama', 'Mistral open models'],
  ['US', 'EU AI regulation'],
];

const COMPARISON_TEMPLATES = [
  '{a} vs {b} — who leads in {year} and why?',
  'Compare {a} and {b}: strategy, risks, and outlook ({year})',
  '{a} vs {b} — enterprise buyer perspective in {year}',
];

/** Timely, headline-style prompts (refreshed for 2025–2026 themes). */
const CURATED_PROMPTS = [
  'OpenAI GPT-5 rumors — capabilities and competitive impact',
  'Anthropic Claude enterprise adoption and safety positioning',
  'Google Gemini 2.x vs OpenAI — developer and consumer traction',
  'Meta Llama open ecosystem — who is winning the open-model stack?',
  'xAI Grok — distribution advantage via X and product roadmap',
  'NVIDIA Blackwell ramp — supply, pricing, and customer demand',
  'AMD MI300 vs NVIDIA — datacenter GPU share shift',
  'TSMC Arizona fabs — timeline and geopolitical risk',
  'Microsoft Copilot revenue — attach rate across Office and GitHub',
  'Amazon Bedrock — enterprise AI platform competitive analysis',
  'Apple Intelligence — on-device AI strategy and developer impact',
  'Tesla robotaxi launch — economics and regulatory hurdles',
  'SpaceX Starship — commercial launch market disruption',
  'Stripe agentic commerce — payments infra for AI apps',
  'Perplexity vs Google Search — AI-native search threat',
  'Cursor and AI IDEs — impact on developer tooling market',
  'EU AI Act — compliance costs for US tech firms',
  'US CHIPS Act — domestic fab progress and bottlenecks',
  'AI data center buildout — power grid constraints in the US',
  'Stargate and mega-datacenter projects — capex and partners',
  'DeepSeek and Chinese LLMs — export controls and performance',
  'Reasoning models (o-series, R1-style) — cost and use cases',
  'AI agents in customer support — ROI and vendor landscape',
  'Vertical AI SaaS — defensibility vs foundation models',
  'SaaS death narrative — which categories are actually at risk?',
  'GLP-1 drugs — Novo Nordisk vs Lilly market share battle',
  'Bitcoin post-ETF — flows, regulation, and macro sensitivity',
  'Fed policy in 2026 — rates, growth stocks, and AI capex',
  'Magnificent Seven concentration — index risk and rebalancing',
  'Q2 2026 tech earnings — hyperscaler AI spend guide',
  'Humanoid robots (Figure, Tesla Optimus) — timeline and TAM',
  'Autonomous trucking — Aurora, Kodiak, and incumbents',
  'Palantir AIP — government vs commercial growth mix',
  'Anduril and defense tech — procurement and ethics debate',
  'Climate tech 2026 — grid storage and carbon credit markets',
  'Nearshoring to Mexico — supply chain winners',
  'India semiconductor mission — incentives and execution risk',
  'Cyber insurance — AI-driven attack surface expansion',
  'Open-weight models — enterprise adoption barriers',
  'Video generation (Sora, Veo) — creative industry disruption',
  'AI copyright litigation — training data and outcomes',
  'Reddit and social data licensing — model training economics',
  'Cloudflare vs hyperscalers — edge inference opportunity',
  'Databricks vs Snowflake — data+AI platform war',
  'Shopify agentic storefronts — merchant tooling shift',
  'TikTok divestiture scenarios — ad market impact',
  'Waymo vs Tesla FSD — approach and city rollout',
  'Nuclear for AI datacenters — SMR projects and timelines',
  'Water stress and chip fabs — sustainability risk',
  'Venture dry powder — AI seed vs Series A crunch',
  'Secondary market for AI unicorns — pricing and liquidity',
  'Intel turnaround — foundry customers and process nodes',
  'Qualcomm on-device AI — mobile NPU roadmap',
  'Honeywell vs startups — industrial automation AI',
  'McKinsey-style AI consulting — Big Four vs boutiques',
  'CoreWeave and GPU cloud — threat to hyperscaler AI infra',
  'Lambda Labs and neoclouds — pricing vs AWS',
  'CrowdStrike platform expansion — security + AI agents',
  'Canva AI design — creative suite competitive dynamics',
  'Figma AI features — Adobe acquisition fallout',
  'Robinhood tokenization and crypto roadmap',
  'Shein vs Temu — cross-border e-commerce war',
  'Notion AI — productivity suite consolidation',
  'Zscaler zero trust — SASE growth in 2026',
];

function buildCatalog(year: number): string[] {
  const prompts = new Set<string>();

  for (const line of CURATED_PROMPTS) {
    prompts.add(line.replace(/\{year\}/g, String(year)));
  }

  for (const name of COMPANIES) {
    for (const tpl of COMPANY_TEMPLATES) {
      prompts.add(tpl.replace(/\{name\}/g, name).replace(/\{year\}/g, String(year)));
    }
  }

  for (const topic of TOPICS) {
    for (const tpl of TOPIC_TEMPLATES) {
      prompts.add(tpl.replace(/\{topic\}/g, topic).replace(/\{year\}/g, String(year)));
    }
  }

  for (const [a, b] of COMPARISONS) {
    for (const tpl of COMPARISON_TEMPLATES) {
      prompts.add(
        tpl.replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{year\}/g, String(year)),
      );
    }
  }

  // Quarter-aware earnings prompts for megacaps
  const quarter = Math.floor(new Date().getMonth() / 3) + 1;
  const megacaps = ['Apple', 'Microsoft', 'Amazon', 'Google', 'Meta', 'NVIDIA', 'Tesla'];
  for (const name of megacaps) {
    prompts.add(`${name} Q${quarter} ${year} earnings — beats, misses, and guidance`);
  }

  return [...prompts];
}

export const SUGGESTED_PROMPTS: string[] = buildCatalog(new Date().getFullYear());
