const noun = "noun 名詞";
const verb = "verb 動詞";
const adverb = "adverb 副詞";
const pronoun = "pronoun 代名詞";
const determiner = "determiner 限定詞";
const preposition = "preposition 介系詞";
const modal = "modal verb 情態助動詞";

export const serviceForms = (form) => ({
  sell: form("sell", verb),
  milk: form("milk", "noun 名詞；verb 動詞"),
  bags: form("bag", "noun 名詞；verb 動詞", "bags", {
    kk: "/bæɡz/", ipa: "/bæɡz/", syllables: 1,
  }),
  pay: form("pay", "verb 動詞；noun 名詞"),
  sign: form("sign", "verb 動詞；noun 名詞"),
  here: form("here", adverb),
  class: form("class", "noun 名詞；verb 動詞"),
  what: form("what", "pronoun 代名詞；determiner 限定詞"),
  start: form("start", "verb 動詞；noun 名詞"),
  ends: form("end", "verb 動詞；noun 名詞", "ends", {
    kk: "/ɛndz/", ipa: "/ɛndz/", syllables: 1,
  }),
  running: form("run", "verb 動詞；noun 名詞", "RUN・ning", {
    kk: "/ˈrʌnɪŋ/", ipa: "/ˈɹʌnɪŋ/", syllables: 2, stress: 1,
  }),
  little: form("little", "adjective 形容詞；adverb 副詞", "LIT・tle"),
  later: form("late", "adjective 形容詞；adverb 副詞", "LA・ter", {
    kk: "/ˈletɚ/", ipa: "/ˈleɪtɚ/", syllables: 2, stress: 1,
  }),
  be: form("be", "verb 動詞；auxiliary verb 助動詞"),
  there: form("there", adverb),
  minutes: form("minute", noun, "MIN・utes", {
    kk: "/ˈmɪnəts/", ipa: "/ˈmɪnəts/", syllables: 2, stress: 1,
  }),
  waiting: form("wait", "verb 動詞；noun 名詞", "WAIT・ing", {
    kk: "/ˈwetɪŋ/", ipa: "/ˈweɪtɪŋ/", syllables: 2, stress: 1,
  }),
});

