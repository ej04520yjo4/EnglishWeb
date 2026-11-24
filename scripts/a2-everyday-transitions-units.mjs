const noun = "noun 名詞";
const verb = "verb 動詞";
const adjective = "adjective 形容詞";
const adverb = "adverb 副詞";
const preposition = "preposition 介系詞";
const determiner = "determiner 限定詞";
const modal = "modal verb 情態助動詞";
const pronoun = "pronoun 代名詞";

export const everydayTransitionsForms = (form) => ({
  cash: form("cash", "noun 名詞；verb 動詞"),
  cards: form("card", noun, "cards", { kk: "/kɑrdz/", ipa: "/kɑɹdz/", syllables: 1 }),
  working: form("work", "noun 名詞；verb 動詞", "WORK・ing", {
    kk: "/ˈwɝkɪŋ/", ipa: "/ˈwɝkɪŋ/", syllables: 2, stress: 1,
  }),
  delayed: form("delay", "verb 動詞；noun 名詞", "de・LAYED", {
    kk: "/dɪˈled/", ipa: "/dɪˈleɪd/", syllables: 2, stress: 2,
  }),
  platform: form("platform", noun, "PLAT・form"),
  team: form("team", "noun 名詞；verb 動詞"),
  sales: form("sale", noun, "sales", { kk: "/selz/", ipa: "/seɪlz/", syllables: 1 }),
  desk: form("desk", noun),
});

