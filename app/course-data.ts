export type LearningToken = {
  id: string;
  answer: string;
  prompt: string;
  partOfSpeech: string;
  kk: string;
  ipa: string;
  syllables?: string;
  stress?: string;
  lemma?: string;
  note?: string;
  accepted?: string[];
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
};

export type CourseUnit = {
  id: string;
  number: number;
  title: string;
  description: string;
  accent: string;
  lessons: Lesson[];
};

const t = (
  id: string,
  answer: string,
  prompt: string,
  partOfSpeech: string,
  kk: string,
  ipa: string,
  options: Partial<LearningToken> = {},
): LearningToken => ({
  id,
  answer,
  prompt,
  partOfSpeech,
  kk,
  ipa,
  ...options,
});

const lesson = (
  id: string,
  number: number,
  title: string,
  sentence: string,
  translation: string,
  grammar: string,
  tokens: LearningToken[],
): Lesson => ({
  id,
  number,
  title,
  sentence,
  translation,
  grammar,
  minutes: Math.max(4, Math.ceil(tokens.length * 1.25)),
  tokens,
});

export const courseUnits: CourseUnit[] = [
  {
    id: "a1-u1",
    number: 1,
    title: "打招呼與自我介紹",
    description: "用最常見的句型介紹自己，並自然地向別人問好。",
    accent: "#f47b5b",
    lessons: [
      lesson(
        "a1-u1-l1",
        1,
        "我是誰",
        "I am Amy.",
        "我是 Amy。",
        "主詞 I 搭配 be 動詞 am",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/", {
            note: "英文的 I 永遠要大寫。",
          }),
          t("am", "am", "是", "verb 動詞", "/æm/", "/æm/", {
            lemma: "be",
            note: "am 只和 I 搭配。",
          }),
          t("amy", "Amy", "Amy（人名）", "proper noun 專有名詞", "/ˈemɪ/", "/ˈeɪ.mi/", {
            syllables: "A・my",
            stress: "第一音節",
          }),
        ],
      ),
      lesson(
        "a1-u1-l2",
        2,
        "我的名字",
        "My name is Ben.",
        "我的名字是 Ben。",
        "My name is ...",
        [
          t("my", "My", "我的", "determiner 限定詞", "/maɪ/", "/maɪ/"),
          t("name", "name", "名字", "noun 名詞", "/nem/", "/neɪm/"),
          t("is", "is", "是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("ben", "Ben", "Ben（人名）", "proper noun 專有名詞", "/bɛn/", "/ben/"),
        ],
      ),
      lesson(
        "a1-u1-l3",
        3,
        "很高興認識你",
        "Nice to meet you.",
        "很高興認識你。",
        "見面時的固定用語",
        [
          t("nice", "Nice", "很高興的／令人愉快的", "adjective 形容詞", "/naɪs/", "/naɪs/"),
          t("to-meet", "to meet", "認識／見到", "verb phrase 動詞片語", "/tə mit/", "/tə miːt/", {
            lemma: "meet",
            note: "to 在自然語速中常弱化為 /tə/。",
          }),
          t("you", "you", "你", "pronoun 代名詞", "/ju/", "/juː/"),
        ],
      ),
      lesson(
        "a1-u1-l4",
        4,
        "我來自台灣",
        "I am from Taiwan.",
        "我來自台灣。",
        "be from 表示來自某地",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("am", "am", "是", "verb 動詞", "/æm/", "/æm/", { lemma: "be" }),
          t("from", "from", "來自", "preposition 介系詞", "/frəm/", "/frəm/"),
          t("taiwan", "Taiwan", "台灣", "proper noun 專有名詞", "/taɪˈwɑn/", "/taɪˈwɑːn/", {
            syllables: "Tai・wan",
            stress: "第二音節",
          }),
        ],
      ),
    ],
  },
  {
    id: "a1-u2",
    number: 2,
    title: "身邊物品",
    description: "描述常見物品、所有關係與簡單位置。",
    accent: "#f2a93b",
    lessons: [
      lesson(
        "a1-u2-l1",
        1,
        "這是一本書",
        "This is a book.",
        "這是一本書。",
        "This is ...",
        [
          t("this", "This", "這個", "pronoun 代名詞", "/ðɪs/", "/ðɪs/"),
          t("is", "is", "是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("a", "a", "一個／一本", "article 冠詞", "/ə/", "/ə/"),
          t("book", "book", "書", "noun 名詞", "/bʊk/", "/bʊk/"),
        ],
      ),
      lesson(
        "a1-u2-l2",
        2,
        "我有一枝筆",
        "I have a pen.",
        "我有一枝筆。",
        "have 表示擁有",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("have", "have", "有", "verb 動詞", "/hæv/", "/hæv/"),
          t("a", "a", "一枝", "article 冠詞", "/ə/", "/ə/"),
          t("pen", "pen", "筆", "noun 名詞", "/pɛn/", "/pen/"),
        ],
      ),
      lesson(
        "a1-u2-l3",
        3,
        "那是我的包包",
        "That is my bag.",
        "那是我的包包。",
        "That is ...",
        [
          t("that", "That", "那個", "pronoun 代名詞", "/ðæt/", "/ðæt/"),
          t("is", "is", "是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("my", "my", "我的", "determiner 限定詞", "/maɪ/", "/maɪ/"),
          t("bag", "bag", "包包", "noun 名詞", "/bæg/", "/bæɡ/"),
        ],
      ),
      lesson(
        "a1-u2-l4",
        4,
        "手機在桌上",
        "The cellphone is on the table.",
        "手機在桌上。",
        "on 表示在物體表面上",
        [
          t("the-cellphone", "The cellphone", "這支手機", "noun phrase 名詞片語", "/ðə ˈsɛlˌfon/", "/ðə ˈsel.foʊn/", {
            lemma: "cellphone",
            note: "意思接近 phone，但本課目標答案是 cellphone。",
          }),
          t("is", "is", "在／是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("on", "on", "在……上面", "preposition 介系詞", "/ɑn/", "/ɑːn/"),
          t("the-table", "the table", "桌子", "noun phrase 名詞片語", "/ðə ˈtebəl/", "/ðə ˈteɪ.bəl/", {
            lemma: "table",
          }),
        ],
      ),
    ],
  },
  {
    id: "a1-u3",
    number: 3,
    title: "家人與人物",
    description: "介紹家人、朋友與簡單的人物關係。",
    accent: "#e76c8a",
    lessons: [
      lesson(
        "a1-u3-l1",
        1,
        "她是我的太太",
        "She is my wife.",
        "她是我的太太。",
        "She is ...",
        [
          t("she", "She", "她", "pronoun 代名詞", "/ʃi/", "/ʃiː/"),
          t("is", "is", "是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("my", "my", "我的", "determiner 限定詞", "/maɪ/", "/maɪ/"),
          t("wife", "wife", "太太／妻子", "noun 名詞", "/waɪf/", "/waɪf/"),
        ],
      ),
      lesson(
        "a1-u3-l2",
        2,
        "他是我的朋友",
        "He is my friend.",
        "他是我的朋友。",
        "He is ...",
        [
          t("he", "He", "他", "pronoun 代名詞", "/hi/", "/hiː/"),
          t("is", "is", "是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("my", "my", "我的", "determiner 限定詞", "/maɪ/", "/maɪ/"),
          t("friend", "friend", "朋友", "noun 名詞", "/frɛnd/", "/frend/"),
        ],
      ),
      lesson(
        "a1-u3-l3",
        3,
        "我有兩個兄弟",
        "I have two brothers.",
        "我有兩個兄弟。",
        "數字加複數名詞",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("have", "have", "有", "verb 動詞", "/hæv/", "/hæv/"),
          t("two", "two", "兩個", "number 數字", "/tu/", "/tuː/"),
          t("brothers", "brothers", "兄弟", "noun 名詞", "/ˈbrʌðɚz/", "/ˈbrʌð.ɚz/", {
            lemma: "brother",
            syllables: "broth・ers",
            stress: "第一音節",
          }),
        ],
      ),
      lesson(
        "a1-u3-l4",
        4,
        "媽媽在家",
        "My mother is at home.",
        "我媽媽在家。",
        "at home 表示在家",
        [
          t("my-mother", "My mother", "我媽媽", "noun phrase 名詞片語", "/maɪ ˈmʌðɚ/", "/maɪ ˈmʌð.ɚ/"),
          t("is", "is", "在／是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("at-home", "at home", "在家", "prepositional phrase 介系詞片語", "/ət hom/", "/ət hoʊm/", {
            note: "這是常見的固定搭配。",
          }),
        ],
      ),
    ],
  },
  {
    id: "a1-u4",
    number: 4,
    title: "飲食",
    description: "表達喜好、需要，以及常見的飲食習慣。",
    accent: "#68ad66",
    lessons: [
      lesson(
        "a1-u4-l1",
        1,
        "我有一顆蘋果",
        "I have an apple.",
        "我有一顆蘋果。",
        "an 用在母音音素開頭的單數名詞前",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("have", "have", "有", "verb 動詞", "/hæv/", "/hæv/"),
          t("an", "an", "一個／一顆", "article 冠詞", "/ən/", "/ən/"),
          t("apple", "apple", "蘋果", "noun 名詞", "/ˈæpəl/", "/ˈæp.əl/", {
            syllables: "ap・ple",
            stress: "第一音節",
          }),
        ],
      ),
      lesson(
        "a1-u4-l2",
        2,
        "我喜歡咖啡",
        "I like coffee.",
        "我喜歡咖啡。",
        "like 加名詞表示喜歡某物",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("like", "like", "喜歡", "verb 動詞", "/laɪk/", "/laɪk/"),
          t("coffee", "coffee", "咖啡", "noun 名詞", "/ˈkɔfi/", "/ˈkɑː.fi/", {
            syllables: "cof・fee",
            stress: "第一音節",
          }),
        ],
      ),
      lesson(
        "a1-u4-l3",
        3,
        "我想要一些水",
        "I want some water.",
        "我想要一些水。",
        "some 搭配不可數名詞",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("want", "want", "想要", "verb 動詞", "/wɑnt/", "/wɑːnt/"),
          t("some", "some", "一些", "determiner 限定詞", "/səm/", "/səm/"),
          t("water", "water", "水", "noun 名詞", "/ˈwɔtɚ/", "/ˈwɑː.t̬ɚ/", {
            syllables: "wa・ter",
            stress: "第一音節",
          }),
        ],
      ),
      lesson(
        "a1-u4-l4",
        4,
        "我在家吃早餐",
        "I eat breakfast at home.",
        "我在家吃早餐。",
        "eat breakfast 與 at home",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("eat-breakfast", "eat breakfast", "吃早餐", "verb phrase 動詞片語", "/it ˈbrɛkfəst/", "/iːt ˈbrek.fəst/", {
            lemma: "eat",
          }),
          t("at-home", "at home", "在家", "prepositional phrase 介系詞片語", "/ət hom/", "/ət hoʊm/"),
        ],
      ),
    ],
  },
  {
    id: "a1-u5",
    number: 5,
    title: "日常活動",
    description: "談工作、起床時間與休閒活動。",
    accent: "#5a95db",
    lessons: [
      lesson(
        "a1-u5-l1",
        1,
        "我去上班",
        "I go to work.",
        "我去上班。",
        "go to work 是常用語塊",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("go-to-work", "go to work", "去上班", "verb phrase 動詞片語", "/go tə wɝk/", "/ɡoʊ tə wɝːk/", {
            lemma: "go",
          }),
        ],
      ),
      lesson(
        "a1-u5-l2",
        2,
        "我七點起床",
        "I get up at seven.",
        "我七點起床。",
        "get up 與 at 加時間",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("get-up", "get up", "起床", "phrasal verb 片語動詞", "/gɛt ʌp/", "/ɡet ʌp/"),
          t("at-seven", "at seven", "在七點", "time phrase 時間片語", "/ət ˈsɛvən/", "/ət ˈsev.ən/"),
        ],
      ),
      lesson(
        "a1-u5-l3",
        3,
        "我打羽球",
        "I play badminton.",
        "我打羽球。",
        "play 加球類運動",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("play", "play", "打／玩", "verb 動詞", "/ple/", "/pleɪ/"),
          t("badminton", "badminton", "羽球", "noun 名詞", "/ˈbædmɪntən/", "/ˈbæd.mɪn.tən/", {
            syllables: "bad・min・ton",
            stress: "第一音節",
          }),
        ],
      ),
      lesson(
        "a1-u5-l4",
        4,
        "我晚上看電視",
        "I watch TV at night.",
        "我晚上看電視。",
        "watch TV 與 at night",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("watch-tv", "watch TV", "看電視", "verb phrase 動詞片語", "/wɑtʃ ˌtiˈvi/", "/wɑːtʃ ˌtiːˈviː/"),
          t("at-night", "at night", "在晚上", "time phrase 時間片語", "/ət naɪt/", "/ət naɪt/"),
        ],
      ),
    ],
  },
  {
    id: "a1-u6",
    number: 6,
    title: "時間與日期",
    description: "說明時間、星期、月份與工作日。",
    accent: "#8c78d7",
    lessons: [
      lesson(
        "a1-u6-l1",
        1,
        "現在八點",
        "It is eight o'clock.",
        "現在是八點。",
        "It is ... 表示時間",
        [
          t("it", "It", "現在／它", "pronoun 代名詞", "/ɪt/", "/ɪt/"),
          t("is", "is", "是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("eight-oclock", "eight o'clock", "八點", "time phrase 時間片語", "/et əˈklɑk/", "/eɪt əˈklɑːk/"),
        ],
      ),
      lesson(
        "a1-u6-l2",
        2,
        "今天星期一",
        "Today is Monday.",
        "今天是星期一。",
        "星期名稱要大寫",
        [
          t("today", "Today", "今天", "adverb 副詞", "/təˈde/", "/təˈdeɪ/"),
          t("is", "is", "是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("monday", "Monday", "星期一", "proper noun 專有名詞", "/ˈmʌnde/", "/ˈmʌn.deɪ/"),
        ],
      ),
      lesson(
        "a1-u6-l3",
        3,
        "我的生日在五月",
        "My birthday is in May.",
        "我的生日在五月。",
        "月份前使用 in",
        [
          t("my-birthday", "My birthday", "我的生日", "noun phrase 名詞片語", "/maɪ ˈbɝθˌde/", "/maɪ ˈbɝːθ.deɪ/"),
          t("is", "is", "是／在", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("in-may", "in May", "在五月", "time phrase 時間片語", "/ɪn me/", "/ɪn meɪ/"),
        ],
      ),
      lesson(
        "a1-u6-l4",
        4,
        "我的工作日",
        "I work from Monday to Friday.",
        "我星期一到星期五上班。",
        "from ... to ... 表示起訖範圍",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("work", "work", "工作／上班", "verb 動詞", "/wɝk/", "/wɝːk/"),
          t("from-monday-to-friday", "from Monday to Friday", "從星期一到星期五", "time phrase 時間片語", "/frəm ˈmʌnde tə ˈfraɪde/", "/frəm ˈmʌn.deɪ tə ˈfraɪ.deɪ/"),
        ],
      ),
    ],
  },
  {
    id: "a1-u7",
    number: 7,
    title: "地點與方向",
    description: "說明所在位置、附近地點與交通方式。",
    accent: "#49a7a2",
    lessons: [
      lesson(
        "a1-u7-l1",
        1,
        "我在家",
        "I am at home.",
        "我在家。",
        "at home 表示在家",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("am", "am", "是／在", "verb 動詞", "/æm/", "/æm/", { lemma: "be" }),
          t("at-home", "at home", "在家", "prepositional phrase 介系詞片語", "/ət hom/", "/ət hoʊm/"),
        ],
      ),
      lesson(
        "a1-u7-l2",
        2,
        "商店在車站附近",
        "The store is near the station.",
        "商店在車站附近。",
        "near 表示在附近",
        [
          t("the-store", "The store", "這間商店", "noun phrase 名詞片語", "/ðə stɔr/", "/ðə stɔːr/"),
          t("is", "is", "在／是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("near", "near", "在……附近", "preposition 介系詞", "/nɪr/", "/nɪr/"),
          t("the-station", "the station", "車站", "noun phrase 名詞片語", "/ðə ˈsteʃən/", "/ðə ˈsteɪ.ʃən/"),
        ],
      ),
      lesson(
        "a1-u7-l3",
        3,
        "洗手間在左邊",
        "The bathroom is on the left.",
        "洗手間在左邊。",
        "on the left 是固定方向語塊",
        [
          t("the-bathroom", "The bathroom", "洗手間", "noun phrase 名詞片語", "/ðə ˈbæθˌrum/", "/ðə ˈbæθ.ruːm/"),
          t("is", "is", "在／是", "verb 動詞", "/ɪz/", "/ɪz/", { lemma: "be" }),
          t("on-the-left", "on the left", "在左邊", "prepositional phrase 介系詞片語", "/ɑn ðə lɛft/", "/ɑːn ðə left/"),
        ],
      ),
      lesson(
        "a1-u7-l4",
        4,
        "我搭公車上學",
        "I go to school by bus.",
        "我搭公車上學。",
        "by 加交通工具",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("go-to-school", "go to school", "去上學", "verb phrase 動詞片語", "/go tə skul/", "/ɡoʊ tə skuːl/"),
          t("by-bus", "by bus", "搭公車", "transport phrase 交通片語", "/baɪ bʌs/", "/baɪ bʌs/"),
        ],
      ),
    ],
  },
  {
    id: "a1-u8",
    number: 8,
    title: "A1 綜合短文",
    description: "把已學過的單字、語塊與句型組合成短文。",
    accent: "#e08f55",
    lessons: [
      lesson(
        "a1-u8-l1",
        1,
        "早晨",
        "I get up at seven.",
        "我七點起床。",
        "複習日常活動與時間",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("get-up", "get up", "起床", "phrasal verb 片語動詞", "/gɛt ʌp/", "/ɡet ʌp/"),
          t("at-seven", "at seven", "在七點", "time phrase 時間片語", "/ət ˈsɛvən/", "/ət ˈsev.ən/"),
        ],
      ),
      lesson(
        "a1-u8-l2",
        2,
        "早餐",
        "I eat breakfast at home.",
        "我在家吃早餐。",
        "複習動詞語塊與地點",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("eat-breakfast", "eat breakfast", "吃早餐", "verb phrase 動詞片語", "/it ˈbrɛkfəst/", "/iːt ˈbrek.fəst/"),
          t("at-home", "at home", "在家", "prepositional phrase 介系詞片語", "/ət hom/", "/ət hoʊm/"),
        ],
      ),
      lesson(
        "a1-u8-l3",
        3,
        "上班",
        "I go to work by bus.",
        "我搭公車去上班。",
        "結合目的地與交通方式",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("go-to-work", "go to work", "去上班", "verb phrase 動詞片語", "/go tə wɝk/", "/ɡoʊ tə wɝːk/"),
          t("by-bus", "by bus", "搭公車", "transport phrase 交通片語", "/baɪ bʌs/", "/baɪ bʌs/"),
        ],
      ),
      lesson(
        "a1-u8-l4",
        4,
        "幫助朋友",
        "I would like to help you.",
        "我想要幫助你。",
        "would like to 是較禮貌的「想要」",
        [
          t("i", "I", "我", "pronoun 代名詞", "/aɪ/", "/aɪ/"),
          t("would-like-to", "would like to", "想要", "verb phrase 動詞片語", "/wʊd laɪk tə/", "/wʊd laɪk tə/", {
            syllables: "would・like・to",
            note: "整段是一個意思，應視為同一個語塊；to 在自然語速中常弱化。",
          }),
          t("help", "help", "幫助", "verb 動詞", "/hɛlp/", "/help/"),
          t("you", "you", "你", "pronoun 代名詞", "/ju/", "/juː/"),
        ],
      ),
    ],
  },
];

export const allLessons = courseUnits.flatMap((unit) =>
  unit.lessons.map((item) => ({ ...item, unit })),
);

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
