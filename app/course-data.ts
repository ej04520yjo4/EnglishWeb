export type AudioStatus = "pending" | "fallback" | "ready" | "error";

export type LearningChunk = {
  id: string;
  text: string;
  translation: string;
  order: number;
  note: string;
};

export type LearningToken = {
  id: string;
  tokenId: string;
  occurrenceId: string;
  answer: string;
  prompt: string;
  promptType: "meaning" | "grammar" | "context";
  partOfSpeech: string;
  dictionaryPos: string;
  contextPos: string;
  semanticRole: string;
  lexemeId: string;
  senseId: string;
  kk: string;
  ipa: string;
  ipaStandalone: string;
  ipaInSentence: string;
  syllables: string;
  stress: string;
  lemma: string;
  note: string;
  accepted?: string[];
  chunk?: LearningChunk;
  patternId: string;
  audioMethod: string;
  audioStatus: AudioStatus;
  wordAudioSource: string;
  audioSource: string;
  license: string;
  isNewWord: boolean;
  isNewPattern: boolean;
  isNewCombination: boolean;
  isNewContent: boolean;
  qaStatus: string;
};

export type Lesson = {
  id: string;
  number: number;
  title: string;
  sentence: string;
  translation: string;
  grammar: string;
  minutes: number;
  tokens: LearningToken[];
  passageId: string;
  passageOrder: number;
  sentenceId: string;
  sentenceOrder: number;
  sentencePatternId: string;
  patternName: string;
  patternCefr: string;
  isNewSentencePattern: boolean;
  sentenceAudioSource: string;
  audioStatus: AudioStatus;
  sourceVersion: string;
};

export type CourseUnit = {
  id: string;
  number: number;
  title: string;
  description: string;
  accent: string;
  lessons: Lesson[];
};

export type AlphabetEntry = {
  letter: string;
  kk: string;
  ipa: string;
};

export const alphabet: AlphabetEntry[] = [
  { letter: "A", kk: "/e/", ipa: "/eɪ/" },
  { letter: "B", kk: "/bi/", ipa: "/biː/" },
  { letter: "C", kk: "/si/", ipa: "/siː/" },
  { letter: "D", kk: "/di/", ipa: "/diː/" },
  { letter: "E", kk: "/i/", ipa: "/iː/" },
  { letter: "F", kk: "/ɛf/", ipa: "/ef/" },
  { letter: "G", kk: "/dʒi/", ipa: "/dʒiː/" },
  { letter: "H", kk: "/etʃ/", ipa: "/eɪtʃ/" },
  { letter: "I", kk: "/aɪ/", ipa: "/aɪ/" },
  { letter: "J", kk: "/dʒe/", ipa: "/dʒeɪ/" },
  { letter: "K", kk: "/ke/", ipa: "/keɪ/" },
  { letter: "L", kk: "/ɛl/", ipa: "/el/" },
  { letter: "M", kk: "/ɛm/", ipa: "/em/" },
  { letter: "N", kk: "/ɛn/", ipa: "/en/" },
  { letter: "O", kk: "/o/", ipa: "/oʊ/" },
  { letter: "P", kk: "/pi/", ipa: "/piː/" },
  { letter: "Q", kk: "/kju/", ipa: "/kjuː/" },
  { letter: "R", kk: "/ɑr/", ipa: "/ɑːr/" },
  { letter: "S", kk: "/ɛs/", ipa: "/es/" },
  { letter: "T", kk: "/ti/", ipa: "/tiː/" },
  { letter: "U", kk: "/ju/", ipa: "/juː/" },
  { letter: "V", kk: "/vi/", ipa: "/viː/" },
  { letter: "W", kk: "/ˈdʌbəlju/", ipa: "/ˈdʌbəl.juː/" },
  { letter: "X", kk: "/ɛks/", ipa: "/eks/" },
  { letter: "Y", kk: "/waɪ/", ipa: "/waɪ/" },
  { letter: "Z", kk: "/zi/", ipa: "/ziː/" },
];
