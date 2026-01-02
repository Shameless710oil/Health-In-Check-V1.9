
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
    features: [
      "Basic Ingredient Analysis",
      "3 Scans per day",
      "1 Meal/Workout Idea per day",
      "Contains Ads"
    ]
  },
  [UserTier.STANDARD]: {
    id: UserTier.STANDARD,
    name: "Standard",
    price: "$4.99/mo",
    priceValue: 4.99,
    scansPerDay: 20,
    generationsPerDay: 10,
    adFree: true,
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
    features: [
      "Unlimited Scans & Analysis",
      "Unlimited AI Generations",
      "Priority Processing",
      "Advanced Toxicology Reports",
      "Early Access to New Features"
    ]
  }
};

// Sourced from the provided project audit files
export const KNOWLEDGE_BASE: KnowledgeBase = {
  hazardous_additives: {
    "potassium bromate": {
      "risk_level": "CRITICAL",
      "function": "Dough Conditioner",
      "health_impact": "Class 2B Carcinogen. Linked to kidney damage and cancer.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: BANNED | 🇨🇳 China: BANNED",
      "verdict": "AVOID. Banned in almost every industrialized nation.",
      "citation_source": "IARC Monograph Vol. 73",
      "citation_url": "https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono73-17.pdf"
    },
    "azodicarbonamide": {
      "risk_level": "HIGH",
      "function": "Bleaching Agent",
      "health_impact": "Respiratory issues/Asthma. Breaks down into semicarbazide (carcinogen).",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: BANNED | 🇦🇺 Aus: BANNED",
      "verdict": "AVOID. Industrial chemical (Yoga Mats).",
      "citation_source": "EFSA Journal 2005",
      "citation_url": "https://efsa.onlinelibrary.wiley.com/doi/abs/10.2903/j.efsa.2005.236"
    },
    "bha": {
      "risk_level": "MODERATE",
      "function": "Preservative",
      "health_impact": "Reasonably anticipated to be a human carcinogen (NTP).",
      "regulatory_status": "🇺🇸 USA: GRAS | 🇪🇺 EU: Restricted",
      "verdict": "CAUTION. Endocrine disruptor.",
      "citation_source": "National Toxicology Program (Report 15)",
      "citation_url": "https://ntp.niehs.nih.gov/ntp/roc/content/profiles/butylatedhydroxyanisole.pdf"
    },
    "bht": {
      "risk_level": "MODERATE",
      "function": "Preservative",
      "health_impact": "Liver stress and thyroid changes in animal studies.",
      "regulatory_status": "🇺🇸 USA: GRAS | 🇪🇺 EU: Restricted",
      "verdict": "CAUTION. Petroleum-derived.",
      "citation_source": "EFSA Scientific Opinion",
      "citation_url": "https://www.efsa.europa.eu/en/efsajournal/pub/2588"
    },
    "red 40": {
      "risk_level": "MODERATE",
      "function": "Synthetic Dye",
      "health_impact": "Linked to hyperactivity (ADHD) and benzidine contamination.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: Warning Label Required",
      "verdict": "CAUTION. Cosmetic risk.",
      "citation_source": "Center for Science in the Public Interest",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/23026007/"
    },
    "yellow 5": {
      "risk_level": "MODERATE",
      "function": "Synthetic Dye",
      "health_impact": "High allergen risk. Linked to DNA damage in high doses.",
      "regulatory_status": "🇺🇸 USA: Legal | 🇪🇺 EU: Warning Label Required",
      "verdict": "CAUTION.",
      "citation_source": "PubMed: Genotoxicity of Tartrazine",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/29149841/"
    },
    "brominated vegetable oil": {
      "risk_level": "CRITICAL",
      "function": "Emulsifier",
      "health_impact": "Bromine toxicity (Memory loss, skin lesions).",
      "regulatory_status": "🇺🇸 USA: Revoked (2024) | 🇪🇺 EU: BANNED",
      "verdict": "DANGEROUS. Flame retardant chemical.",
      "citation_source": "FDA Revocation Rule 2023",
      "citation_url": "https://www.fda.gov/food/food-additives-petitions/brominated-vegetable-oil-bvo"
    }
  },
  deceptive_ingredients: {
    "citric acid": {
      "risk_level": "LOW/MODERATE",
      "function": "Preservative",
      "origin": "99% Bio-Synthetic (Black Mold fermentation).",
      "health_impact": "Potential inflammatory reactions in sensitive individuals.",
      "verdict": "MISLEADING. Not from fruit.",
      "citation_source": "NIH: Aspergillus niger production",
      "citation_url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6097542/"
    },
    "ascorbic acid": {
      "risk_level": "LOW",
      "function": "Vitamin C",
      "origin": "Synthetic. Derived from GMO Corn starch.",
      "health_impact": "Lacks whole-food co-factors.",
      "verdict": "SYNTHETIC ISOLATE.",
      "citation_source": "Industrial Synthesis of Vitamin C",
      "citation_url": "https://www.acs.org/content/acs/en/education/whatischemistry/landmarks/republic-of-science-reichstein.html"
    },
    "natural flavors": {
      "risk_level": "UNKNOWN",
      "function": "Flavor",
      "origin": "Lab extracts + incidental additives.",
      "health_impact": "Hidden composition.",
      "verdict": "OPAQUE.",
      "citation_source": "Code of Federal Regulations 21",
      "citation_url": "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/cfrsearch.cfm?fr=501.22"
    }
  },
  nutrient_blockers: [
    {
      "pair": ["calcium", "iron"],
      "type": "Absorption Blocker",
      "mechanism": "Calcium competes with Iron for absorption channels.",
      "advice": "Separate dairy and iron-rich meats.",
      "citation_source": "Am. Journal of Clinical Nutrition",
      "citation_url": "https://pubmed.ncbi.nlm.nih.gov/21462112/"
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
