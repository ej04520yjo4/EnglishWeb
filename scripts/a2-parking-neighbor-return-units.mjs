const noun = "noun 名詞";
const verb = "verb 動詞";
const adjective = "adjective 形容詞";
const adverb = "adverb 副詞";
const preposition = "preposition 介系詞";
const pronoun = "pronoun 代名詞";
const modal = "modal verb 情態助動詞";

export const parkingNeighborReturnForms = (form) => ({
  behind: form("behind", "preposition 介系詞；adverb 副詞", "be・HIND"),
  welcome: form("welcome", "verb 動詞；adjective 形容詞", "WEL・come"),
  neighbor: form("neighbor", noun, "NEIGH・bor"),
  borrowed: form("borrow", verb, "BOR・rowed", { kk: "/ˈbɑrod/", ipa: "/ˈbɑːroʊd/", syllables: 2, stress: 1 }),
});

export const parkingNeighborReturnUnits = ({ lesson, variant, chunk, line, question, wordUse, youSubject }) => {
  const infinitive = (role) => wordUse("to-infinitive-marker", "接原形動詞", "infinitive marker 不定詞標記", role, "", "grammar");
  const park = (role) => wordUse("park-leave-vehicle", "停（車）", verb, role);
  const canPermission = wordUse("can-ask-permission-seat", "可以……嗎？（徵求同意）", modal, "徵求同意", "", "grammar");
  const canPossible = (role) => wordUse("can-possible-general", "可以（有辦法）", modal, role, "", "grammar");
  const your = wordUse("your-possessive", "你的", "determiner 限定詞", "所有");
  const umbrella = (role) => wordUse("umbrella-rain-cover", "雨傘", noun, role);
  return [
    {
      id: "a2-u161", title: "應用：詢問停車",
      lessons: [
        lesson("問這裡能不能停車", "Can I park my car here?", "我可以把車停在這裡嗎？",
          "park 當動詞是停車，當名詞是公園。Can I + 原形動詞 徵求同意。", "parking-ask-here",
          "Can I park {thing} {place}?", "Can I park ______ ______?", ["徵求同意", "停放的東西與地點"],
          [variant("street", "我可以把車停在這條街上嗎？", ["Can I park my car", "on this street?"]),
            variant("short", "我可以停在這裡嗎？", ["Can I park", "here?"])],
          ["我可以停在這裡嗎？", "可以幫我包裝嗎？", "這個藍色杯子怎麼樣？"], ["a2-u160-l04", "a2-u160-l03", "a2-u160-l02"],
          {
            can: canPermission,
            park: park("把車停放"),
            car: wordUse("car-motor-vehicle", "汽車", noun, "要停的東西"),
            here: wordUse("here-this-place", "這裡", adverb, "地點"),
          }, [chunk("park-my-car", "park my car", "停我的車", "park + 車。")]),
        lesson("問可以停在哪裡", "Where can I park?", "我可以停在哪裡？",
          "Where can I + 原形動詞 問可以在哪裡做某事。", "parking-ask-where",
          "Where can {person} park?", "Where can ______ park?", ["詢問地點", "停車的人"],
          [variant("car", "我可以把車停在哪裡？", ["Where can I", "park my car?"]),
            variant("we", "我們可以停在哪裡？", ["Where can we", "park?"])],
          ["我們可以停在哪裡？", "我可以把車停在這裡嗎？", "可以幫我包裝嗎？"], ["a2-u161-l01", "a2-u160-l04", "a2-u160-l03"],
          {
            where: wordUse("where-ask-place", "哪裡", adverb, "詢問地點"),
            can: canPossible("詢問可行地點"),
            park: park("把車停放"),
          }, [chunk("where-can-i", "where can I", "我可以在哪裡", "Where + can + 主詞。")]),
        lesson("聽懂停在店後面", "You can park behind the store.", "你可以停在店後面。",
          "behind 是在……後面，和 in front of 相反。", "parking-state-place",
          "You can park {place}.", "You can park ______.", ["說明可以停", "地點"],
          [variant("station", "你可以停在車站附近。", ["You can park", "near the station."]),
            variant("street", "你可以停在這條街上。", ["You can park", "on this street."])],
          ["你可以停在車站附近。", "我可以停在哪裡？", "我可以把車停在這裡嗎？"], ["a2-u161-l01", "a2-u161-l02", "a2-u160-l04"],
          {
            you: youSubject,
            can: canPossible("說明可行做法"),
            park: park("把車停放"),
            behind: wordUse("behind-at-the-back", "在……後面", preposition, "相對位置"),
            store: wordUse("store-shop-place", "商店", noun, "位置參考"),
          }, [chunk("behind-the-store", "behind the store", "在店後面", "behind + 地點。")]),
        lesson("問停車費怎麼算", "How much is it per hour?", "一小時多少錢？",
          "per + 單位 表示每一個單位的價錢。", "parking-ask-rate",
          "How much is it per {unit}?", "How much is it per ______?", ["詢問價錢", "計費單位"],
          [variant("night", "一晚多少錢？", ["How much is it", "per night?"]),
            variant("day", "一天多少錢？", ["How much is it", "per day?"])],
          ["一晚多少錢？", "你可以停在店後面。", "我可以停在哪裡？"], ["a2-u161-l01", "a2-u161-l02", "a2-u161-l03"],
          {
            how: wordUse("how-degree-amount", "多（問數量）", adverb, "和 much 一起問多少"),
            much: wordUse("much-amount-of-money", "多少（錢）", "determiner 限定詞", "問金額"),
            is: wordUse("be-linking-price", "是（連接價錢）", verb, "連接價錢", "", "grammar"),
            per: wordUse("per-rate-unit", "每（接計費單位）", preposition, "計費方式"),
            hour: wordUse("hour-duration-unit", "小時", noun, "計費單位"),
          }, [chunk("per-hour", "per hour", "每小時", "per + 單位。")]),
      ],
      passage: [
        line("Can I park my car here?", "司機：我可以把車停在這裡嗎？"),
        line("Sorry, not here.", "店員：抱歉，這裡不行。"),
        line("Where can I park?", "司機：我可以停在哪裡？"),
        line("You can park behind the store.", "店員：你可以停在店後面。"),
        line("How much is it per hour?", "司機：一小時多少錢？"),
        line("It is two dollars per hour.", "店員：一小時兩美元。"),
      ],
      questions: [
        question("司機先問能不能做什麼？", [1], "Park my car here.", "Park my car on this street.", "Wash my car here.", "Buy a car here."),
        question("可以停在哪裡？", [3, 4], "Behind the store.", "Near the station.", "On this street.", "In the park."),
        question("司機接著問什麼？", [5], "How much is it per hour?", "How much is it per night?", "What time does the pool open?", "Is there a delivery fee?"),
        question("停車費多少錢？", [5, 6], "Two dollars per hour.", "Ten dollars per hour.", "Two dollars per night.", "Three dollars per day."),
      ],
    },
    {
      id: "a2-u162", title: "應用：歡迎新鄰居",
      lessons: [
        lesson("問對方是不是新來的", "Are you new here?", "你是新來的嗎？",
          "new here 表示剛來這裡，是認識新朋友時常用的開場。", "neighbor-ask-new",
          "Are you {state}?", "Are you ______?", ["詢問", "是否新來"],
          [variant("work", "你是新來上班的嗎？", ["Are you", "new at work?"]),
            variant("class", "你是這個班新來的嗎？", ["Are you", "new in this class?"])],
          ["你是新來上班的嗎？", "一小時多少錢？", "你可以停在店後面。"], ["a2-u161-l04", "a2-u161-l03", "a2-u161-l02"],
          {
            are: wordUse("be-linking-state-question", "是（問狀態）", verb, "詢問狀態", "", "grammar"),
            you: youSubject,
            new: wordUse("new-inexperienced-member", "新來的／剛加入的", adjective, "剛到這裡"),
            here: wordUse("here-this-place", "這裡", adverb, "地點"),
          }, [chunk("new-here", "new here", "新來這裡", "new + here。")]),
        lesson("歡迎並自我介紹", "Welcome, I am your neighbor.", "歡迎，我是你的鄰居。",
          "Welcome 用來歡迎新來的人。neighbor 是住在附近的鄰居。", "neighbor-state-welcome",
          "Welcome, I am {person}.", "Welcome, I am ______.", ["表示歡迎", "自我介紹"],
          [variant("new", "歡迎，我是你的新鄰居。", ["Welcome, I am", "your new neighbor."]),
            variant("amy", "歡迎，我是 Amy。", ["Welcome, I am", "Amy."])],
          ["歡迎，我是 Amy。", "你是新來的嗎？", "一小時多少錢？"], ["a2-u162-l01", "a2-u161-l04", "a2-u161-l03"],
          {
            welcome: wordUse("welcome-greet-newcomer", "歡迎", "interjection 感嘆詞", "迎接新來的人"),
            am: wordUse("be-linking-state", "是", verb, "連接身分", "", "grammar"),
            your,
            neighbor: wordUse("neighbor-person-nearby", "鄰居", noun, "住在附近的人"),
          }, [chunk("your-neighbor", "your neighbor", "你的鄰居", "your + 名詞。")]),
        lesson("說自己住幾樓", "I live on the second floor.", "我住在二樓。",
          "樓層前面用 on the。second 是第二。", "neighbor-state-floor",
          "{person} on {floor}.", "______ on ______.", ["住的人", "樓層"],
          [variant("first", "我住在一樓。", ["I live on", "the first floor."]),
            variant("amy", "Amy 住在二樓。", ["Amy lives on", "the second floor."])],
          ["Amy 住在二樓。", "歡迎，我是你的鄰居。", "你是新來的嗎？"], ["a2-u162-l01", "a2-u162-l02", "a2-u161-l04"],
          {
            live: wordUse("live-have-home", "住（在某處）", verb, "居住"),
            on: wordUse("on-floor-of-building", "在（某樓層）", preposition, "樓層"),
            second: wordUse("second-floor-ordinal", "第二（指樓層）", "ordinal number 序數", "樓層"),
            floor: wordUse("floor-building-level", "樓層", noun, "住的地方"),
          }, [chunk("on-the-second-floor", "on the second floor", "在二樓", "on the + 序數 + floor。")]),
        lesson("說可以找自己幫忙", "You can ask me for help.", "你可以找我幫忙。",
          "ask + 人 + for + 東西 表示向某人要求。for help 是請求幫忙。", "neighbor-offer-help",
          "You can ask {person} for help.", "You can ask ______ for help.", ["表達可以", "可以找的人"],
          [variant("ben", "你可以找 Ben 幫忙。", ["You can ask", "Ben for help."]),
            variant("manager", "你可以找主管幫忙。", ["You can ask", "the manager for help."])],
          ["你可以找主管幫忙。", "我住在二樓。", "歡迎，我是你的鄰居。"], ["a2-u162-l01", "a2-u162-l02", "a2-u162-l03"],
          {
            you: youSubject,
            can: canPossible("提出幫忙"),
            ask: wordUse("ask-request-from-person", "請求", verb, "向人要求"),
            me: wordUse("me-person-to-ask", "我（受詞）", "pronoun 代名詞（受格）", "可以找的人", "", "grammar"),
            help: wordUse("help-noun-assistance", "幫助", noun, "需要的東西"),
          }, [chunk("ask-me-for-help", "ask me for help", "找我幫忙", "ask + 人 + for help。")]),
      ],
      passage: [
        line("Are you new here?", "鄰居：你是新來的嗎？"),
        line("Yes, I am new here.", "小安：對，我是新來的。"),
        line("Welcome, I am your neighbor.", "鄰居：歡迎，我是你的鄰居。"),
        line("I live on the second floor.", "鄰居：我住在二樓。"),
        line("You can ask me for help.", "鄰居：你可以找我幫忙。"),
        line("Thank you so much.", "小安：非常謝謝你。"),
      ],
      questions: [
        question("小安是什麼情況？", [1, 2], "I am new here.", "I am new at work.", "I am very busy.", "I am at the bank."),
        question("對方是誰？", [3], "Your neighbor.", "Your manager.", "Your doctor.", "Your friend."),
        question("鄰居住幾樓？", [4], "The second floor.", "The first floor.", "The second door.", "The first door."),
        question("鄰居願意做什麼？", [4, 5], "You can ask me for help.", "You can park behind the store.", "You can borrow it again.", "You can call me back."),
      ],
    },
    {
      id: "a2-u163", title: "應用：歸還借來的東西",
      lessons: [
        lesson("說借了對方的東西", "I borrowed your umbrella.", "我借了你的雨傘。",
          "borrow 是向別人借入，過去式是 borrowed。", "return-state-borrowed",
          "I borrowed {thing}.", "I borrowed ______.", ["說明借過", "借的東西"],
          [variant("book", "我借了你的書。", ["I borrowed", "your book."]),
            variant("pen", "我借了你的筆。", ["I borrowed", "your pen."])],
          ["我借了你的書。", "你可以找我幫忙。", "我住在二樓。"], ["a2-u162-l04", "a2-u162-l03", "a2-u162-l02"],
          {
            borrowed: wordUse("borrow-take-temporarily-past", "借入（過去式）", "verb 動詞（過去式）", "借東西"),
            your,
            umbrella: umbrella("借的東西"),
          }, [chunk("borrowed-your-umbrella", "borrowed your umbrella", "借了你的雨傘", "borrowed + 東西。")]),
        lesson("說今天想還", "I want to return it today.", "我今天想把它還你。",
          "return 是歸還。want to + 原形動詞 表示想做某事。", "return-state-plan",
          "I want to return it {time}.", "I want to return it ______.", ["說明想歸還", "時間"],
          [variant("tomorrow", "我明天想把它還你。", ["I want to return it", "tomorrow."]),
            variant("work", "我下班後想把它還你。", ["I want to return it", "after work."])],
          ["我明天想把它還你。", "我借了你的雨傘。", "你可以找我幫忙。"], ["a2-u163-l01", "a2-u162-l04", "a2-u162-l03"],
          {
            want: wordUse("want-desire-to-do", "想要（做某事）", verb, "打算"),
            to: infinitive("接想做的事"),
            return: wordUse("return-give-back-borrowed", "歸還", verb, "還東西"),
            it: wordUse("it-the-borrowed-item", "它（指借來的東西）", pronoun, "借的東西"),
            today: wordUse("today-current-day", "今天", adverb, "時間"),
          }, [chunk("return-it", "return it", "把它還回去", "return + it。")]),
        lesson("把東西交還", "Here is your umbrella.", "這是你的雨傘。",
          "Here is + 東西 是把東西遞給對方時說的話。", "return-hand-over",
          "Here is {thing}.", "Here is ______.", ["遞給對方", "東西"],
          [variant("book", "這是你的書。", ["Here is", "your book."]),
            variant("pen", "這是你的筆。", ["Here is", "your pen."])],
          ["這是你的書。", "我今天想把它還你。", "我借了你的雨傘。"], ["a2-u163-l01", "a2-u163-l02", "a2-u162-l04"],
          {
            here: wordUse("here-this-place", "這裡", adverb, "遞東西"),
            is: wordUse("be-singular-exist", "是（單數）", verb, "連接東西", "", "grammar"),
            your,
            umbrella: umbrella("還的東西"),
          }, [chunk("here-is-your", "here is your", "這是你的", "Here is + your + 名詞。")]),
        lesson("說下次還可以借", "You can borrow it again.", "你可以再借一次。",
          "again 放句尾表示再一次。borrow 這裡用原形，因為前面有 can。", "return-offer-again",
          "You can borrow it {time}.", "You can borrow it ______.", ["表示可以", "時間"],
          [variant("week", "你下週可以借。", ["You can borrow it", "next week."]),
            variant("friday", "你星期五可以借。", ["You can borrow it", "on Friday."])],
          ["你下週可以借。", "這是你的雨傘。", "我今天想把它還你。"], ["a2-u163-l01", "a2-u163-l02", "a2-u163-l03"],
          {
            you: youSubject,
            can: canPossible("表示允許"),
            borrow: wordUse("borrow-take-temporarily", "借入", verb, "借東西"),
            it: wordUse("it-the-borrowed-item", "它（指借來的東西）", pronoun, "借的東西"),
            again: wordUse("again-one-more-time", "再一次", adverb, "重複"),
          }, [chunk("borrow-it-again", "borrow it again", "再借一次", "borrow + it + again。")]),
      ],
      passage: [
        line("I borrowed your umbrella.", "小安：我借了你的雨傘。"),
        line("I want to return it today.", "小安：我今天想把它還你。"),
        line("Here is your umbrella.", "小安：這是你的雨傘。"),
        line("Thank you so much.", "小安：非常謝謝你。"),
        line("You can borrow it again.", "小林：你可以再借一次。"),
        line("Okay, see you next week.", "小安：好，下週見。"),
      ],
      questions: [
        question("小安借了什麼？", [1], "Your umbrella.", "Your book.", "Your pen.", "Your card."),
        question("小安想什麼時候還？", [1, 2], "Today.", "Tomorrow.", "After work.", "On Friday."),
        question("小安把東西交還時說什麼？", [3], "Here is your umbrella.", "Here is your book.", "Here is your pen.", "I need a gift for my friend."),
        question("小林怎麼回應？", [5], "You can borrow it again.", "You can borrow it on Friday.", "You need to pay two dollars.", "I will call again tomorrow."),
      ],
    },
  ];
};
