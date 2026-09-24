import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePrompts } from "./use-prompts";
import { promptService } from "../infrastructure/prompt.service";

describe("usePrompts hook", () => {
  const mockPromptList = [
    {
      id: "p-1",
      slug: "interpret_message",
      name: "Interpretación NLU",
      description: "Clasifica mensajes",
      allowedVariables: ["message", "departmentContext"],
      activeVersion: {
        id: "v-1",
        versionNumber: 1,
        systemPrompt: "Eres un clasificador NLU",
        userTemplate: "Mensaje: {{message}}",
        modelConfig: { temperature: 0.1 },
        createdAt: "2026-09-23T10:00:00Z",
      },
      versionsCount: 1,
    },
  ];

  const mockDetail = {
    ...mockPromptList[0],
    versions: [mockPromptList[0].activeVersion],
  };

  beforeEach(() => {
    vi.spyOn(promptService, "listPrompts").mockResolvedValue(mockPromptList);
    vi.spyOn(promptService, "getPromptBySlug").mockResolvedValue(mockDetail);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("carga la lista y el detalle del primer prompt automáticamente", async () => {
    const { result } = renderHook(() => usePrompts());

    await waitFor(() => {
      expect(result.current.loadingPrompts).toBe(false);
      expect(result.current.loadingDetail).toBe(false);
    });

    expect(result.current.prompts).toHaveLength(1);
    expect(result.current.selectedSlug).toBe("interpret_message");
    expect(result.current.systemPrompt).toBe("Eres un clasificador NLU");
    expect(result.current.userTemplate).toBe("Mensaje: {{message}}");
    expect(result.current.temperature).toBe(0.1);
  });

  it("permite actualizar variables de prueba e insertar variables en templates", async () => {
    const { result } = renderHook(() => usePrompts());

    await waitFor(() => {
      expect(result.current.selectedSlug).toBe("interpret_message");
      expect(result.current.loadingDetail).toBe(false);
    });

    act(() => {
      result.current.updateTestVariable("message", "Hola, no tengo internet");
      result.current.insertVariable("departmentContext", "user");
    });

    expect(result.current.testVariables["message"]).toBe("Hola, no tengo internet");
    expect(result.current.userTemplate).toContain("{{departmentContext}}");
  });

  it("ejecuta simulate y almacena el resultado", async () => {
    const mockSim = {
      interpolatedSystem: "Eres un clasificador",
      interpolatedUser: "Mensaje: Hola",
      rawResponse: '{"intent":"greeting"}',
      parsedResponse: { intent: "greeting" },
      businessInterpretation: {
        actionBadge: {
          label: "Nueva Solicitud",
          variant: "success" as const,
          description: "Nueva",
        },
        intentTitle: "Cancelación de servicio",
        departmentName: "Soporte Técnico",
        resolutionPath: "Derivación a humano",
        confidencePercent: 95,
        confidenceBadge: "ALTA" as const,
        summary: "El cliente desea cancelar el servicio.",
      },
      isValidJson: true,
      durationMs: 150,
    };
    vi.spyOn(promptService, "simulatePrompt").mockResolvedValue(mockSim);

    const { result } = renderHook(() => usePrompts());
    await waitFor(() => {
      expect(result.current.selectedSlug).toBe("interpret_message");
      expect(result.current.loadingDetail).toBe(false);
    });

    await act(async () => {
      await result.current.simulate();
    });

    expect(result.current.simulationResult).toEqual(mockSim);
    expect(result.current.simulationResult?.businessInterpretation?.intentTitle).toBe(
      "Cancelación de servicio",
    );
    expect(result.current.simulating).toBe(false);
  });

  it("permite guardar una nueva versión", async () => {
    const createSpy = vi.spyOn(promptService, "createVersion").mockResolvedValue({
      id: "v-2",
      versionNumber: 2,
      systemPrompt: "Nuevo prompt",
      userTemplate: "Nuevo template",
      createdAt: "2026-09-23T11:00:00Z",
    });

    const { result } = renderHook(() => usePrompts());
    await waitFor(() => {
      expect(result.current.selectedSlug).toBe("interpret_message");
      expect(result.current.loadingDetail).toBe(false);
    });

    act(() => {
      result.current.setSystemPrompt("Nuevo prompt");
      result.current.setUserTemplate("Nuevo template");
      result.current.setChangeNotes("Ajuste v2");
    });

    let success = false;
    await act(async () => {
      success = await result.current.saveVersion(true);
    });

    expect(success).toBe(true);
    expect(createSpy).toHaveBeenCalledWith("interpret_message", {
      systemPrompt: "Nuevo prompt",
      userTemplate: "Nuevo template",
      changeNotes: "Ajuste v2",
      modelConfig: { temperature: 0.1 },
      publishImmediately: true,
    });
  });
});
