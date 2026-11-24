const noun = "noun 名詞";
const verb = "verb 動詞";
const adverb = "adverb 副詞";
const adjective = "adjective 形容詞";
const preposition = "preposition 介系詞";

export const instructionForms = (form) => ({
  long: form("long", "adjective 形容詞；adverb 副詞"),
  wait: form("wait", "verb 動詞；noun 名詞"),
  outside: form("outside", "adverb 副詞；preposition 介系詞；noun 名詞", "out・SIDE", {
    kk: "/ˌaʊtˈsaɪd/", ipa: "/ˌaʊtˈsaɪd/", syllables: 2, stress: 2,
  }),
  read: form("read", "verb 動詞；noun 名詞", "read", {
    kk: "/rid/", ipa: "/ɹid/", syllables: 1,
  }),
  first: form("first", "ordinal number 序數；adverb 副詞"),
  page: form("page", "noun 名詞；verb 動詞"),
  question: form("question", "noun 名詞；verb 動詞", "QUES・tion", {
    kk: "/ˈkwɛstʃən/", ipa: "/ˈkwɛstʃən/", syllables: 2, stress: 1,
  }),
  reply: form("reply", "verb 動詞；noun 名詞", "re・PLY"),
  must: form("must", "modal verb 情態助動詞"),
  quiet: form("quiet", "adjective 形容詞；noun 名詞；verb 動詞", "QUI・et", {
    kk: "/ˈkwaɪət/", ipa: "/ˈkwaɪət/", syllables: 2, stress: 1,
  }),
  close: form("close", "verb 動詞；adjective 形容詞；adverb 副詞", "close", {
    kk: "/kloz/", ipa: "/kloʊz/", syllables: 1,
  }),
});

