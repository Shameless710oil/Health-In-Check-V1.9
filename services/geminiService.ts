
import { Type, Schema } from "@google/genai";
import { KNOWLEDGE_BASE } from "../constants";
import { AnalysisReport, MealRecommendation, WorkoutRecommendation, UserProfile, DailyFoodLog, DayAnalysis, ParsedIngredients, ReportPeriod, PeriodReport } from "../types";

// Removed Client-side SDK initialization to prevent API Key exposure.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TEXT_MODEL = "gemini-3-flash-preview";
const PRO_MODEL = "gemini-3-pro-preview";

// Helper for non-hook logging
const logAgentAction = (step: string, data?: any) => {
  console.log(`%c[AGENT] %c${step}`, 'color: #22d3ee; font-weight: bold;', '', data || '');
};

/**
 * Calls the secure Vercel Serverless Function to interface with Gemini.
 */
const callAIEndpoint = async (model: string, contents: any, config?: any) => {
  try {
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
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    const data = await response.json();
    // Simulate the structure returned by the SDK's response.text getter
    return { text: data.text };
  } catch (error) {
    console.error("Secure AI Endpoint Call Failed:", error);
    throw error;
  }
};

// --- AGENT 1: OCR & Ingredient Extraction ---
export const runOCRAgent = async (imageBase64: string, localQrData: string | null): Promise<{ ingredients: string[], qrData?: string, productName?: string }> => {
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
      { responseMimeType: "application/json", responseSchema: schema, temperature: 0.1 }
    );

    const result = JSON.parse(response.text || "{}");
    logAgentAction("OCR Extraction Complete", { count: result.ingredients?.length });
    return result;
  } catch (error) {
    logAgentAction("OCR Agent Failed", error);
    throw error;
  }
};

// --- AGENT 2: Analysis Agent ---
export const runAnalysisAgent = async (ingredients: string[], qrData?: string, userProfile?: UserProfile, productName?: string): Promise<AnalysisReport> => {
  logAgentAction("Starting Deep Toxicology Analysis", { ingredients });
  const prompt = `
    You are the Health-In-Check Watchdog Engine.
    Current Simulation Year: 2025/2026.
    
    Orchestrate a food safety report based on these ingredients: ${JSON.stringify(ingredients)}.
    Context:
    - Product: ${productName || "Unknown"}
    - User Profile Goals: ${userProfile?.goal || "General Health"}
    - User Allergies: ${userProfile?.allergies || "None"}
    - User Medications: ${userProfile?.medications || "None"}

    Identify Hazards, Allergies, Drug Interactions, and Recalls.
    CRITICAL: Recalls must be simulated for the window of December 2025 to January 2026.
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
      { responseMimeType: "application/json", responseSchema: schema, temperature: 0.2 }
    );

    const report = JSON.parse(response.text || "{}");
    logAgentAction("Toxicology Report Synthesized", { score: report.overall_score });
    return report;
  } catch (error) {
    logAgentAction("Analysis Agent Failed", error);
    throw error;
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

// --- AGENT: PERIOD SUMMARY ---
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
                suggested_foods: { type: Type.ARRAY, items: { type: Type.STRING }}
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
        key_trends: { type: Type.ARRAY, items: { type: Type.STRING }}
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
