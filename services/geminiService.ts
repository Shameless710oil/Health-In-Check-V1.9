import { Type, Schema } from "@google/genai";
import {
  AnalysisReport,
  MealRecommendation,
  WorkoutRecommendation,
  UserProfile,
  DailyFoodLog,
  DayAnalysis,
  ParsedIngredients,
  ReportPeriod,
  PeriodReport,
  Hazard
} from "../types";
import { fetchRealRecalls } from "./recallService";
import { buildDeterministicReport } from "./deterministicAnalyzer";

export const TEXT_MODEL = "gemini-2.5-flash";
export const PRO_MODEL = "gemini-2.5-pro";

const logAgentAction = (step: string, data?: any) => {
  console.log(`%c[AGENT] %c${step}`, 'color: #22d3ee; font-weight: bold;', '', data || '');
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calls the secure Vercel Serverless Function to interface with Gemini, with exponential backoff.
 */
const callAIEndpoint = async (model: string, contents: any, config?: any, maxRetries = 3) => {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          contents,
          config
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(errorData.error || `Client Error: ${response.status}`);
        }

        throw new Error(errorData.error || `Server Error: ${response.status}`);
      }

      const data = await response.json();
      return { text: data.text };
    } catch (error: any) {
      attempt++;
      console.warn(`[API] Attempt ${attempt} failed:`, error.message);

      if (attempt >= maxRetries || error.name === 'AbortError' || (error.message.startsWith('Client Error') && !error.message.includes('429'))) {
        console.error("Secure AI Endpoint Call Failed completely:", error);
        throw error;
      }

      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      console.log(`[API] Retrying in ${backoffMs}ms...`);
      await wait(backoffMs);
    }
  }
  throw new Error("Max retries reached");
};

