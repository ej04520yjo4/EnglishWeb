const noun = "noun 名詞";
const verb = "verb 動詞";
const adverb = "adverb 副詞";
const preposition = "preposition 介系詞";
const modal = "modal verb 情態助動詞";
const pronoun = "pronoun 代名詞";
const comparative = "adjective 形容詞（比較級）";

export const everydayDecisionsForms = (form) => ({
  which: form("which", "determiner 限定詞；pronoun 代名詞"),
  way: form("way", noun),
  faster: form("fast", "adjective 形容詞；adverb 副詞", "FAS・ter", {
    kk: "/ˈfæstɚ/", ipa: "/ˈfæstɚ/", syllables: 2, stress: 1,
  }),
  takes: form("take", "verb 動詞；noun 名詞", "takes", { kk: "/teks/", ipa: "/teɪks/", syllables: 1 }),
  less: form("less", "determiner 限定詞；adverb 副詞；pronoun 代名詞"),
  then: form("then", adverb),
  put: form("put", verb),
  away: form("away", adverb),
  out: form("out", "adverb 副詞；preposition 介系詞"),
  trash: form("trash", "noun 名詞；verb 動詞"),
  cancel: form("cancel", verb, "CAN・cel"),
  order: form("order", "noun 名詞；verb 動詞", "OR・der"),
  details: form("detail", "noun 名詞；verb 動詞", "DE・tails", {
    kk: "/ˈditelz/", ipa: "/ˈditeɪlz/", syllables: 2, stress: 1,
  }),
});

