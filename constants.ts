import { KnowledgeBase, SubscriptionPlan, UserTier } from './types';

export const PLANS: Record<UserTier, SubscriptionPlan> = {
  [UserTier.FREE]: {
    id: UserTier.FREE,
    name: "Starter",
    price: "Free",
    priceValue: 0,
    scansPerDay: 3,
    generationsPerDay: 1,
    adFree: false,
    billingPeriod: 'free',
    features: [
      "Basic Ingredient Analysis",
      "3 Scans per day",
      "1 Meal/Workout Idea per day",
      "Shareable @food.chem.intel Story Cards"
    ]
  },
  [UserTier.PASS]: {
    id: UserTier.PASS,
    name: "30-Day Pantry Cleanout Pass",
    price: "$9.99 / 30 days",
    priceValue: 9.99,
    scansPerDay: 50,
    generationsPerDay: 15,
    adFree: true,
    billingPeriod: 'one_time_30d',
    badge: "MOST POPULAR • NO SUBSCRIPTION",
    features: [
      "50 Scans per day for 30 days",
      "Full Drug-Food Interaction Checker",
      "EU vs. USA Banned Chemical Dossiers",
      "Ad-Free Experience",
      "One-Time Pass (No Auto-Renew)"
    ]
  },
  [UserTier.STANDARD]: {
    id: UserTier.STANDARD,
    name: "Standard Watchdog",
    price: "$4.99/mo",
    priceValue: 4.99,
    scansPerDay: 20,
    generationsPerDay: 10,
    adFree: true,
    billingPeriod: 'monthly',
    features: [
      "Everything in Starter",
      "Ad-Free Experience",
      "20 Scans per day",
      "10 Meal/Workout Ideas",
      "Drug Interaction Checker"
    ]
  },
  [UserTier.ULTRA]: {
    id: UserTier.ULTRA,
    name: "Ultra Health",
    price: "$19.99/mo",
    priceValue: 19.99,
    scansPerDay: -1, // Unlimited
    generationsPerDay: -1,
    adFree: true,
    billingPeriod: 'monthly',
    badge: "UNLIMITED AI + AUDITS",
    features: [
      "Unlimited Scans & Analysis",
      "Unlimited AI Generations",
      "Priority Processing",
      "Advanced Toxicology Reports",
      "Weekly/Monthly/Yearly Nutrition Audits"
    ]
  }
};

