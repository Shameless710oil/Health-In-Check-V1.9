import { render, screen, within } from '@testing-library/react';
import React from 'react';
import Report from '../components/Report';
import { AnalysisReport } from '../types';

const mockReport: AnalysisReport = {
  product_name: "Test Protein Bar",
  ingredients_detected: ["Whey", "Sugar"],
  allergy_warnings: [],
  drug_interactions: [],
  recalls: [],
  hazards: [
    { name: "Sugar", risk_level: "High", health_impact: "Spikes insulin", verdict: "Limit intake" }
  ],
  positives: [],
  blockers: [],
  substitutions: [],
  exercise_tip: "Run 5 miles",
  summary: "A decent protein bar.",
  overall_score: 85
};

describe('Report Component', () => {
  it('renders product score correctly', () => {
    render(<Report report={mockReport} onNewScan={vi.fn()} onShowSubscription={vi.fn()} />);

    // Test for something that actually renders like the score and the summary
    expect(screen.getByText(/85/i)).toBeInTheDocument();
    expect(screen.getByText(/A decent protein bar./i)).toBeInTheDocument();
  });

  it('renders hazard elements properly', () => {
    render(<Report report={mockReport} onNewScan={vi.fn()} onShowSubscription={vi.fn()} />);

    expect(screen.getByText(/Spikes insulin/i)).toBeInTheDocument();
  });

  it('renders Ingredients Read From Label card with extracted ingredient pills', () => {
    render(<Report report={mockReport} onNewScan={vi.fn()} onShowSubscription={vi.fn()} />);

    const heading = screen.getByText(/Ingredients Read From Label \(2\)/i);
    expect(heading).toBeInTheDocument();
    const card = heading.closest('div')!;
    expect(within(card).getByText('Whey')).toBeInTheDocument();
    expect(within(card).getByText('Sugar')).toBeInTheDocument();
  });
});
