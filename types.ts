
export interface Hazard {
  name: string;
  risk_level: string;
  function: string;
  health_impact: string;
  regulatory_status: string;
  verdict: string;
  citation_source: string;
  citation_url: string;
}

export interface PositiveAttribute {
  name: string;
  benefit: string;
  usda_category?: string;
  citation_source?: string;
  citation_url?: string;
}

export interface Substitution {
  name: string;
  reason: string;
  brand_example?: string;
}

export interface NutrientBlocker {
  pair: string[];
  type: string;
  mechanism: string;
  advice: string;
  citation_source: string;
  citation_url: string;
}

export interface DrugInteraction {
  medication: string;
  ingredient: string;
  severity: 'High' | 'Moderate' | 'Low';
  effect: string;
  advice: string;
}

export interface Recall {
  reason: string; // e.g., "Salmonella Contamination"
  date: string;   // e.g., "2023-10-15"
  description: string;
  source: string; // e.g., "FDA" or "Manufacturer"
}

export interface RecallFeedItem {
  id: string;
  date: string;
  product_type: string;
  brand_names: string;
  hazard: string;
  risk_level: 'Critical' | 'High' | 'Moderate';
  description: string;
  action_required: string;
}

export interface AnalysisReport {
  timestamp?: number;
  product_name?: string; // Added product name
  ingredients_detected: string[];
  hazards: Hazard[];
  positives: PositiveAttribute[];
  blockers: NutrientBlocker[];
  substitutions: Substitution[];
  recalls: Recall[]; // New field for recall alerts
  exercise_tip: string; 
  summary: string;
  overall_score: number;
  allergy_warnings?: string[];
  drug_interactions?: DrugInteraction[];
}

export interface HistoryEntry {
  id: string;
  date: number;
  report: AnalysisReport;
}

export enum AppTab {
  SCANNER = 'SCANNER',
  FITNESS = 'FITNESS',
  MEALS = 'MEALS',
  PROFILE = 'PROFILE',
  LOG = 'LOG',
  RECALLS = 'RECALLS'
}

export type HealthGoal = 'General Health' | 'Weight Loss' | 'Muscle Gain' | 'Endurance' | 'Tone & Sculpt';

// --- SAAS / AUTH TYPES ---

export enum UserTier {
  FREE = 'FREE',
  STANDARD = 'STANDARD',
  ULTRA = 'ULTRA'
}

export interface SubscriptionPlan {
  id: UserTier;
  name: string;
  price: string;
  priceValue: number; // for calc
  scansPerDay: number; // -1 for unlimited
  generationsPerDay: number; // Meals/Workouts
  features: string[];
  adFree: boolean;
}

export interface UsageStats {
  date: string; // YYYY-MM-DD
  scansCount: number;
  generationsCount: number;
}

export interface UserProfile {
  // Auth Info
  email: string;
  username: string;
  tier: UserTier;
  
  // Physical Stats
  age: number | '';
  weight: number | ''; 
  height: string; 
  allergies: string; 
  medications: string;
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active';
  goal: HealthGoal;
}

export interface MealRecommendation {
  name: string;
  description: string;
  ingredients: string[];
  calories_approx: number;
  benefits: string;
}

export interface ExerciseStep {
  name: string;
  reps: string;
  focus_area: string; // e.g. "Chest", "Core"
  instructions: string[]; // Step-by-step guide
}

export interface WorkoutRecommendation {
  title: string;
  duration: string;
  difficulty: string;
  exercises: ExerciseStep[];
  motivation: string;
}

// --- NEW TYPES FOR NUTRIENT LOG ---

export interface ParsedIngredients {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snack: string[];
}

export interface DayAnalysis {
  calories_total_approx: number;
  macro_breakdown: {
    protein: string;
    carbs: string;
    fats: string;
  };
  nutrients_received: { name: string; amount: string }[];
  nutrients_missing: { name: string; importance: string }[];
  recommendations: { nutrient: string; food_to_eat: string; reason: string }[];
  overall_quality_score: number; // 0-100
  summary: string;
}

export interface DailyFoodLog {
  date: string; // YYYY-MM-DD
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  waterIntake: number; // Number of cups (8oz)
  parsedIngredients?: ParsedIngredients;
  analysis?: DayAnalysis;
}

// --- PERIODIC REPORTS ---

export enum ReportPeriod {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR'
}

export interface PeriodReport {
  periodType: ReportPeriod;
  dateRange: string;
  score: number;
  summary: string;
  deficiencies: {
    nutrient: string;
    impact: string;
    suggested_foods: string[];
  }[];
  excessive_intake: {
    item: string;
    risk: string;
    advice: string;
  }[];
  key_trends: string[];
}

export enum AppState {
  AUTH = 'AUTH', // New state for login/register
  SUBSCRIPTION = 'SUBSCRIPTION', // New state for upgrade
  LANDING = 'LANDING',
  SCANNING = 'SCANNING',
  PROCESSING = 'PROCESSING',
  REPORT = 'REPORT',
}

export interface KnowledgeBaseItem {
  risk_level: string;
  function?: string;
  origin?: string;
  health_impact: string;
  regulatory_status?: string;
  verdict: string;
  citation_source?: string;
  citation_url?: string;
}

export interface KnowledgeBase {
  hazardous_additives: Record<string, KnowledgeBaseItem>;
  deceptive_ingredients: Record<string, KnowledgeBaseItem>;
  nutrient_blockers: NutrientBlocker[];
}
