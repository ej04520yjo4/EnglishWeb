const noun = "noun 名詞";
const verb = "verb 動詞";
const adverb = "adverb 副詞";
const adjective = "adjective 形容詞";
const preposition = "preposition 介系詞";
const determiner = "determiner 限定詞";
const modal = "modal verb 情態助動詞";
const number = "number 數詞";

export const localVisitsForms = (form) => ({
  tickets: form("ticket", noun, "TICK・ets", { kk: "/ˈtɪkəts/", ipa: "/ˈtɪkəts/", syllables: 2, stress: 1 }),
  exhibition: form("exhibition", noun, "ex・hi・BI・tion", {
    kk: "/ˌɛksəˈbɪʃən/", ipa: "/ˌɛksəˈbɪʃən/", syllables: 4, stress: 3,
  }),
  each: form("each", "determiner 限定詞；pronoun 代名詞"),
  children: form("child", noun, "CHIL・dren", {
    kk: "/ˈtʃɪldrən/", ipa: "/ˈtʃɪldɹən/", syllables: 2, stress: 1,
  }),
  free: form("free", "adjective 形容詞；adverb 副詞；verb 動詞"),
  entrance: form("entrance", "noun 名詞；verb 動詞", "EN・trance", {
    kk: "/ˈɛntrəns/", ipa: "/ˈɛntɹəns/", syllables: 2, stress: 1,
  }),
  second: form("second", "ordinal number 序數；noun 名詞；verb 動詞", "SEC・ond", {
    kk: "/ˈsɛkənd/", ipa: "/ˈsɛkənd/", syllables: 2, stress: 1,
  }),
  floor: form("floor", "noun 名詞；verb 動詞"),
  come: form("come", verb),
  over: form("over", "adverb 副詞；preposition 介系詞", "O・ver"),
  busy: form("busy", adjective, "BU・sy"),
  until: form("until", "preposition 介系詞；conjunction 連接詞", "un・TIL"),
  around: form("around", "adverb 副詞；preposition 介系詞", "a・ROUND", {
    kk: "/əˈraʊnd/", ipa: "/əˈɹaʊnd/", syllables: 2, stress: 2,
  }),
  only: form("only", "adverb 副詞；adjective 形容詞", "ON・ly"),
  few: form("few", "determiner 限定詞；pronoun 代名詞；adjective 形容詞"),
  number: form("number", "noun 名詞；verb 動詞", "NUM・ber"),
});

