import { describe, it, expect } from 'vitest';
import { PLANS, KNOWLEDGE_BASE } from '../constants';
import { UserTier, RecallFeedItem } from '../types';
import {
  matchKnowledgeBase,
  matchUserAllergies,
  matchRealRecalls,
  buildDeterministicReport
} from '../services/deterministicAnalyzer';

describe('Task 1: Expanded KNOWLEDGE_BASE & Deterministic Pre-Analyzer', () => {
  it('defines all 4 monetization tiers including the $9.99 30-Day Pantry Cleanout Pass', () => {
    expect(PLANS[UserTier.FREE].scansPerDay).toBe(3);
    expect(PLANS[UserTier.PASS].priceValue).toBe(9.99);
    expect(PLANS[UserTier.PASS].scansPerDay).toBe(50);
    expect(PLANS[UserTier.PASS].billingPeriod).toBe('one_time_30d');
    expect(PLANS[UserTier.STANDARD].priceValue).toBe(4.99);
    expect(PLANS[UserTier.ULTRA].priceValue).toBe(19.99);
    expect(Object.keys(KNOWLEDGE_BASE.hazardous_additives).length).toBeGreaterThanOrEqual(18);
    expect(Object.keys(KNOWLEDGE_BASE.deceptive_ingredients).length).toBeGreaterThanOrEqual(6);
    expect(KNOWLEDGE_BASE.nutrient_blockers.length).toBeGreaterThanOrEqual(4);
  });

  it('matches canonical additives, OCR aliases (FD&C Red No. 40, E171, HFCS), deceptive ingredients, and nutrient blockers', () => {
    const res = matchKnowledgeBase([
      'Enriched Flour (Potassium Bromate)',
      'FD&C Red No. 40 (Allura Red)',
      'Titanium Dioxide (E171)',
      'High-Fructose Corn Syrup',
      'Citric Acid',
      'Calcium Carbonate',
      'Reduced Iron'
    ]);
    const names = res.hazards.map(h => h.name.toLowerCase());
    expect(names).toEqual(
      expect.arrayContaining(['potassium bromate', 'red 40', 'titanium dioxide', 'high fructose corn syrup', 'citric acid'])
    );
    const tiO2 = res.hazards.find(h => h.name.toLowerCase() === 'titanium dioxide');
    expect(tiO2?.regulatory_status).toContain('EU: BANNED');
    expect(tiO2?.citation_url).toMatch(/^https:\/\//);
    expect(res.blockers.length).toBeGreaterThanOrEqual(1);
    expect(res.blockers[0].pair).toEqual(['calcium', 'iron']);
  });

  it('flags user allergies and ignores short/generic tokens when matching OpenFDA recalls', () => {
    const warnings = matchUserAllergies(['Whey Protein (Milk)', 'Roasted Peanuts'], 'peanuts, shellfish');
    expect(warnings).toEqual(['Contains declared allergen: Peanuts']);

    const feed: RecallFeedItem[] = [
      {
        id: 'F-001',
        date: 'Oct 15, 2026',
        product_type: 'Food',
        brand_names: 'Acme Bakery Corp',
        hazard: 'Undeclared Peanut allergen in Chocolate Crunch Bar',
        risk_level: 'Critical',
        description: 'Acme Chocolate Crunch Bar 2.5oz recalled due to undeclared peanuts.',
        action_required: 'DO NOT CONSUME.'
      }
    ];
    expect(matchRealRecalls('Water', ['Purified Water'], feed)).toEqual([]);
    const hit = matchRealRecalls('Acme Chocolate Crunch Bar', ['Sugar', 'Cocoa'], feed);
    expect(hit).toHaveLength(1);
    expect(hit[0].source).toBe('Official OpenFDA Enforcement Registry');
  });

  it('builds a complete cited AnalysisReport with deterministic scoring and zero simulated recalls', () => {
    const report = buildDeterministicReport({
      productName: 'Neon Berry Soda',
      ingredients: ['Carbonated Water', 'High Fructose Corn Syrup', 'Red 40', 'Brominated Vegetable Oil'],
      recallFeed: []
    });
    expect(report.product_name).toBe('Neon Berry Soda');
    expect(report.recalls).toEqual([]);
    expect(report.overall_score).toBeLessThan(60);
    expect(report.hazards.length).toBe(3);
  });
});
