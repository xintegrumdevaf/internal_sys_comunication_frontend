import { useState, useMemo } from 'react';
import {
  ChatRoutingConfig,
  ContactCustomField,
  CampaignRecipient,
  validateCampaignName,
  validateCampaignMessage,
  parseCsvText,
  buildCampaignRecipientsFromRows,
} from '../domain/campaign';

export function useCampaignWizard() {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Step 1 state: Mensaje
  const [name, setName] = useState('');
  const [quickMode, setQuickMode] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(45);
  const [messageText, setMessageText] = useState('');

  // Step 2 state: Destinatarios
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

  // Step 4 state: Contacto
  const [tags, setTags] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<ContactCustomField[]>([]);
  const [forceContactUpdate, setForceContactUpdate] = useState(false);

  // Validations & Pending Indicators
  const nameValidation = useMemo(() => validateCampaignName(name), [name]);
  const messageValidation = useMemo(() => validateCampaignMessage(messageText), [messageText]);

  const step1Pending = !nameValidation.valid || !messageValidation.valid;
  const step2Pending = importedRecipients.length === 0 && !importedFile;

  const canSubmit = !step1Pending && !step2Pending;

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

  const handleAddCustomField = () => {
    setCustomFields((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleUpdateCustomField = (index: number, key: string, value: string) => {
    setCustomFields((prev) => {
      const next = [...prev];
      next[index] = { key, value };
      return next;
    });
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const resetWizard = () => {
    setActiveStep(1);
    setName('');
    setQuickMode(true);
    setIntervalSeconds(45);
    setMessageText('');
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
    setTags([]);
    setCustomFields([]);
    setForceContactUpdate(false);
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
    importedRecipients,
    importedFile,
    previewRows,
    importSummary,
    handleProcessFile,
    routingConfig,
    setRoutingConfig,
    tags,
    setTags,
    customFields,
    handleAddCustomField,
    handleUpdateCustomField,
    handleRemoveCustomField,
    forceContactUpdate,
    setForceContactUpdate,
    nameValidation,
    messageValidation,
    step1Pending,
    step2Pending,
    canSubmit,
    resetWizard,
  };
}
