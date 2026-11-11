import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTelegramSettings } from "../application/use-telegram-settings";
import { TelegramCardHeader, TelegramInactiveBanner } from "./telegram/TelegramCardHeader";
import { TelegramCopilotWebhookSection } from "./telegram/TelegramCopilotWebhookSection";
import { TelegramCredentialsSection } from "./telegram/TelegramCredentialsSection";
import { TelegramDigestSection } from "./telegram/TelegramDigestSection";
import { TelegramOnboardingGuide } from "./telegram/TelegramOnboardingGuide";
import { TelegramSaveFooter } from "./telegram/TelegramSaveFooter";
import { TelegramSentinelRulesSection } from "./telegram/TelegramSentinelRulesSection";
import { TelegramTopicsSection } from "./telegram/TelegramTopicsSection";

export function TelegramSettingsCard() {
  const vm = useTelegramSettings();
  const { settings } = vm;

  if (vm.loading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-3" />
          <span className="text-sm text-muted-foreground">
            Cargando configuración de Telegram...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm relative">
      <TelegramCardHeader
        enabled={settings.enabled}
        saving={vm.saving}
        isDirty={vm.isDirty}
        onToggleEnabled={(checked) => vm.handleFieldChange("enabled", checked)}
        onSave={vm.handleSave}
      />

      <CardContent className="space-y-8">
        {!settings.enabled && (
          <TelegramInactiveBanner onActivate={() => vm.handleFieldChange("enabled", true)} />
        )}

        <TelegramOnboardingGuide
          showGuide={vm.showGuide}
          onToggle={() => vm.setShowGuide(!vm.showGuide)}
        />

        <TelegramCredentialsSection
          settings={settings}
          showToken={vm.showToken}
          sendSampleOnTest={vm.sendSampleOnTest}
          detectingChat={vm.detectingChat}
          testing={vm.testing}
          testResult={vm.testResult}
          onToggleShowToken={() => vm.setShowToken(!vm.showToken)}
          onToggleSampleOnTest={vm.setSendSampleOnTest}
          onChangeField={vm.handleFieldChange}
          onDetectChatId={vm.handleDetectChatId}
          onTestConnection={vm.handleTestConnection}
        />

        <TelegramTopicsSection
          topicsEnabled={Boolean(settings.topicsEnabled)}
          topics={settings.topics || []}
          testingTopicId={vm.testingTopicId}
          onToggleTopicsEnabled={(enabled) => vm.handleFieldChange("topicsEnabled", enabled)}
          onAddTopic={vm.handleAddTopic}
          onUpdateTopic={vm.handleUpdateTopic}
          onDeleteTopic={vm.handleDeleteTopic}
          onResetTopics={vm.handleResetTopics}
          onTestTopic={vm.handleTestTopic}
        />

        <TelegramDigestSection
          digestsEnabled={settings.digestsEnabled}
          digestHours={settings.digestHours}
          timeZone={settings.timeZone}
          defaultChatId={settings.defaultChatId}
          newHourInput={vm.newHourInput}
          sendingDigest={vm.sendingDigest}
          onToggleDigestsEnabled={(checked) => vm.handleFieldChange("digestsEnabled", checked)}
          onChangeNewHour={vm.setNewHourInput}
          onAddDigestHour={vm.handleAddDigestHour}
          onRemoveDigestHour={(hour) =>
            vm.handleFieldChange(
              "digestHours",
              settings.digestHours.filter((h) => h !== hour),
            )
          }
          onChangeTimeZone={(val) => vm.handleFieldChange("timeZone", val)}
          onSendDigestNow={vm.handleSendDigestNow}
        />

        <TelegramSentinelRulesSection
          alertRules={settings.alertRules || []}
          defaultChatId={settings.defaultChatId}
          testingAlerts={vm.testingAlerts}
          testingAlertCategory={vm.testingAlertCategory}
          onAddRule={vm.handleAddRule}
          onUpdateRule={vm.handleUpdateRule}
          onDeleteRule={vm.handleDeleteRule}
          onResetRules={vm.handleResetRules}
          onCheckAlertsNow={vm.handleCheckAlertsNow}
          onTestAlert={vm.handleTestAlert}
        />

        <TelegramCopilotWebhookSection
          commandsEnabled={settings.commandsEnabled}
          aiCopilotEnabled={settings.aiCopilotEnabled}
          hasBotToken={Boolean(settings.botToken)}
          syncingWebhook={vm.syncingWebhook}
          onToggleCommands={(checked) => vm.handleFieldChange("commandsEnabled", checked)}
          onToggleCopilot={(checked) => vm.handleFieldChange("aiCopilotEnabled", checked)}
          onSyncWebhook={vm.handleSyncWebhook}
        />
      </CardContent>

      <TelegramSaveFooter
        isDirty={vm.isDirty}
        saving={vm.saving}
        onSave={vm.handleSave}
        onDiscard={vm.handleDiscard}
      />
    </Card>
  );
}