// --- AGENT 1: OCR & Ingredient Extraction ---
export const runOCRAgent = async (imageBase64: string, localQrData: string | null): Promise<{ ingredients: string[], qrData?: string, productName?: string }> => {
  if (localQrData) {
    try {
      const parsed = JSON.parse(localQrData);
      if (parsed && Array.isArray(parsed.ingredients)) {
        logAgentAction("Using Structured Ingredient Payload", {
          productName: parsed.productName,
          count: parsed.ingredients.length
        });
        return {
          productName: parsed.productName,
          ingredients: parsed.ingredients,
          qrData: undefined
        };
      }
    } catch {
      // Non-JSON QR string; proceed with image OCR
    }
  }

  logAgentAction("Starting Visual Cortex OCR", { hasQr: !!localQrData });
  const prompt = `
    Analyze this food product image for the Health-In-Check system. 
    1. Identify Product Name.
    2. Extract full ingredients list.
    3. Decode any QR data if present.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      productName: { type: Type.STRING, nullable: true },
      qrData: { type: Type.STRING, nullable: true },
      ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["ingredients"]
  };

  try {
    const response = await callAIEndpoint(
      TEXT_MODEL,
      {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: prompt }
        ]
      },
      { responseMimeType: "application/json", responseSchema: schema, temperature: 0.1 },
      1
    );

    const result = JSON.parse(response.text || "{}");
    logAgentAction("OCR Extraction Complete", { count: result.ingredients?.length });
    return result;
  } catch (error) {
    logAgentAction("OCR Agent Unavailable — Returning Offline Demo Fallback", error);
    return {
      productName: 'Scanned Grocery Item (Offline OCR Demo)',
      ingredients: [
        'Enriched Flour (Potassium Bromate)',
        'High Fructose Corn Syrup',
        'Red 40',
        'BHT',
        'Natural Flavors',
        'Citric Acid'
      ],
      qrData: localQrData || undefined
    };
  }
};

function mergeHazardsWithDeterministic(aiHazards: Hazard[] | undefined, detHazards: Hazard[]): Hazard[] {
  const merged: Hazard[] = [];
  const detMap = new Map<string, Hazard>();
  for (const dh of detHazards) {
    detMap.set(dh.name.toLowerCase(), dh);
  }

  const seen = new Set<string>();
  for (const raw of aiHazards || []) {
    if (!raw || !raw.name) continue;
    const key = raw.name.toLowerCase();
    const matchedDet = detMap.get(key) || detHazards.find(d => key.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(key));
    if (matchedDet) {
      seen.add(matchedDet.name.toLowerCase());
      merged.push({
        name: matchedDet.name,
        risk_level: matchedDet.risk_level || raw.risk_level,
        function: matchedDet.function || raw.function,
        health_impact: raw.health_impact || matchedDet.health_impact,
        regulatory_status: matchedDet.regulatory_status,
        verdict: matchedDet.verdict || raw.verdict,
        citation_source: matchedDet.citation_source,
        citation_url: matchedDet.citation_url
      });
    } else {
      seen.add(key);
      merged.push(raw);
    }
  }

  for (const dh of detHazards) {
    if (!seen.has(dh.name.toLowerCase())) {
      merged.push(dh);
    }
  }

  return merged;
}

// --- AGENT 2: Hybrid Deterministic + AI Toxicology Analysis Agent ---
export const runAnalysisAgent = async (
  ingredients: string[],
  qrData?: string,
  userProfile?: UserProfile,
  productName?: string
): Promise<AnalysisReport> => {
  logAgentAction("Starting Deep Toxicology Analysis", { ingredients });

  // Step 1: Live OpenFDA Recall Feed + Deterministic Pre-Analysis (@food.chem.intel Knowledge Base)
  const liveRecalls = await fetchRealRecalls(20).catch(() => []);
  const deterministicReport = buildDeterministicReport({
    ingredients,
    productName,
    userProfile,
    recallFeed: liveRecalls
  });

  const prompt = `
    You are the @food.chem.intel // Health-In-Check Watchdog Engine.
    
    Orchestrate an evidence-based food toxicology report for these ingredients: ${JSON.stringify(ingredients)}.
    Context:
    - Product: ${productName || "Scanned Food Product"}
    - User Profile Goals: ${userProfile?.goal || "General Health"}
    - User Allergies: ${userProfile?.allergies || "None"}
    - User Medications: ${userProfile?.medications || "None"}
    - Verified @food.chem.intel Database Matches: ${JSON.stringify(deterministicReport.hazards)}
    - Verified Live OpenFDA Recall Matches: ${JSON.stringify(deterministicReport.recalls)}

    Rules:
    1. Use the Verified @food.chem.intel Database Matches as ground truth for hazards and regulatory status.
    2. Never fabricate or simulate FDA recalls — only report verified recalls from the provided OpenFDA list.
    3. Identify any additional hazardous additives, allergy warnings, drug-food interactions, nutrient blockers, and clean-label brand substitutions.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      product_name: { type: Type.STRING },
      ingredients_detected: { type: Type.ARRAY, items: { type: Type.STRING } },
      allergy_warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
      drug_interactions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            medication: { type: Type.STRING },
            ingredient: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ["High", "Moderate", "Low"] },
            effect: { type: Type.STRING },
            advice: { type: Type.STRING }
          }
        }
      },
      recalls: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            reason: { type: Type.STRING },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            source: { type: Type.STRING }
          }
        }
      },
      hazards: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            risk_level: { type: Type.STRING },
            health_impact: { type: Type.STRING },
            verdict: { type: Type.STRING }
          }
        }
      },
      positives: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, benefit: { type: Type.STRING } } } },
      blockers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, mechanism: { type: Type.STRING } } } },
      substitutions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } } } },
      exercise_tip: { type: Type.STRING },
      summary: { type: Type.STRING },
      overall_score: { type: Type.INTEGER }
    },
    required: ["product_name", "hazards", "positives", "summary", "overall_score", "recalls"]
  };

  try {
    const response = await callAIEndpoint(
      PRO_MODEL,
      { text: prompt },
      { responseMimeType: "application/json", responseSchema: schema, temperature: 0.2 },
      1
    );

    const aiReport = JSON.parse(response.text || "{}");
    const mergedHazards = mergeHazardsWithDeterministic(aiReport.hazards, deterministicReport.hazards);
    const mergedAllergies = Array.from(
      new Set([...(deterministicReport.allergy_warnings || []), ...(aiReport.allergy_warnings || [])])
    );

    const finalReport: AnalysisReport = {
      timestamp: Date.now(),
      product_name: aiReport.product_name || deterministicReport.product_name,
      ingredients_detected: aiReport.ingredients_detected?.length ? aiReport.ingredients_detected : ingredients,
      hazards: mergedHazards,
      positives: aiReport.positives?.length ? aiReport.positives : deterministicReport.positives,
      blockers: deterministicReport.blockers.length ? deterministicReport.blockers : (aiReport.blockers || []),
      substitutions: aiReport.substitutions?.length ? aiReport.substitutions : deterministicReport.substitutions,
      // Strictly keep only verified real OpenFDA recalls — never AI-hallucinated recalls
      recalls: deterministicReport.recalls,
      allergy_warnings: mergedAllergies,
      drug_interactions: aiReport.drug_interactions || [],
      exercise_tip: aiReport.exercise_tip || deterministicReport.exercise_tip,
      summary: aiReport.summary || deterministicReport.summary,
      overall_score: typeof aiReport.overall_score === 'number' ? aiReport.overall_score : deterministicReport.overall_score
    };

    logAgentAction("Toxicology Report Synthesized", { score: finalReport.overall_score });
    return finalReport;
  } catch (error) {
    logAgentAction("AI Endpoint Unavailable — Returning Verified Deterministic Report", error);
    return deterministicReport;
  }
};

