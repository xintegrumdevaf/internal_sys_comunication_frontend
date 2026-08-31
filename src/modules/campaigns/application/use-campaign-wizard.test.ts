import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCampaignWizard } from './use-campaign-wizard';

describe('useCampaignWizard', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCampaignWizard());
    expect(result.current.activeStep).toBe(1);
    expect(result.current.name).toBe('');
    expect(result.current.quickMode).toBe(true);
    expect(result.current.intervalSeconds).toBe(45);
    expect(result.current.step1Pending).toBe(true);
    expect(result.current.step2Pending).toBe(true);
    expect(result.current.canSubmit).toBe(false);
  });

  it('should update campaign name and message text', () => {
    const { result } = renderHook(() => useCampaignWizard());

    act(() => {
      result.current.setName('Campaña Promocional');
      result.current.setMessageText('Hola {{name}}, ¡aprovecha esta oferta!');
    });

    expect(result.current.name).toBe('Campaña Promocional');
    expect(result.current.messageText).toBe('Hola {{name}}, ¡aprovecha esta oferta!');
    expect(result.current.step1Pending).toBe(false);
  });

  it('should allow adding and removing custom contact fields', () => {
    const { result } = renderHook(() => useCampaignWizard());

    act(() => {
      result.current.handleAddCustomField();
    });

    expect(result.current.customFields.length).toBe(1);

    act(() => {
      result.current.handleUpdateCustomField(0, 'codigo', '12345');
    });

    expect(result.current.customFields[0]).toEqual({ key: 'codigo', value: '12345' });

    act(() => {
      result.current.handleRemoveCustomField(0);
    });

    expect(result.current.customFields.length).toBe(0);
  });
});
