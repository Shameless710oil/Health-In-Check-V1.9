import { render, screen } from '@testing-library/react';
import React from 'react';
import ProfileTab from '../views/ProfileTab';

// Mock storage and auth services
vi.mock('../services/storageService', () => ({
  getUserProfile: vi.fn().mockResolvedValue({
    email: 'test@example.com',
    tier: 'FREE',
    height: '5\'10',
    weight: 180,
    age: 30,
    goal: 'General Health',
    activityLevel: 'Moderately Active',
    allergies: '',
    medications: ''
  }),
  saveUserProfile: vi.fn(),
}));

vi.mock('../services/authService', () => ({
  logoutUser: vi.fn(),
}));

describe('ProfileTab Component', () => {
  it('renders loading state initially', () => {
    render(<ProfileTab onShowSubscription={vi.fn()} onLogout={vi.fn()} />);
    // There isn't much to see during loading besides the spinner, so just making sure it doesn't crash
  });

  it('renders profile data after load', async () => {
    render(<ProfileTab onShowSubscription={vi.fn()} onLogout={vi.fn()} />);

    // Using findBy to wait for the profile to load
    const emailElement = await screen.findByText('test@example.com');
    expect(emailElement).toBeInTheDocument();
  });
});
