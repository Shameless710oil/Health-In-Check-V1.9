import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BetaFeedbackModal from '../components/BetaFeedbackModal';
import feedbackHandler from '../api/feedback';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

describe('P0 #2: Beta Feedback API & Guest Mode Modal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('api/feedback rejects non-POST requests with 405', async () => {
    const req = { method: 'GET', body: {} };
    const res = createMockRes();
    await feedbackHandler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('api/feedback rejects empty message with 400', async () => {
    const req = { method: 'POST', body: { type: 'BUG', message: '   ' } };
    const res = createMockRes();
    await feedbackHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('api/feedback accepts valid feedback and returns 200 ok', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: { type: 'FEATURE', message: 'Add barcode history export' }
    };
    const res = createMockRes();
    await feedbackHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.id).toBeTruthy();
  });

  it('BetaFeedbackModal submits via /api/feedback in guest mode and shows Received!', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, id: 'fb-1' })
    });
    vi.stubGlobal('fetch', fetchMock);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<BetaFeedbackModal isOpen={true} onClose={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(/Describe what happened/i);
    fireEvent.change(textarea, { target: { value: 'Camera worked great on mobile!' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));

    await waitFor(() => {
      expect(screen.getByText('Received!')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/feedback',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'BUG', message: 'Camera worked great on mobile!' })
      })
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('BetaFeedbackModal displays an inline error when /api/feedback fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' })
    }));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<BetaFeedbackModal isOpen={true} onClose={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(/Describe what happened/i);
    fireEvent.change(textarea, { target: { value: 'Something broke' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit feedback/i)).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
