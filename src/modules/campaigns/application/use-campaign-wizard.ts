import { useState, useMemo } from "react";
import type { MessageTemplate } from "@/modules/message-templates/domain/message-template";
import {
  ChatRoutingConfig,
  CampaignRecipient,
  validateCampaignName,
  validateCampaignMessage,
  parseImportFile,
  buildCampaignRecipientsFromRows,
} from "../domain/campaign";

export function useCampaignWizard() {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Step 1 state: Mensaje & Plantilla Meta
  const [name, setName] = useState("");
  const [quickMode, setQuickMode] = useState(true);

  const intervalSeconds = quickMode ? 7 : 45;
  const setIntervalSeconds = (_sec: number) => {};
  const [messageText, setMessageText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [templateVariableValues, setTemplateVariableValues] = useState<Record<string, string>>({});

  // Step 2 state: Destinatarios (CSV/Excel)
  const [importedRecipients, setImportedRecipients] = useState<CampaignRecipient[]>([]);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>>([]);
  const [rawRows, setRawRows] = useState<Array<Record<string, string>>>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importSummary, setImportSummary] = useState({ total: 0, valid: 0, invalid: 0 });

  // Step 3 state: Enrutamiento del chat
  const [routingConfig, setRoutingConfig] = useState<ChatRoutingConfig>({
    chatStatus: "closed",
    departmentName: "",
    assignedUserName: "",
    keepAssigned: false,
    delegateToBot: false,
    forceChatUpdate: false,
  });

  // Validations & Pending Indicators
  const nameValidation = useMemo(() => validateCampaignName(name), [name]);

  const step1Pending = !nameValidation.valid || !selectedTemplate;
  const step2Pending = importedRecipients.length === 0 || importSummary.valid === 0;

  const canSubmit = !step1Pending && !step2Pending;

  const handleSelectTemplate = (template: MessageTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setMessageText(template.body);
      const initialVars: Record<string, string> = {};
      if (template.variables && template.variables.length > 0) {
        template.variables.forEach((v) => {
          initialVars[v] = "";
        });
      }
      setTemplateVariableValues(initialVars);
    } else {
      setTemplateVariableValues({});
    }
  };

  const handleUpdateVariableValue = (key: string, value: string) => {
    setTemplateVariableValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    setTemplateVariableValues({});
  };

  const handleProcessFile = async (file: File) => {
    setImportedFile(file);
    const rows = await parseImportFile(file);
    setRawRows(rows);
    setPreviewRows(rows.slice(0, 5));

    const headers = rows.headers || [];
    setCsvHeaders(headers);

    // Auto-mapear variables de la plantilla si existen
    const autoMap: Record<string, string> = {};
    if (selectedTemplate?.variables && selectedTemplate.variables.length > 0) {
      // Detectar columna telefónica para no asignarla por error a variables {{1}}, {{2}}
      const phoneCol =
        headers.find((h) => /number|telefono|phone|celular|movil|numero/i.test(h)) || headers[0];

      const nonPhoneHeaders = headers.filter(
        (h) => h !== phoneCol && !/number|telefono|phone|celular|movil|numero/i.test(h),
      );

      selectedTemplate.variables.forEach((vKey, index) => {
        const match = headers.find((h) => {
          const hLower = h.toLowerCase();
          if (
            vKey === "1" &&
            (hLower.includes("nombre") || hLower.includes("name") || hLower === "1")
          )
            return true;
          if (
            vKey === "2" &&
            (hLower.includes("monto") ||
              hLower.includes("valor") ||
              hLower.includes("precio") ||
              hLower === "2")
          )
            return true;
          return h.toLowerCase() === vKey.toLowerCase();
        });

        if (match) {
          autoMap[vKey] = match;
        } else {
          const fallbackCol = nonPhoneHeaders[index] || headers[index + 1] || headers[0];
          if (fallbackCol) {
            autoMap[vKey] = fallbackCol;
          }
        }
      });
    }
    setColumnMapping(autoMap);

    const { recipients, validCount, invalidCount } = buildCampaignRecipientsFromRows(
      rows,
      undefined,
      autoMap,
    );
    setImportedRecipients(recipients);
    setImportSummary({
      total: rows.length,
      valid: validCount,
      invalid: invalidCount,
    });
  };

  const handleUpdateColumnMapping = (varKey: string, excelHeader: string) => {
    const updated = { ...columnMapping, [varKey]: excelHeader };
    setColumnMapping(updated);

    if (rawRows.length > 0) {
      const { recipients, validCount, invalidCount } = buildCampaignRecipientsFromRows(
        rawRows,
        undefined,
        updated,
      );
      setImportedRecipients(recipients);
      setImportSummary({
        total: rawRows.length,
        valid: validCount,
        invalid: invalidCount,
      });
    }
  };

  const resetWizard = () => {
    setActiveStep(1);
    setName("");
    setQuickMode(true);
    setMessageText("");
    setSelectedTemplate(null);
    setTemplateVariableValues({});
    setImportedRecipients([]);
    setImportedFile(null);
    setPreviewRows([]);
    setRawRows([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setImportSummary({ total: 0, valid: 0, invalid: 0 });
    setRoutingConfig({
      chatStatus: "closed",
      departmentName: "",
      assignedUserName: "",
      keepAssigned: false,
      delegateToBot: false,
      forceChatUpdate: false,
    });
  };

  return {
    activeStep,
    setActiveStep,
    name,
    setName,
    quickMode,
    setQuickMode,
    intervalSeconds,
    setIntervalSeconds,
    messageText,
    setMessageText,
    selectedTemplate,
    setSelectedTemplate,
    templateVariableValues,
    setTemplateVariableValues,
    handleSelectTemplate,
    handleUpdateVariableValue,
    handleClearTemplate,
    importedRecipients,
    importedFile,
    previewRows,
    csvHeaders,
    columnMapping,
    handleUpdateColumnMapping,
    importSummary,
    handleProcessFile,
    routingConfig,
    setRoutingConfig,
    nameValidation,
    step1Pending,
    step2Pending,
    canSubmit,
    resetWizard,
  };
}
