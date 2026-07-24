export type KkPhoneticEntry = {
  symbol: string;
  example: string;
  translation: string;
  tip: string;
};

export type KkPhoneticGroup = {
  id: "vowels" | "consonants";
  title: string;
  subtitle: string;
  entries: KkPhoneticEntry[];
};

const vowels: KkPhoneticEntry[] = [
  { symbol: "i", example: "see", translation: "看見", tip: "嘴角向兩側，聲音長而緊。" },
  { symbol: "ɪ", example: "sit", translation: "坐", tip: "短促、放鬆，不要拉成長音。" },
  { symbol: "e", example: "say", translation: "說", tip: "聲音由前方母音滑向較輕的尾音。" },
  { symbol: "ɛ", example: "bed", translation: "床", tip: "嘴巴半開，舌位在前方。" },
  { symbol: "æ", example: "cat", translation: "貓", tip: "嘴巴張較大，舌位低而前。" },
  { symbol: "ɑ", example: "hot", translation: "熱的", tip: "嘴巴張開，舌位低而後。" },
  { symbol: "ɔ", example: "law", translation: "法律", tip: "嘴唇微圓，聲音在口腔後方。" },
  { symbol: "o", example: "go", translation: "去", tip: "嘴唇先圓，再自然收小。" },
  { symbol: "ʊ", example: "book", translation: "書", tip: "短促、放鬆，嘴唇稍微收圓。" },
  { symbol: "u", example: "food", translation: "食物", tip: "嘴唇收圓，聲音較長。" },
  { symbol: "ʌ", example: "cup", translation: "杯子", tip: "嘴巴自然半開，聲音短促。" },
  { symbol: "ə", example: "about", translation: "關於", tip: "非重讀音節常見，念得輕而短。" },
  { symbol: "ɝ", example: "bird", translation: "鳥", tip: "重讀的美式捲舌母音。" },
  { symbol: "ɚ", example: "teacher", translation: "老師", tip: "非重讀的美式捲舌母音，聲音較輕。" },
  { symbol: "aɪ", example: "my", translation: "我的", tip: "由張口音滑向較收的前母音。" },
  { symbol: "aʊ", example: "now", translation: "現在", tip: "由張口音滑向圓唇尾音。" },
  { symbol: "ɔɪ", example: "boy", translation: "男孩", tip: "由後方圓唇音滑向前母音。" },
];

const consonants: KkPhoneticEntry[] = [
  { symbol: "p", example: "pen", translation: "筆", tip: "雙唇閉合後送氣，不振動聲帶。" },
  { symbol: "b", example: "bad", translation: "壞的", tip: "雙唇閉合後放開，聲帶要振動。" },
  { symbol: "t", example: "tea", translation: "茶", tip: "舌尖碰上齒齦後送氣。" },
  { symbol: "d", example: "dog", translation: "狗", tip: "舌尖碰上齒齦，聲帶要振動。" },
  { symbol: "k", example: "cat", translation: "貓", tip: "舌根阻住氣流後放開。" },
  { symbol: "g", example: "go", translation: "去", tip: "舌根阻住氣流後放開，聲帶振動。" },
  { symbol: "f", example: "fan", translation: "扇子", tip: "上排牙齒輕碰下唇並送氣。" },
  { symbol: "v", example: "van", translation: "廂型車", tip: "口型和 f 相同，但聲帶要振動。" },
  { symbol: "θ", example: "think", translation: "想", tip: "舌尖輕放上下牙間，送氣不振動。" },
  { symbol: "ð", example: "this", translation: "這個", tip: "舌尖輕放上下牙間，聲帶要振動。" },
  { symbol: "s", example: "see", translation: "看見", tip: "舌尖靠近齒齦，讓氣流持續通過。" },
  { symbol: "z", example: "zoo", translation: "動物園", tip: "口型和 s 相同，但聲帶要振動。" },
  { symbol: "ʃ", example: "she", translation: "她", tip: "嘴唇稍圓，發出較厚的無聲摩擦音。" },
  { symbol: "ʒ", example: "vision", translation: "視覺", tip: "口型和 sh 相近，但聲帶要振動。" },
  { symbol: "h", example: "hat", translation: "帽子", tip: "喉部放鬆，直接呼出氣流。" },
  { symbol: "tʃ", example: "chair", translation: "椅子", tip: "先阻住氣流，再接 sh 的送氣聲。" },
  { symbol: "dʒ", example: "job", translation: "工作", tip: "口型和 ch 相近，但聲帶要振動。" },
  { symbol: "m", example: "man", translation: "男人", tip: "雙唇閉合，聲音從鼻腔出來。" },
  { symbol: "n", example: "name", translation: "名字", tip: "舌尖碰齒齦，聲音從鼻腔出來。" },
  { symbol: "ŋ", example: "sing", translation: "唱歌", tip: "舌根抬起，聲音從鼻腔出來。" },
  { symbol: "l", example: "leg", translation: "腿", tip: "舌尖碰上齒齦，氣流從舌側通過。" },
  { symbol: "r", example: "red", translation: "紅色", tip: "舌尖向後靠但不碰上顎，保持捲舌感。" },
  { symbol: "j", example: "yes", translation: "是的", tip: "像快速滑過的短 i 音。" },
  { symbol: "w", example: "we", translation: "我們", tip: "嘴唇先收圓，再快速滑向後面的母音。" },
];

export const kkPhoneticGroups: KkPhoneticGroup[] = [
  {
    id: "vowels",
    title: "母音 Vowels",
    subtitle: "17 個常用 KK 母音；注意嘴型、長短與滑音。",
    entries: vowels,
  },
  {
    id: "consonants",
    title: "子音 Consonants",
    subtitle: "24 個常用 KK 子音；注意發音位置、送氣與聲帶振動。",
    entries: consonants,
  },
];
