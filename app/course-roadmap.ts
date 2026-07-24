export type CefrLevelPlan = {
  code: "A2" | "B1" | "B2" | "C1" | "C2";
  name: string;
  role: string;
  accent: string;
  unlock: string;
  canDo: string;
  lessonModel: string;
  sentenceWords: string;
  passageSentences: string;
  promptPolicy: string;
  audioPolicy: string;
  knowledgeRatio: string;
  grammarFocus: string[];
  units: string[];
};

export const advancedCoursePlans: CefrLevelPlan[] = [
  {
    code: "A2",
    name: "基礎溝通",
    role: "把 A1 的短句延伸成日常情境中的簡單對話與短文。",
    accent: "#e89d3d",
    unlock: "通過 A1 程度總測驗（85%）",
    canDo: "能處理購物、交通、工作、健康等熟悉情境，簡單描述過去經驗與近期計畫。",
    lessonModel: "8 單元 × 4 課；每課 1–3 句",
    sentenceWords: "約 5–12 詞",
    passageSentences: "2–4 句",
    promptPolicy: "保留完整繁中翻譯，逐步減少逐字對應提示。",
    audioPolicy: "正常速度約 90%，保留慢速與語塊重播。",
    knowledgeRatio: "約 65% 複習／25% 新知／10% 延伸",
    grammarFocus: ["一般過去式", "未來表達", "比較級", "頻率副詞", "簡單連接詞", "可數與不可數名詞"],
    units: [
      "過去經驗與週末活動",
      "未來計畫與約會",
      "購物、價格與服務",
      "旅行、交通與住宿",
      "健康、症狀與就醫",
      "工作與職場日常",
      "日常問題與解決方式",
      "A2 整合對話與短文",
    ],
  },
  {
    code: "B1",
    name: "獨立運用",
    role: "從句子重建進入連貫敘事，練習說明原因、經驗與個人意見。",
    accent: "#4aa88f",
    unlock: "通過 A2 程度總測驗（85%）",
    canDo: "能理解熟悉主題的重點，應付多數旅行情境，並以連貫文字描述經驗、目標與理由。",
    lessonModel: "8 單元 × 4 課；每課 2–4 句",
    sentenceWords: "約 8–16 詞",
    passageSentences: "3–6 句",
    promptPolicy: "改用句意與關鍵詞提示，降低逐字中文提示比例。",
    audioPolicy: "正常速度約 95%，加入自然連讀與短對話。",
    knowledgeRatio: "約 60% 複習／30% 新知／10% 延伸",
    grammarFocus: ["現在完成式", "過去進行式", "第一條件句", "關係子句入門", "情態動詞", "原因與結果"],
    units: [
      "經驗、回憶與故事順序",
      "目標、希望與個人計畫",
      "意見、理由與簡單論證",
      "工作與學習中的溝通",
      "旅行突發狀況與協調",
      "媒體、科技與日常使用",
      "人際關係與社會生活",
      "B1 整合敘事文章",
    ],
  },
  {
    code: "B2",
    name: "流暢互動",
    role: "建立複合句、觀點比較與較自然的互動速度。",
    accent: "#5889c7",
    unlock: "通過 B1 程度總測驗（85%）",
    canDo: "能理解具體及抽象主題的複雜文章重點，流暢互動，並清楚說明觀點的優缺點。",
    lessonModel: "8 單元 × 4 課；每課 3–5 句",
    sentenceWords: "約 10–22 詞",
    passageSentences: "4–8 句",
    promptPolicy: "主要提供情境摘要；只有困難語塊保留繁中提示。",
    audioPolicy: "自然速度 100%，加入語調、弱化與跨句連音。",
    knowledgeRatio: "約 55% 複習／35% 新知／10% 延伸",
    grammarFocus: ["第二條件句", "被動語態", "間接引語", "完成進行式", "進階關係子句", "讓步與對比"],
    units: [
      "深入表達觀點與立場",
      "比較方案、優點與缺點",
      "職場專業溝通與回饋",
      "新聞與公共議題",
      "文化差異與跨文化交流",
      "科技、環境與社會影響",
      "提案、簡報與協商",
      "B2 整合評論文章",
    ],
  },
  {
    code: "C1",
    name: "進階表達",
    role: "練習長篇資訊整合、隱含語意與學術／專業語域。",
    accent: "#8069bd",
    unlock: "通過 B2 程度總測驗（85%）",
    canDo: "能理解較長且要求高的文本及隱含意義，流暢表達，並產出結構清楚的複雜內容。",
    lessonModel: "8 單元 × 4 課；每課 4–7 句",
    sentenceWords: "約 12–28 詞",
    passageSentences: "6–12 句",
    promptPolicy: "以繁中摘要、任務目標與少量關鍵詞取代逐句翻譯。",
    audioPolicy: "自然速度 100%，加入講座、訪談與不同正式程度。",
    knowledgeRatio: "約 50% 複習／40% 新知／10% 延伸",
    grammarFocus: ["倒裝與強調", "名詞化", "複雜從句", "篇章連接", "推論與保留語氣", "語域控制"],
    units: [
      "抽象概念與精準定義",
      "學術文章閱讀與摘要",
      "專業報告與正式寫作",
      "隱含語意、立場與語氣",
      "辯論、反駁與論證修正",
      "跨文化修辭與溝通",
      "複雜資訊整合與轉述",
      "C1 整合專題",
    ],
  },
  {
    code: "C2",
    name: "精熟運用",
    role: "聚焦細微語意、語域切換、即興精準度與複雜文本重構。",
    accent: "#a65c80",
    unlock: "通過 C1 程度總測驗（85%）",
    canDo: "能輕鬆理解幾乎所有聽讀內容，整合不同來源，並以高度流暢且精準的方式表達細微差異。",
    lessonModel: "8 單元 × 4 課；每課 5–10 句",
    sentenceWords: "依文體彈性調整，常見 15–35 詞",
    passageSentences: "8–16 句",
    promptPolicy: "僅提供任務、受眾與語境；繁中翻譯完成後才揭示。",
    audioPolicy: "自然至稍快速度，加入即興談話、修辭與多種語域。",
    knowledgeRatio: "約 45% 複習／45% 新知／10% 延伸",
    grammarFocus: ["細微語氣差異", "高階搭配詞", "修辭結構", "文體轉換", "語用推論", "精準編輯"],
    units: [
      "細微語意與語域選擇",
      "慣用語、高階搭配與韻律",
      "文學、評論與修辭分析",
      "複雜論證的重構與摘要",
      "專業領域的跨文體溝通",
      "即興回應與精準表達",
      "編輯、改寫與風格優化",
      "C2 綜合真實任務",
    ],
  },
];
