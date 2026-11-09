import type * as React from "react";
import { ConversationPractice } from "../conversation-practice-panel";
import type { A1CourseCsvRow } from "../a1-mvp-data";
import type { Screen, SettingsState } from "../home-model";

export type ConversationScreenProps = {
  conversationA2Unlocked: boolean;
  conversationCompletedLessonIds: string[];
  conversationSourceRows: A1CourseCsvRow[];
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  settings: SettingsState;
  speak: (text: string, rate?: number, countReplay?: boolean) => void;
  speechSupported: boolean;
};

export function ConversationScreen({
  conversationA2Unlocked,
  conversationCompletedLessonIds,
  conversationSourceRows,
  setScreen,
  settings,
  speak,
  speechSupported,
}: ConversationScreenProps) {
  return (
    <ConversationPractice
      sourceRows={conversationSourceRows}
      completedLessonIds={conversationCompletedLessonIds}
      a2Unlocked={conversationA2Unlocked}
      allowPilotPreview={settings.showAdvancedPilots}
      onSpeak={(text, rate) => speak(text, rate, false)}
      audioAvailable={speechSupported}
      onExit={() => setScreen("home")}
    />
  );
}