export const instructionUnits = ({ lesson, variant, chunk, line, question, wordUse, youSubject }) => {
  const polite = wordUse("please-request", "請", adverb, "禮貌請求");
  const outside = wordUse("outside-not-indoors", "在外面", adverb, "室外");
  const canOffer = wordUse("can-offer-action", "可以（提出可行做法）", "modal verb 情態助動詞", "提出自己能做的事");
  return [
    {
      id: "a2-u35", title: "應用：訂位、候位與叫號",
      lessons: [
        lesson("詢問有沒有兩人的桌位", "Do you have a table for two?", "有兩位的桌位嗎？",
          "a table for two 是供兩位用餐的桌位，for 後面的數字指用餐人數。", "seating-ask-table-for-party",
          "Do you have a table for {people}?", "Do you have a table for ______?", ["詢問有沒有桌位", "用餐人數"],
          [variant("three", "有三位的桌位嗎？", ["Do you have a table", "for three?"]),
            variant("one", "有一位的桌位嗎？", ["Do you have a table", "for one?"])],
          ["有三位的桌位嗎？", "這一桌要等多久？", "這張桌子可以退嗎？"], ["a2-u14-l04", "a2-u32-l02", "a2-u29-l03"],
          {
            you: youSubject, table: wordUse("table-dining-seats", "用餐桌位", noun, "等待的座位"),
            have: wordUse("have-seating-available", "有（詢問是否有空位）", verb, "詢問可用桌位"),
            for: wordUse("for-dining-party-size", "供（接用餐人數）", preposition, "用餐人數"),
          }, [chunk("a-table-for-two", "a table for two", "兩人桌位", "for two 是給兩位用餐，不是等兩分鐘。")]),
        lesson("問候位大概要多久", "How long is the wait?", "大概要等多久？",
          "How long 問時間長度；the wait 的 wait 是名詞，指等待的時間。", "seating-ask-wait-duration",
          "How long is {event}?", "How long is ______?", ["詢問多長", "等待或活動時間"],
          [variant("class", "這堂課會上多久？", ["How long", "is the class?"]),
            variant("appointment", "這個預約會花多久？", ["How long", "is the appointment?"])],
          ["這堂課會上多久？", "候位要多少錢？", "我再十分鐘就會到。"], ["a2-u35-l01", "a2-u33-l03", "a2-u34-l03"],
          {
            how: wordUse("how-long-duration", "和 long 一起問多久", adverb, "引出等待時間"),
            long: wordUse("long-duration", "長（指時間）", adjective, "時間長度"),
            wait: wordUse("wait-duration-noun", "等待的時間", noun, "候位時間", "the wait 中的 wait 是名詞。"),
          }, [chunk("how-long", "How long", "多久", "問經過多長時間，不問幾點。")]),
        lesson("說可以到外面等", "We can wait outside.", "我們可以在外面等。",
          "wait 表示等候；outside 作副詞表示在外面，不用加 at。", "seating-offer-wait-at-place",
          "{person} can wait {place}.", "______ can wait ______.", ["可以等候的人", "等候的地方"],
          [variant("here", "我們可以在這裡等。", ["We can wait", "here."]),
            variant("i", "我可以在外面等。", ["I can wait", "outside."])],
          ["我們可以在這裡等。", "我們可以直接進去。", "我要在哪裡簽到？"], ["a2-u35-l01", "a2-u35-l02", "a2-u33-l01"],
          { can: canOffer, wait: wordUse("wait-stay-until-called", "等候", verb, "等待叫號"), outside }),
        lesson("請對方叫自己的名字", "Please call my name.", "麻煩叫我的名字。",
          "call my name 指喊名字，不是打電話。Please + 原形動詞可用於禮貌請求。", "seating-ask-to-call-name",
          "{request} call {name}.", "______ call ______.", ["禮貌請求", "要叫的名字"],
          [variant("could", "可以麻煩叫我的名字嗎？", ["Could you call", "my name?"]),
            variant("again", "麻煩再叫一次我的名字。", ["Please call", "my name again."])],
          ["麻煩再叫一次我的名字。", "我再十分鐘會到。", "我們可以在外面等。"], ["a2-u35-l01", "a2-u35-l02", "a2-u35-l03"],
          {
            please: polite, call: wordUse("call-name-aloud", "喊出", verb, "通知候位的人", "call my name 指喊名字。"),
          }, [chunk("call-my-name", "call my name", "喊我的名字", "在候位或點名時表示大聲叫名字。")]),
      ],
      passage: [
        line("Do you have a table for two?", "客人：有兩位的桌位嗎？"),
        line("How long is the wait?", "客人：大概要等多久？"),
        line("The wait is ten minutes.", "店員：大概要等十分鐘。"),
        line("We can wait outside.", "客人：我們可以在外面等。"),
        line("Please call my name.", "客人：麻煩叫我的名字。"),
      ],
      questions: [
        question("客人需要幾位的桌位？", [1], "For two.", "For one.", "For three.", "For ten."),
        question("客人問了什麼，店員答十分鐘？", [2, 3], "How long is the wait?", "What time does it start?", "How much does it cost?", "Where do I sign in?"),
        question("等候時間是多久？", [3], "Ten minutes.", "Two minutes.", "Three minutes.", "A day."),
        question("知道候位時間後，客人說可以在哪裡等？", [3, 4], "Outside.", "Here.", "At home.", "At the station."),
      ],
    },
    {
      id: "a2-u36", title: "應用：寄檔案與回覆訊息",
      lessons: [
        lesson("告知會寄檔案給對方", "I will send you the file.", "我會把檔案寄給你。",
          "send + 人 + 物品表示把東西寄給某人；也可以說 send the file to you。", "message-send-file-to-recipient",
          "{person} will send {recipient} the file.", "______ will send ______ the file.", ["答應會寄出", "收件人"],
          [variant("amy", "我會把檔案寄給 Amy。", ["I will send", "Amy the file."]),
            variant("we", "我們會把檔案寄給你。", ["We will send", "you the file."])],
          ["我會把檔案寄給 Amy。", "我已經把檔案寄出去了。", "我會把包裹寄給你。"], ["a2-u16-l02", "a2-u27-l02", "a2-u29-l01"],
          {
            send: wordUse("send-deliver-file", "寄出／傳送", verb, "傳送檔案"),
            you: wordUse("you-object-recipient", "你（受詞）", "pronoun 代名詞", "收件人"),
          }),
        lesson("請對方先看第一頁", "Please read the first page.", "麻煩讀一下第一頁。",
          "first page 指第一頁；這句的原形 read 發 /ɹid/，不要讀成過去式 /ɹɛd/。", "message-request-reading",
          "Please read {section}.", "Please read ______.", ["禮貌指示", "要閱讀的內容"],
          [variant("message", "麻煩讀一下那則訊息。", ["Please read", "the message."]),
            variant("report", "麻煩讀一下那份報告。", ["Please read", "the report."])],
          ["麻煩讀一下那份報告。", "麻煩把地址寫在第一頁。", "麻煩確認新的時間。"], ["a2-u36-l01", "a2-u29-l02", "a2-u21-l04"],
          {
            please: polite, read: wordUse("read-view-written-text", "閱讀（原形）", verb, "閱讀資料"),
            first: wordUse("first-ordinal", "第一", "ordinal number 序數", "頁碼"),
            page: wordUse("page-document-sheet", "頁", noun, "文件中一頁"),
          }),
        lesson("請對方有問題就告知", "Let me know if you have a question.", "如果你有問題，請告訴我。",
          "Let me know 是請對方告知；if 引出需要通知的情況。", "message-ask-to-inform-if-needed",
          "Let me know if you have {item}.", "Let me know if you have ______.", ["請對方告知", "需要通知的情況"],
          [variant("file", "如果你拿到檔案，請告訴我。", ["Let me know if you have", "the file."]),
            variant("receipt", "如果你有收據，請告訴我。", ["Let me know if you have", "the receipt."])],
          ["如果你有收據，請告訴我。", "如果你有問題，請閱讀報告。", "麻煩讀一下第一頁。"], ["a2-u36-l01", "a2-u36-l02", "a2-u26-l03"],
          {
            me: wordUse("me-object", "我（受詞）", "pronoun 代名詞", "收到通知的人"),
            if: wordUse("if-condition", "如果", "conjunction 連接詞", "告知的條件"),
            you: youSubject,
            have: wordUse("have-a-question", "有（疑問）", verb, "指出有問題"),
            question: wordUse("question-request-for-information", "問題／疑問", noun, "想請對方告知的疑問"),
          }, [chunk("let-me-know", "Let me know", "請告訴我", "用於請別人把消息告訴你。")]),
        lesson("說明什麼時候能回覆", "I can reply after lunch.", "我可以在午餐後回覆。",
          "reply 表示對訊息作出回應；after lunch 是午餐後。", "message-offer-to-reply-at-time",
          "{person} can reply {time}.", "______ can reply ______.", ["能回覆的人", "回覆時間"],
          [variant("tomorrow", "我明天可以回覆。", ["I can reply", "tomorrow."]),
            variant("we", "我們可以在午餐後回覆。", ["We can reply", "after lunch."])],
          ["我明天可以回覆。", "我可以在午餐後打電話。", "我不能在午餐後回覆。"], ["a2-u36-l01", "a2-u36-l02", "a2-u36-l03"],
          { can: canOffer, reply: wordUse("reply-respond-to-message", "回覆", verb, "答覆訊息") }),
      ],
      passage: [
        line("I will send you the file.", "A：我會把檔案寄給你。"),
        line("Please read the first page.", "A：麻煩讀一下第一頁。"),
        line("Let me know if you have a question.", "A：如果你有問題，請告訴我。"),
        line("I can reply after lunch.", "B：我可以在午餐後回覆。"),
        line("Thank you for the help.", "A：謝謝你的幫忙。"),
      ],
      questions: [
        question("A 說會寄給 B 什麼？", [1], "The file.", "The receipt.", "The ticket.", "The package."),
        question("A 說收到檔案後要讀哪一頁？", [1, 2], "The first page.", "The address.", "The report.", "The message."),
        question("有什麼情況時，A 請 B 告知？", [3], "A question.", "A smaller size.", "An appointment.", "An extra blanket."),
        question("在收到閱讀和回覆的請求後，B 說何時可以回覆？", [2, 4], "After lunch.", "Before lunch.", "At eight.", "Next week."),
      ],
    },
    {
      id: "a2-u37", title: "應用：聽懂場所規則",
      lessons: [
        lesson("說明在這裡得保持安靜", "We must stay quiet here.", "我們在這裡必須保持安靜。",
          "must 表必須遵守；stay quiet 表示維持安靜。", "venue-state-keep-quiet",
          "{person} must stay quiet {place}.", "______ must stay quiet ______.", ["誰必須遵守", "要保持安靜的地方"],
          [variant("you", "你在這裡必須保持安靜。", ["You must", "stay quiet here."]),
            variant("there", "我們在那裡必須保持安靜。", ["We must", "stay quiet there."])],
          ["你在這裡必須保持安靜。", "我們可以在外面等。", "我們在這裡不必保持安靜。"], ["a2-u35-l03", "a2-u33-l01", "a2-u28-l02"],
          {
            must: wordUse("must-rule-obligation", "必須", "modal verb 情態助動詞", "表示場所規則"),
            stay: wordUse("stay-keep-state", "保持（接狀態）", verb, "維持狀態"),
            quiet: wordUse("quiet-low-noise", "安靜的", adjective, "保持低音量"),
          }),
        lesson("請對方關門", "Please close the door.", "請把門關上。",
          "close 在這裡是動詞「關上」，字尾發 /z/。可以從 Please 開頭讓指示更禮貌。", "venue-request-close-door",
          "Please {action} the door.", "Please ______ the door.", ["禮貌指示", "門要如何處理"],
          [variant("open", "請把門打開。", ["Please open", "the door."]),
            variant("close-it", "請把它關上。", ["Please close", "it."])],
          ["請把門打開。", "請把地址寫下來。", "這扇門已經關上了。"], ["a2-u37-l01", "a2-u27-l03", "a2-u29-l02"],
          { please: polite, close: wordUse("close-shut-object", "關上", verb, "關門", "動詞 close 的字尾發 /z/。") }),
        lesson("聽懂請勿在室內用餐", "Please do not eat in this room.", "請不要在這個房間吃東西。",
          "Please do not + 原形動詞，可以禮貌地說某件事不能做。", "venue-request-no-eating",
          "Please do not {action} {place}.", "Please do not ______ ______.", ["不能做的事", "規則適用的地方"],
          [variant("drink", "請不要在這個房間喝東西。", ["Please do not drink", "in this room."]),
            variant("that-room", "請不要在那個房間吃東西。", ["Please do not eat", "in that room."])],
          ["請不要在那個房間吃東西。", "請在這個房間吃東西。", "請把門關上。"], ["a2-u37-l01", "a2-u37-l02", "a2-u22-l02"],
          {
            please: polite, do: wordUse("do-negative-auxiliary", "和 not 合用形成否定", "auxiliary verb 助動詞", "形成否定指示"),
            in: wordUse("in-inside-location", "在……裡面", preposition, "規則適用位置"),
            this: wordUse("this-current-room", "這個（指這個房間）", "determiner 限定詞", "說明適用房間"),
          }),
        lesson("知道在哪裡可以喝水", "You can drink water outside.", "你可以到外面喝水。",
          "這裡 can 指允許。outside 放句尾交代允許喝水的位置。", "venue-tell-permitted-location",
          "{person} can drink water {place}.", "______ can drink water ______.", ["被允許的人", "允許的地點"],
          [variant("we", "我們可以到外面喝水。", ["We can drink", "water outside."]),
            variant("here", "你可以在這裡喝水。", ["You can drink", "water here."])],
          ["你可以在這裡喝水。", "我們在這裡必須保持安靜。", "請不要在這個房間吃東西。"], ["a2-u37-l01", "a2-u37-l02", "a2-u37-l03"],
          { you: youSubject, can: wordUse("can-grant-permission", "可以（表示允許）", "modal verb 情態助動詞", "允許的行為"), outside }),
      ],
      passage: [
        line("We must stay quiet here.", "工作人員：我們在這裡必須保持安靜。"),
        line("Please close the door.", "工作人員：請把門關上。"),
        line("Please do not eat in this room.", "工作人員：請不要在這個房間吃東西。"),
        line("You can drink water outside.", "工作人員：你可以到外面喝水。"),
        line("Now I understand.", "訪客：我現在懂了。"),
      ],
      questions: [
        question("訪客在這裡必須怎麼做？", [1], "Stay quiet.", "Wait outside.", "Write the address.", "Open the door."),
        question("工作人員請訪客怎麼處理門？", [2], "Close the door.", "Open the door.", "Check the room.", "Bring the file."),
        question("對照室內規則和室外可做的事，明確禁止的是哪一項？", [3, 4], "Eat in this room.", "Drink water outside.", "Stay quiet here.", "Close the door."),
        question("在哪裡可以喝水？", [4], "Outside.", "Here.", "At school.", "At the station."),
      ],
    },
  ];
};