export const runMealAgent = async (profile: UserProfile): Promise<MealRecommendation> => {
  logAgentAction("Generating Nutritional Recommendation");
  const response = await callAIEndpoint(
    TEXT_MODEL,
    { text: `Suggest healthy meal for ${profile.goal} with allergies ${profile.allergies} for the Health-In-Check app. Format as JSON with name, description, ingredients (array), calories_approx, benefits.` },
    { responseMimeType: "application/json" }
  );
  return JSON.parse(response.text || "{}");
};

export const runFitnessAgent = async (profile: UserProfile): Promise<WorkoutRecommendation> => {
  logAgentAction("Design Workout Routine");
  const prompt = `
    Suggest a workout for a user with the goal: "${profile.goal}".
    Activity Level: ${profile.activityLevel}.
    
    Format as JSON. 
    For each exercise, provide:
    1. Name
    2. Reps/Duration
    3. Focus Area (e.g. Chest, Legs, Cardio)
    4. Instructions: An array of 3-4 short, simple strings explaining how to do the exercise for a beginner.
  `;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      duration: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      motivation: { type: Type.STRING },
      exercises: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            reps: { type: Type.STRING },
            focus_area: { type: Type.STRING },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    },
    required: ["title", "duration", "exercises"]
  };

  const response = await callAIEndpoint(
    TEXT_MODEL,
    { text: prompt },
    { responseMimeType: "application/json", responseSchema: schema }
  );
  return JSON.parse(response.text || "{}");
};

export const runIngredientParserAgent = async (log: DailyFoodLog): Promise<ParsedIngredients> => {
  logAgentAction("Parsing Log Ingredients");
  const response = await callAIEndpoint(
    TEXT_MODEL,
    { text: `Parse ingredients from this meal log: ${JSON.stringify(log)}. Return JSON with breakfast, lunch, dinner, snack arrays for Health-In-Check analysis.` },
    { responseMimeType: "application/json" }
  );
  return JSON.parse(response.text || "{}");
};

export const runNutrientLogAgent = async (log: DailyFoodLog, profile: UserProfile): Promise<DayAnalysis> => {
  logAgentAction("Conducting Intake Synthesis");
  const response = await callAIEndpoint(
    PRO_MODEL,
    { text: `Analyze intake for Health-In-Check: ${JSON.stringify(log)} for goal ${profile.goal}. Return detailed nutritional analysis including macro_breakdown (protein, carbs, fats as strings), nutrients_received, nutrients_missing, recommendations, overall_quality_score, summary. Ensure macro_breakdown object is present.` },
    { responseMimeType: "application/json" }
  );
  return JSON.parse(response.text || "{}");
};

export const runPeriodSummaryAgent = async (logs: DailyFoodLog[], periodType: ReportPeriod, profile: UserProfile): Promise<PeriodReport> => {
  logAgentAction(`Generating ${periodType} Summary`, { logsCount: logs.length });
  
  const prompt = `
    You are the Lead Nutrition Auditor for Health-In-Check.
    Analyze the user's food logs for the past ${periodType}.
    
    User Goal: ${profile.goal}
    Activity Level: ${profile.activityLevel}
    
    Logs Provided: ${JSON.stringify(logs)}
    
    Output a detailed JSON report. 
    CRITICAL: You must identify:
    1. Deficiencies: What nutrients are missing consistently? Suggest specific foods.
    2. Excessive Intake: What is the user eating too much of (sugar, sodium, processed fats)?
    3. Key Trends: Patterns in eating habits.
    4. Score: 0-100 health score for the period.
  `;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      periodType: { type: Type.STRING, enum: [ReportPeriod.WEEK, ReportPeriod.MONTH, ReportPeriod.YEAR] },
      dateRange: { type: Type.STRING },
      score: { type: Type.INTEGER },
      summary: { type: Type.STRING },
      deficiencies: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            nutrient: { type: Type.STRING },
            impact: { type: Type.STRING },
            suggested_foods: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
      excessive_intake: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            item: { type: Type.STRING },
            risk: { type: Type.STRING },
            advice: { type: Type.STRING }
          }
        }
      },
      key_trends: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["periodType", "score", "summary", "deficiencies", "excessive_intake"]
  };

  try {
    const response = await callAIEndpoint(
      PRO_MODEL,
      { text: prompt },
      { responseMimeType: "application/json", responseSchema: schema }
    );
    return JSON.parse(response.text || "{}");
  } catch (error) {
    logAgentAction("Period Summary Agent Failed", error);
    throw error;
  }
};
