"use client";

import { useEffect, useState } from "react";
import { loadVocabularyApplications, type VocabularyApplicationData } from "./vocabulary-application";
import { loadVocabularyPhonetics, validateVocabularyPhonetics, type VocabularyPhoneticsData } from "./vocabulary-phonetics";
import type { VocabularyTargetsData } from "./vocabulary-targets";

export function useVocabularySupplements(activeScreen: boolean, targets: VocabularyTargetsData | null) {
  const [applications, setApplications] = useState<VocabularyApplicationData | null>(null);
  const [applicationError, setApplicationError] = useState("");
  const [phonetics, setPhonetics] = useState<VocabularyPhoneticsData | null>(null);
  const [phoneticError, setPhoneticError] = useState("");

  useEffect(() => {
    if (!activeScreen || !targets || applications) return;
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setApplicationError("");
      loadVocabularyApplications(targets, (input, init) => fetch(input, { ...init, signal: controller.signal }))
        .then((data) => { if (active) setApplications(data); })
        .catch((cause: unknown) => { if (active) setApplicationError(cause instanceof Error ? cause.message : "句子應用資料無法載入；其他練習仍可使用。"); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); controller.abort(); };
  }, [activeScreen, targets, applications]);

  useEffect(() => {
    if (!activeScreen || !targets || phonetics) return;
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPhoneticError("");
      loadVocabularyPhonetics((input, init) => fetch(input, { ...init, signal: controller.signal }))
        .then((data) => {
          if (!active) return;
          const report = validateVocabularyPhonetics(data, targets.entries);
          if (!report.valid) throw new Error(report.errors.join("\n"));
          setPhonetics(data);
        })
        .catch((cause: unknown) => { if (active) setPhoneticError(cause instanceof Error ? cause.message : "KK 候選資料無法載入；文字練習仍可使用。"); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); controller.abort(); };
  }, [activeScreen, targets, phonetics]);

  return { applications, applicationError, phonetics, phoneticError };
}
