const noun = "noun 名詞";
const verb = "verb 動詞";
const adjective = "adjective 形容詞";
const adverb = "adverb 副詞";
const determiner = "determiner 限定詞";
const preposition = "preposition 介系詞";
const pronoun = "pronoun 代名詞";
const modal = "modal verb 情態助動詞";
const conjunction = "conjunction 連接詞";

export const everydayChoicesForms = (form) => ({
  pack: form("pack", "verb 動詞；noun 名詞"),
  jacket: form("jacket", noun, "JACK・et"),
  fit: form("fit", "verb 動詞；adjective 形容詞；noun 名詞"),
  heavy: form("heavy", adjective, "HEAV・y"),
  apartment: form("apartment", noun, "a・PART・ment"),
  kitchen: form("kitchen", noun, "KITCH・en"),
  bedroom: form("bedroom", noun, "BED・room", {
    kk: "/ˈbɛdˌrum/", ipa: "/ˈbɛdˌɹum/", syllables: 2, stress: 1,
  }),
  brighter: form("bright", "adjective 形容詞；adverb 副詞", "BRIGHT・er", {
    kk: "/ˈbraɪtɚ/", ipa: "/ˈbɹaɪtɚ/", syllables: 2, stress: 1,
  }),
  other: form("other", "determiner 限定詞；pronoun 代名詞", "OTH・er"),
  window: form("window", noun, "WIN・dow"),
  dropped: form("drop", "verb 動詞；noun 名詞", "dropped", {
    kk: "/drɑpt/", ipa: "/dɹɑpt/", syllables: 1,
  }),
  mistake: form("mistake", "noun 名詞；verb 動詞", "mis・TAKE"),
  broke: form("break", "verb 動詞；noun 名詞", "broke", {
    kk: "/brok/", ipa: "/bɹoʊk/", syllables: 1,
  }),
  hit: form("hit", "verb 動詞；noun 名詞"),
});

