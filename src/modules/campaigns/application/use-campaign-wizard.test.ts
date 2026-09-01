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

  it('should handle selecting, updating variables, and clearing a template', () => {
    const { result } = renderHook(() => useCampaignWizard());

    const mockTemplate = {
      id: 'tpl_test',
      name: 'aviso_cobro',
      category: 'UTILITY' as const,
      language: 'es',
      connectionId: 'default',
      connectionName: 'Línea Oficial WhatsApp',
      status: 'APPROVED' as const,
      body: 'Estimado {{1}}, su factura {{2}} vence hoy.',
      variables: ['1', '2'],
      createdAt: '2026-08-30T10:00:00Z',
    };

    act(() => {
      result.current.handleSelectTemplate(mockTemplate);
    });

    expect(result.current.selectedTemplate).toEqual(mockTemplate);
    expect(result.current.messageText).toBe('Estimado {{1}}, su factura {{2}} vence hoy.');
    expect(result.current.templateVariableValues).toEqual({ '1': '', '2': '' });

    act(() => {
      result.current.handleUpdateVariableValue('1', 'Juan');
      result.current.handleUpdateVariableValue('2', '#9988');
    });

    expect(result.current.templateVariableValues).toEqual({ '1': 'Juan', '2': '#9988' });

    act(() => {
      result.current.handleClearTemplate();
    });

    expect(result.current.selectedTemplate).toBeNull();
    expect(result.current.templateVariableValues).toEqual({});
  });
});