// Sourced from @food.chem.intel investigative toxicology audit database
export const KNOWLEDGE_BASE: KnowledgeBase = {
  hazardous_additives: {
    "potassium bromate": {
      "risk_level": "CRITICAL",
      "function": "Dough Conditioner",
      "health_impact": "Class 2B Carcinogen. Linked to kidney damage, thyroid tumors, and DNA oxidative damage.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: BANNED | 🇬🇧 UK: BANNED | 🇨🇦 CA: BANNED",
      "verdict": "AVOID. Banned in almost every industrialized nation.",
      "citation_source": "IARC Monograph Vol. 73",
      "citation_url": "https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono73-17.pdf",
      "aliases": ["bromated flour", "e924"]
    },
    "azodicarbonamide": {
      "risk_level": "HIGH",
      "function": "Bleaching & Foaming Agent",
      "health_impact": "Respiratory sensitizer. Breaks down during baking into urethane and semicarbazide (carcinogens).",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: BANNED | 🇦🇺 Aus: BANNED",
      "verdict": "AVOID. Industrial blowing agent used in yoga mats.",
      "citation_source": "EFSA Journal 2005",
      "citation_url": "https://efsa.onlinelibrary.wiley.com/doi/abs/10.2903/j.efsa.2005.236",
      "aliases": ["ada", "e927"]
    },
    "titanium dioxide": {
      "risk_level": "HIGH",
      "function": "Whitening Nanoparticle Pigment",
      "health_impact": "Nanoparticles accumulate in intestinal Peyer's patches; genotoxicity and DNA strand breaks cannot be ruled out.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: BANNED (2022)",
      "verdict": "AVOID. Banned across Europe over genotoxicity concerns.",
      "citation_source": "EFSA Safety Assessment of E171 (2021)",
      "citation_url": "https://www.efsa.europa.eu/en/efsajournal/pub/6585",
      "aliases": ["e171", "ci 77891", "tio2"]
    },
    "brominated vegetable oil": {
      "risk_level": "CRITICAL",
      "function": "Citrus Emulsifier",
      "health_impact": "Bromine bioaccumulation causing thyroid toxicity, neurological impairment, and memory loss.",
      "regulatory_status": "🇺🇸 USA: Revoked (2024) | 🇪🇺 EU: BANNED | 🇯🇵 JP: BANNED",
      "verdict": "DANGEROUS. Organobromine chemical banned globally.",
      "citation_source": "FDA Revocation Rule 2024",
      "citation_url": "https://www.fda.gov/food/food-additives-petitions/brominated-vegetable-oil-bvo",
      "aliases": ["bvo", "e443"]
    },
    "bha": {
      "risk_level": "MODERATE",
      "function": "Synthetic Antioxidant Preservative",
      "health_impact": "Reasonably anticipated to be a human carcinogen (NTP) and xenoestrogenic endocrine disruptor.",
      "regulatory_status": "🇺🇸 USA: GRAS | 🇪🇺 EU: Restricted",
      "verdict": "CAUTION. Endocrine disruptor & NTP listed carcinogen.",
      "citation_source": "National Toxicology Program (Report 15)",
      "citation_url": "https://ntp.niehs.nih.gov/ntp/roc/content/profiles/butylatedhydroxyanisole.pdf",
      "aliases": ["butylated hydroxyanisole", "e320"]
    },
    "bht": {
      "risk_level": "MODERATE",
      "function": "Synthetic Preservative",
      "health_impact": "Hepatic enzyme induction and thyroid follicular hyperplasia in animal toxicology studies.",
      "regulatory_status": "🇺🇸 USA: GRAS | 🇪🇺 EU: Restricted",
      "verdict": "CAUTION. Petroleum-derived toluene antioxidant.",
      "citation_source": "EFSA Scientific Opinion on BHT",
      "citation_url": "https://www.efsa.europa.eu/en/efsajournal/pub/2588",
      "aliases": ["butylated hydroxytoluene", "e321"]
    },
    "tbhq": {
      "risk_level": "MODERATE",
      "function": "Synthetic Lipid Preservative",
      "health_impact": "Linked to T-cell immune response suppression and vision/neurological disturbances at high exposure.",
      "regulatory_status": "🇺🇸 USA: Legal (<0.02%) | 🇯🇵 JP: BANNED",
      "verdict": "CAUTION. Butane-derived preservative linked to immune modulation.",
      "citation_source": "Int. Journal of Environmental Research & Public Health",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/33809446/",
      "aliases": ["tertiary butylhydroquinone", "tert-butylhydroquinone", "e319"]
    },
    "red 40": {
      "risk_level": "MODERATE",
      "function": "Synthetic Petroleum Azo Dye",
      "health_impact": "Linked to neurobehavioral hyperactivity in children, colonic inflammation, and trace benzidine contaminants.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: Warning Label Required",
      "verdict": "CAUTION. Requires child hyperactivity warning label in Europe.",
      "citation_source": "OEHHA Neurobehavioral Assessment / PubMed",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/23026007/",
      "aliases": ["fd&c red no. 40", "fd&c red 40", "red no. 40", "red no 40", "allura red", "e129"]
    },
    "yellow 5": {
      "risk_level": "MODERATE",
      "function": "Synthetic Azo Dye",
      "health_impact": "Hypersensitivity reactions, neurobehavioral agitation, and lymphocyte DNA damage at elevated concentrations.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: Warning Label Required",
      "verdict": "CAUTION. Synthetic coal-tar/petroleum tartrazine dye.",
      "citation_source": "PubMed: Genotoxicity of Tartrazine",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/29149841/",
      "aliases": ["tartrazine", "fd&c yellow no. 5", "fd&c yellow 5", "yellow no 5", "e102"]
    },
    "yellow 6": {
      "risk_level": "MODERATE",
      "function": "Synthetic Azo Dye",
      "health_impact": "Linked to adrenal/testicular tumors in animal assays and hyperactivity in sensitive children.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: Warning Label Required",
      "verdict": "CAUTION. Requires EU warning label.",
      "citation_source": "EFSA Re-evaluation of Sunset Yellow FCF",
      "citation_url": "https://www.efsa.europa.eu/en/efsajournal/pub/1330",
      "aliases": ["sunset yellow", "fd&c yellow no. 6", "fd&c yellow 6", "yellow no 6", "e110"]
    },
    "blue 1": {
      "risk_level": "MODERATE",
      "function": "Synthetic Triphenylmethane Dye",
      "health_impact": "Crosses blood-brain barrier in compromised states and inhibits mitochondrial respiration in vitro.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: Restricted",
      "verdict": "CAUTION. Purely cosmetic synthetic dye.",
      "citation_source": "Journal of Pediatrics / Toxicology",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/23026007/",
      "aliases": ["brilliant blue", "fd&c blue no. 1", "fd&c blue 1", "blue no 1", "e133"]
    },
    "caramel color": {
      "risk_level": "MODERATE",
      "function": "Artificial Coloring (Class III/IV)",
      "health_impact": "Ammonia-sulfite process produces 4-methylimidazole (4-MEI), a California Prop 65 listed carcinogen.",
      "regulatory_status": "🇺🇸 USA: Legal (Prop 65 Warning in CA) | 🇪🇺 EU: E150d",
      "verdict": "CAUTION. Watch for 4-MEI contaminant in colas and sauces.",
      "citation_source": "NTP Technical Report on 4-Methylimidazole",
      "citation_url": "https://ntp.niehs.nih.gov/publications/reports/tr/500s/tr535",
      "aliases": ["caramel color iv", "class iv caramel", "e150d", "artificial caramel color"]
    },
    "sodium nitrite": {
      "risk_level": "HIGH",
      "function": "Meat Curing & Color Fixative",
      "health_impact": "Reacts with secondary amines in stomach acid or high heat to form carcinogenic N-nitrosamines.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: Strictly Capped",
      "verdict": "AVOID HIGH INTAKE. Linked to colorectal cancer risk (WHO Group 1 processed meat).",
      "citation_source": "IARC / WHO Monograph on Ingested Nitrates and Nitrites",
      "citation_url": "https://monographs.iarc.who.int/list-of-classifications",
      "aliases": ["sodium nitrate", "e250", "e251"]
    },
    "propylparaben": {
      "risk_level": "HIGH",
      "function": "Antimicrobial Preservative",
      "health_impact": "Estrogenic endocrine disruptor linked to decreased sperm counts and altered reproductive signaling.",
      "regulatory_status": "🇺🇸 USA: Banned in CA (2027) | 🇪🇺 EU: BANNED in Food",
      "verdict": "AVOID. Endocrine-disrupting paraben banned in EU food.",
      "citation_source": "EFSA Opinion on Parabens in Food",
      "citation_url": "https://www.efsa.europa.eu/en/efsajournal/pub/83",
      "aliases": ["propyl paraben", "e216", "e217"]
    },
    "carrageenan": {
      "risk_level": "MODERATE",
      "function": "Polysaccharide Thickener & Stabilizer",
      "health_impact": "Triggers TLR4 innate immune pathway, tight-junction intestinal permeability, and colonic inflammation.",
      "regulatory_status": "🇺🇸 USA: Legal (Barred from Organic in EU infant formula) | 🇪🇺 EU: Restricted",
      "verdict": "CAUTION. Known gastrointestinal inflammatory trigger.",
      "citation_source": "Environmental Health Perspectives: Review of Carrageenan",
      "citation_url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1240459/",
      "aliases": ["degraded carrageenan", "e407"]
    },
    "polysorbate 80": {
      "risk_level": "MODERATE",
      "function": "Synthetic Surfactant Emulsifier",
      "health_impact": "Erodes intestinal mucosal barrier, alters microbiome composition, and promotes low-grade metabolic endotoxemia.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: E433",
      "verdict": "CAUTION. Gut mucus barrier disruptor.",
      "citation_source": "Nature: Dietary Emulsifiers Impact the Mouse Gut Microbiota",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/25731162/",
      "aliases": ["tween 80", "e433"]
    },
    "high fructose corn syrup": {
      "risk_level": "MODERATE",
      "function": "Industrial Sweetener",
      "health_impact": "Bypasses hepatic phosphofructokinase regulation, driving rapid de novo lipogenesis, uric acid elevation, and NAFLD.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: Quota/Isoglucose Restricted",
      "verdict": "AVOID. Primary driver of hepatic insulin resistance.",
      "citation_source": "American Journal of Clinical Nutrition",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/15051594/",
      "aliases": ["hfcs", "high-fructose corn syrup", "hfcs-55", "hfcs-42", "corn syrup solids"]
    },
    "acesulfame potassium": {
      "risk_level": "MODERATE",
      "function": "Artificial Non-Nutritive Sweetener",
      "health_impact": "Disrupts gut bacterial diversity and cephalic phase insulin signaling in metabolic studies.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: E950",
      "verdict": "CAUTION. Synthetic sulfonamide derivative sweetener.",
      "citation_source": "PLOS Medicine: Artificial Sweeteners & Risk",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/35324894/",
      "aliases": ["acesulfame k", "ace-k", "e950"]
    }
  },
  deceptive_ingredients: {
    "citric acid": {
      "risk_level": "LOW/MODERATE",
      "function": "Acidulant & Preservative",
      "origin": "99% Manufactured via Aspergillus niger (black mold) fermentation on corn glucose.",
      "health_impact": "Potential systemic inflammatory reactions in mold-sensitive individuals.",
      "regulatory_status": "🇺🇸 USA: GRAS | 🇪🇺 EU: E330",
      "verdict": "MISLEADING. Industrial mold fermentation, not lemon juice.",
      "citation_source": "NIH: Manufactured Citric Acid & Inflammatory Reactions",
      "citation_url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6097542/",
      "aliases": ["manufactured citric acid", "e330"]
    },
    "ascorbic acid": {
      "risk_level": "LOW",
      "function": "Synthetic Vitamin C Isolate & Preservative",
      "origin": "Synthesized from GMO corn dextrose via hydrogenation and acetone Reichstein process.",
      "health_impact": "Lacks bioflavonoids, tyrosinase, and whole-food Vitamin C complex cofactors.",
      "regulatory_status": "🇺🇸 USA: GRAS | 🇪🇺 EU: E300",
      "verdict": "SYNTHETIC ISOLATE. Not whole-food Vitamin C.",
      "citation_source": "ACS: Reichstein Process Industrial Synthesis",
      "citation_url": "https://www.acs.org/content/acs/en/education/whatischemistry/landmarks/republic-of-science-reichstein.html",
      "aliases": ["sodium ascorbate", "e300"]
    },
    "natural flavors": {
      "risk_level": "UNKNOWN",
      "function": "Proprietary Flavor Complex",
      "origin": "Lab-distilled aromatic chemicals plus up to 80% propylene glycol, BHA, or solvent carriers.",
      "health_impact": "Opaque non-disclosed chemical mixture engineered for hyper-palatability.",
      "regulatory_status": "🇺🇸 USA: 21 CFR 501.22 Loophole",
      "verdict": "OPAQUE. Can hide dozens of undisclosed carrier chemicals.",
      "citation_source": "Code of Federal Regulations Title 21 § 501.22",
      "citation_url": "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/cfrsearch.cfm?fr=501.22",
      "aliases": ["natural flavor", "natural flavoring"]
    },
    "refined seed oils": {
      "risk_level": "MODERATE",
      "function": "Industrial Frying & Emulsion Lipid",
      "origin": "Hexane-solvent extracted, caustic refined, bleached, and high-heat deodorized (RBD) seeds.",
      "health_impact": "Excessive linoleic acid (Omega-6) oxidizes into 4-HNE lipid peroxides linked to mitochondrial dysfunction.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: Legal",
      "verdict": "CAUTION. High-Omega-6 RBD industrial seed oil.",
      "citation_source": "BMJ Open Heart: Omega-6 Linoleic Acid & Coronary Artery Disease",
      "citation_url": "https://openheart.bmj.com/content/5/2/e000898",
      "aliases": ["canola oil", "soybean oil", "vegetable oil", "corn oil", "cottonseed oil", "safflower oil", "sunflower oil"]
    },
    "maltodextrin": {
      "risk_level": "MODERATE",
      "function": "Bulking Agent & Carrier Powder",
      "origin": "Enzymatically hydrolyzed GMO corn, rice, or potato starch.",
      "health_impact": "Glycemic index of 110–136 (higher than table sugar), spiking insulin and promoting E. coli biofilm adhesion.",
      "regulatory_status": "🇺🇸 USA: Classified as Complex Carb (not Sugar)",
      "verdict": "MISLEADING. Spikes blood glucose faster than pure sucrose.",
      "citation_source": "PLOS ONE: Maltodextrin Impairs Cellular Anti-Bacterial Responses",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/23251500/",
      "aliases": ["corn maltodextrin", "resistant maltodextrin"]
    },
    "silicon dioxide": {
      "risk_level": "LOW/MODERATE",
      "function": "Anti-Caking Nanoparticle Agent",
      "origin": "Synthetic fumed or precipitated amorphous silica.",
      "health_impact": "Contains nano-sized silica particles under ongoing EFSA gastrointestinal accumulation review.",
      "regulatory_status": "🇺🇸 USA: Legal (<2%) | 🇪🇺 EU: E551 (Under Re-Evaluation)",
      "verdict": "INDUSTRIAL FLOW AGENT. Check nanoparticle exposure.",
      "citation_source": "EFSA Re-evaluation of Silicon Dioxide (E 551)",
      "citation_url": "https://www.efsa.europa.eu/en/efsajournal/pub/5088",
      "aliases": ["silica", "e551"]
    }
  },
  nutrient_blockers: [
    {
      "pair": ["calcium", "iron"],
      "type": "Divalent Mineral Absorption Blocker",
      "mechanism": "Calcium directly inhibits divalent metal transporter 1 (DMT1), blocking both heme and non-heme iron uptake by up to 50%.",
      "advice": "Separate high-calcium dairy/fortified foods and iron-rich meals by at least 2 hours.",
      "citation_source": "American Journal of Clinical Nutrition",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/21462112/"
    },
    {
      "pair": ["oxalate", "calcium"],
      "type": "Chelation Absorption Blocker",
      "mechanism": "Oxalic acid binds ionized calcium in the gut lumen to form insoluble calcium oxalate crystals.",
      "advice": "Pair raw high-oxalate greens (spinach/beet greens) with steaming or fermenting to improve mineral bioavailability.",
      "citation_source": "American Journal of Clinical Nutrition: Calcium Bioavailability",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/3318357/"
    },
    {
      "pair": ["phytic acid", "zinc"],
      "type": "Phytate Mineral Chelation",
      "mechanism": "Inositol hexaphosphate (phytate) in unfermented bran/legumes chelates zinc and iron into non-absorbable complexes.",
      "advice": "Choose sprouted, soaked, or sourdough-fermented grains to activate endogenous phytase.",
      "citation_source": "Molecular Nutrition & Food Research",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/19708094/"
    },
    {
      "pair": ["caffeine", "iron"],
      "type": "Polyphenol/Tannin Chelation",
      "mechanism": "Chlorogenic acid and tannins bind non-heme iron in the digestive tract, reducing absorption by 60–90%.",
      "advice": "Wait 60 minutes after iron-rich meals before consuming coffee, black tea, or caffeinated beverages.",
      "citation_source": "American Journal of Clinical Nutrition",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/6837473/"
    }
  ]
};