export const everydayChoicesUnits = ({ lesson, variant, chunk, line, question, wordUse }) => {
  const jacket = wordUse("jacket-outer-clothing", "外套", noun, "出門時要帶的衣物");
  const bag = wordUse("bag-travel-container", "袋子／包包", noun, "裝出門用品的袋子");
  const apartment = wordUse("apartment-home-unit", "一戶公寓住宅", noun, "正在看的住處");
  const bedroom = wordUse("bedroom-room-for-sleeping", "臥室", noun, "睡覺的房間");
  const cup = wordUse("cup-drinking-vessel", "杯子", noun, "盛飲料的容器");
  const needTo = wordUse("to-after-need", "接需要做的動作", "infinitive marker 不定詞標記", "說明要做什麼", "", "grammar");
  const itIncident = wordUse("it-current-mess", "它（指剛才弄亂的現場）", pronoun, "要收拾的地方");
  return [
    {
      id: "a2-u56", title: "應用：打包行李與確認能否裝下",
      lessons: [
        lesson("問出門要打包哪些東西", "What do I need to pack?", "我需要打包哪些東西？",
          "What do I need to + 原形動詞？用來確認怎麼準備。pack 在這裡是收拾並裝進行李。", "packing-ask-what-to-prepare",
          "What {request} need to {action}?", "What ______ need to ______?", ["確認誰要準備", "準備的動作"],
          [variant("we", "我們需要打包哪些東西？", ["What do we", "need to pack?"]),
            variant("bring", "我需要帶哪些東西？", ["What do I", "need to bring?"])],
          ["我需要帶哪些東西？", "我應該把腳踏車放在哪裡？", "我需要取消這份訂單。"], ["a2-u45-l04", "a2-u40-l01", "a2-u50-l01"],
          {
            what: wordUse("what-needed-item", "什麼東西（詢問要準備的物品）", pronoun, "需要準備的東西"),
            do: wordUse("do-auxiliary-for-wh-question", "形成問句的助動詞", "auxiliary verb 助動詞", "接 what 問需要什麼", "", "grammar"),
            to: needTo,
            pack: wordUse("pack-put-into-luggage", "打包／裝進行李", verb, "把出門的東西收拾好"),
          }),
        lesson("確認需要帶一件外套", "I need to bring a jacket.", "我需要帶一件外套。",
          "need to bring 說明需要把某物帶去某處；pack 比較著重把物品打包的過程。", "packing-state-item-needed",
          "{person} need to bring {item}.", "______ need to bring ______.", ["需要帶的人", "要帶的物品"],
          [variant("bag", "我需要帶一個袋子。", ["I need to bring", "a bag."]),
            variant("we", "我們需要帶一件外套。", ["We need to bring", "a jacket."])],
          ["我們需要帶一件外套。", "我需要打包哪些東西？", "我需要取消這份訂單。"], ["a2-u56-l01", "a2-u40-l01", "a2-u45-l03"],
          { to: needTo, bring: wordUse("bring-take-on-trip", "帶去／帶在身邊", verb, "出門時攜帶"), jacket }),
        lesson("問外套能不能裝進這個袋子", "Will the jacket fit in this bag?", "這件外套裝得進這個袋子嗎？",
          "fit in 問尺寸能否放進某個空間。這裡不是問外套穿起來合不合身。", "packing-ask-if-item-fits",
          "Will {item} fit in {place}?", "Will ______ fit in ______?", ["想裝進去的物品", "容器"],
          [variant("book", "這本書裝得進這個袋子嗎？", ["Will the book", "fit in this bag?"]),
            variant("clothes", "這些衣服裝得進這個袋子嗎？", ["Will the clothes", "fit in this bag?"])],
          ["這些衣服裝得進這個袋子嗎？", "我需要帶一件外套。", "請先把衣服放進洗衣機。"], ["a2-u56-l01", "a2-u56-l02", "a2-u44-l01"],
          {
            will: wordUse("will-ask-physical-possibility", "會……嗎？（問是否裝得進去）", modal, "確認是否裝得下", "", "grammar"),
            jacket, fit: wordUse("fit-inside-space", "裝得進去／放得下", verb, "物品與容器的尺寸合不合"),
            in: wordUse("in-inner-capacity", "在……裡面（容器內部）", preposition, "能不能裝下的容器"),
            this: wordUse("this-shown-travel-bag", "這個（眼前的袋子）", determiner, "指目前考慮使用的袋子"), bag,
          }, [chunk("fit-in", "fit in", "裝得進／放得下", "說的是物品放進容器，不是人融入群體。")]),
        lesson("說行李重到提不動", "The bag is too heavy to carry.", "這個袋子太重了，提不動。",
          "too + 形容詞 + to + 原形動詞，表示程度太高，做不到後面的事。這裡是太重而無法提著走。", "packing-state-too-heavy-to-carry",
          "{item} is too heavy to carry.", "______ is too heavy to carry.", ["過重的物品", "結果是無法提著走"],
          [variant("box", "這個箱子太重了，搬不動。", ["The box", "is too heavy to carry."]),
            variant("machine", "這台機器太重了，搬不動。", ["The machine", "is too heavy to carry."])],
          ["這個箱子太重了，搬不動。", "這件外套裝得進這個袋子嗎？", "這台機器現在不能用。"], ["a2-u56-l02", "a2-u56-l03", "a2-u53-l02"],
          {
            bag, heavy: wordUse("heavy-weight-hard-to-lift", "重的", adjective, "袋子太重搬不動"),
            is: wordUse("be-linking-weight", "連接袋子與重量描述的 be 動詞", "linking verb 連綴動詞", "引出重量狀態", "", "grammar"),
            too: wordUse("too-exceeds-ability", "太……（導致後面的事做不到）", adverb, "超出提得動的程度"),
            to: wordUse("to-after-too-result", "接做不到的動作", "infinitive marker 不定詞標記", "太重造成的結果", "", "grammar"),
            carry: wordUse("carry-lift-and-take", "提著走／搬", verb, "拿著袋子移動"),
          }, [chunk("too-heavy-to-carry", "too heavy to carry", "太重，提不動", "不是單指這個袋子很重，而是重到沒辦法提著走。")]),
      ],
      passage: [
        line("What do I need to pack?", "準備出門的人：我需要打包哪些東西？"),
        line("You need to bring a jacket.", "同伴：你需要帶一件外套。"),
        line("Will the jacket fit in this bag?", "準備出門的人：這件外套裝得進這個袋子嗎？"),
        line("It will fit in this bag.", "同伴：這件外套裝得進這個袋子。"),
        line("The bag is too heavy to carry.", "裝好後：這個袋子太重了，提不動。"),
      ],
      questions: [
        question("同伴提醒出門時要帶什麼？", [1, 2], "A jacket.", "A cup.", "A phone.", "A book."),
        question("帶外套的人接著想確認什麼？", [2, 3], "Will the jacket fit in this bag?", "Can I rent a bike for an hour?", "Is this my desk?", "Which bin is for paper?"),
        question("同伴對「裝不裝得下」怎麼回答？", [3, 4], "It will fit in this bag.", "The bag is too heavy to carry.", "You need to bring a jacket.", "I will wait right by the door."),
        question("外套裝得進去，但裝好後又遇到什麼問題？", [4, 5], "The bag is too heavy to carry.", "The bag will fit in the box.", "The box is too heavy to carry.", "The jacket is not in the bag."),
      ],
    },
    {
      id: "a2-u57", title: "應用：看住處、房間相對位置與比較",
      lessons: [
        lesson("問公寓有沒有廚房", "Does the apartment have a kitchen?", "這間公寓有廚房嗎？",
          "Does + 單數主詞 + have …? 問住處是否有某項空間或設備。does 後面保留 have 原形。", "housing-ask-about-room-feature",
          "Does {place} have {feature}?", "Does ______ have ______?", ["詢問某個住處", "指定的空間或設備"],
          [variant("bathroom", "這個房間有浴室嗎？", ["Does the room", "have a bathroom?"]),
            variant("desk", "這個房間有書桌嗎？", ["Does the room", "have a desk?"])],
          ["這個房間有浴室嗎？", "這是我的辦公桌嗎？", "入口在車站對面。"], ["a2-u55-l03", "a2-u51-l02", "a2-u13-l03"],
          {
            apartment, have: wordUse("have-provide-housing-feature", "有／配有", verb, "住處提供的設施"),
            kitchen: wordUse("kitchen-room-for-cooking", "廚房", noun, "煮飯的空間"),
          }),
        lesson("說臥室就在浴室旁邊", "The bedroom is next to the bathroom.", "臥室就在浴室旁邊。",
          "next to + 地點表示緊鄰，不是斜對面。這裡的 bathroom 指住處裡的浴室。", "housing-locate-room-next-to",
          "{room} is next to {place}.", "______ is next to ______.", ["要找的房間或物件", "它旁邊的參照位置"],
          [variant("kitchen", "臥室就在廚房旁邊。", ["The bedroom", "is next to the kitchen."]),
            variant("desk", "書桌就在門旁邊。", ["The desk", "is next to the door."])],
          ["臥室就在廚房旁邊。", "臥室就在浴室對面。", "這間公寓有廚房嗎？"], ["a2-u57-l01", "a2-u51-l02", "a2-u55-l03"],
          {
            bedroom,
            is: wordUse("be-linking-room-position", "連接房間與位置的 be 動詞", "linking verb 連綴動詞", "說明房間的位置", "", "grammar"),
            next: wordUse("next-adjacent-with-to", "和 to 搭配表示「旁邊」", adverb, "兩個位置緊鄰"),
            to: wordUse("to-in-next-to", "接緊鄰的地點", preposition, "旁邊的參照位置", "", "grammar"),
            bathroom: wordUse("bathroom-home-room", "浴室", noun, "住處的浴室"),
          }, [chunk("next-to-place", "next to", "就在……旁邊", "指兩個位置緊鄰。")]),
        lesson("說這間房比另一間亮", "This room is brighter than the other one.", "這間房比另一間亮。",
          "brighter 是 bright 的比較級。the other one 指兩個選項中的另一個；one 代替 room。", "housing-compare-room-brightness",
          "{first} is brighter than {second}.", "______ is brighter than ______.", ["採光較亮的房間", "比較的另一個空間"],
          [variant("bedroom", "臥室比另一間亮。", ["The bedroom", "is brighter than the other one."]),
            variant("kitchen", "這間房比廚房亮。", ["This room", "is brighter than the kitchen."])],
          ["這間房比廚房亮。", "這間房比另一間安靜。", "臥室就在浴室旁邊。"], ["a2-u57-l01", "a2-u57-l02", "a2-u38-l01"],
          {
            this: wordUse("this-room-being-viewed", "這間（正在看的房間）", determiner, "目前看的空間"),
            is: wordUse("be-linking-room-comparison", "連接房間與比較結果的 be 動詞", "linking verb 連綴動詞", "引出亮度比較", "", "grammar"),
            brighter: wordUse("bright-more-light-comparative", "更亮的／採光更好的", "adjective 形容詞（比較級）", "比較明亮程度"),
            than: wordUse("than-comparison", "比（引出比較對象）", preposition, "用來比較的另一個空間"),
            other: wordUse("other-remaining-of-two", "另外的（兩個中的另一個）", determiner, "另一間房"),
            one: wordUse("one-substitute-for-room", "一間（代替 room）", pronoun, "不重複提到 room"),
          }, [chunk("the-other-one", "the other one", "另一個／另一間", "one 避免重複名詞；此句是兩個選項中的另一間。")]),
        lesson("說比較喜歡有窗戶的那間", "I prefer the room with a window.", "我比較喜歡有窗戶的那一間。",
          "prefer 表示在選項之間比較喜歡其中一個。with a window 說明這間房有一扇窗戶。", "housing-express-room-preference",
          "{person} prefer {place} with {feature}.", "______ prefer ______ with ______.", ["做選擇的人", "偏好的空間和特徵"],
          [variant("desk", "我比較喜歡有書桌的那一間。", ["I prefer the room", "with a desk."]),
            variant("we", "我們比較喜歡有窗戶的那一間。", ["We prefer the room", "with a window."])],
          ["我們比較喜歡有窗戶的那一間。", "這間房比另一間亮。", "這間公寓有廚房嗎？"], ["a2-u57-l01", "a2-u57-l02", "a2-u57-l03"],
          {
            prefer: wordUse("prefer-choose-over-other-option", "比較喜歡／較想選", verb, "說出自己偏好的選項"),
            with: wordUse("with-housing-feature", "有（接房間具備的特徵）", preposition, "讓這間房有別於另一間"),
            window: wordUse("window-room-opening", "窗戶", noun, "房間有的設備"),
          }, [chunk("with-a-window", "with a window", "有窗戶的", "修飾前面的房間，表示那間有窗戶。")]),
      ],
      passage: [
        line("Does the apartment have a kitchen?", "看房的人：這間公寓有廚房嗎？"),
        line("The kitchen is next to the bedroom.", "帶看的人：廚房就在臥室旁邊。"),
        line("The bedroom is next to the bathroom.", "帶看的人：臥室就在浴室旁邊。"),
        line("This room is brighter than the other one.", "看房的人：這間房比另一間亮。"),
        line("I prefer the room with a window.", "看房的人：我比較喜歡有窗戶的那一間。"),
      ],
      questions: [
        question("看房的人問起廚房，哪一句證明公寓有廚房？", [1, 2], "The kitchen is next to the bedroom.", "The entrance is across from the station.", "The bedroom is next to the bathroom.", "This room is brighter than the other one."),
        question("帶看的人說臥室緊鄰哪裡？", [3], "The bathroom.", "The station.", "The office.", "The first floor."),
        question("看房的人怎麼比較兩個房間？", [4], "This room is brighter than the other one.", "The room with a window is too cold.", "The bedroom is on the second floor.", "This bag is too heavy to carry."),
        question("比較房間後，看房的人用哪個特徵說明自己的偏好？", [4, 5], "The room with a window.", "The room with a desk.", "The room by the door.", "The room on the first floor."),
      ],
    },
    {
      id: "a2-u58", title: "應用：說明小失誤與提出補救",
      lessons: [
        lesson("承認自己不小心弄掉杯子", "I dropped the cup by mistake.", "我不小心讓杯子掉到地上了。",
          "dropped 是 drop 的過去式，表示讓物品掉下去。by mistake 說明不是故意的。", "mishap-report-accidental-drop",
          "{person} dropped {item} by mistake.", "______ dropped ______ by mistake.", ["不小心弄掉東西的人", "掉下去的物品"],
          [variant("book", "我不小心讓書掉下去了。", ["I dropped", "the book by mistake."]),
            variant("card", "我不小心讓卡片掉下去了。", ["I dropped", "the card by mistake."])],
          ["我不小心讓書掉下去了。", "我需要帶一件外套。", "請先把瓶子倒空。"], ["a2-u56-l02", "a2-u47-l03", "a2-u48-l03"],
          {
            dropped: wordUse("drop-let-fall-past", "弄掉／讓……掉下去（過去式）", "verb 動詞（過去式）", "不小心掉落物品"),
            cup, by: wordUse("by-in-by-mistake", "與 mistake 搭配表示不是故意的", preposition, "意外發生的動作"),
            mistake: wordUse("mistake-accidental-error", "失誤", noun, "不是故意做的"),
          }, [chunk("by-mistake", "by mistake", "不小心／不是故意的", "用來解釋失誤，不是說這件事發生在某個時刻。")]),
        lesson("說杯子碰到地板時破了", "It broke when it hit the floor.", "它碰到地板時就破了。",
          "broke 是 break 的過去式；hit 的原形和過去式拼法相同。when 在這裡連接前後發生的事。", "mishap-describe-break-on-impact",
          "{first} broke when {second} hit the floor.", "______ broke when ______ hit the floor.", ["破掉的物品", "碰到地板的事件"],
          [variant("cup", "杯子碰到地板時就破了。", ["The cup broke", "when it hit the floor."]),
            variant("glass", "玻璃杯碰到地板時就破了。", ["The glass broke", "when it hit the floor."])],
          ["玻璃杯碰到地板時就破了。", "我不小心讓杯子掉到地上了。", "這張卡現在刷不過。"], ["a2-u58-l01", "a2-u53-l02", "a2-u44-l04"],
          {
            it: wordUse("it-fallen-object", "它（指掉下去的物品）", pronoun, "前面提到的杯子"),
            broke: wordUse("break-come-apart-past", "破了／壞了（過去式）", "verb 動詞（過去式）", "杯子破掉"),
            when: wordUse("when-connect-occurrence", "當……時（接發生的事）", conjunction, "破掉的時候", "", "grammar"),
            hit: wordUse("hit-strike-surface-past", "碰到／撞到（過去式）", "verb 動詞（過去式）", "杯子落到地板上"),
            floor: wordUse("floor-interior-surface", "地板", noun, "杯子掉下來撞到的表面"),
          }),
        lesson("主動說可以收拾現場", "I can clean it up.", "我可以把這裡收拾乾淨。",
          "clean up 表示把弄亂的地方收拾乾淨。用 it 代替要收拾的東西時，it 放在 clean 和 up 中間。", "mishap-offer-to-clean-up",
          "{person} can clean {item}.", "______ can clean ______.", ["要收拾的人", "要清理的地方"],
          [variant("we", "我們可以把這裡收拾乾淨。", ["We can clean", "it up."]),
            variant("floor", "我可以把地板清理乾淨。", ["I can clean", "up the floor."])],
          ["我可以把地板清理乾淨。", "我會小聲一點。", "它碰到地板時就破了。"], ["a2-u58-l01", "a2-u58-l02", "a2-u48-l04"],
          {
            can: wordUse("can-offer-clean-up", "可以（主動提出幫忙）", modal, "願意清理現場"),
            clean: wordUse("clean-remove-mess-with-up", "收拾乾淨（和 up 一起用）", verb, "把現場整理好"), it: itIncident,
            up: wordUse("up-in-clean-up", "和 clean 搭配表示把現場收拾好", adverb, "把清理動作做好"),
          }, [chunk("clean-it-up", "clean it up", "把它收拾乾淨", "it 指現場的髒亂；代名詞放在 clean 和 up 中間。")]),
        lesson("說會再拿一個新杯子來", "I will get a new cup.", "我會再拿一個新杯子來。",
          "get a new + 物品，可以說明要拿一個替代品。這句沒指定是買新的還是從手邊拿備品。", "mishap-offer-replacement",
          "{person} will get {item}.", "______ will get ______.", ["會拿替代品的人", "要拿來的物品"],
          [variant("we", "我們會再拿一個新杯子來。", ["We will get", "a new cup."]),
            variant("bag", "我會再拿一個新袋子來。", ["I will get", "a new bag."])],
          ["我會再拿一個新袋子來。", "我可以把這裡收拾乾淨。", "我不小心讓杯子掉到地上了。"], ["a2-u58-l01", "a2-u58-l02", "a2-u58-l03"],
          {
            will: wordUse("will-commit-to-replacement", "會（表示答應接下來做）", modal, "承諾拿替代品", "", "grammar"),
            get: wordUse("get-fetch-replacement", "拿來／取得（可作替代品）", verb, "用另一件物品替換"),
            new: wordUse("new-replacement-item", "新的／可替代的", adjective, "取代原本那一個"), cup,
          }),
      ],
      passage: [
        line("Sorry about the cup.", "說話者：杯子的事，真不好意思。"),
        line("I dropped the cup by mistake.", "說話者：我不小心讓杯子掉到地上了。"),
        line("It broke when it hit the floor.", "說話者：它碰到地板時就破了。"),
        line("I can clean it up.", "說話者：我可以把這裡收拾乾淨。"),
        line("I will get a new cup.", "說話者：我會再拿一個新杯子來。"),
      ],
      questions: [
        question("說話者怎麼解釋自己為什麼要道歉？", [1, 2], "I dropped the cup by mistake.", "I will get a new cup.", "I can clean it up.", "It will fit in this bag."),
        question("依說話者的描述，杯子什麼時候破掉？", [2, 3], "When it hit the floor.", "When it ends.", "At nine.", "In ten minutes."),
        question("說明杯子破掉後，說話者先主動提議做什麼？", [3, 4], "Clean it up.", "Pick up my package.", "Check the details.", "Press the start button."),
        question("除了收拾以外，說話者還會拿什麼來替換？", [4, 5], "A new cup.", "A new bag.", "A jacket.", "A book."),
      ],
    },
  ];
};