export const everydayTransitionsUnits = ({ lesson, variant, chunk, line, question, wordUse }) => {
  const payVerb = wordUse("pay-make-payment", "付款", verb, "支付應付金額");
  const cash = wordUse("cash-money-not-card", "現金", noun, "用鈔票或硬幣付款");
  const change = wordUse("change-money-returned", "找零／找回的錢", noun, "付現後找回的差額",
    "這裡指店家找回的錢；change 在別處也可以是「更改」，或指零錢。");
  const leave = wordUse("leave-depart-transport", "發車／出發", verb, "離開站點");
  const team = wordUse("team-working-group", "團隊", noun, "一起工作的一群人");
  return [
    {
      id: "a2-u53", title: "應用：結帳、付款方式與找零",
      lessons: [
        lesson("問店家收現金還是卡片", "Do you take cash or cards?", "請問你們收現金還是刷卡？",
          "take cash 或 take cards 裡的 take 表示「接受某種付款方式」，不是把東西拿起來。", "checkout-ask-payment-options",
          "Do you take {payment}?", "Do you take ______?", ["詢問接受哪種付款方式", "現金或卡片"],
          [variant("cash", "請問你們收現金嗎？", ["Do you take", "cash?"]),
            variant("cards", "請問你們可以刷卡嗎？", ["Do you take", "cards?"])],
          ["請問你們可以刷卡嗎？", "我可以用卡片付款嗎？", "這裡可以領取包裹嗎？"], ["a2-u32-l04", "a2-u41-l02", "a2-u43-l01"],
          {
            do: wordUse("do-yes-no-question", "開頭的助動詞，用來問接不接受", "auxiliary verb 助動詞", "形成一般現在式問句", "", "grammar"),
            you: wordUse("you-store-staff", "你們（對店員或店家說）", pronoun, "代表店家的對方"),
            take: wordUse("take-accept-payment", "接受（付款方式）", verb, "商店收款"), cash,
            cards: wordUse("card-payment-plural", "付款用的卡片（複數）", noun, "詢問能否刷卡"),
          }),
        lesson("說這張卡目前刷不過", "This card is not working.", "這張卡現在刷不過。",
          "is not working 表示現在不能正常運作。這裡的 work 不是「上班」，也沒說明失敗原因。", "checkout-state-method-not-working",
          "{item} is not working.", "______ is not working.", ["遇到問題的東西", "現在不能正常運作"],
          [variant("machine", "這台機器現在不能用。", ["This machine", "is not working."]),
            variant("other-card", "那張卡現在刷不過。", ["That card", "is not working."])],
          ["這台機器現在不能用。", "這張卡可以用。", "請問你們收現金還是刷卡？"], ["a2-u53-l01", "a2-u18-l01", "a2-u44-l03"],
          {
            this: wordUse("this-presented-card", "這張（指目前使用的卡）", determiner, "目前刷的卡片"),
            is: wordUse("be-progressive-working", "與 working 一起表示當下狀態", "auxiliary verb 助動詞", "現在進行式", "", "grammar"),
            working: wordUse("work-function-currently", "正常運作／可以用", verb, "目前卡片能否使用"),
          }, [chunk("not-working", "not working", "目前不能用", "只報告當下的問題，不判斷故障原因。")]),
        lesson("問可不可以改用現金", "Can I pay in cash instead?", "我可以改用現金付款嗎？",
          "常用 in cash 表示付現，by card 表示刷卡。instead 表示改用另一種做法。", "checkout-ask-alternative-payment",
          "{request} pay {method} instead?", "______ pay ______ instead?", ["詢問是否可以改用", "替代的付款方式"],
          [variant("by-card", "我可以改用卡片付款嗎？", ["Can I pay", "by card instead?"]),
            variant("we", "我們可以改用現金付款嗎？", ["Can we pay", "in cash instead?"])],
          ["我們可以改用現金付款嗎？", "我可以用卡片付款嗎？", "這張卡現在刷不過。"], ["a2-u53-l01", "a2-u53-l02", "a2-u32-l04"],
          {
            can: wordUse("can-ask-permission", "可以……嗎？", modal, "詢問能否更換付款方式", "", "grammar"),
            pay: payVerb, in: wordUse("in-cash-payment-method", "和 cash 搭配表示用現金", preposition, "付款媒介"),
            cash, instead: wordUse("instead-alternative-action", "改用另一個做法", adverb, "改用現金"),
          }, [chunk("in-cash", "in cash", "用現金", "pay in cash；使用卡片則常說 pay by card。")]),
        lesson("禮貌地向店員要找零", "Can I have my change, please?", "可以麻煩你把找零給我嗎？",
          "Can I have …, please? 是請對方把某物給你。my change 指付現後應找回的錢，不是「我的變更」。", "checkout-request-change-after-paying",
          "Can I have {item}, please?", "Can I have ______, please?", ["有禮貌地索取", "結帳後要拿回的東西"],
          [variant("receipt", "可以麻煩你把收據給我嗎？", ["Can I have", "my receipt, please?"]),
            variant("the-change", "可以麻煩你把找零給我嗎？", ["Can I have", "the change, please?"])],
          ["可以麻煩你把收據給我嗎？", "我可以改用現金付款嗎？", "可以麻煩你把包裹給我看嗎？"], ["a2-u53-l01", "a2-u53-l02", "a2-u53-l03"],
          {
            can: wordUse("can-request-item-politely", "可以……嗎？（請對方給東西）", modal, "禮貌地索取"),
            have: wordUse("have-receive-requested-item", "拿到（向對方索取）", verb, "收回找零"),
            change, please: wordUse("please-request", "請（禮貌用語）", adverb, "讓請求較有禮貌"),
          }, [chunk("my-change", "my change", "應找給我的錢", "結帳付現後應找回的差額。")]),
      ],
      passage: [
        line("Do you take cash or cards?", "顧客：請問你們收現金還是刷卡？"),
        line("I will pay by card.", "顧客選定付款方式：我會刷卡。"),
        line("This card is not working.", "店員：這張卡現在刷不過。"),
        line("Can I pay in cash instead?", "顧客：我可以改用現金付款嗎？"),
        line("Can I have my change, please?", "顧客付現後：可以麻煩你把找零給我嗎？"),
        line("Here is the change.", "店員：這是找零。"),
      ],
      questions: [
        question("顧客開頭詢問的是哪兩種付款方式？", [1], "Cash or cards.", "Cash or email.", "Cards or tea.", "Cash or a receipt."),
        question("店員說剛才付款發生什麼問題？", [2, 3], "This card is not working.", "This machine is not working.", "The entrance is on the second floor.", "The store is open every day except Sunday."),
        question("卡片刷不過之後，顧客想改用什麼方式？", [3, 4], "In cash.", "By card.", "By email.", "On the side."),
        question("付現之後，顧客請店員給什麼？", [5, 6], "The change.", "The receipt.", "The card.", "The package."),
      ],
    },
    {
      id: "a2-u54", title: "應用：班次延誤與月台資訊",
      lessons: [
        lesson("聽懂列車延誤", "The train is delayed by ten minutes.", "列車延誤十分鐘。",
          "be delayed 表示班次比原定時間晚，不代表取消。by ten minutes 是晚了多少時間，不是最晚幾點。", "departure-state-delay",
          "{service} is delayed by {amount}.", "______ is delayed by ______.", ["延誤的班次", "延誤的時間長度"],
          [variant("bus", "公車延誤十分鐘。", ["The bus", "is delayed by ten minutes."]),
            variant("three", "列車延誤三分鐘。", ["The train", "is delayed by three minutes."])],
          ["公車延誤十分鐘。", "列車已經發車。", "搭火車比較省時間。"], ["a2-u15-l01", "a2-u38-l03", "a2-u45-l03"],
          {
            is: wordUse("be-linking-delay-status", "連接班次與延誤狀態的 be 動詞", "linking verb 連綴動詞", "引出班次現在的狀態", "", "grammar"),
            delayed: wordUse("delay-running-late-state", "延誤的／誤點的", adjective, "未依原定時間發車",
              "delayed 源自 delay；此處說明延誤的狀態，不是已取消。"),
            by: wordUse("by-amount-of-delay", "接延誤的時間長度", preposition, "比原定時間晚多久"),
          }, [chunk("is-delayed", "is delayed", "已延誤", "比原訂時刻晚，是否有替代班次仍需再問。")]),
        lesson("用「下一班」追問發車時間", "When does the next one leave?", "下一班什麼時候發車？",
          "the next one 代替已提到的交通工具。does 後面用原形 leave；此處是發車，不是放下東西。", "departure-ask-next-service-time",
          "When does {service} leave?", "When does ______ leave?", ["詢問發車時刻", "指定的班次"],
          [variant("next-bus", "下一班公車什麼時候發車？", ["When does", "the next bus leave?"]),
            variant("this-train", "這班火車什麼時候發車？", ["When does", "this train leave?"])],
          ["下一班公車什麼時候發車？", "這家店幾點開門？", "列車延誤十分鐘。"], ["a2-u54-l01", "a2-u50-l01", "a2-u38-l02"],
          {
            when: wordUse("when-time-question", "什麼時候（詢問時間）", adverb, "詢問發車時間"),
            next: wordUse("next-following-service", "下一班（接班次）", adjective, "接下來的班次"),
            one: wordUse("one-replace-mentioned-service", "一班（代替前面提到的車）", pronoun, "不重複前面的交通工具名稱"), leave,
          }, [chunk("the-next-one", "the next one", "下一班", "one 代替前面說過的班次。")]),
        lesson("聽懂回答九點發車", "It leaves at nine.", "這班車九點發車。",
          "It 指已提過的班次。直述句的單數主詞用 leaves；具體幾點用 at。", "departure-state-leaving-clock-time",
          "{service} leaves at {time}.", "______ leaves at ______.", ["出發的班次", "幾點發車"],
          [variant("ten", "這班車十點發車。", ["It leaves", "at ten."]),
            variant("bus", "公車九點發車。", ["The bus leaves", "at nine."])],
          ["這班車十點發車。", "下一班什麼時候發車？", "我們從八點營業到七點。"], ["a2-u54-l01", "a2-u54-l02", "a2-u50-l02"],
          {
            it: wordUse("it-mentioned-service", "這班車（指剛才問的班次）", pronoun, "下一班車"),
            leaves: wordUse("leave-third-person-departure", "發車（單數主詞）", "verb 動詞（第三人稱單數）", "班次離開車站"),
            at: wordUse("at-exact-clock-time", "在（接幾點）", preposition, "發車的鐘點"),
            nine: wordUse("nine-clock-time", "九點（指鐘點）", "number 數詞", "確切發車時間"),
          }),
        lesson("詢問從哪個月台發車", "Which platform does it leave from?", "這班車從哪個月台發車？",
          "Which platform … leave from? 問從哪個月台出發。月台編號用 Platform two（第二月台）這種說法。", "departure-ask-platform",
          "Which {place} does {service} leave from?", "Which ______ does ______ leave from?", ["問從哪個地點出發", "要搭的班次"],
          [variant("train", "這班火車從哪個月台發車？", ["Which platform does", "the train leave from?"]),
            variant("station", "這班車從哪個車站出發？", ["Which station does", "it leave from?"])],
          ["這班車從哪個車站出發？", "這班車九點發車。", "入口在車站對面。"], ["a2-u54-l02", "a2-u54-l03", "a2-u51-l02"],
          {
            platform: wordUse("platform-train-boarding", "月台", noun, "搭車的指定月台"),
            it: wordUse("it-mentioned-service", "這班車（指剛才問的班次）", pronoun, "要搭的班次"),
            leave, from: wordUse("from-departure-point", "從（接出發地點）", preposition, "發車的起點"),
          }),
      ],
      passage: [
        line("The train is delayed by ten minutes.", "站務人員：列車延誤十分鐘。"),
        line("When does the next one leave?", "乘客：下一班什麼時候發車？"),
        line("It leaves at nine.", "站務人員：這班車九點發車。"),
        line("Which platform does it leave from?", "乘客：這班車從哪個月台發車？"),
        line("Platform two.", "站務人員：第二月台。"),
      ],
      questions: [
        question("站務人員一開始公布了什麼？", [1], "The train is delayed by ten minutes.", "The bus takes ten minutes.", "It leaves at nine.", "The entrance is on the second floor."),
        question("聽到延誤後，乘客先問什麼？", [1, 2], "When does the next one leave?", "Which platform does it leave from?", "How much is each ticket?", "How long is the wait?"),
        question("乘客之後要搭的那班車幾點發車？", [2, 3], "At nine.", "At ten.", "At eight.", "At seven."),
        question("知道發車時間後，乘客確認搭車位置；站務人員指定哪裡？", [3, 4, 5], "Platform two.", "Platform one.", "On the second floor.", "Right by the door."),
      ],
    },
    {
      id: "a2-u55", title: "應用：新同事、座位與協助工作",
      lessons: [
        lesson("介紹自己是新加入團隊的", "I am new to the team.", "我剛加入這個團隊。",
          "be new to + 團隊或地方表示自己是新加入的。這句不是說這個團隊才剛成立。", "coworker-state-new-to-team",
          "{person} new to {group}.", "______ new to ______.", ["新加入的人", "團隊或環境"],
          [variant("office", "我剛來這間辦公室。", ["I am new", "to the office."]),
            variant("we", "我們剛加入這個團隊。", ["We are new", "to the team."])],
          ["我們剛加入這個團隊。", "這是新的團隊。", "我們可以一起做完。"], ["a2-u27-l04", "a2-u46-l02", "a2-u50-l02"],
          {
            am: wordUse("be-new-member-state", "接形容詞 new 的 be 動詞", "linking verb 連綴動詞", "引出新成員身分", "", "grammar"),
            new: wordUse("new-inexperienced-member", "新來的／剛加入的", adjective, "自己剛成為其中一員"),
            to: wordUse("to-in-new-to", "接剛加入的團隊或地方", preposition, "新的環境", "", "grammar"), team,
          }, [chunk("new-to-the-team", "new to the team", "剛加入團隊", "new 的是說話者，不是整個團隊。")]),
        lesson("介紹自己和業務團隊共事", "I work with the sales team.", "我和業務團隊一起工作。",
          "work with 是和某人或某團隊共事。sales team 指負責銷售的團隊，不一定表示說話者就是業務。", "coworker-state-work-with",
          "{person} work with {group}.", "______ work with ______.", ["共事的人", "工作上的合作對象"],
          [variant("manager", "我和這位主管一起工作。", ["I work with", "the manager."]),
            variant("we", "我們和業務團隊一起工作。", ["We work with", "the sales team."])],
          ["我們和業務團隊一起工作。", "我剛加入這個團隊。", "我會把檔案寄給你。"], ["a2-u55-l01", "a2-u36-l01", "a2-u27-l04"],
          {
            work: wordUse("work-professional-collaboration", "工作／共事", verb, "和團隊合作"),
            with: wordUse("with-work-collaborator", "和……一起", preposition, "工作的合作對象"),
            sales: wordUse("sale-business-activity-modifier", "業務／銷售（修飾 team）", "noun 名詞（作修飾語）", "團隊負責的業務"), team,
          }, [chunk("the-sales-team", "the sales team", "業務團隊", "sales 修飾 team，指負責銷售工作。")]),
        lesson("確認這是不是自己的座位", "Is this my desk?", "這是我的辦公桌嗎？",
          "Is this my …? 用來確認眼前是不是指定給自己的物品。desk 是工作桌，不是一般餐桌。", "coworker-confirm-assigned-place",
          "Is {nearby} my {place}?", "Is ______ my ______?", ["指要確認的地方", "指定給自己的工作位置"],
          [variant("that", "那是我的辦公桌嗎？", ["Is that", "my desk?"]),
            variant("office", "這是我的辦公室嗎？", ["Is this", "my office?"])],
          ["那是我的辦公桌嗎？", "你看得到正門嗎？", "我剛加入這個團隊。"], ["a2-u55-l01", "a2-u55-l02", "a2-u51-l03"],
          {
            is: wordUse("be-confirm-object-identity", "用 be 動詞開頭確認是不是某個東西", "linking verb 連綴動詞", "確認眼前的辦公桌", "", "grammar"),
            this: wordUse("this-nearby-desk", "這個（眼前的座位）", pronoun, "確認眼前的辦公桌"),
            desk: wordUse("desk-assigned-work-surface", "辦公桌／工作桌", noun, "指定給自己的工作位置"),
          }),
        lesson("主動問能不能幫忙做報告", "Can I help with the report?", "我可以幫忙做這份報告嗎？",
          "help with + 事情，表示協助某件事。Can I help with …? 是主動提供協助，不是要求別人幫自己。", "coworker-offer-help-with-task",
          "{person} help with {task}?", "______ help with ______?", ["提出協助的人", "要幫忙的事情"],
          [variant("file", "我可以幫忙處理這份檔案嗎？", ["Can I help", "with the file?"]),
            variant("we", "我們可以幫忙做這份報告嗎？", ["Can we help", "with the report?"])],
          ["我們可以幫忙做這份報告嗎？", "我會把檔案寄給你。", "這是我的辦公桌嗎？"], ["a2-u55-l01", "a2-u55-l02", "a2-u55-l03"],
          {
            can: wordUse("can-offer-help", "可以……嗎？（主動提供協助）", modal, "請問能不能幫上忙"),
            help: wordUse("help-assist-with-task", "協助／幫忙", verb, "協助工作"),
            with: wordUse("with-help-task", "接要幫忙的事情", preposition, "協助的工作項目"),
          }, [chunk("help-with", "help with", "協助處理", "後面接要幫忙的事情，而不是接受協助的人。")]),
      ],
      passage: [
        line("I am new to the team.", "新同事：我剛加入這個團隊。"),
        line("I work with the sales team.", "同事：我和業務團隊一起工作。"),
        line("Is this my desk?", "新同事：這是我的辦公桌嗎？"),
        line("You can work here.", "同事：你可以在這裡工作。"),
        line("Can I help with the report?", "新同事：我可以幫忙做這份報告嗎？"),
      ],
      questions: [
        question("新同事先怎麼介紹自己？", [1], "New to the team.", "New to the office.", "From the station.", "At the library."),
        question("接待的同事說和哪個團隊共事？", [2], "The sales team.", "The manager.", "The library.", "The station."),
        question("確認辦公桌之後，接待的同事怎麼回答？", [3, 4], "You can work here.", "You can wait outside.", "You can leave it here.", "You can send it by email."),
        question("問完座位後，新同事又主動提議幫忙做什麼？", [3, 4, 5], "Help with the report.", "Read the first page.", "Check the package number.", "Put the dishes away."),
      ],
    },
  ];
};
