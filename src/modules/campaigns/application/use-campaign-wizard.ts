import { useState, useMemo } from 'react';
import type { MessageTemplate } from '@/modules/message-templates/domain/message-template';
import {
  ChatRoutingConfig,
  CampaignRecipient,
  validateCampaignName,
  validateCampaignMessage,
  parseCsvText,
  buildCampaignRecipientsFromRows,
} from '../domain/campaign';

export function useCampaignWizard() {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Step 1 state: Mensaje & Plantilla Meta
  const [name, setName] = useState('');
  const [quickMode, setQuickMode] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(45);
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [templateVariableValues, setTemplateVariableValues] = useState<Record<string, string>>({});

  // Step 2 state: Destinatarios (CSV/Excel)
  const [importedRecipients, setImportedRecipients] = useState<CampaignRecipient[]>([]);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>>([]);
  const [importSummary, setImportSummary] = useState({ total: 0, valid: 0, invalid: 0 });

  // Step 3 state: Enrutamiento del chat
  const [routingConfig, setRoutingConfig] = useState<ChatRoutingConfig>({
    chatStatus: 'closed',
    departmentName: '',
    assignedUserName: '',
    keepAssigned: false,
    delegateToBot: false,
    forceChatUpdate: false,
  });

  // Validations & Pending Indicators
  const nameValidation = useMemo(() => validateCampaignName(name), [name]);
  const messageValidation = useMemo(() => validateCampaignMessage(messageText), [messageText]);

  const step1Pending = !nameValidation.valid || !messageValidation.valid;
  const step2Pending = importedRecipients.length === 0 && !importedFile;

  const canSubmit = !step1Pending && !step2Pending;

  const handleSelectTemplate = (template: MessageTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setMessageText(template.body);
      const initialVars: Record<string, string> = {};
      if (template.variables && template.variables.length > 0) {
        template.variables.forEach((v) => {
          initialVars[v] = '';
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
    const text = await file.text();
    const rows = parseCsvText(text);
    setPreviewRows(rows.slice(0, 5));
    const { recipients, validCount, invalidCount } = buildCampaignRecipientsFromRows(rows);
    setImportedRecipients(recipients);
    setImportSummary({
      total: rows.length,
      valid: validCount,
      invalid: invalidCount,
    });
  };

  const resetWizard = () => {
    setActiveStep(1);
    setName('');
    setQuickMode(true);
    setIntervalSeconds(45);
    setMessageText('');
    setSelectedTemplate(null);
    setTemplateVariableValues({});
    setImportedRecipients([]);
    setImportedFile(null);
    setPreviewRows([]);
    setImportSummary({ total: 0, valid: 0, invalid: 0 });
    setRoutingConfig({
      chatStatus: 'closed',
      departmentName: '',
      assignedUserName: '',
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
    importSummary,
    handleProcessFile,
    routingConfig,
    setRoutingConfig,
    nameValidation,
    messageValidation,
    step1Pending,
    step2Pending,
    canSubmit,
    resetWizard,
  };
}
