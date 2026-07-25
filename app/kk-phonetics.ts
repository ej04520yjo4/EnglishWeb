import kkAudioAttribution from "../public/data/kk-audio-attribution.json" with { type: "json" };

type KkAudioAttribution = {
  id: string;
  localPath: string;
  remoteUrl: string;
  sourceFile: string;
  sourcePage: string;
  author: string;
  license: string;
  licenseUrl: string | null;
};

export type KkPhoneticEntry = {
  audioId: string;
  audioSrc: string;
  symbol: string;
  example: string;
  translation: string;
  tip: string;
  sourcePage: string;
  author: string;
  license: string;
  licenseUrl: string | null;
};

export type KkPhoneticGroup = {
  id: "vowels" | "consonants";
  title: string;
  subtitle: string;
  entries: KkPhoneticEntry[];
};

type KkPhoneticContent = Pick<
  KkPhoneticEntry,
  "audioId" | "symbol" | "example" | "translation" | "tip"
>;

const audioSources = new Map(
  (kkAudioAttribution as KkAudioAttribution[]).map((source) => [source.id, source]),
);

const withAudio = (entry: KkPhoneticContent): KkPhoneticEntry => {
  const source = audioSources.get(entry.audioId);
  if (!source) {
    throw new Error(`Missing KK audio source: ${entry.audioId}`);
  }
  return {
    ...entry,
    audioSrc: source.localPath || source.remoteUrl,
    sourcePage: source.sourcePage,
    author: source.author,
    license: source.license,
    licenseUrl: source.licenseUrl,
  };
};

const vowels: KkPhoneticEntry[] = [
  { audioId: "vowel-i", symbol: "i", example: "see", translation: "看見", tip: "嘴角向兩側，聲音長而緊。" },
  { audioId: "vowel-small-i", symbol: "ɪ", example: "sit", translation: "坐", tip: "短促、放鬆，不要拉成長音。" },
  { audioId: "vowel-e", symbol: "e", example: "say", translation: "說", tip: "聲音由前方母音滑向較輕的尾音。" },
  { audioId: "vowel-epsilon", symbol: "ɛ", example: "bed", translation: "床", tip: "嘴巴半開，舌位在前方。" },
  { audioId: "vowel-ash", symbol: "æ", example: "cat", translation: "貓", tip: "嘴巴張較大，舌位低而前。" },
  { audioId: "vowel-script-a", symbol: "ɑ", example: "hot", translation: "熱的", tip: "嘴巴張開，舌位低而後。" },
  { audioId: "vowel-open-o", symbol: "ɔ", example: "law", translation: "法律", tip: "嘴唇微圓，聲音在口腔後方。" },
  { audioId: "vowel-o", symbol: "o", example: "go", translation: "去", tip: "嘴唇先圓，再自然收小。" },
  { audioId: "vowel-upsilon", symbol: "ʊ", example: "book", translation: "書", tip: "短促、放鬆，嘴唇稍微收圓。" },
  { audioId: "vowel-u", symbol: "u", example: "food", translation: "食物", tip: "嘴唇收圓，聲音較長。" },
  { audioId: "vowel-wedge", symbol: "ʌ", example: "cup", translation: "杯子", tip: "嘴巴自然半開，聲音短促。" },
  { audioId: "vowel-schwa", symbol: "ə", example: "about", translation: "關於", tip: "非重讀音節常見，念得輕而短。" },
  { audioId: "vowel-r-colored-stressed", symbol: "ɝ", example: "bird", translation: "鳥", tip: "重讀的美式捲舌母音；單獨聽時與 ɚ 很接近，主要差別在重音。" },
  { audioId: "vowel-r-colored-unstressed", symbol: "ɚ", example: "teacher", translation: "老師", tip: "非重讀的美式捲舌母音；放進單字時會比 ɝ 更輕、更短。" },
  { audioId: "vowel-ai", symbol: "aɪ", example: "my", translation: "我的", tip: "由張口音滑向較收的前母音。" },
  { audioId: "vowel-au", symbol: "aʊ", example: "now", translation: "現在", tip: "由張口音滑向圓唇尾音。" },
  { audioId: "vowel-oi", symbol: "ɔɪ", example: "boy", translation: "男孩", tip: "由後方圓唇音滑向前母音。" },
].map(withAudio);