export const everydayDecisionsUnits = ({ lesson, variant, chunk, line, question, wordUse, couldRequest, youSubject }) => {
  const offer = wordUse("can-offer-action", "可以（提出可行做法）", modal, "提出可以做的事");
  const travelTake = wordUse("take-travel-transport", "搭乘", verb, "選擇交通方式");
  const durationTake = wordUse("take-duration", "花費（時間）", verb, "車程所需時間");
  const itTask = wordUse("it-assigned-task", "這件事（指剛提到的家事）", pronoun, "承接剛提到的家事");
  const tenDuration = wordUse("ten-duration-count", "十（用於分鐘數）", "number 數詞", "車程的分鐘數");
  return [
    {
      id: "a2-u38", title: "應用：比較路線與車程",
      lessons: [
        lesson("問哪種走法比較快", "Which way is faster?", "哪種走法比較快？",
          "Which + 名詞用來從已知選項中問是哪一個；faster 是 fast 的比較級。", "route-ask-which-faster",
          "Which {option} is faster?", "Which ______ is faster?", ["從既有選項中詢問", "要比較的項目"],
          [variant("bus", "搭哪一班公車比較快？", ["Which bus", "is faster?"]),
            variant("train", "搭哪一班火車比較快？", ["Which train", "is faster?"])],
          ["搭哪一班公車比較快？", "火車幾點開？", "哪一種走法比較便宜？"], ["a2-u15-l01", "a2-u15-l02", "a2-u33-l03"],
          {
            which: wordUse("which-choice", "哪一個（在選項之中）", "determiner 限定詞", "從選項中挑選"),
            way: wordUse("way-route", "走法／路線", noun, "比較的走法"),
            faster: wordUse("fast-comparative-speed", "比較快", comparative, "比較速度", "fast → faster；兩個走法之中，問哪個速度較快。"),
          }),
        lesson("說明搭公車要多久", "The bus takes ten minutes.", "搭公車要十分鐘。",
          "交通工具 + takes + 時間，說明搭乘要花多久。the bus 是單數，所以用 takes。", "route-state-travel-duration",
          "{transport} takes {time}.", "______ takes ______.", ["交通工具", "所需時間"],
          [variant("train", "搭火車要十分鐘。", ["The train takes", "ten minutes."]),
            variant("three", "搭公車要三分鐘。", ["The bus takes", "three minutes."])],
          ["搭火車要十分鐘。", "公車再十分鐘會來。", "公車票要十元。"], ["a2-u38-l01", "a2-u34-l03", "a2-u29-l04"],
          { takes: durationTake, ten: tenDuration }),
        lesson("說其中一種交通工具比較省時", "The train takes less time.", "搭火車比較省時間。",
          "less time 表示「較少的時間」；這裡不用加 than，因為正在比較的交通方式已經提過。", "route-compare-travel-time",
          "{transport} takes less time.", "______ takes less time.", ["比較的交通工具", "所需時間較少"],
          [variant("bus", "搭公車比較省時間。", ["The bus", "takes less time."]),
            variant("this-train", "搭這班火車比較省時間。", ["This train", "takes less time."])],
          ["搭公車比較省時間。", "搭火車要十分鐘。", "搭火車比較便宜。"], ["a2-u38-l01", "a2-u38-l02", "a2-u03-l02"],
          {
            takes: durationTake, less: wordUse("less-uncountable-quantity", "較少的（接 time）", "determiner 限定詞", "比較所需時間"),
            time: wordUse("time-duration", "時間（指所花的時間）", noun, "所需時間"),
          }, [chunk("less-time", "less time", "較少的時間", "以 less 修飾不可數的 time，表示比較省時。")]),
        lesson("根據剛收到的資訊提議搭車", "We can take the train then.", "那我們可以搭火車。",
          "take the train 是搭火車；句末的 then 在這裡是「那樣的話」，不是「然後」。", "route-suggest-transport-then",
          "{person} can take {transport} then.", "______ can take ______ then.", ["提出建議的人", "根據剛才資訊決定的交通方式"],
          [variant("bus", "那我們可以搭公車。", ["We can take", "the bus then."]),
            variant("i", "那我可以搭火車。", ["I can take", "the train then."])],
          ["那我們可以搭公車。", "搭火車比較省時間。", "那我們可以在外面等。"], ["a2-u38-l02", "a2-u38-l03", "a2-u35-l03"],
          {
            can: offer, take: travelTake, then: wordUse("then-result-of-information", "那樣的話／那就", adverb, "根據剛才資訊提出建議"),
          }, [chunk("take-the-train", "take the train", "搭火車", "take + 交通工具在這裡指搭乘，不是拿取。")]),
      ],
      passage: [
        line("Which way is faster?", "甲：哪種走法比較快？"),
        line("The bus takes ten minutes.", "乙：搭公車要十分鐘。"),
        line("The train takes three minutes.", "乙：搭火車要三分鐘。"),
        line("The train takes less time.", "甲：搭火車比較省時間。"),
        line("We can take the train then.", "甲：那我們可以搭火車。"),
      ],
      questions: [
        question("甲一開始想知道什麼？", [1], "Which way is faster?", "How much does it cost?", "How long is the wait?", "Where do I sign in?"),
        question("搭公車要幾分鐘？", [2], "Ten minutes.", "Three minutes.", "Two minutes.", "A day."),
        question("比較乙說的兩種車程，哪個結論正確？", [2, 3, 4], "The train takes less time.", "The bus takes less time.", "The train takes ten minutes.", "The bus takes three minutes."),
        question("選出甲聽完車程之後提出的建議。", [3, 5], "We can take the train then.", "We can take the bus then.", "We can wait outside.", "We can go home instead."),
      ],
    },
    {
      id: "a2-u39", title: "應用：家事分工與收拾",
      lessons: [
        lesson("主動說會把碗盤收好", "I will put the dishes away.", "我會把碗盤收好。",
          "put something away 是把東西收回原處。若用代名詞，要放在中間：put it away。", "chores-offer-put-away",
          "{person} will put {item} away.", "______ will put ______ away.", ["承諾收拾的人", "要收好的東西"],
          [variant("we", "我們會把碗盤收好。", ["We will put", "the dishes away."]),
            variant("book", "我會把那本書收好。", ["I will put", "the book away."])],
          ["我們會把碗盤收好。", "我會洗碗。", "我會把檔案寄給你。"], ["a2-u06-l02", "a2-u36-l01", "a2-u38-l04"],
          {
            put: wordUse("put-away-verb", "和 away 一起用，表示收好", verb, "收拾碗盤"),
            away: wordUse("away-in-put-away", "和 put 一起用，表示收回原處", adverb, "收回原處"),
          }, [chunk("put-the-dishes-away", "put the dishes away", "把碗盤收好", "把要收拾的物品放在 put 和 away 之間。")]),
        lesson("請對方把垃圾拿出去", "Can you take out the trash?", "可以請你把垃圾拿出去嗎？",
          "take out the trash 是把垃圾拿出去。若 trash 已提過，可以說 take it out；it 要放在中間。", "chores-request-take-out",
          "{request} take {trash}.", "______ take ______.", ["提出請求", "拿出去的東西與位置"],
          [variant("could", "可以麻煩你把垃圾拿出去嗎？", ["Could you take", "out the trash?"]),
            variant("it", "可以請你把它拿出去嗎？", ["Can you take", "it out?"])],
          ["可以請你把那本書收好嗎？", "你有空嗎？", "哪種走法比較快？"], ["a2-u39-l01", "a2-u38-l01", "a2-u35-l01"],
          {
            can: wordUse("can-polite-request", "可以請你……嗎？", modal, "請人做事", "", "grammar"), you: youSubject,
            take: wordUse("take-out-remove", "和 out 一起用，表示拿出去", verb, "把垃圾拿出去"),
            out: wordUse("out-in-take-out", "出去（和 take 一起用）", adverb, "從室內拿到外面"),
            trash: wordUse("trash-household-waste", "垃圾", noun, "要拿出去的物品", "美式英文用 trash 指家庭垃圾，通常是不可數名詞。"),
          }, [chunk("take-out-the-trash", "take out the trash", "把垃圾拿出去", "take out + 名詞；代名詞用 take it out。")]),
        lesson("告知晚餐前可以處理", "I can do it before dinner.", "我可以在晚餐前做這件事。",
          "用 do it 接續剛提到的任務；before + 用餐或活動表示在那之前。", "chores-offer-by-event",
          "I can do it before {event}.", "I can do it before ______.", ["承接要做的事", "完成前的時間參照"],
          [variant("lunch", "我可以在午餐前做這件事。", ["I can do it", "before lunch."]),
            variant("class", "我可以在上課前做這件事。", ["I can do it", "before class."])],
          ["我可以在午餐前做這件事。", "我可以在晚餐後做這件事。", "我會把碗盤收好。"], ["a2-u39-l01", "a2-u38-l02", "a2-u35-l03"],
          {
            can: offer, do: wordUse("do-assigned-task", "做／處理（剛提到的事）", verb, "處理家事"), it: itTask,
            before: wordUse("before-event-time", "在……之前", preposition, "晚餐前"),
          }),
        lesson("提議一起做完", "We can finish together.", "我們可以一起做完。",
          "finish 在雙方都知道要做什麼時，可以不再接受詞；together 放在句末，表示一起。", "chores-finish-together",
          "We can {action} together.", "We can ______ together.", ["共同做事的人", "一起採取的行動"],
          [variant("finish-work", "我們可以一起把這份工作做完。", ["We can finish the work", "together."]),
            variant("check-it", "我們可以一起檢查。", ["We can check it", "together."])],
          ["我們可以一起檢查。", "我可以在晚餐前做這件事。", "我們可以在外面等。"], ["a2-u39-l01", "a2-u39-l03", "a2-u35-l03"],
          { can: offer, finish: wordUse("finish-complete-shared-work", "做完", verb, "完成家事") }),
      ],
      passage: [
        line("I will put the dishes away.", "甲：我會把碗盤收好。"),
        line("Can you take out the trash?", "甲：可以請你把垃圾拿出去嗎？"),
        line("I can do it before dinner.", "乙：我可以在晚餐前做。"),
        line("We can finish together.", "甲：我們可以一起做完。"),
        line("Thank you for the help.", "乙：謝謝你的幫忙。"),
      ],
      questions: [
        question("甲原本說自己要做哪件家事？", [1], "Put the dishes away.", "Put the book away.", "Take out the trash.", "Read the first page."),
        question("甲請乙幫忙做什麼？", [2], "Take out the trash.", "Put the dishes away.", "Send the file.", "Close the door."),
        question("乙說晚餐前可以做的，是甲剛才交代的哪件事？", [2, 3], "Take out the trash.", "Put the dishes away.", "Check the address.", "Read the message."),
        question("哪句表示兩個人可以一起做完？", [4], "We can finish together.", "I can do it before dinner.", "I will put the dishes away.", "We can wait outside."),
      ],
    },
    {
      id: "a2-u40", title: "應用：取消或更改訂單",
      lessons: [
        lesson("表明需要取消訂單", "I need to cancel my order.", "我需要取消我的訂單。",
          "need to + 原形動詞表示有必要做某事；order 在這裡是名詞「訂單」，不是動詞「點餐」。", "order-state-cancellation",
          "I need to cancel {booking}.", "I need to cancel ______.", ["說明需要取消", "被取消的訂單或安排"],
          [variant("appointment", "我需要取消我的預約。", ["I need to cancel", "my appointment."]),
            variant("class", "我需要取消這堂課。", ["I need to cancel", "the class."])],
          ["我需要取消我的預約。", "我可以更改時間嗎？", "我已經寄出了包裹。"], ["a2-u21-l01", "a2-u29-l01", "a2-u27-l02"],
          {
            cancel: wordUse("cancel-stop-arrangement", "取消", verb, "取消購買或安排"),
            order: wordUse("order-purchase-noun", "訂單", noun, "需要取消的訂購", "my order 是我的訂單；order food 裡的 order 是動詞。"),
          }),
        lesson("詢問能否改用別的做法", "Can I change it instead?", "那我可以改一下，不取消嗎？",
          "instead 說明採取另一個做法；這裡的 it 指剛提到的訂單，change it 代替取消訂單。", "order-ask-alternative-instead",
          "Can I {action} instead?", "Can I ______ instead?", ["詢問是否可行", "替代做法"],
          [variant("cancel", "那我可以改成取消訂單嗎？", ["Can I cancel", "my order instead?"]),
            variant("call", "那我可以改成晚一點打來嗎？", ["Can I call", "later instead?"])],
          ["那我可以改成取消訂單嗎？", "我需要取消我的訂單。", "我會把檔案寄給你。"], ["a2-u40-l01", "a2-u21-l01", "a2-u36-l01"],
          {
            can: wordUse("can-ask-permission", "可以……嗎？", modal, "詢問可不可以更改", "", "grammar"),
            it: wordUse("it-mentioned-order", "它（指剛提到的訂單）", pronoun, "指前面提到的訂單"),
            instead: wordUse("instead-alternative-action", "改用另一個做法", adverb, "用更改取代取消"),
          }),
        lesson("請對方寄電子郵件", "Could you send me an email?", "可以麻煩你寄封電子郵件給我嗎？",
          "Could you send + 收件人 + 物品？是禮貌的請求；me 表示收件人是我。", "order-request-email-update",
          "Could you send me {item}?", "Could you send me ______?", ["請人寄給自己", "希望收到的內容"],
          [variant("file", "可以麻煩你把檔案寄給我嗎？", ["Could you send", "me the file?"]),
            variant("message", "可以麻煩你傳個訊息給我嗎？", ["Could you send", "me a message?"])],
          ["可以麻煩你把檔案寄給我嗎？", "我會把檔案寄給你。", "那我可以改一下，不取消嗎？"], ["a2-u40-l01", "a2-u40-l02", "a2-u36-l01"],
          { could: couldRequest, you: youSubject, send: wordUse("send-email-to-recipient", "寄出（郵件）", verb, "寄送電子郵件") }),
        lesson("表示自己會核對細節", "I will check the details.", "我會核對細節。",
          "check the details 表示核對已知資料中的細節；details 的單數原形是 detail。", "order-confirm-check-details",
          "{person} will check {item}.", "______ will check ______.", ["會執行核對的人", "要核對的內容"],
          [variant("we", "我們會核對細節。", ["We will check", "the details."]),
            variant("address", "我會核對地址。", ["I will check", "the address."])],
          ["我會核對地址。", "可以麻煩你寄封電子郵件給我嗎？", "我需要取消我的訂單。"], ["a2-u40-l01", "a2-u40-l02", "a2-u40-l03"],
          {
            check: wordUse("check-order-information", "核對", verb, "確認更新後的訂單資料"),
            details: wordUse("detail-information-plural", "細節（複數）", noun, "要核對的訂單資訊", "detail 是細節；多項細節通常用 details。"),
          }, [chunk("check-the-details", "check the details", "核對細節", "例如查看訂單內容，確認改好的資訊。")]),
      ],
      passage: [
        line("I need to cancel my order.", "顧客：我需要取消我的訂單。"),
        line("Can I change it instead?", "顧客：那我可以改一下，不取消嗎？"),
        line("You can change it today.", "客服：你今天可以更改。"),
        line("Could you send me an email?", "顧客：可以麻煩你寄封電子郵件給我嗎？"),
        line("I will send you an email.", "客服：我會寄電子郵件給你。"),
        line("I will check the details.", "顧客：我會核對細節。"),
      ],
      questions: [
        question("顧客一開始想取消什麼？", [1], "My order.", "My appointment.", "The first class.", "The next class."),
        question("顧客提出了哪個替代做法，客服回答今天可以？", [1, 2, 3], "Change it.", "Cancel the order.", "Read the first page.", "Call later."),
        question("顧客在得知今天可以更改後，請客服寄什麼？", [3, 4, 5], "An email.", "The report.", "The file.", "The address."),
        question("客服答應寄出通知以後，顧客說會做什麼？", [5, 6], "Check the details.", "Check the address.", "Send the file.", "Cancel the class."),
      ],
    },
  ];
};