export const SAMPLE_QUOTES = [
  "Let food be thy medicine and medicine be thy food. - Hippocrates",
  "Every time you eat is an opportunity to nourish your body.",
  "Your body is a temple, keep it pure.",
  "Small changes in ingredients lead to big changes in health.",
  "The greatest wealth is health. - Virgil",
  "Take care of your body. It's the only place you have to live. - Jim Rohn",
  "Don't eat anything your great-grandmother wouldn't recognize as food. - Michael Pollan"
];

export const WELLNESS_TIPS = [
  "Tip: A 10-minute walk after meals helps regulate blood sugar levels.",
  "Tip: Hydration is key. Drink a glass of water before every meal.",
  "Tip: Try the 80/20 rule: 80% whole foods, 20% fun foods.",
  "Tip: Combining protein with carbs helps sustain energy longer.",
  "Tip: Strength training twice a week boosts metabolism significantly.",
  "Tip: Mindful eating reduces overeating. Put your fork down between bites."
];

export const LEGAL_DISCLAIMER_TEXT = `
## LEGAL DISCLAIMER & LIABILITY NOTICE

**PRODUCT:** Health-In-Check
**OWNER/AUTHOR:** Chad Willingham

### 1. NO MEDICAL ADVICE
The content, analysis, reports, fitness suggestions, meal plans, and drug interaction checks generated by this application are for **INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY**. 

This system is **NOT** a doctor, nutritionist, pharmacist, or healthcare professional. It is not a substitute for professional medical advice, diagnosis, or treatment. Never disregard professional medical advice or delay in seeking it because of something you have read on this application.

### 2. ACCURACY OF AI ANALYSIS
This system utilizes artificial intelligence (AI) and Optical Character Recognition (OCR) to analyze data. 
*   **Errors May Occur:** The AI may misidentify ingredients, miss allergens, or provide incorrect chemical data due to blur, lighting, or model hallucinations.
*   **Not Exhaustive:** The absence of a warning does not guarantee safety.
*   **Regulatory Variance:** Laws regarding ingredients vary by country; this app may not reflect the specific regulations of your jurisdiction.

### 3. ALLERGIES & DRUG INTERACTIONS
*   **Critical Risk:** You must **ALWAYS** physically verify the ingredient label on the product packaging. Do not rely solely on the app's analysis for allergy management.
*   **Drug Interactions:** The drug interaction checker is a screening tool only. It does not cover all possible drugs, dosages, or biological factors. Consult your pharmacist before combining foods with medication.

### 4. USE AT YOUR OWN RISK & RELEASE OF LIABILITY
By using this application, you explicitly acknowledge and agree that:
1.  You assume full responsibility for any dietary, fitness, or health decisions made based on this data.
2.  **Chad Willingham (The Owner)** and any associated developers or entities are **NOT LIABLE** for any direct, indirect, incidental, consequential, or special damages arising out of or in any way connected with your access to or use of this application.
3.  This includes, but is not limited to, damages for personal injury, allergic reactions, medical complications, wrongful death, or data loss.

### 5. PROPRIETARY RIGHTS
The specific architecture, multi-agent orchestration, and logic flows are the proprietary intellectual property of Chad Willingham. Unauthorized reproduction is prohibited.
`;
