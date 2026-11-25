const noun = "noun 名詞";
const verb = "verb 動詞";
const adjective = "adjective 形容詞";
const adverb = "adverb 副詞";
const preposition = "preposition 介系詞";
const determiner = "determiner 限定詞";
const modal = "modal verb 情態助動詞";
const pronoun = "pronoun 代名詞";
const linking = "linking verb 連綴動詞";

export const everydayConfirmationForms = (form) => ({
  are: form("be", "verb 動詞", "are", { kk: "/ɑr/", ipa: "/ɑɹ/", syllables: 1 }),
  every: form("every", determiner, "EV・er・y"),
  except: form("except", "preposition 介系詞；conjunction 連接詞", "ex・CEPT"),
  sunday: form("sunday", "proper noun 專有名詞", "SUN・day"),
  front: form("front", "noun 名詞；adjective 形容詞；verb 動詞"),
  main: form("main", "adjective 形容詞；noun 名詞"),
  spell: form("spell", "verb 動詞；noun 名詞"),
  letter: form("letter", noun, "LET・ter"),
  repeat: form("repeat", "verb 動詞；noun 名詞", "re・PEAT"),
  numbers: form("number", "noun 名詞；verb 動詞", "NUM・bers", {
    kk: "/ˈnʌmbɚz/", ipa: "/ˈnʌmbɚz/", syllables: 2, stress: 1,
  }),
});