export const serviceUnits = ({ lesson, variant, chunk, line, question, wordUse, youSubject }) => {
  const canAsk = wordUse("can-interactive-permission", "可以……嗎？", modal, "詢問可行做法");
  const itEvent = wordUse("it-event-reference", "它（指前面提到的課程或活動）", pronoun, "代指活動");
  const willPlan = wordUse("will-immediate-decision", "會（表示決定或預計）", modal, "接下來的做法");
  return [
    {
      id: "a2-u32", title: "應用：超市購物與份量",
      lessons: [
        lesson("用包裝單位說需要多少", "I need a bag of rice.", "我需要一包米。",
          "a bag of + 食物說明一包的份量；這裡 rice 指超市要買的米。", "grocery-need-bag-of-food",
          "{person} need a bag of {food}.", "______ need a bag of ______.", ["提出需求", "要買的東西和份量"],
          [variant("we", "我們需要一包米。", ["We", "need a bag of rice."]),
            variant("would-like", "我想要一包米。", ["I would like", "a bag of rice."])],
          ["我們需要一包米。", "我需要一杯茶。", "我想要一個空袋子。"], ["a2-u12-l02", "a2-u24-l01", "a2-u23-l04"],
          {
            bag: wordUse("bag-food-package", "一包（這裡指包裝單位）", noun, "商品份量"),
            of: wordUse("of-quantity-content", "接包裝裡的東西", preposition, "連接份量與商品"),
            rice: wordUse("rice-food", "米（這裡是尚未煮的米）", noun, "要買的食品"),
          }, [chunk("a-bag-of", "a bag of", "一包……", "用袋裝份量說明要買多少。")]),
        lesson("詢問店家是否有賣", "Do you sell milk?", "你們有賣牛奶嗎？",
          "Do you sell…? 可直接問店家是否販售某商品。you 可以指店家，不一定指一人。", "grocery-ask-whether-sells",
          "Do you sell {item}?", "Do you sell ______?", ["詢問有沒有賣", "想買的東西"],
          [variant("rice", "你們有賣米嗎？", ["Do you sell", "rice?"]),
            variant("tea", "你們有賣茶嗎？", ["Do you sell", "tea?"])],
          ["你們有賣米嗎？", "你們喝牛奶嗎？", "牛奶多少錢？"], ["a2-u32-l01", "a2-u29-l03", "a2-u14-l04"],
          {
            do: wordUse("do-regular-question", "一般現在式問句的助動詞", "auxiliary verb 助動詞", "形成問句"),
            you: youSubject, sell: wordUse("sell-retail-item", "販售／賣", verb, "是否有賣"),
            milk: wordUse("milk-food", "牛奶", noun, "要買的商品"),
          }),
        lesson("選定要兩包米", "I will take two bags of rice.", "我要兩包米。",
          "I will take… 在購物時可用來選定商品；two 後面用複數 bags。", "grocery-choose-quantity",
          "{person} will take {quantity}.", "______ will take ______.", ["選定要買", "數量與商品"],
          [variant("one", "我要一包米。", ["I will take", "a bag of rice."]),
            variant("we", "我們要兩包米。", ["We will take", "two bags of rice."])],
          ["我要一包米。", "我們要兩包米。", "你們有賣米嗎？"], ["a2-u32-l01", "a2-u32-l02", "a2-u23-l04"],
          {
            will: willPlan,
            take: wordUse("take-buy-chosen-item", "要買／要這個", verb, "選定商品", "這裡 take 指選購，不是搭車。"),
            two: wordUse("two-item-quantity", "兩個單位", "number 數詞", "購買數量"),
            bags: wordUse("bag-food-package", "包（複數）", noun, "商品包數", "單數 bag；兩包用 bags。"),
          }, [chunk("two-bags-of", "two bags of", "兩包……", "數量超過一包時，bag 加 s。")]),
        lesson("詢問能不能刷卡", "Can I pay by card?", "我可以刷卡嗎？",
          "pay by card 表示刷卡或使用卡片付款。by 接付款方式，不是在說截止日期。", "grocery-ask-to-pay-by-card",
          "{request} pay by card?", "______ pay by card?", ["詢問可否", "刷卡付款"],
          [variant("we", "我們可以刷卡嗎？", ["Can we", "pay by card?"]),
            variant("could", "可以讓我刷卡嗎？", ["Could I", "pay by card?"])],
          ["我們可以刷卡嗎？", "我需要辦一張卡嗎？", "這個可以退嗎？"], ["a2-u20-l02", "a2-u32-l02", "a2-u14-l01"],
          {
            can: canAsk, pay: wordUse("pay-purchase-payment", "付錢", verb, "付款"),
            by: wordUse("by-payment-method", "用（接付款方式）", preposition, "付款方式"),
            card: wordUse("card-payment-card", "付款用的卡片", noun, "用來付款"),
          }, [chunk("pay-by-card", "pay by card", "刷卡付款", "購物或外食結帳時使用。")]),
      ],
      passage: [
        line("I need a bag of rice.", "顧客：我需要一包米。"),
        line("Do you sell milk?", "顧客：你們有賣牛奶嗎？"),
        line("We sell milk.", "店員：我們有賣牛奶。"),
        line("I will take two bags of rice.", "顧客選定後：我要兩包米。"),
        line("Can I pay by card?", "顧客：我可以刷卡嗎？"),
      ],
      questions: [
        question("顧客一開始說需要什麼？", [1], "A bag of rice.", "A cup of tea.", "A smaller size.", "A train ticket."),
        question("顧客詢問後，店員確認有賣什麼？", [2, 3], "Milk.", "Tea.", "Coffee.", "Water."),
        question("對照開始的需求，最後顧客選了多少米？", [1, 4], "Two bags of rice.", "A bag of rice.", "Two bags of tea.", "A cup of rice."),
        question("最後顧客問了哪一種付款方式？", [5], "By card.", "After lunch.", "At the store.", "On Friday."),
      ],
    },
    {
      id: "a2-u33", title: "應用：參加活動與報到",
      lessons: [
        lesson("詢問在哪裡簽到", "Where do I sign in?", "我要在哪裡簽到？",
          "sign in 在活動情境指簽到。Where do I…? 詢問該在哪裡做某事。", "event-ask-where-to-sign-in",
          "Where {request} sign in?", "Where ______ sign in?", ["詢問簽到地點", "報到的動作"],
          [variant("can", "我可以在哪裡簽到？", ["Where can I", "sign in?"]),
            variant("we", "我們要在哪裡簽到？", ["Where do we", "sign in?"])],
          ["我們要在哪裡簽到？", "我要去哪裡領包包？", "圖書館怎麼走？"], ["a2-u19-l03", "a2-u17-l01", "a2-u13-l02"],
          {
            sign: wordUse("sign-attendance", "簽名（和 in 一起指簽到）", verb, "報到登記"),
            in: wordUse("in-sign-in-particle", "sign in 的一部分", "particle 小品詞", "與 sign 構成簽到"),
          }, [chunk("sign-in", "sign in", "簽到／報到", "參加活動時用於登記出席。")]),
        lesson("說明是來上課的", "I am here for the class.", "我是來上這堂課的。",
          "I am here for… 可在櫃檯說明來訪目的。for 後接活動或要辦的事情。", "event-state-purpose-of-visit",
          "I am here for {event}.", "I am here for ______.", ["說明來這裡", "到訪的目的"],
          [variant("appointment", "我是來赴預約的。", ["I am here for", "the appointment."]),
            variant("package", "我是來領包裹的。", ["I am here for", "the package."])],
          ["我是來赴預約的。", "我是來領包裹的。", "我要在哪裡簽到？"], ["a2-u33-l01", "a2-u21-l01", "a2-u20-l01"],
          {
            here: wordUse("here-current-location", "在這裡", adverb, "現在所在的地方"),
            for: wordUse("for-visit-purpose", "為了（接來訪目的）", preposition, "來這裡的原因"),
            class: wordUse("class-lesson-session", "課／一堂課", noun, "要參加的課"),
          }),
        lesson("詢問活動何時開始", "What time does it start?", "它幾點開始？",
          "What time 問鐘點；主詞為 it 時用 does，後面用原形 start。", "event-ask-start-time",
          "What time does {event} start?", "What time does ______ start?", ["詢問鐘點", "活動開始"],
          [variant("class", "這堂課幾點開始？", ["What time does", "the class start?"]),
            variant("appointment", "預約幾點開始？", ["What time does", "the appointment start?"])],
          ["它幾點結束？", "它明天開始嗎？", "我要在哪裡簽到？"], ["a2-u33-l01", "a2-u33-l02", "a2-u15-l02"],
          {
            what: wordUse("what-asking-clock-time", "哪個（和 time 一起問幾點）", determiner, "詢問鐘點"),
            it: itEvent, start: wordUse("start-event-begin", "開始", verb, "活動開始"),
          }, [chunk("what-time", "What time", "幾點", "用來詢問具體鐘點。")]),
        lesson("回答活動幾點結束", "It ends at eight.", "它八點結束。",
          "活動是單數，end 加 s。at 接鐘點；at eight 表示八點。", "event-state-end-time",
          "{event} ends at {time}.", "______ ends at ______.", ["說明活動結束", "結束鐘點"],
          [variant("nine", "它九點結束。", ["It ends", "at nine."]),
            variant("the-class", "這堂課十點結束。", ["The class ends", "at ten."])],
          ["它九點結束。", "它八點開始。", "它今天不會結束。"], ["a2-u33-l01", "a2-u33-l02", "a2-u33-l03"],
          {
            it: itEvent, ends: wordUse("end-event-finish", "結束", "verb 動詞（第三人稱單數）", "活動結束"),
            at: wordUse("at-clock-time", "在（接鐘點）", preposition, "結束時間"),
          }),
      ],
      passage: [
        line("I am here for the class.", "學員：我是來上這堂課的。"),
        line("Where do I sign in?", "學員：我要在哪裡簽到？"),
        line("You can sign in here.", "工作人員：你可以在這裡簽到。"),
        line("What time does it start?", "學員：它幾點開始？"),
        line("We start at seven.", "工作人員：我們七點開始。"),
        line("It ends at eight.", "工作人員：八點結束。"),
      ],
      questions: [
        question("這位學員來參加什麼？", [1], "The class.", "The appointment.", "The job.", "The dinner."),
        question("對照提問與答覆，工作人員說在哪裡簽到？", [2, 3], "Here.", "At home.", "At the station.", "On the left."),
        question("幾點開始上課？", [4, 5], "At seven.", "At eight.", "At nine.", "At ten."),
        question("對照開始時間，結束時間是哪個？", [5, 6], "At eight.", "At seven.", "At nine.", "At ten."),
      ],
    },
    {
      id: "a2-u34", title: "應用：告知晚到與道歉",
      lessons: [
        lesson("告知自己會晚到", "I am running late.", "我會晚一點到。",
          "be running late 是快要遲到或行程落後的常見說法；running 不表示真的在跑步。", "meet-report-running-late",
          "{person} {be} running late.", "______ ______ running late.", ["誰會晚到", "比預期晚"],
          [variant("she", "她會晚一點到。", ["She", "is running late."]),
            variant("he", "他會晚一點到。", ["He", "is running late."])],
          ["她會晚一點到。", "我已經到了。", "火車原本就會晚到。"], ["a2-u15-l01", "a2-u25-l01", "a2-u26-l01"],
          {
            am: wordUse("be-present-continuous", "和 running 一起構成現在進行式", "auxiliary verb 助動詞", "現在發生的情況"),
            running: wordUse("run-late-formula", "行程落後（與 late 合用）", "verb 動詞（現在分詞）", "快要遲到"),
            late: wordUse("late-after-expected-time", "晚了／來不及準時", adverb, "超過預定時間"),
          }, [chunk("running-late", "running late", "會晚一點到", "通常用來告知別人自己無法準時。")]),
        lesson("詢問能不能晚一點見面", "Can we meet a little later?", "我們可以晚一點見面嗎？",
          "later 是更晚／稍後；a little later 表示只往後延一點。", "meet-request-slightly-later",
          "{request} meet a little later?", "______ meet a little later?", ["詢問能否改時間", "想晚一點見面"],
          [variant("could", "能不能晚一點見面？", ["Could we", "meet a little later?"]),
            variant("later", "我們可以稍後再見面嗎？", ["Can we", "meet later?"])],
          ["我們可以早一點見面嗎？", "我們晚點要去哪裡？", "我大概會晚到。"], ["a2-u34-l01", "a2-u19-l03", "a2-u21-l03"],
          {
            can: canAsk, little: wordUse("little-small-degree", "一點點", "adjective 形容詞", "表示程度很小"),
            later: wordUse("late-comparative-time", "更晚／較晚", adverb, "延後時間"),
          }, [chunk("a-little-later", "a little later", "晚一點", "用來委婉提出改晚一點。")]),
        lesson("說預計幾分鐘後到", "I will be there in ten minutes.", "我再十分鐘就會到那裡。",
          "be there 在這裡表示抵達當地。in ten minutes 表示從現在起再過十分鐘。", "meet-estimate-arrival-in-minutes",
          "{person} will be there in {duration}.", "______ will be there in ______.", ["表示會到", "距現在還要多久"],
          [variant("eight", "我再八分鐘就會到那裡。", ["I will be there", "in eight minutes."]),
            variant("we", "我們再十分鐘就會到那裡。", ["We will be there", "in ten minutes."])],
          ["我再八分鐘就會到那裡。", "我十分鐘前就到了。", "我們可以晚一點見面嗎？"], ["a2-u34-l01", "a2-u34-l02", "a2-u33-l04"],
          {
            will: willPlan, be: wordUse("be-present-at-destination", "在（這裡指到達後會在場）", verb, "預期抵達"),
            there: wordUse("there-agreed-location", "在那裡", adverb, "約好的地點"),
            in: wordUse("in-future-duration", "再過（接時間長度）", preposition, "從現在起到抵達"),
            minutes: wordUse("minute-duration", "分鐘（複數）", noun, "時間單位"),
          }, [chunk("in-ten-minutes", "in ten minutes", "再過十分鐘", "和十點鐘 at ten 不同。")]),
        lesson("向等候的人道謝", "Thank you for waiting.", "謝謝你等我。",
          "Thank you for + 名詞或動詞 ing，可說明為什麼道謝；for waiting 指謝謝對方等候。", "meet-thank-for-waiting",
          "Thank you for {reason}.", "Thank you for ______.", ["道謝", "感謝的事"],
          [variant("waiting-here", "謝謝你在這裡等我。", ["Thank you for", "waiting here."]),
            variant("message", "謝謝你傳來的訊息。", ["Thank you for", "the message."])],
          ["謝謝你傳來訊息。", "我會等你十分鐘。", "我會晚一點到。"], ["a2-u34-l01", "a2-u34-l02", "a2-u34-l03"],
          {
            you: wordUse("you-object-thanks", "你（受詞）", pronoun, "感謝對象"),
            for: wordUse("for-reason-gratitude", "用來接感謝的事情", preposition, "道謝原因"),
            waiting: wordUse("wait-stay-until-arrival", "等候", "verb 動詞（動名詞）", "對方等候的行為"),
          }),
      ],
      passage: [
        line("I am running late.", "A：我會晚一點到。"),
        line("Can we meet a little later?", "A：我們可以晚一點見面嗎？"),
        line("I can stay at the station.", "B：我可以留在車站。"),
        line("I will be there in ten minutes.", "A：我再十分鐘就會到那裡。"),
        line("Thank you for waiting.", "A：謝謝你等我。"),
      ],
      questions: [
        question("A 用哪一句告知自己會晚到？", [1], "I am running late.", "I am not sure.", "I need more time.", "I can finish it by Friday."),
        question("A 希望什麼時候見面？", [2], "A little later.", "At seven.", "Next week.", "On Saturday."),
        question("B 說可以留在哪裡？", [3], "At the station.", "At home.", "At the office.", "At the store."),
        question("對照 B 留在車站與 A 的回覆，A 再過多久會到？", [3, 4], "In ten minutes.", "At ten.", "Next week.", "After dinner."),
      ],
    },
  ];
};