export const localVisitsUnits = ({ lesson, variant, chunk, line, question, wordUse, couldRequest, youSubject }) => {
  const please = wordUse("please-request", "請（禮貌用語）", adverb, "讓提出的需求較有禮貌");
  const ticket = wordUse("ticket-exhibition-admission", "入場票", noun, "進場參觀的票");
  const exhibition = wordUse("exhibition-public-display", "展覽", noun, "要參觀的展覽");
  const comeOver = wordUse("come-over-visit", "來／過去（和 over 一起表示拜訪）", verb, "到對方或說話者家裡");
  const over = wordUse("over-in-come-over", "與 come 搭配表示到家裡拜訪", adverb, "構成拜訪語塊");
  const threeHour = wordUse("three-clock-time", "三點（指鐘點）", number, "三點");
  const sevenHour = wordUse("seven-clock-time", "七點（指鐘點）", number, "七點左右");
  const packageItem = wordUse("package-parcel-delivery", "包裹", noun, "櫃台待領取的包裹");
  return [
    {
      id: "a2-u41", title: "應用：展館售票與入場",
      lessons: [
        lesson("禮貌地買兩張展覽票", "Two tickets for the exhibition, please.", "麻煩給我兩張展覽票。",
          "在售票口可用數量＋名詞，再加 please。tickets 是複數；只買一張用 one ticket。", "exhibit-order-ticket-count",
          "{count} for the exhibition, please.", "______ for the exhibition, please.", ["票的數量", "指定展覽與禮貌語"],
          [variant("one", "麻煩給我一張展覽票。", ["One ticket", "for the exhibition, please."]),
            variant("three", "麻煩給我三張展覽票。", ["Three tickets", "for the exhibition, please."])],
          ["麻煩給我一張展覽票。", "麻煩給我兩張火車票。", "哪種走法比較快？"], ["a2-u15-l01", "a2-u38-l01", "a2-u32-l03"],
          {
            two: wordUse("two-ticket-count", "兩張（指票的數量）", number, "入場人數"),
            tickets: wordUse("ticket-exhibition-admission-plural", "入場票（複數）", noun, "進場參觀的票"),
            for: wordUse("for-ticket-event", "用於（接展覽或活動）", preposition, "票的用途"),
            exhibition, please,
          }, [chunk("tickets-for-the-exhibition", "tickets for the exhibition", "展覽的入場票", "指要參觀這場展覽用的票。")]),
        lesson("問每張票的價格", "How much is each ticket?", "每張票要多少錢？",
          "each 後接單數可數名詞。問每張票的價格用 is each ticket，不問總價。", "exhibit-ask-price-per-item",
          "How much is each {item}?", "How much is each ______?", ["詢問單件價格", "單數商品"],
          [variant("book", "每本書要多少錢？", ["How much is each", "book?"]),
            variant("bag", "每包要多少錢？", ["How much is each", "bag?"])],
          ["每本書要多少錢？", "兩張票總共多少錢？", "麻煩給我兩張展覽票。"], ["a2-u41-l01", "a2-u29-l03", "a2-u03-l01"],
          {
            how: wordUse("how-with-much-price", "和 much 一起問要多少錢", adverb, "詢問單張票價"),
            each: wordUse("each-per-item", "每一個／每一張", determiner, "單件價格", "each ticket 是逐張計價，不是多張票的總價。"),
            ticket,
          }),
        lesson("聽懂小孩可以免費入場", "Children can get in for free.", "兒童可以免費入場。",
          "children 是 child 的不規則複數；get in 是進場；for free 是免費。", "exhibit-state-free-entry",
          "{who} can get in for free.", "______ can get in for free.", ["可免費入場的人", "入場不用付錢"],
          [variant("we", "我們可以免費入場。", ["We", "can get in for free."]),
            variant("you", "你可以免費入場。", ["You", "can get in for free."])],
          ["你可以免費入場。", "每張票要多少錢？", "人們可以在外面喝水。"], ["a2-u41-l01", "a2-u41-l02", "a2-u37-l04"],
          {
            children: wordUse("child-children-visitors", "兒童（不規則複數）", noun, "可免費入場的人", "一位小孩是 a child；多位是 children，不寫 childs。"),
            can: wordUse("can-exhibit-entry-permission", "可以（表示允許入場）", modal, "可免費進入的資格"),
            get: wordUse("get-enter-with-in", "和 in 一起表示入場", verb, "進入場地"),
            in: wordUse("in-get-in-entry", "進去（和 get 一起用）", adverb, "入場"),
            for: wordUse("for-price-free", "和 free 一起表示不用付費", preposition, "入場價格"),
            free: wordUse("free-no-charge", "免費的", adjective, "不用付費"),
          }, [chunk("get-in", "get in", "進場", "get in 在售票情境指入場。"),
            chunk("for-free", "for free", "免費", "指不用花錢，不是有空。")]),
        lesson("確認入口在哪一層", "The entrance is on the second floor.", "入口在二樓。",
          "on the second floor 是在二樓，樓層用 on。美式英文中，first floor 通常就是街面的一樓。", "exhibit-locate-by-floor",
          "{place} is on {floor}.", "______ is on ______.", ["要找的地點", "所在樓層"],
          [variant("first", "入口在一樓。", ["The entrance", "is on the first floor."]),
            variant("room", "我的房間在二樓。", ["My room", "is on the second floor."])],
          ["入口在一樓。", "入口在左邊。", "兒童可以免費入場。"], ["a2-u41-l01", "a2-u41-l03", "a2-u17-l02"],
          {
            entrance: wordUse("entrance-way-in", "入口", noun, "進入展館或展場的位置", "作名詞「入口」時，重音在第一音節。"),
            on: wordUse("on-floor-location", "在（接樓層）", preposition, "說明樓層"),
            second: wordUse("second-floor-ordinal", "第二（指樓層）", "ordinal number 序數", "所在樓層"),
            floor: wordUse("floor-building-story", "樓層", noun, "建築物樓層", "此處指所在的樓層，不是在說地板。"),
          }, [chunk("on-the-second-floor", "on the second floor", "在二樓", "on the + 序數 + floor。")]),
      ],
      passage: [
        line("Two tickets for the exhibition, please.", "訪客：麻煩給我兩張展覽票。"),
        line("How much is each ticket?", "訪客：每張票要多少錢？"),
        line("Each ticket is ten dollars.", "售票員：每張票十美元。"),
        line("Children can get in for free.", "售票員：兒童可以免費入場。"),
        line("The entrance is on the second floor.", "售票員：入口在二樓。"),
      ],
      questions: [
        question("訪客一開口要幾張票？", [1], "Two tickets.", "One ticket.", "Three tickets.", "Ten tickets."),
        question("售票員報了什麼價格？請留意訪客問的是每張票。", [2, 3], "Each ticket is ten dollars.", "Each ticket is two dollars.", "Each ticket is three dollars.", "Each ticket is free."),
        question("對照票價和補充規則，哪一類人不用付入場費？", [3, 4], "Children.", "The manager.", "My friend.", "My mother."),
        question("訪客要到哪一層才找得到入口？", [5], "On the second floor.", "On the first floor.", "Outside.", "At the station."),
      ],
    },
    {
      id: "a2-u42", title: "應用：鄰居來訪與停留時間",
      lessons: [
        lesson("問能不能去對方家坐一下", "Can I come over this afternoon?", "我今天下午可以過去坐坐嗎？",
          "come over 表示到對方家或所在的地方拜訪。this afternoon 前面不加 on 或 in。", "neighbor-request-visit",
          "Can I come over {time}?", "Can I come over ______?", ["詢問是否方便拜訪", "拜訪時間"],
          [variant("tomorrow", "我明天可以過去坐坐嗎？", ["Can I come over", "tomorrow?"]),
            variant("saturday", "我星期六可以過去坐坐嗎？", ["Can I come over", "on Saturday?"])],
          ["我明天可以過去坐坐嗎？", "我可以晚點打電話嗎？", "我今天下午會在家。"], ["a2-u40-l02", "a2-u34-l02", "a2-u35-l03"],
          {
            can: wordUse("can-ask-to-visit", "可以……嗎？（詢問方不方便）", modal, "禮貌詢問是否方便", "", "grammar"),
            come: comeOver, over,
            this: wordUse("this-current-afternoon", "今天的（搭配 afternoon）", determiner, "今天下午"),
          }, [chunk("come-over", "come over", "過來／過去拜訪", "問對方時是去對方那裡；邀請對方時則是請對方過來。")]),
        lesson("說自己會忙到三點", "I will be busy until three.", "我會忙到三點。",
          "until three 表示忙碌一直持續到三點，不是三點才開始忙。", "neighbor-state-busy-until",
          "{person} will be busy until {time}.", "______ will be busy until ______.", ["暫時無法接待的人", "忙到幾點"],
          [variant("eight", "我會忙到八點。", ["I will be busy", "until eight."]),
            variant("we", "我們會忙到三點。", ["We will be busy", "until three."])],
          ["我會忙到八點。", "我三點之後會很忙。", "我今天下午可以過去坐坐嗎？"], ["a2-u42-l01", "a2-u34-l01", "a2-u35-l03"],
          {
            be: wordUse("be-future-state", "是／處於（接 busy）", "linking verb 連綴動詞", "說明將處於忙碌狀態"),
            busy: wordUse("busy-unavailable-person", "忙碌的／沒有空的", adjective, "目前不方便接待"),
            until: wordUse("until-time-endpoint", "直到（某時間）", preposition, "忙碌的結束時間"),
            three: threeHour,
          }, [chunk("busy-until-three", "busy until three", "忙到三點", "until 指持續到該時間；不是把時間安排在三點之前。")]),
        lesson("邀請對方七點左右過來", "Can you come over around seven?", "你可以大約七點過來嗎？",
          "around seven 表示大約七點，可能早一點或晚一點；at seven 對應明確的七點。", "neighbor-suggest-approximate-visit",
          "Can you come over {time}?", "Can you come over ______?", ["邀請來訪", "大約或明確的時間"],
          [variant("around-eight", "你可以大約八點過來嗎？", ["Can you come over", "around eight?"]),
            variant("at-seven", "你可以七點過來嗎？", ["Can you come over", "at seven?"])],
          ["你可以七點過來嗎？", "我會忙到三點。", "我可以三點前處理這件事。"], ["a2-u42-l01", "a2-u42-l02", "a2-u39-l03"],
          {
            can: wordUse("can-invite-availability", "可以嗎？（詢問對方能否來訪）", modal, "詢問來訪是否方便", "", "grammar"),
            you: youSubject, come: comeOver, over,
            around: wordUse("around-approximate-time", "大約（接鐘點）", preposition, "約略時間"),
            seven: sevenHour,
          }, [chunk("around-seven", "around seven", "七點左右", "around 不指定正好在整點。")]),
        lesson("說只能坐幾分鐘", "I can only stay for a few minutes.", "我只能待幾分鐘。",
          "stay for + 時間是停留多久；a few 接複數可數名詞，表示有幾個。only 說明停留時間有限。", "neighbor-limit-visit-length",
          "{person} can only stay for {time}.", "______ can only stay for ______.", ["停留的人", "可以停留的時間"],
          [variant("we", "我們只能待幾分鐘。", ["We can only stay", "for a few minutes."]),
            variant("ten", "我只能待十分鐘。", ["I can only stay", "for ten minutes."])],
          ["我只能待十分鐘。", "我會再等你十分鐘。", "你可以大約七點過來嗎？"], ["a2-u42-l02", "a2-u42-l03", "a2-u34-l03"],
          {
            can: wordUse("can-visit-availability-limit", "能夠（表示情況允許）", modal, "說明可停留的限制"),
            only: wordUse("only-limit-available-time", "只／只能", adverb, "限制可停留時間"),
            stay: wordUse("stay-remain-visit", "待在這裡／停留", verb, "拜訪時的停留"),
            for: wordUse("for-duration-visit-length", "接停留多久", preposition, "停留時間長度"),
            a: wordUse("a-in-a-few", "一個", "article 冠詞", "少量但不只一個",
              "a 的核心功能是不定冠詞；在 a few 這個固定用法裡，要整組理解為「幾個」，不是只有一個。"),
            few: wordUse("few-in-a-few-count", "幾個（和 a 一起用）", determiner, "少量的分鐘數"),
          }, [chunk("a-few-minutes", "a few minutes", "幾分鐘", "a few 接複數名詞；不等於只有一分鐘。")]),
      ],
      passage: [
        line("Can I come over this afternoon?", "鄰居：我今天下午可以過去坐坐嗎？"),
        line("I will be busy until three.", "主人：我會忙到三點。"),
        line("Can you come over around seven?", "主人：你可以大約七點過來嗎？"),
        line("I can only stay for a few minutes.", "鄰居：我只能待幾分鐘。"),
        line("See you around seven.", "主人：七點左右見。"),
      ],
      questions: [
        question("鄰居一開始提議什麼時候來？", [1], "This afternoon.", "Tomorrow morning.", "After lunch.", "On Saturday."),
        question("主人說會忙到什麼時候？", [2], "Until three.", "Until seven.", "Until eight.", "Until tomorrow."),
        question("鄰居能停留多久？", [4], "A few minutes.", "Ten minutes.", "A day.", "A week."),
        question("對照原本的提議和最後的道別，最後兩人約在什麼時候？", [1, 3, 5], "Around seven.", "Around eight.", "At three.", "Tomorrow morning."),
      ],
    },
    {
      id: "a2-u43", title: "應用：報編號與領取包裹",
      lessons: [
        lesson("到櫃台說要領包裹", "I am here to pick up my package.", "我是來領我的包裹的。",
          "I am here to + 原形動詞說明來意。pick up my package 指領包裹，不是幫忙寄件。", "pickup-state-purpose",
          "I am here to pick up {item}.", "I am here to pick up ______.", ["說明到場目的", "要領取的東西"],
          [variant("box", "我是來領那個箱子的。", ["I am here to pick up", "the box."]),
            variant("ticket", "我是來取我的票的。", ["I am here to pick up", "my ticket."])],
          ["我是來取我的票的。", "我想寄這個包裹。", "我需要取消我的訂單。"], ["a2-u29-l01", "a2-u40-l01", "a2-u29-l02"],
          {
            am: wordUse("be-here-purpose", "是（接 here，說明來意）", "linking verb 連綴動詞", "說明到這裡的目的"),
            to: wordUse("to-introduce-visit-purpose", "接動詞說明來這裡要做什麼", "infinitive marker 不定詞標記", "領取的目的"),
            pick: wordUse("pick-collect-with-up", "和 up 一起表示領取", verb, "領走預留或寄送到的物品"),
            up: wordUse("up-in-pick-up-collect", "和 pick 搭配成「領取」", adverb, "構成領取語塊"),
            package: packageItem,
          }, [chunk("pick-up-my-package", "pick up my package", "領取我的包裹", "包裹送到指定地點後，由收件人前往領取。")]),
        lesson("聽懂櫃台在問包裹編號", "What is the package number?", "包裹編號是什麼？",
          "package number 中的 package 說明是哪種編號。這句問用來核對的編號，不是問有幾個包裹。", "pickup-request-reference-number",
          "What is the {item} number?", "What is the ______ number?", ["詢問辨識用的編號", "物件種類"],
          [variant("order", "訂單編號是什麼？", ["What is the", "order number?"]),
            variant("ticket", "票券編號是什麼？", ["What is the", "ticket number?"])],
          ["訂單編號是什麼？", "包裹的地址在哪裡？", "我是來領我的包裹的。"], ["a2-u43-l01", "a2-u29-l02", "a2-u41-l02"],
          {
            what: wordUse("what-reference-value", "什麼（詢問辨識資訊）", "pronoun 代名詞", "詢問編號"),
            package: wordUse("package-number-modifier", "包裹（修飾 number）", "noun 名詞（作修飾語）", "編號屬於哪個物件"),
            number: wordUse("number-reference-code", "編號", noun, "核對包裹或訂單的數字"),
          }, [chunk("package-number", "package number", "包裹編號", "用來辨識是哪一件包裹，不是包裹的數量。")]),
        lesson("請對方出示電子郵件", "Could you show me the email?", "可以麻煩你給我看那封電子郵件嗎？",
          "show + 人 + 物品是「把某物給某人看」。這句是請對方出示已收到的郵件，而不是另外寄一封。", "pickup-request-show-record",
          "Could you show me {record}?", "Could you show me ______?", ["禮貌地請對方出示", "要出示的資料"],
          [variant("number", "可以麻煩你給我看包裹編號嗎？", ["Could you show", "me the package number?"]),
            variant("ticket", "可以麻煩你給我看那張票嗎？", ["Could you show", "me the ticket?"])],
          ["可以麻煩你給我看包裹編號嗎？", "可以麻煩你寄封電子郵件給我嗎？", "包裹編號是什麼？"], ["a2-u43-l01", "a2-u43-l02", "a2-u40-l03"],
          { could: couldRequest, you: youSubject, show: wordUse("show-display-for-verification", "給……看／出示", verb, "出示領取資料") }),
        lesson("請在指定位置簽名", "Could you sign here, please?", "可以麻煩你在這裡簽名嗎？",
          "sign here 指在指定位置簽名。sign in 是報到或登入，兩者意思不同。", "pickup-request-sign-location",
          "Could you sign {place}, please?", "Could you sign ______, please?", ["請對方簽名", "簽名位置"],
          [variant("there", "可以麻煩你在那裡簽名嗎？", ["Could you sign", "there, please?"]),
            variant("on-this-side", "可以麻煩你在這一面簽名嗎？", ["Could you sign", "on this side, please?"])],
          ["可以麻煩你在那裡簽名嗎？", "我要在哪裡簽到？", "可以麻煩你給我看那封電子郵件嗎？"], ["a2-u43-l02", "a2-u43-l03", "a2-u33-l01"],
          {
            could: couldRequest, you: youSubject, please,
            sign: wordUse("sign-write-signature", "簽名", verb, "在收件單上留下簽名", "這裡的 sign 沒有接 in，意思是寫下簽名。"),
          }, [chunk("sign-here", "sign here", "在這裡簽名", "here 指櫃台人員指出的簽名處。")]),
      ],
      passage: [
        line("I am here to pick up my package.", "顧客：我是來領我的包裹的。"),
        line("What is the package number?", "櫃台人員：包裹編號是什麼？"),
        line("I have it in this email.", "顧客：編號在這封電子郵件裡。"),
        line("Could you show me the email?", "櫃台人員：可以麻煩你給我看那封電子郵件嗎？"),
        line("Could you sign here, please?", "櫃台人員：可以麻煩你在這裡簽名嗎？"),
        line("Here is the package.", "櫃台人員：這是你的包裹。"),
      ],
      questions: [
        question("顧客到櫃台做什麼？", [1], "Pick up my package.", "Send the package.", "Cancel my order.", "Check the address."),
        question("櫃台問編號後，顧客說可以在哪裡找到？", [2, 3], "In this email.", "In the box.", "On the first page.", "On this side."),
        question("顧客提到郵件之後，櫃台請顧客做什麼？", [3, 4], "Show me the email.", "Send me an email.", "Read the first page.", "Change the order."),
        question("櫃台把包裹交給顧客前，最後請顧客做什麼？", [5, 6], "Sign here.", "Sign in.", "Wait outside.", "Check the details."),
      ],
    },
  ];
};