const consonants: KkPhoneticEntry[] = [
  { audioId: "consonant-p", symbol: "p", example: "pen", translation: "筆", tip: "雙唇閉合後送氣，不振動聲帶。" },
  { audioId: "consonant-b", symbol: "b", example: "bad", translation: "壞的", tip: "雙唇閉合後放開，聲帶要振動。" },
  { audioId: "consonant-t", symbol: "t", example: "tea", translation: "茶", tip: "舌尖碰上齒齦後送氣。" },
  { audioId: "consonant-d", symbol: "d", example: "dog", translation: "狗", tip: "舌尖碰上齒齦，聲帶要振動。" },
  { audioId: "consonant-k", symbol: "k", example: "cat", translation: "貓", tip: "舌根阻住氣流後放開。" },
  { audioId: "consonant-g", symbol: "g", example: "go", translation: "去", tip: "舌根阻住氣流後放開，聲帶振動。" },
  { audioId: "consonant-f", symbol: "f", example: "fan", translation: "扇子", tip: "上排牙齒輕碰下唇並送氣。" },
  { audioId: "consonant-v", symbol: "v", example: "van", translation: "廂型車", tip: "口型和 f 相同，但聲帶要振動。" },
  { audioId: "consonant-theta", symbol: "θ", example: "think", translation: "想", tip: "舌尖輕放上下牙間，送氣不振動。" },
  { audioId: "consonant-eth", symbol: "ð", example: "this", translation: "這個", tip: "舌尖輕放上下牙間，聲帶要振動。" },
  { audioId: "consonant-s", symbol: "s", example: "see", translation: "看見", tip: "舌尖靠近齒齦，讓氣流持續通過。" },
  { audioId: "consonant-z", symbol: "z", example: "zoo", translation: "動物園", tip: "口型和 s 相同，但聲帶要振動。" },
  { audioId: "consonant-esh", symbol: "ʃ", example: "she", translation: "她", tip: "嘴唇稍圓，發出較厚的無聲摩擦音。" },
  { audioId: "consonant-ezh", symbol: "ʒ", example: "vision", translation: "視覺", tip: "口型和 sh 相近，但聲帶要振動。" },
  { audioId: "consonant-h", symbol: "h", example: "hat", translation: "帽子", tip: "喉部放鬆，直接呼出氣流。" },
  { audioId: "consonant-ch", symbol: "tʃ", example: "chair", translation: "椅子", tip: "先阻住氣流，再接 sh 的送氣聲。" },
  { audioId: "consonant-j", symbol: "dʒ", example: "job", translation: "工作", tip: "口型和 ch 相近，但聲帶要振動。" },
  { audioId: "consonant-m", symbol: "m", example: "man", translation: "男人", tip: "雙唇閉合，聲音從鼻腔出來。" },
  { audioId: "consonant-n", symbol: "n", example: "name", translation: "名字", tip: "舌尖碰齒齦，聲音從鼻腔出來。" },
  { audioId: "consonant-eng", symbol: "ŋ", example: "sing", translation: "唱歌", tip: "舌根抬起，聲音從鼻腔出來。" },
  { audioId: "consonant-l", symbol: "l", example: "leg", translation: "腿", tip: "舌尖碰上齒齦，氣流從舌側通過。" },
  { audioId: "consonant-r", symbol: "r", example: "red", translation: "紅色", tip: "舌尖向後靠但不碰上顎，保持美式 r 的捲舌感。" },
  { audioId: "consonant-y", symbol: "j", example: "yes", translation: "是的", tip: "像快速滑過的短 i 音。" },
  { audioId: "consonant-w", symbol: "w", example: "we", translation: "我們", tip: "嘴唇先收圓，再快速滑向後面的母音。" },
].map(withAudio);

export const kkPhoneticGroups: KkPhoneticGroup[] = [
  {
    id: "vowels",
    title: "母音 Vowels",
    subtitle: "17 個常用 KK 母音；播放鍵只播放音標聲音，例字不會被朗讀。",
    entries: vowels,
  },
  {
    id: "consonants",
    title: "子音 Consonants",
    subtitle: "24 個常用 KK 子音；短促子音的開源樣本可能搭配載音，並非朗讀例字。",
    entries: consonants,
  },
];