export const everydayConfirmationUnits = ({ lesson, variant, chunk, line, question, wordUse, couldRequest, youSubject }) => {
  const calendarDay = wordUse("sunday-day-of-week", "星期日", "proper noun 專有名詞", "不營業的日子");
  const openForBusiness = wordUse("open-operating-state", "營業中的／有開", adjective, "商店的營業狀態");
  const entrance = wordUse("entrance-way-in", "入口", noun, "進入建築的通道");
  const backByReading = wordUse("back-in-read-back", "照原內容念回去", adverb, "向剛才提供資料的人複誦");
  const phoneNumber = wordUse("number-digit-in-sequence", "數字（這裡指號碼中的個別數字）", noun, "要核對的號碼數字");
  return [
    {
      id: "a2-u50", title: "應用：問營業時間與公休日",
      lessons: [
        lesson("問店家幾點開始營業", "What time does the store open?", "這家店幾點開門？",
          "What time does + 單數主詞 + 原形動詞？open 在這裡是「開始營業」的動作。", "hours-ask-opening-clock-time",
          "What time does {place} open?", "What time does ______ open?", ["詢問開門時間", "場所"],
          [variant("library", "圖書館幾點開門？", ["What time does", "the library open?"]),
            variant("office", "辦公室幾點開門？", ["What time does", "the office open?"])],
          ["圖書館幾點開門？", "這家店幾點關門？", "這堂課幾點開始？"], ["a2-u33-l03", "a2-u33-l04", "a2-u41-l02"],
          {
            what: wordUse("what-in-what-time", "和 time 一起問「幾點」", determiner, "詢問鐘點"),
            time: wordUse("time-clock-hour-question", "時間（與 what 合用問幾點）", noun, "開門的時刻"),
            does: wordUse("do-auxiliary-for-singular-question", "單數主詞問句的助動詞", "auxiliary verb 助動詞", "形成一般現在式問句", "", "grammar"),
            open: wordUse("open-begin-business-hours", "開門／開始營業", verb, "營業開始的動作"),
          }),
        lesson("說從八點營業到七點", "We are open from eight to seven.", "我們從八點營業到七點。",
          "be open 表示營業狀態，from … to … 表示起迄時間。日常說法常依情境省略早上或晚上。", "hours-state-business-time-range",
          "{place} open from {time}.", "______ open from ______.", ["營業的場所", "營業起迄時間"],
          [variant("nine", "我們從九點營業到七點。", ["We are open", "from nine to seven."]),
            variant("store", "這家店從八點營業到七點。", ["The store is open", "from eight to seven."])],
          ["我們從九點營業到七點。", "我們七點才開門。", "這家店幾點開門？"], ["a2-u50-l01", "a2-u33-l04", "a2-u42-l02"],
          {
            are: wordUse("be-linking-operating-state", "連接 we 和 open 的 be 動詞", linking, "接營業狀態", "", "grammar"),
            open: openForBusiness,
            from: wordUse("from-opening-time-range", "從（接開始營業的時間）", preposition, "營業起始時間"),
            to: wordUse("to-closing-time-range", "到（接停止營業的時間）", preposition, "營業結束時間"),
            eight: wordUse("eight-clock-time", "八點（指鐘點）", "number 數詞", "開始營業的時間"),
            seven: wordUse("seven-clock-time", "七點（指鐘點）", "number 數詞", "結束營業的時間"),
          }, [chunk("from-eight-to-seven", "from eight to seven", "從八點到七點", "句中指從當天早上八點到晚上七點。")]),
        lesson("聽懂除了週日每天都開", "The store is open every day except Sunday.", "這家店除了星期日，每天都營業。",
          "every day 是「每天」；except Sunday 把這一天排除在外。星期的英文第一個字母大寫。", "hours-state-weekly-exception",
          "{place} is open every day except {day}.", "______ is open every day except ______.", ["營業的場所", "例外日"],
          [variant("monday", "這家店除了星期一，每天都營業。", ["The store", "is open every day except Monday."]),
            variant("library", "圖書館除了星期日，每天都開放。", ["The library", "is open every day except Sunday."])],
          ["這家店除了星期一，每天都營業。", "這家店只在星期日營業。", "我們從八點營業到七點。"], ["a2-u50-l01", "a2-u50-l02", "a2-u42-l02"],
          {
            open: openForBusiness, every: wordUse("every-all-members", "每一個", determiner, "每天的固定安排"),
            except: wordUse("except-exclude-exception", "除了（排除後項）", preposition, "不營業的例外"),
            sunday: calendarDay,
          }, [chunk("every-day", "every day", "每天", "表示每天時要分成兩個字；everyday 不分開，則是「日常的」。"),
            chunk("except-sunday", "except Sunday", "除了星期日之外", "星期日不包含在每天營業的規則內。")]),
        lesson("聽完時間後決定週一再來", "I can come back on Monday then.", "那我星期一可以再來。",
          "on Monday 用在指星期的日期前；句末 then 表示「既然這樣，那就」。", "hours-choose-return-day",
          "{person} can come back on {day} then.", "______ can come back on ______ then.", ["會再來的人", "替代的日期"],
          [variant("friday", "那我星期五可以再來。", ["I can come back", "on Friday then."]),
            variant("we", "那我們星期一可以再來。", ["We can come back", "on Monday then."])],
          ["那我星期五可以再來。", "那我星期一可以提早離開。", "這家店除了星期日，每天都營業。"], ["a2-u50-l03", "a2-u44-l04", "a2-u42-l01"],
          {
            can: wordUse("can-offer-action", "可以（提出安排）", modal, "自己可採取的安排"),
            come: wordUse("come-back-return", "和 back 一起表示回來", verb, "改天回到店裡"),
            back: wordUse("back-in-come-back", "回到原地（和 come 一起用）", adverb, "改天再來"),
            on: wordUse("on-weekday-when", "在（接星期幾）", preposition, "回來的日期"),
            then: wordUse("then-result-of-information", "那樣的話／那就", adverb, "依剛聽到的營業安排決定"),
          }, [chunk("come-back", "come back", "回來", "指回到原本所在的位置。")]),
      ],
      passage: [
        line("What time does the store open?", "顧客：這家店幾點開門？"),
        line("We are open from eight to seven.", "店員：我們從八點營業到七點。"),
        line("The store is open every day except Sunday.", "店員：這家店除了星期日，每天都營業。"),
        line("I can come back on Monday then.", "顧客：那我星期一可以再來。"),
        line("Thank you.", "顧客：謝謝。"),
      ],
      questions: [
        question("顧客一開始想問什麼？", [1], "What time does the store open?", "How much is each ticket?", "What is the package number?", "Where should I leave the bike?"),
        question("這裡公布的營業區間是什麼？", [1, 2], "From eight to seven.", "From nine to seven.", "From seven to eight.", "After seven."),
        question("每週哪一天例外、不營業？", [3], "Sunday.", "Monday.", "Friday.", "Saturday."),
        question("知道公休日之後，顧客決定哪一天再來？", [3, 4], "On Monday.", "On Sunday.", "On Friday.", "On Saturday."),
      ],
    },
    {
      id: "a2-u51", title: "應用：用地標約集合",
      lessons: [
        lesson("提議在圖書館前面見", "We can meet in front of the library.", "我們可以在圖書館前面見。",
          "in front of + 地標表示在該地標前面，不是指裡面或對面。", "landmark-suggest-meeting-in-front",
          "We can meet in front of {place}.", "We can meet in front of ______.", ["提出集合位置", "當作參照的地標"],
          [variant("station", "我們可以在車站前面見。", ["We can meet", "in front of the station."]),
            variant("school", "我們可以在學校前面見。", ["We can meet", "in front of the school."])],
          ["我們可以在車站前面見。", "圖書館在學校對面。", "那我星期一可以再來。"], ["a2-u17-l04", "a2-u50-l04", "a2-u42-l03"],
          {
            in: wordUse("in-part-of-in-front-of", "和 front of 一起表示「在……前面」", preposition, "地標前方", "", "grammar"),
            front: wordUse("front-location-in-front-of", "前方（搭配 in front of）", noun, "面向地標的正前方"),
            of: wordUse("of-in-front-of", "接當作參照的地標", preposition, "參照位置"),
          }, [chunk("in-front-of", "in front of", "在……前面", "在地標的正面一側，不是穿過馬路的對面。")]),
        lesson("說入口在車站對面", "The entrance is across from the station.", "入口在車站對面。",
          "across from + 地標表示在對面。這句不是請人過馬路，只用車站說明入口在哪裡。", "landmark-locate-across-from",
          "{place} is across from {landmark}.", "______ is across from ______.", ["要找的地方", "對面的地標"],
          [variant("library", "圖書館在車站對面。", ["The library", "is across from the station."]),
            variant("school", "入口在學校對面。", ["The entrance", "is across from the school."])],
          ["入口在學校對面。", "入口在二樓。", "我們可以在圖書館前面見。"], ["a2-u51-l01", "a2-u17-l04", "a2-u41-l04"],
          { entrance,
            across: wordUse("across-opposite-landmark", "對面（接 from 和參照地標）", adverb, "建築物的相對位置"),
            from: wordUse("from-across-reference", "和 across 一起接參照地標", preposition, "對面的地標"),
          }, [chunk("across-from", "across from", "在……對面", "以另一個地點作為參照。")]),
        lesson("問對方是否看得見正門", "Can you see the main entrance?", "你看得到正門嗎？",
          "main entrance 是主要出入口。Can you see …? 問對方能不能看見，不是請對方去查看。", "landmark-confirm-visible-reference",
          "Can you see {landmark}?", "Can you see ______?", ["確認看不看得見", "要辨認的地標"],
          [variant("station", "你看得到車站嗎？", ["Can you see", "the station?"]),
            variant("library", "你看得到圖書館嗎？", ["Can you see", "the library?"])],
          ["你看得到車站嗎？", "入口在車站對面。", "我們可以在圖書館前面見。"], ["a2-u51-l01", "a2-u51-l02", "a2-u41-l04"],
          {
            can: wordUse("can-ask-ability-perception", "能……嗎？（問是否看得到）", modal, "是否看得見"),
            you: youSubject, see: wordUse("see-visible-object", "看得見", verb, "從所在位置看得到"),
            main: wordUse("main-primary-entrance", "主要的／正（門）", adjective, "最主要的入口"), entrance,
          }, [chunk("main-entrance", "main entrance", "正門／主要入口", "不特指哪個樓層或其他出入口。")]),
        lesson("說會在門旁邊等", "I will wait right by the door.", "我會在門旁邊等。",
          "right by 表示「就在……旁邊」。right 在這裡是加強語氣，不是指右邊。", "landmark-confirm-waiting-place",
          "{person} will wait right by {place}.", "______ will wait right by ______.", ["會等候的人", "靠近的地標"],
          [variant("we", "我們會在門旁邊等。", ["We will wait", "right by the door."]),
            variant("entrance", "我會在正門旁邊等。", ["I will wait", "right by the main entrance."])],
          ["我會在正門旁邊等。", "我會在門的右邊等。", "你看得到正門嗎？"], ["a2-u51-l01", "a2-u51-l02", "a2-u51-l03"],
          {
            wait: wordUse("wait-for-meeting-partner", "等候", verb, "等約好見面的人"),
            right: wordUse("right-intensifier-near", "就（加強距離很近）", adverb, "不表示右邊"),
            by: wordUse("by-next-to-place", "在……旁邊", preposition, "等候位置"),
          }, [chunk("right-by", "right by", "就在……旁邊", "right 加強 by 的位置意思，並非向右。")]),
      ],
      passage: [
        line("We can meet in front of the library.", "甲：我們可以在圖書館前面見。"),
        line("The entrance is across from the station.", "甲：入口在車站對面。"),
        line("Can you see the main entrance?", "甲：你看得到正門嗎？"),
        line("I will wait right by the door.", "乙：我會在門旁邊等。"),
        line("I will be there in ten minutes.", "甲：我再十分鐘就到。"),
      ],
      questions: [
        question("甲提出的集合點是哪裡？", [1], "In front of the library.", "In front of the station.", "At the station.", "On the second floor."),
        question("甲說入口位於哪個地標的對面？", [2], "Across from the station.", "Across from the school.", "In front of the library.", "Right by the door."),
        question("甲想確認乙有沒有看到哪裡？", [2, 3], "The main entrance.", "The station.", "The library.", "The room."),
        question("對照第 3 和第 4 句，乙說會在哪裡等？", [3, 4], "Right by the door.", "Across from the station.", "On the first floor.", "At home."),
      ],
    },
    {
      id: "a2-u52", title: "應用：電話中確認拼字與號碼",
      lessons: [
        lesson("請對方拼出姓名", "Could you spell the name for me?", "可以麻煩你拼一下這個名字嗎？",
          "spell the name 是按順序說出名字的字母，不是請人再喊一次名字。for me 說明是為了讓我核對。", "call-ask-to-spell",
          "Could you spell {item} for me?", "Could you spell ______ for me?", ["請對方拼字", "要核對的詞或姓名"],
          [variant("first-name", "可以麻煩你拼一下名字嗎？", ["Could you spell", "the first name for me?"]),
            variant("last-name", "可以麻煩你拼一下姓氏嗎？", ["Could you spell", "the last name for me?"])],
          ["可以麻煩你拼一下姓氏嗎？", "可以麻煩你喊一下我的名字嗎？", "可以麻煩你給我看那封電子郵件嗎？"], ["a2-u35-l04", "a2-u43-l03", "a2-u46-l02"],
          {
            could: couldRequest, you: youSubject,
            spell: wordUse("spell-say-letters-in-order", "拼出（依序念出字母）", verb, "核對拼法"),
            name: wordUse("name-spelling-reference", "名字／姓名", noun, "待核對拼法的名字"),
            for: wordUse("for-recipient-benefit", "替／為……", preposition, "請對方替我確認"),
          }),
        lesson("請每個字母都慢慢念", "Can you say each letter slowly?", "可以請你慢慢念出每個字母嗎？",
          "each + 單數名詞，強調每一個。say each letter slowly 表示逐一慢慢念出字母。", "call-ask-one-letter-at-time",
          "Can you say {item} slowly?", "Can you say ______ slowly?", ["請放慢速度", "要慢慢念的內容"],
          [variant("name", "可以請你慢慢念那個名字嗎？", ["Can you say", "the name slowly?"]),
            variant("number", "可以請你慢慢念那個號碼嗎？", ["Can you say", "the number slowly?"])],
          ["可以請你慢慢念那個號碼嗎？", "可以請你拼一下這個名字嗎？", "可以麻煩你給我看包裹編號嗎？"], ["a2-u52-l01", "a2-u11-l02", "a2-u43-l02"],
          {
            can: wordUse("can-polite-request", "可以請你……嗎？", modal, "請對方放慢速度", "", "grammar"),
            you: youSubject, each: wordUse("each-individual-letter", "每一個（接單數）", determiner, "一次念一個"),
            letter: wordUse("letter-alphabet-character", "字母（不是信件）", noun, "名字中的一個字母"),
          }, [chunk("each-letter", "each letter", "每一個字母", "指 A、B、C 這類字母，不是每封信。")]),
        lesson("請對方重念最後兩個數字", "Could you repeat the last two numbers?", "可以麻煩你重念最後兩個數字嗎？",
          "repeat 是重複說一次。the last two numbers 指號碼末尾的兩個數字，不必重念整串。", "call-ask-repeat-number-part",
          "Could you repeat {item}?", "Could you repeat ______?", ["禮貌請對方再說一次", "需要重念的部分"],
          [variant("phone", "可以麻煩你再念一次電話號碼嗎？", ["Could you repeat", "the phone number?"]),
            variant("first", "可以麻煩你重念前兩個數字嗎？", ["Could you repeat", "the first two numbers?"])],
          ["可以麻煩你重念前兩個數字嗎？", "可以請你慢慢念出每個字母嗎？", "可以麻煩你拼一下這個名字嗎？"], ["a2-u52-l01", "a2-u52-l02", "a2-u46-l03"],
          {
            could: couldRequest, you: youSubject,
            repeat: wordUse("repeat-say-again", "重念／再說一次", verb, "請對方重複資訊"),
            last: wordUse("last-final-in-sequence", "最後的（接順序）", adjective, "號碼尾端"),
            two: wordUse("two-count-of-digits", "兩個（數字的個數）", "number 數詞", "要核對的位數"),
            numbers: phoneNumber,
          }, [chunk("the-last-two-numbers", "the last two numbers", "最後兩個數字", "在電話中指一串號碼尾端的兩個個別數字。")]),
        lesson("把數字念回去讓對方核對", "Let me read the numbers back to you.", "我把這些數字念給你聽，確認一下。",
          "read … back to someone 表示把剛收到或寫下的內容念給原來的說話者聽，讓彼此確認。", "call-offer-read-back",
          "Let me read {item} back to you.", "Let me read ______ back to you.", ["提出覆誦核對", "要念回去的資訊"],
          [variant("address", "我把地址念給你聽，確認一下。", ["Let me read", "the address back to you."]),
            variant("number", "我把電話號碼念給你聽，確認一下。", ["Let me read", "the phone number back to you."])],
          ["我把地址念給你聽，確認一下。", "可以麻煩你重念最後兩個數字嗎？", "可以麻煩你拼一下這個名字嗎？"], ["a2-u52-l01", "a2-u52-l02", "a2-u52-l03"],
          {
            let: wordUse("let-me-offer-next-action", "讓我……（提出接下來要做的事）", verb, "主動開口核對"),
            me: wordUse("me-object-after-let", "我（let 的受詞）", pronoun, "由我接著做"),
            read: wordUse("read-aloud-for-confirmation", "念出來", verb, "把號碼照原樣念出"),
            numbers: phoneNumber, back: backByReading,
            to: wordUse("to-listener-recipient", "給（接要聽的人）", preposition, "原本給資訊的人"),
            you: wordUse("you-read-back-recipient", "你（聽我念回去的人）", pronoun, "核對的聽者"),
          }, [chunk("back-to-you", "back to you", "念回去給你聽", "和 read 一起用，表示念回去讓對方確認。")]),
      ],
      passage: [
        line("Could you spell the name for me?", "來電者：可以麻煩你拼一下這個名字嗎？"),
        line("Can you say each letter slowly?", "來電者：可以請你慢慢念出每個字母嗎？"),
        line("Could you repeat the last two numbers?", "來電者轉而核對號碼：可以麻煩你重念最後兩個數字嗎？"),
        line("The last two numbers are nine, then three.", "對方：最後兩個數字先是九，再來是三。"),
        line("Let me read the numbers back to you.", "來電者：我把這些數字念給你聽，確認一下。"),
        line("Nine, then three.", "來電者：九，再來是三。"),
      ],
      questions: [
        question("一開始，來電者想核對什麼？", [1], "The name.", "The address.", "The phone number.", "The package number."),
        question("來電者請對方慢慢念什麼？", [1, 2], "Each letter.", "The last two numbers.", "The address.", "Each ticket."),
        question("來電者沒有要求重念整串，而是要求重念哪部分？", [3, 4], "The last two numbers.", "The first two numbers.", "Each letter.", "The phone number."),
        question("對方提供末兩位後，來電者按什麼順序念回去？", [4, 5, 6], "Nine, then three.", "Three, then nine.", "Two, then three.", "Eight, then seven."),
      ],
    },
  ];
};
