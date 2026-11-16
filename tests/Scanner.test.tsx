import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import Scanner, { SAMPLE_GROCERY_PRESETS, compressImageDataUrl } from '../components/Scanner';

describe('Scanner Component', () => {
  it('renders instructions and camera/gallery controls correctly', () => {
    render(<Scanner onScanComplete={vi.fn()} isSubscribed={true} />);
    expect(screen.getByText(/Ingredient Scanner/i)).toBeInTheDocument();
    expect(screen.getByText(/Capture Label \/ QR/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload from Gallery/i)).toBeInTheDocument();
    expect(screen.getByText(/Paste Ingredients or Try Instant Sample/i)).toBeInTheDocument();
  });

  it('triggers immediate structured scan when tapping a 1-tap grocery preset', () => {
    const handleScanStart = vi.fn();
    const handleScanComplete = vi.fn();
    render(
      <Scanner
        onScanStart={handleScanStart}
        onScanComplete={handleScanComplete}
        isSubscribed={true}
      />
    );

    const preset = SAMPLE_GROCERY_PRESETS[0];
    fireEvent.click(screen.getByText(preset.productName));

    expect(handleScanStart).toHaveBeenCalledTimes(1);
    expect(handleScanComplete).toHaveBeenCalledWith(
      '',
      JSON.stringify({ productName: preset.productName, ingredients: preset.ingredients })
    );
  });

  it('allows typing/pasting custom product name and ingredients on mobile', () => {
    const handleScanStart = vi.fn();
    const handleScanComplete = vi.fn();
    render(
      <Scanner
        onScanStart={handleScanStart}
        onScanComplete={handleScanComplete}
        isSubscribed={true}
      />
    );

    fireEvent.click(screen.getByText(/Type or Paste Ingredients Directly/i));
    fireEvent.change(screen.getByLabelText(/Product name/i), {
      target: { value: 'Midnight Soda' }
    });
    fireEvent.change(screen.getByLabelText(/Ingredients list/i), {
      target: { value: 'Carbonated Water, Red 40\nHigh Fructose Corn Syrup' }
    });
    fireEvent.click(screen.getByText(/Analyze Ingredients/i));

    expect(handleScanStart).toHaveBeenCalledTimes(1);
    expect(handleScanComplete).toHaveBeenCalledWith(
      '',
      JSON.stringify({
        productName: 'Midnight Soda',
        ingredients: ['Carbonated Water', 'Red 40', 'High Fructose Corn Syrup']
      })
    );
  });

  it('downscales oversized camera images to max 1280px JPEG quality 0.82', async () => {
    const drawImage = vi.fn();
    const toDataURL = vi.fn(() => 'data:image/jpeg;base64,compressed123');
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toDataURL
    } as unknown as HTMLCanvasElement;

    const origCreateElement = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') return mockCanvas;
      return origCreateElement(tagName);
    }) as any);

    class MockImage {
      width = 4000;
      height = 3000;
      crossOrigin = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_val: string) {
        this.onload?.();
      }
    }
    vi.stubGlobal('Image', MockImage);

    const compressed = await compressImageDataUrl('data:image/jpeg;base64,rawlarge');
    expect(mockCanvas.width).toBe(1280);
    expect(mockCanvas.height).toBe(960);
    expect(drawImage).toHaveBeenCalled();
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.82);
    expect(compressed).toBe('data:image/jpeg;base64,compressed123');

    createSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
