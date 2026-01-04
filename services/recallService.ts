import { RecallFeedItem } from '../types';

/**
 * Service to fetch real-time food recall data from the OpenFDA API.
 * API Documentation: https://open.fda.gov/apis/food/enforcement/
 */

const OPENFDA_API_URL = 'https://api.fda.gov/food/enforcement.json';

interface FDAOpenFDA {
  // Add specific openfda fields if needed
}

interface FDARecallResult {
  recall_number: string;
  reason_for_recall: string;
  status: string;
  distribution_pattern: string;
  product_quantity: string;
  recall_initiation_date: string; // YYYYMMDD
  state: string;
  event_id: string;
  product_type: string;
  product_description: string;
  country: string;
  city: string;
  recalling_firm: string;
  report_date: string; // YYYYMMDD
  classification: string; // "Class I", "Class II", "Class III"
  openfda: FDAOpenFDA;
}

interface FDAApiResponse {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: FDARecallResult[];
}

/**
 * Formats a YYYYMMDD string to a readable date (e.g., "Oct 15, 2023").
 */
const formatFDADate = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  // Note: Month is 0-indexed in JS Date
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Determines the risk level based on FDA classification.
 * Class I = Critical (Serious adverse health consequences or death)
 * Class II = High (Temporary or medically reversible adverse health consequences)
 * Class III = Moderate (Not likely to cause adverse health consequences)
 */
const mapClassificationToRisk = (classification: string): 'Critical' | 'High' | 'Moderate' => {
  if (classification.includes('Class I') && !classification.includes('Class II') && !classification.includes('Class III')) {
    return 'Critical';
  }
  if (classification.includes('Class II')) {
    return 'High';
  }
  return 'Moderate';
};

/**
 * Generates actionable advice based on the recall reason and classification.
 */
const generateAction = (reason: string, classification: string): string => {
    const risk = mapClassificationToRisk(classification);

    if (risk === 'Critical') {
        return "DO NOT CONSUME. Return to place of purchase immediately for a full refund. This product poses a serious health risk.";
    } else if (risk === 'High') {
        return "Discard product or return to store. Do not consume if you are pregnant, elderly, or immunocompromised.";
    } else {
        return "Check batch codes. Return if matching affected lot numbers.";
    }
};

/**
 * Fetches the latest food recalls from the FDA.
 * Defaults to the last 6 months of data to ensure relevance.
 */
export const fetchRealRecalls = async (limit: number = 10): Promise<RecallFeedItem[]> => {
  try {
    // Calculate date 6 months ago for the query
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const formatDateForQuery = (d: Date) => d.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateQuery = `report_date:[${formatDateForQuery(sixMonthsAgo)} TO ${formatDateForQuery(today)}]`;

    // Query: Food products, sorted by report_date descending
    // We prioritize Class I and Class II recalls for safety
    const query = `product_type:"Food" AND ${dateQuery}`;
    const sort = `report_date:desc`;

    const url = `${OPENFDA_API_URL}?search=${encodeURIComponent(query)}&sort=${sort}&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`FDA API Error: ${response.statusText}`);
    }

    const data: FDAApiResponse = await response.json();

    return data.results.map((item) => ({
      id: item.recall_number,
      date: formatFDADate(item.report_date),
      product_type: 'Food', // Hardcoded as we filtered for it
      brand_names: item.recalling_firm, // Using recalling firm as brand proxy
      hazard: item.reason_for_recall,
      risk_level: mapClassificationToRisk(item.classification),
      description: item.product_description,
      action_required: generateAction(item.reason_for_recall, item.classification)
    }));

  } catch (error) {
    console.error("Failed to fetch real recalls:", error);
    // Return empty array instead of throwing to prevent crashing the UI
    return [];
  }
};
