const noun = "noun 名詞";
const verb = "verb 動詞";
const adverb = "adverb 副詞";
const adjective = "adjective 形容詞";
const modal = "modal verb 情態助動詞";
const preposition = "preposition 介系詞";
const past = "verb 動詞（過去式）";

export const followThroughForms = (form) => ({
  meat: form("meat", noun),
  without: form("without", "preposition 介系詞；adverb 副詞", "with・OUT"),
  rice: form("rice", noun),
  finish: form("finish", "verb 動詞；noun 名詞", "FIN・ish"),
  let: form("let", verb),
  know: form("know", verb),
  got: form("get", verb, "got", { kk: "/ɡɑt/", ipa: "/ɡɑt/", syllables: 1 }),
  was: form("be", "verb 動詞；auxiliary verb 助動詞", "was", {
    kk: "/wʌz/", ipa: "/wʌz/", syllables: 1,
  }),
  already: form("already", adverb, "al・READ・y"),
  closed: form("close", "verb 動詞；adjective 形容詞；adverb 副詞", "closed", {
    kk: "/klozd/", ipa: "/kloʊzd/", syllables: 1,
  }),
});

export const followThroughUnits = ({ lesson, variant, chunk, line, question, wordUse }) => {
  const itMeal = wordUse("it-refer-to-meal", "它（指剛提到的餐點）", "pronoun 代名詞", "代指餐點");
  const haveFood = wordUse("have-food-order", "要／點（餐點）", verb, "點餐", "have 在點餐時可指想點的東西，不是已經持有。");
  const finish = wordUse("finish-complete-work", "完成", verb, "把事情做完");
  const will = wordUse("will-immediate-decision", "將會（表示決定）", modal, "說話時做的決定", "", "grammar");
  return [
    {
      id: "a2-u23", title: "應用：餐點成分與替代選擇",
      lessons: [
        lesson("詢問餐點含不含某種成分", "Does this have meat in it?", "這道菜裡有肉嗎？",
          "Does this have + 成分 + in it？詢問這個餐點裡有沒有某成分。", "meal-ask-about-ingredient",
          "Does this have {ingredient} in it?", "Does this have ______ in it?", ["問餐點含不含", "確認成分"],
          [variant("tea", "這裡面有茶嗎？", ["Does this have", "tea in it?"]),
            variant("coffee", "這裡面有咖啡嗎？", ["Does this have", "coffee in it?"])],
          ["這道菜裡有飯嗎？", "這道菜裡沒有肉。", "我想點那道有肉的菜。"], ["a2-u12-l01", "a2-u12-l02", "a2-u14-l04"],
          {
            does: wordUse("do-singular-question", "單數主詞問句的助動詞", "auxiliary verb 助動詞", "形成問句", "Does 後的主要動詞用 have。", "grammar"),
            this: wordUse("this-current-dish", "這道菜／這份餐點", "pronoun 代名詞", "代指前面的餐點"),
            have: wordUse("have-ingredient-contain", "含有", verb, "描述成分"),
            meat: wordUse("meat-food", "肉", noun, "餐點成分"),
            in: wordUse("in-ingredient-content", "在裡面", preposition, "指出成分的位置", "", "grammar"),
            it: itMeal,
          }),
        lesson("表示自己不吃某種食物", "I do not eat meat.", "我不吃肉。",
          "I／We + do not + 原形動詞可說明習慣或選擇；不表示過去沒做過。", "meal-describe-diet-choice",
          "{person} do not {choice}.", "______ do not ______.", ["說明自己的選擇", "不吃喝的東西"],
          [variant("we", "我們不吃肉。", ["We do not", "eat meat."]),
            variant("coffee", "我不喝咖啡。", ["I do not", "drink coffee."])],
          ["我們不吃肉。", "我不喝咖啡。", "我想點一份有肉的菜。"], ["a2-u23-l01", "a2-u12-l02", "a2-u12-l03"],
          {
            do: wordUse("do-negative-auxiliary", "構成否定句的助動詞", "auxiliary verb 助動詞", "形成否定句", "", "grammar"),
            not: wordUse("not-habit-negation", "不（否定習慣）", adverb, "表示不做", "", "grammar"),
          }, [chunk("do-not", "do not", "不……", "一般現在式中，後接原形動詞。")]),
        lesson("詢問能不能不要加某種食材", "Can I have it without meat?", "這道菜可以做成不加肉嗎？",
          "without + 成分表示不含某物；用 Can I have…? 詢問是否可調整。", "meal-request-without-ingredient",
          "{request} have it without {ingredient}?", "______ have it without ______?", ["詢問能否調整", "要拿掉的成分"],
          [variant("tea", "這份可以不加茶嗎？", ["Can I", "have it without tea?"]),
            variant("could", "能不能幫我做成不加肉？", ["Could I", "have it without meat?"])],
          ["這份可以不加茶嗎？", "這道菜可以加肉嗎？", "這道菜裡有肉嗎？"], ["a2-u23-l01", "a2-u23-l02", "a2-u12-l04"],
          {
            can: wordUse("can-interactive-permission", "可以……嗎？", modal, "詢問是否能調整餐點", "", "grammar"),
            have: haveFood, it: itMeal, without: wordUse("without-leaving-out", "不加／不含", preposition, "排除的成分"),
          }),
        lesson("改選一道可吃的餐點", "I will have rice instead.", "那我改點飯。",
          "I will have + 餐點表示選定；instead 表示以這個選項替代原本的。", "meal-choose-alternative",
          "I will have {item} instead.", "I will have ______ instead.", ["當下選定", "替代餐點"],
          [variant("tea", "那我改點茶。", ["I will have", "tea instead."]),
            variant("water", "那我改點水。", ["I will have", "water instead."])],
          ["那我改點茶。", "我不吃飯。", "我剛才已經點了飯。"], ["a2-u23-l01", "a2-u23-l02", "a2-u23-l03"],
          { will, have: haveFood, rice: wordUse("rice-food", "飯／米飯", noun, "選來替代的餐點") }),
      ],
      passage: [
        line("Does this have meat in it?", "客人：這道菜裡有肉嗎？"),
        line("We use meat.", "店員：我們會用肉。"),
        line("I do not eat meat.", "客人：我不吃肉。"),
        line("Can I have it without meat?", "客人：這道菜可以做成不加肉嗎？"),
        line("We have rice.", "店員提出另一個選項：我們有飯。"),
        line("I will have rice instead.", "客人：那我改點飯。"),
      ],
      questions: [
        question("一開始客人問菜裡有沒有什麼？", [1], "Meat.", "Tea.", "Coffee.", "Water."),
        question("客人說自己的飲食選擇是什麼？", [2, 3], "I do not eat meat.", "I do not drink coffee.", "I prefer tea to coffee.", "I would rather eat at home."),
        question("客人先提出哪種調整？", [4], "Without meat.", "Without tea.", "A smaller size.", "More slowly."),
        question("聽完另一個選項後，客人最後改點什麼？", [5, 6], "Rice.", "Meat.", "Water.", "Tea."),
      ],
    },
    {
      id: "a2-u24", title: "應用：延長時間與回覆期限",
      lessons: [
        lesson("直接說明需要更多時間", "I need more time.", "我需要多一點時間。",
          "more + 名詞表示需要更多數量；more time 是更多時間。", "deadline-need-more-time",
          "{person} need more {resource}.", "______ need more ______.", ["誰有需要", "想增加的東西"],
          [variant("we", "我們需要多一點時間。", ["We", "need more time."]),
            variant("water", "我需要多一點水。", ["I", "need more water."])],
          ["我們需要多一點時間。", "我不需要更多時間。", "我想確認新的時間。"], ["a2-u21-l04", "a2-u21-l01", "a2-u16-l04"],
          { more: wordUse("more-greater-quantity", "更多的", "determiner 限定詞", "時間增加") }),
        lesson("提出明天完成的可能性", "Could we finish this tomorrow?", "我們可以明天把這件事做完嗎？",
          "Could we + 原形動詞？用來協商做法；tomorrow 放句尾。", "deadline-negotiate-finish-time",
          "Could we finish {item} {time}?", "Could we finish ______ ______?", ["詢問能否完成", "完成時間"],
          [variant("today", "我們可以今天把這件事做完嗎？", ["Could we finish this", "today?"]),
            variant("report", "我們可以明天把報告做完嗎？", ["Could we finish the report", "tomorrow?"])],
          ["我們可以今天把這件事做完嗎？", "我會明天把這件事做完。", "我們明天可以再約嗎？"], ["a2-u24-l01", "a2-u16-l01", "a2-u21-l03"],
          { finish, this: wordUse("this-current-task", "這件事", "pronoun 代名詞", "正談到的工作") }),
        lesson("給出明確的最晚時間", "I can finish it by Friday.", "我最晚可以在星期五完成。",
          "by Friday 表示最晚到星期五，不是只能在星期五那一天做。", "deadline-give-latest-finish-time",
          "I can finish {item} by {deadline}.", "I can finish ______ by ______.", ["可完成的事情", "最晚時間"],
          [variant("saturday", "我最晚可以在星期六完成。", ["I can finish it", "by Saturday."]),
            variant("report", "我最晚可以在星期五完成報告。", ["I can finish the report", "by Friday."])],
          ["我最晚可以在星期六完成。", "我到星期五才開始。", "我已經在星期五完成了。"], ["a2-u24-l01", "a2-u24-l02", "a2-u16-l01"],
          {
            can: wordUse("can-offer-action", "可以（表示有能力完成）", modal, "提供可行時間"),
            finish,
            it: wordUse("it-task-reference", "它（指正在談的工作）", "pronoun 代名詞", "代指工作"),
            by: wordUse("by-deadline", "最晚到……", preposition, "完成期限", "by Friday 包含星期五；不要和 before Friday 混淆。", "grammar"),
          }, [chunk("by-friday-deadline", "by Friday", "最晚到星期五", "指出完成的最晚時點。")]),
        lesson("答應之後再通知對方", "I will let you know.", "我會再告訴你。",
          "let someone know 是通知某人的常用說法；you 放在 let 和 know 中間。", "deadline-promise-to-update",
          "{person} will let {recipient} know.", "______ will let ______ know.", ["承諾會通知", "通知對象"],
          [variant("we", "我們會再告訴你。", ["We will let", "you know."]),
            variant("manager", "我會通知我的主管。", ["I will let", "my manager know."])],
          ["我們會再告訴你。", "我會等你來通知我。", "我已經告訴你了。"], ["a2-u24-l01", "a2-u24-l02", "a2-u24-l03"],
          {
            will, let: wordUse("let-inform-expression", "與 know 合用表示通知", verb, "組成通知說法"),
            you: wordUse("you-object-recipient", "你（受詞）", "pronoun 代名詞", "通知對象", "", "grammar"),
            know: wordUse("know-be-informed", "得知", verb, "收到資訊", "let you know 不是要求對方自己知道。"),
          }, [chunk("let-you-know", "let you know", "通知你", "整組用來表示之後會把資訊告訴對方。")]),
      ],
      passage: [
        line("I need more time.", "A：我需要多一點時間。"),
        line("Could we finish this tomorrow?", "B：我們可以明天把這件事做完嗎？"),
        line("I can finish it by Friday.", "A：我最晚可以在星期五完成。"),
        line("Friday afternoon works for me.", "B：星期五下午我可以。"),
        line("I will let you know.", "A：我會再告訴你。"),
      ],
      questions: [
        question("一開始 A 說需要什麼？", [1], "More time.", "A larger size.", "A different cable.", "More water."),
        question("B 一開始提議哪一天完成？", [2], "Tomorrow.", "Today.", "Tonight.", "Next week."),
        question("A 說最晚星期五完成；B 可以接受星期五哪個時段？", [3, 4], "Friday afternoon.", "Saturday morning.", "Tuesday afternoon.", "Friday morning."),
        question("談到可行的時段後，A 答應什麼？", [4, 5], "I will let you know.", "I need more time.", "I will take the bus instead.", "I can call you back after lunch."),
      ],
    },
    {
      id: "a2-u25", title: "應用：敘述經過與後續行動",
      lessons: [
        lesson("說明到達得比較晚", "I got to the store late.", "我到商店時已經晚了。",
          "got 是 get 的不規則過去式；get to + 地點是「到達」。", "story-got-to-place-late",
          "{person} got to {place} late.", "______ got to ______ late.", ["誰到了", "到達的地方與時間"],
          [variant("station", "我到車站時已經晚了。", ["I got to", "the station late."]),
            variant("we", "我們到商店時已經晚了。", ["We got to", "the store late."])],
          ["我到車站時已經晚了。", "我很早就到商店。", "商店開到很晚。"], ["a2-u17-l01", "a2-u15-l01", "a2-u01-l02"],
          {
            got: wordUse("get-arrive-past", "到達了", past, "過去到達"),
            to: wordUse("to-destination", "到（接目的地）", preposition, "到達的地點", "", "grammar"),
            late: wordUse("late-after-expected-time", "晚了／較晚地", adverb, "到達時間"),
          }),
        lesson("敘述當時店家已關門", "The store was already closed.", "商店當時已經關門了。",
          "was 描述過去的狀態。already closed 表示在到達時就已經關門。", "story-past-already-closed",
          "{place} was already closed.", "______ was already closed.", ["當時的地點", "已經關門"],
          [variant("library", "圖書館當時已經關門了。", ["The library", "was already closed."]),
            variant("school", "學校當時已經關門了。", ["The school", "was already closed."])],
          ["圖書館當時已經關門了。", "商店當時還營業。", "商店現在才要關門。"], ["a2-u25-l01", "a2-u17-l04", "a2-u18-l04"],
          {
            was: wordUse("be-past-linking-state", "連接過去的狀態", "linking verb 連綴動詞（過去式）", "描述當時狀態", "was 是 is／am 的過去式。", "grammar"),
            already: wordUse("already-before-reference", "已經", adverb, "早於當時"),
            closed: wordUse("close-not-open-state", "已關門／不營業的", adjective, "店家的狀態"),
          }),
        lesson("敘述後來再去一趟", "I went back this morning.", "我今天早上又去了一趟。",
          "went back 是 go back 的過去式，指回到前面提過的地方。", "story-went-back-at-time",
          "{person} went back {time}.", "______ went back ______.", ["再次回去的人", "回去的時間"],
          [variant("afternoon", "我今天下午又去了一趟。", ["I went back", "this afternoon."]),
            variant("we", "我們今天早上又去了一趟。", ["We went back", "this morning."])],
          ["我今天下午又去了一趟。", "我昨晚又去了一趟。", "我今天早上沒有再去。"], ["a2-u25-l01", "a2-u25-l02", "a2-u16-l01"],
          {
            went: wordUse("go-back-past", "去了（go 的過去式）", past, "重新前往"),
            back: wordUse("back-to-previous-place", "回去（接在 went 後）", adverb, "回到原地"),
            this: wordUse("this-current-time-period", "今天的（與 morning 搭配）", "determiner 限定詞", "本日時間", "", "context"),
          }, [chunk("went-back", "went back", "回去了一趟", "回到前面提過的地點。")]),
        lesson("說明最後買了什麼", "I bought a new bag today.", "我今天買了一個新包包。",
          "bought 是 buy 的不規則過去式；today 可以和已經發生的過去動作搭配。", "story-bought-item-today",
          "I bought {item} today.", "I bought ______ today.", ["敘述買到的東西", "完成動作的日期"],
          [variant("book", "我今天買了一本新書。", ["I bought a new book", "today."]),
            variant("shirt", "我今天買了一件新襯衫。", ["I bought a new shirt", "today."])],
          ["我今天買了一本新書。", "我今天弄丟了一個新包包。", "我明天要買一個新包包。"], ["a2-u25-l01", "a2-u25-l02", "a2-u25-l03"],
          { bought: wordUse("buy-purchase-past", "買了", past, "完成購買", "buy → bought，不是 buyed。") }),
      ],
      passage: [
        line("I got to the store late last night.", "我昨晚很晚才到商店。"),
        line("The store was already closed.", "商店當時已經關門了。"),
        line("I went back this morning.", "我今天早上又去了一趟。"),
        line("I bought a new bag today.", "我今天買了一個新包包。"),
        line("It is a black bag.", "那是一個黑色的包包。"),
      ],
      questions: [
        question("這個人第一次是何時到商店？", [1], "Last night.", "This morning.", "This afternoon.", "Tomorrow morning."),
        question("對照到店時間與第二句，到商店時是什麼情況？", [1, 2], "The store was already closed.", "The train is late.", "The room is too cold.", "The file is ready for you."),
        question("這個人後來何時再去？", [2, 3], "This morning.", "Last night.", "After dinner.", "Next week."),
        question("對照最後兩句，最後買到什麼？", [4, 5], "A black bag.", "A black cellphone.", "A new book.", "A new shirt."),
      ],
    },
  ];
};
