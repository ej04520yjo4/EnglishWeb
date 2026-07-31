import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  parseCourseCsv,
  serializeCourseCsv,
} from "../app/curriculum/validation.ts";

const QA_STATUS = "pilot_review_required";

const lesson = (
  title,
  sentence,
  translation,
  grammar,
  focus,
  chunks,
  variants,
) => ({
  title,
  sentence,
  translation,
  grammar,
  focus,
  chunks,
  variants,
});

const LEVELS = [
  {
    level: "B1",
    fileStem: "b1",
    units: [
      {
        title: "經驗、回憶與故事順序",
        lessons: [
          lesson(
            "持續至今的經驗",
            "I have worked here for three years.",
            "我在這裡工作三年了。",
            "present perfect with for",
            "three years",
            [
              ["have worked", "已經工作", "現在完成式表示從過去持續到現在的經驗。"],
              ["for three years", "持續三年", "for 加一段時間。"],
            ],
            [
              ["You have worked here for three years.", "你在這裡工作三年了。"],
              ["I have worked at home for three years.", "我在家工作三年了。"],
            ],
          ),
          lesson(
            "談未曾有過的經驗",
            "I have never traveled alone before.",
            "我以前從未獨自旅行過。",
            "present perfect with never",
            "traveled alone",
            [["have never traveled", "從未旅行過", "never 放在 have 與過去分詞之間。"]],
            [
              ["You have never traveled alone before.", "你以前從未獨自旅行過。"],
              ["I have traveled alone before.", "我以前曾經獨自旅行過。"],
            ],
          ),
          lesson(
            "背景動作與插入事件",
            "I was cooking when you called me.",
            "你打電話給我時，我正在煮飯。",
            "past continuous with when",
            "was cooking",
            [["was cooking", "當時正在煮飯", "過去進行式描述當時持續中的動作。"]],
            [
              ["I was cooking when you called.", "你打電話時，我正在煮飯。"],
              ["You called me when I was cooking.", "我正在煮飯時，你打電話給我。"],
            ],
          ),
          lesson(
            "依序敘述過去事件",
            "After I arrived home I called my friend.",
            "我到家後打電話給朋友。",
            "past events with after",
            "called my friend",
            [["after I arrived home", "我到家後", "after 用來標示先發生的事件。"]],
            [
              ["I called my friend after I arrived home.", "我到家後打電話給朋友。"],
              ["After I arrived I called my friend.", "我抵達後打電話給朋友。"],
            ],
          ),
        ],
      },
      {
        title: "目標、希望與個人計畫",
        lessons: [
          lesson(
            "表達未來希望",
            "I hope to study English abroad next year.",
            "我希望明年到國外學英文。",
            "hope to for future goals",
            "study English abroad",
            [["hope to", "希望做某事", "hope to 後接原形動詞。"]],
            [
              ["I hope to study English next year.", "我希望明年學英文。"],
              ["You hope to study English abroad.", "你希望到國外學英文。"],
            ],
          ),
          lesson(
            "為計畫做準備",
            "I am saving money for my trip.",
            "我正在為旅行存錢。",
            "present continuous for current preparation",
            "saving money",
            [["saving money", "正在存錢", "現在進行式描述目前持續的準備。"]],
            [
              ["I am saving for my trip.", "我正在為旅行存錢。"],
              ["I am saving money for the trip.", "我正在為這趟旅行存錢。"],
            ],
          ),
          lesson(
            "可能條件與結果",
            "If I finish early I will meet you.",
            "如果我提早完成，我會去見你。",
            "first conditional",
            "finish early",
            [["if I finish early", "如果我提早完成", "第一條件句描述可能發生的未來情況。"]],
            [
              ["I will meet you if I finish early.", "如果我提早完成，我會去見你。"],
              ["If I finish I will meet you.", "如果我完成了，我會去見你。"],
            ],
          ),
          lesson(
            "說明個人目標",
            "My goal is to find a better job.",
            "我的目標是找到更好的工作。",
            "goal plus infinitive",
            "better job",
            [["my goal is to", "我的目標是", "用 is to 加原形動詞說明目標。"]],
            [
              ["My goal is to find better work.", "我的目標是找到更好的工作。"],
              ["The goal is to find a better job.", "目標是找到更好的工作。"],
            ],
          ),
        ],
      },
      {
        title: "意見、理由與簡單論證",
        lessons: [
          lesson(
            "提出個人看法",
            "I think public transportation is very useful.",
            "我認為大眾運輸非常實用。",
            "I think plus opinion",
            "public transportation",
            [["I think", "我認為", "用來引出個人意見。"]],
            [
              ["I think transportation is useful.", "我認為交通運輸很實用。"],
              ["Public transportation is very useful.", "大眾運輸非常實用。"],
            ],
          ),
          lesson(
            "說明偏好與理由",
            "I prefer this plan because it costs less.",
            "我比較喜歡這個方案，因為它花費較少。",
            "preference with because",
            "costs less",
            [["because it costs less", "因為它花費較少", "because 引出理由。"]],
            [
              ["I prefer this because it costs less.", "我比較喜歡這個，因為它花費較少。"],
              ["This plan costs less because it is cheaper.", "這個方案花費較少，因為它比較便宜。"],
            ],
          ),
          lesson(
            "使用讓步連接詞",
            "Although the task was difficult I finished it.",
            "雖然任務很困難，我仍完成了。",
            "although for contrast",
            "although the task was difficult",
            [["although the task was difficult", "雖然任務很困難", "although 引出與主句形成對比的情況。"]],
            [
              ["Although it was difficult I finished the task.", "雖然很困難，我仍完成了任務。"],
              ["I finished the task although it was difficult.", "雖然任務很困難，我仍完成了。"],
            ],
          ),
          lesson(
            "選擇有益的方案",
            "We should choose the option that helps everyone.",
            "我們應該選擇能幫助大家的方案。",
            "relative clause with that",
            "helps everyone",
            [["the option that helps everyone", "能幫助大家的方案", "that 引導關係子句補充 option。"]],
            [
              ["We should choose the option that helps.", "我們應該選擇有幫助的方案。"],
              ["I think we should choose that option.", "我認為我們應該選擇那個方案。"],
            ],
          ),
        ],
      },
      {
        title: "工作與學習中的溝通",
        lessons: [
          lesson(
            "禮貌請求說明",
            "Could you explain this problem again please?",
            "可以請你再說明一次這個問題嗎？",
            "polite request with could",
            "explain this problem",
            [["could you explain", "可以請你說明嗎", "Could you... 是較有禮貌的請求。"]],
            [
              ["Could you explain this again please?", "可以請你再說明一次嗎？"],
              ["Please explain this problem again.", "請再說明一次這個問題。"],
            ],
          ),
          lesson(
            "說明期限",
            "I need to finish the report before Friday.",
            "我需要在星期五以前完成報告。",
            "need to with deadline",
            "before Friday",
            [["before Friday", "在星期五以前", "before 標示截止時間。"]],
            [
              ["I need to finish this report before Friday.", "我需要在星期五以前完成這份報告。"],
              ["You need to finish the report before Friday.", "你需要在星期五以前完成報告。"],
            ],
          ),
          lesson(
            "描述提供協助的人",
            "The colleague who helped me was very patient.",
            "幫助我的同事非常有耐心。",
            "relative clause with who",
            "who helped me",
            [["the colleague who helped me", "幫助我的同事", "who 引導關係子句描述人。"]],
            [
              ["The colleague who helped me was patient.", "幫助我的同事很有耐心。"],
              ["I think the colleague was very patient.", "我認為那位同事非常有耐心。"],
            ],
          ),
          lesson(
            "確認共同安排",
            "We agreed to meet after the morning class.",
            "我們同意早上的課程結束後見面。",
            "agree to plus infinitive",
            "agreed to meet",
            [["agreed to meet", "同意見面", "agree to 後接原形動詞。"]],
            [
              ["We agreed to meet after class.", "我們同意下課後見面。"],
              ["I agreed to meet after the morning class.", "我同意早上的課程結束後見面。"],
            ],
          ),
        ],
      },
      {
        title: "旅行突發狀況與協調",
        lessons: [
          lesson(
            "說明延誤造成的結果",
            "My train was delayed so I missed the bus.",
            "我的火車誤點，所以我錯過了公車。",
            "cause and result with so",
            "missed the bus",
            [["was delayed", "誤點了", "被動形式描述交通工具發生延誤。"]],
            [
              ["The train was delayed so I missed the bus.", "火車誤點，所以我錯過了公車。"],
              ["I missed the bus because my train was delayed.", "我因為火車誤點而錯過公車。"],
            ],
          ),
          lesson(
            "間接詢問地點",
            "Could you tell me where the station is?",
            "可以請你告訴我車站在哪裡嗎？",
            "indirect question",
            "where the station is",
            [["could you tell me", "可以請你告訴我嗎", "間接問句使用直述句語序。"]],
            [
              ["Could you tell me where the bus is?", "可以請你告訴我公車在哪裡嗎？"],
              ["Tell me where the station is please.", "請告訴我車站在哪裡。"],
            ],
          ),
          lesson(
            "更改預訂",
            "I need to change my booking for tomorrow.",
            "我需要更改明天的預訂。",
            "need to for travel changes",
            "change my booking",
            [["change my booking", "更改我的預訂", "booking 指已安排好的預訂。"]],
            [
              ["I need to change the booking for tomorrow.", "我需要更改明天的預訂。"],
              ["I want to change my booking for tomorrow.", "我想更改明天的預訂。"],
            ],
          ),
          lesson(
            "天氣條件與行程",
            "If the weather improves we will leave early.",
            "如果天氣好轉，我們會提早出發。",
            "first conditional for travel",
            "weather improves",
            [["if the weather improves", "如果天氣好轉", "描述有可能發生的條件。"]],
            [
              ["We will leave early if the weather improves.", "如果天氣好轉，我們會提早出發。"],
              ["If the weather improves I will leave early.", "如果天氣好轉，我會提早出發。"],
            ],
          ),
        ],
      },
      {
        title: "媒體、科技與日常使用",
        lessons: [
          lesson(
            "使用工具安排生活",
            "I use this app to organize my schedule.",
            "我使用這個應用程式安排自己的行程。",
            "use something to plus verb",
            "organize my schedule",
            [["use this app to", "使用這個應用程式來", "to 表示使用工具的目的。"]],
            [
              ["I use the app to organize my schedule.", "我使用這個應用程式安排自己的行程。"],
              ["This app helps me organize my schedule.", "這個應用程式幫助我安排行程。"],
            ],
          ),
          lesson(
            "描述傳送錯誤",
            "The message was sent to the wrong person.",
            "訊息被傳給錯的人了。",
            "past passive",
            "was sent",
            [["was sent", "被傳送", "被動語態聚焦訊息受到的動作。"]],
            [
              ["The message was sent to the wrong friend.", "訊息被傳給錯的朋友了。"],
              ["The wrong message was sent to me.", "錯誤的訊息被傳給我了。"],
            ],
          ),
          lesson(
            "談近期使用時間",
            "I have spent less time online this week.",
            "我這星期花在網路上的時間比較少。",
            "present perfect for a current period",
            "spent less time online",
            [["this week", "這星期", "尚未結束的時間範圍常搭配現在完成式。"]],
            [
              ["I have spent less time online.", "我花在網路上的時間比較少。"],
              ["This week I have spent less time online.", "這星期我花在網路上的時間比較少。"],
            ],
          ),
          lesson(
            "說明科技的效益",
            "Technology can make daily tasks more convenient.",
            "科技可以讓日常工作更方便。",
            "make plus object plus adjective",
            "more convenient",
            [["make daily tasks more convenient", "讓日常工作更方便", "make 可接受詞與形容詞說明造成的結果。"]],
            [
              ["Technology can make tasks more convenient.", "科技可以讓工作更方便。"],
              ["Technology can make work more convenient.", "科技可以讓工作更方便。"],
            ],
          ),
        ],
      },
      {
        title: "人際關係與社會生活",
        lessons: [
          lesson(
            "為疏忽道歉",
            "I apologized because I had forgotten her birthday.",
            "我因為忘了她的生日而道歉。",
            "past perfect for an earlier event",
            "had forgotten",
            [["had forgotten", "先前已經忘記", "過去完成式表示比另一個過去動作更早發生。"]],
            [
              ["I apologized because I had forgotten the birthday.", "我因為忘了生日而道歉。"],
              ["I had forgotten her birthday so I apologized.", "我忘了她的生日，所以道歉了。"],
            ],
          ),
          lesson(
            "支持朋友",
            "Good friends listen when someone needs support.",
            "好朋友會在別人需要支持時傾聽。",
            "when clause for social situations",
            "needs support",
            [["when someone needs support", "當有人需要支持時", "when 引出需要回應的情況。"]],
            [
              ["Friends listen when someone needs support.", "朋友會在別人需要支持時傾聽。"],
              ["Good friends listen when I need support.", "好朋友會在我需要支持時傾聽。"],
            ],
          ),
          lesson(
            "談長期認識的人",
            "We have known each other since high school.",
            "我們從高中起就認識彼此。",
            "present perfect with since",
            "since high school",
            [["each other", "彼此", "each other 表示雙方互相。"], ["since high school", "從高中起", "since 加起始時間。"]],
            [
              ["We have known each other since school.", "我們從學生時期起就認識彼此。"],
              ["I have known her since high school.", "我從高中起就認識她。"],
            ],
          ),
          lesson(
            "尊重不同意見",
            "It is important to respect different opinions.",
            "尊重不同意見很重要。",
            "it is adjective to plus verb",
            "respect different opinions",
            [["it is important to", "做某事很重要", "形式主詞 it 帶出重要性。"]],
            [
              ["It is important to respect opinions.", "尊重意見很重要。"],
              ["I think it is important to respect different opinions.", "我認為尊重不同意見很重要。"],
            ],
          ),
        ],
      },
      {
        title: "B1 整合敘事文章",
        lessons: [
          lesson(
            "開始改變生活",
            "Last year I decided to change my daily routine.",
            "去年我決定改變日常作息。",
            "past decision with infinitive",
            "change my daily routine",
            [["decided to change", "決定改變", "decide to 後接原形動詞。"]],
            [
              ["I decided to change my routine last year.", "去年我決定改變作息。"],
              ["Last year I decided to change the routine.", "去年我決定改變這套作息。"],
            ],
          ),
          lesson(
            "描述一開始的困難",
            "At first the new schedule was difficult to follow.",
            "一開始，新的作息很難遵循。",
            "adjective plus infinitive",
            "difficult to follow",
            [["at first", "一開始", "用來標示故事的初始階段。"]],
            [
              ["The new schedule was difficult to follow at first.", "新的作息一開始很難遵循。"],
              ["At first it was difficult to follow the schedule.", "一開始很難遵循這套作息。"],
            ],
          ),
          lesson(
            "持續練習的理由",
            "I kept practicing because I wanted better results.",
            "我持續練習，因為我想要更好的成果。",
            "keep plus gerund with because",
            "kept practicing",
            [["kept practicing", "持續練習", "keep 後接動名詞表示持續做某事。"]],
            [
              ["I kept practicing because I wanted results.", "我持續練習，因為我想要成果。"],
              ["I wanted better results so I kept practicing.", "我想要更好的成果，所以持續練習。"],
            ],
          ),
          lesson(
            "說明現在的感受",
            "Now I feel more confident about my goals.",
            "現在我對自己的目標更有信心。",
            "comparative adjective for change",
            "more confident",
            [["feel more confident", "感到更有信心", "more 加形容詞表示程度提升。"]],
            [
              ["I feel more confident about my goals now.", "現在我對自己的目標更有信心。"],
              ["Now I feel confident about the results.", "現在我對成果有信心。"],
            ],
          ),
        ],
      },
    ],
  },
  {
    level: "B2",
    fileStem: "b2",
    units: [
      {
        title: "深入表達觀點與立場",
        lessons: [
          lesson(
            "說明立場的好處",
            "In my view the proposal offers several practical benefits.",
            "依我看，這項提案帶來幾個實際的好處。",
            "opinion framing with in my view",
            "practical benefits",
            [["in my view", "依我看", "較正式地引出個人觀點。"]],
            [
              ["The proposal offers several practical benefits.", "這項提案帶來幾個實際的好處。"],
              ["In my view the proposal offers practical benefits.", "依我看，這項提案帶來實際的好處。"],
            ],
          ),
          lesson(
            "承認疑慮後表態",
            "Although I understand your concern I support the change.",
            "雖然我理解你的疑慮，但我支持這項改變。",
            "concession before a position",
            "support the change",
            [["although I understand your concern", "雖然我理解你的疑慮", "先承認對方觀點，再提出自己的立場。"]],
            [
              ["I support the change although I understand your concern.", "雖然我理解你的疑慮，但我支持這項改變。"],
              ["Although I understand the concern I support the change.", "雖然我理解這項疑慮，但我支持這項改變。"],
            ],
          ),
          lesson(
            "指出核心判斷",
            "The main issue is whether the plan will remain effective.",
            "主要問題是這個方案是否會持續有效。",
            "whether clause as complement",
            "remain effective",
            [["whether the plan will remain effective", "方案是否會持續有效", "whether 引出需要判斷的兩種可能。"]],
            [
              ["The issue is whether the plan will remain effective.", "問題是這個方案是否會持續有效。"],
              ["I think the main issue is whether the plan is effective.", "我認為主要問題是這個方案是否有效。"],
            ],
          ),
          lesson(
            "提出可辯護的主張",
            "I would argue that education should encourage independent thinking.",
            "我會主張教育應該鼓勵獨立思考。",
            "hedged argument with would",
            "independent thinking",
            [["I would argue that", "我會主張", "用 would 降低語氣強度並提出論點。"]],
            [
              ["I would argue that education should encourage thinking.", "我會主張教育應該鼓勵思考。"],
              ["In my view education should encourage independent thinking.", "依我看，教育應該鼓勵獨立思考。"],
            ],
          ),
        ],
      },
      {
        title: "比較方案、優點與缺點",
        lessons: [
          lesson(
            "對照兩個方案",
            "This option is more flexible whereas the other is cheaper.",
            "這個方案比較有彈性，而另一個比較便宜。",
            "contrast with whereas",
            "more flexible",
            [["whereas the other", "而另一個", "whereas 用來清楚對照兩項內容。"]],
            [
              ["This option is cheaper whereas the other is more flexible.", "這個方案比較便宜，而另一個比較有彈性。"],
              ["The other option is cheaper whereas this one is more flexible.", "另一個方案比較便宜，而這個比較有彈性。"],
            ],
          ),
          lesson(
            "指出隱藏代價",
            "The cheaper solution may create additional problems later.",
            "較便宜的解決方案之後可能會造成額外問題。",
            "modal may for possible consequences",
            "additional problems",
            [["may create", "可能造成", "may 表示有可能發生但不確定的結果。"]],
            [
              ["The solution may create additional problems later.", "這個解決方案之後可能會造成額外問題。"],
              ["This cheaper solution may create problems later.", "這個較便宜的解決方案之後可能會造成問題。"],
            ],
          ),
          lesson(
            "同時考量兩面",
            "We should consider both the cost and the long term impact.",
            "我們應該同時考量成本與長期影響。",
            "both and coordination",
            "long term impact",
            [["both the cost and the long term impact", "成本與長期影響兩者", "both...and... 強調兩項都要考量。"]],
            [
              ["We should consider the cost and the long term impact.", "我們應該考量成本與長期影響。"],
              ["I think we should consider both the cost and the impact.", "我認為我們應該同時考量成本與影響。"],
            ],
          ),
          lesson(
            "假設有更多資源",
            "If we had more time we could compare the results carefully.",
            "如果我們有更多時間，就能仔細比較結果。",
            "second conditional",
            "compare the results carefully",
            [["if we had more time", "如果我們有更多時間", "第二條件句描述目前不太可能或假設的情況。"]],
            [
              ["We could compare the results carefully if we had more time.", "如果我們有更多時間，就能仔細比較結果。"],
              ["If I had more time I could compare the results carefully.", "如果我有更多時間，就能仔細比較結果。"],
            ],
          ),
        ],
      },
      {
        title: "職場專業溝通與回饋",
        lessons: [
          lesson(
            "報告專案完成狀況",
            "The project was completed earlier than the manager expected.",
            "專案比經理預期的更早完成。",
            "passive voice with comparison",
            "completed earlier",
            [["was completed", "已被完成", "被動語態聚焦專案的完成狀態。"]],
            [
              ["The project was completed earlier than expected.", "專案比預期的更早完成。"],
              ["The manager expected the project to finish earlier.", "經理原本預期專案會更早完成。"],
            ],
          ),
          lesson(
            "轉述修改建議",
            "She suggested that we revise the final section.",
            "她建議我們修改最後一個段落。",
            "suggest that clause",
            "revise the final section",
            [["suggested that we revise", "建議我們修改", "suggest that 後接子句提出建議。"]],
            [
              ["She suggested that I revise the final section.", "她建議我修改最後一個段落。"],
              ["The manager suggested that we revise the section.", "經理建議我們修改這個段落。"],
            ],
          ),
          lesson(
            "回應具體回饋",
            "I appreciate your feedback because it identifies the main weakness.",
            "我感謝你的回饋，因為它指出了主要弱點。",
            "appreciation with reason",
            "identifies the main weakness",
            [["I appreciate your feedback", "我感謝你的回饋", "用於專業且具體地回應意見。"]],
            [
              ["I appreciate the feedback because it identifies the weakness.", "我感謝這項回饋，因為它指出了弱點。"],
              ["Your feedback identifies the main weakness.", "你的回饋指出了主要弱點。"],
            ],
          ),
          lesson(
            "說明持續中的工作",
            "The team has been working on this issue for months.",
            "團隊幾個月來一直在處理這個問題。",
            "present perfect continuous",
            "has been working",
            [["has been working", "一直在處理", "現在完成進行式強調持續至今的活動。"]],
            [
              ["The team has been working on the project for months.", "團隊幾個月來一直在處理這個專案。"],
              ["We have been working on this issue for months.", "我們幾個月來一直在處理這個問題。"],
            ],
          ),
        ],
      },
      {
        title: "新聞與公共議題",
        lessons: [
          lesson(
            "辨識報導中的主張",
            "The report claims that public support has increased recently.",
            "報告聲稱大眾支持最近有所增加。",
            "reporting verb claims",
            "increased recently",
            [["the report claims that", "報告聲稱", "claims 表示這是來源提出的說法。"]],
            [
              ["The report claims that support has increased recently.", "報告聲稱支持最近有所增加。"],
              ["The report claims that public support increased recently.", "報告聲稱大眾支持最近增加了。"],
            ],
          ),
          lesson(
            "說明政策背景",
            "The policy was introduced after several experts raised concerns.",
            "幾位專家提出疑慮後，這項政策被推出。",
            "passive event with after",
            "experts raised concerns",
            [["was introduced", "被推出", "被動語態聚焦政策本身。"]],
            [
              ["The policy was introduced after experts raised concerns.", "專家提出疑慮後，這項政策被推出。"],
              ["Several experts raised concerns after the policy was introduced.", "這項政策推出後，幾位專家提出了疑慮。"],
            ],
          ),
          lesson(
            "轉述文章可能影響",
            "According to the article the decision may affect small businesses.",
            "根據這篇文章，這項決定可能影響小型企業。",
            "source attribution with according to",
            "affect small businesses",
            [["according to the article", "根據這篇文章", "用來清楚標示資訊來源。"]],
            [
              ["According to the report the decision may affect businesses.", "根據這份報告，這項決定可能影響企業。"],
              ["The article claims that the decision may affect small businesses.", "文章聲稱這項決定可能影響小型企業。"],
            ],
          ),
          lesson(
            "檢查證據可靠性",
            "We should check whether the source provides reliable evidence.",
            "我們應該檢查這個來源是否提供可靠證據。",
            "whether clause for source checking",
            "reliable evidence",
            [["check whether", "檢查是否", "whether 引出需要核實的內容。"]],
            [
              ["We should check whether the article provides reliable evidence.", "我們應該檢查這篇文章是否提供可靠證據。"],
              ["The source provides reliable evidence.", "這個來源提供可靠證據。"],
            ],
          ),
        ],
      },
      {
        title: "文化差異與跨文化交流",
        lessons: [
          lesson(
            "理解行為差異",
            "People may interpret the same behavior in different ways.",
            "人們可能會用不同方式解讀相同的行為。",
            "modal may for interpretation",
            "different ways",
            [["interpret the same behavior", "解讀相同的行為", "interpret 強調對行為賦予意義。"]],
            [
              ["People may interpret behavior in different ways.", "人們可能會用不同方式解讀行為。"],
              ["Different people may interpret the same behavior.", "不同的人可能會解讀相同的行為。"],
            ],
          ),
          lesson(
            "比較文化感受",
            "What seems polite in one culture may feel distant in another.",
            "在一種文化中看似有禮貌的行為，在另一種文化中可能顯得疏遠。",
            "what clause with contrast",
            "feel distant",
            [["in one culture", "在一種文化中", "與 in another 形成跨文化對照。"]],
            [
              ["What seems polite in one culture may feel different in another.", "在一種文化中看似有禮貌的行為，在另一種文化中可能感受不同。"],
              ["In another culture the same behavior may feel distant.", "在另一種文化中，相同的行為可能顯得疏遠。"],
            ],
          ),
          lesson(
            "避免先入為主",
            "I learned to ask questions instead of making assumptions.",
            "我學會先提問，而不是自行假設。",
            "instead of plus gerund",
            "instead of making assumptions",
            [["instead of", "而不是", "用來對比選擇的做法。"]],
            [
              ["I learned to ask instead of making assumptions.", "我學會先詢問，而不是自行假設。"],
              ["Instead of making assumptions I learned to ask questions.", "我學會先提問，而不是自行假設。"],
            ],
          ),
          lesson(
            "建立文化敏感度",
            "Cultural awareness helps teams avoid unnecessary misunderstandings.",
            "文化意識能幫助團隊避免不必要的誤解。",
            "help plus object plus verb",
            "avoid unnecessary misunderstandings",
            [["cultural awareness", "文化意識", "指理解並留意文化差異的能力。"]],
            [
              ["Cultural awareness helps teams avoid misunderstandings.", "文化意識能幫助團隊避免誤解。"],
              ["Awareness helps people avoid unnecessary misunderstandings.", "保持覺察能幫助人們避免不必要的誤解。"],
            ],
          ),
        ],
      },
      {
        title: "科技、環境與社會影響",
        lessons: [
          lesson(
            "權衡科技效益與風險",
            "New technology can improve access while creating privacy risks.",
            "新科技能改善使用機會，同時也會帶來隱私風險。",
            "while for simultaneous contrast",
            "privacy risks",
            [["while creating privacy risks", "同時帶來隱私風險", "while 連接同時存在但需權衡的影響。"]],
            [
              ["Technology can improve access while creating risks.", "科技能改善使用機會，同時也會帶來風險。"],
              ["While creating privacy risks new technology can improve access.", "新科技雖然帶來隱私風險，也能改善使用機會。"],
            ],
          ),
          lesson(
            "討論假設性的能源選擇",
            "If energy were cheaper more companies would use clean power.",
            "如果能源更便宜，會有更多公司使用潔淨能源。",
            "second conditional with were",
            "clean power",
            [["if energy were cheaper", "如果能源更便宜", "第二條件句討論與現況不同的假設。"]],
            [
              ["More companies would use clean power if energy were cheaper.", "如果能源更便宜，會有更多公司使用潔淨能源。"],
              ["If power were cheaper more companies would use clean energy.", "如果電力更便宜，會有更多公司使用潔淨能源。"],
            ],
          ),
          lesson(
            "說明系統設計目的",
            "The system is designed to reduce unnecessary waste.",
            "這個系統的設計目的是減少不必要的浪費。",
            "passive purpose with be designed to",
            "reduce unnecessary waste",
            [["is designed to", "設計用來", "被動結構說明系統的設計目的。"]],
            [
              ["The system is designed to reduce waste.", "這個系統的設計目的是減少浪費。"],
              ["This technology is designed to reduce unnecessary waste.", "這項科技的設計目的是減少不必要的浪費。"],
            ],
          ),
          lesson(
            "要求進步惠及社群",
            "Governments should ensure that progress benefits the whole community.",
            "政府應確保進步能讓整個社群受益。",
            "ensure that clause",
            "the whole community",
            [["ensure that", "確保", "用來表達必須達成的結果。"]],
            [
              ["Governments should ensure that progress benefits everyone.", "政府應確保進步能讓每個人受益。"],
              ["Governments should ensure progress benefits the community.", "政府應確保進步能讓社群受益。"],
            ],
          ),
        ],
      },
      {
        title: "提案、簡報與協商",
        lessons: [
          lesson(
            "說明提案優先順序",
            "Our proposal focuses on quality rather than short term savings.",
            "我們的提案著重品質，而不是短期節省。",
            "rather than for priority",
            "focuses on quality",
            [["rather than", "而不是", "用來清楚說明優先考量。"]],
            [
              ["The proposal focuses on quality rather than savings.", "這項提案著重品質，而不是節省。"],
              ["Our proposal focuses on long term benefits rather than short term savings.", "我們的提案著重長期效益，而不是短期節省。"],
            ],
          ),
          lesson(
            "提出有條件的接受",
            "We could accept the offer provided that the deadline changes.",
            "只要期限調整，我們可以接受這項提議。",
            "provided that condition",
            "provided that",
            [["provided that", "只要；條件是", "較正式地提出接受條件。"]],
            [
              ["We could accept the offer if the deadline changes.", "如果期限調整，我們可以接受這項提議。"],
              ["The team could accept the offer provided that the deadline changes.", "只要期限調整，團隊可以接受這項提議。"],
            ],
          ),
          lesson(
            "改善簡報說明",
            "The figures should be explained more clearly during the presentation.",
            "簡報時應該更清楚地說明這些數據。",
            "modal passive for feedback",
            "explained more clearly",
            [["during the presentation", "簡報期間", "during 加名詞表示事件進行的期間。"]],
            [
              ["The figures should be explained clearly during the presentation.", "簡報時應該清楚地說明這些數據。"],
              ["During the presentation the figures should be explained more clearly.", "簡報時應該更清楚地說明這些數據。"],
            ],
          ),
          lesson(
            "達成合理協議",
            "After reviewing both sides we reached a reasonable agreement.",
            "檢視雙方立場後，我們達成了合理的協議。",
            "after plus gerund",
            "reasonable agreement",
            [["after reviewing both sides", "檢視雙方立場後", "after 後接動名詞表示完成的前置步驟。"]],
            [
              ["We reached a reasonable agreement after reviewing both sides.", "檢視雙方立場後，我們達成了合理的協議。"],
              ["After reviewing the proposal we reached an agreement.", "檢視提案後，我們達成了協議。"],
            ],
          ),
        ],
      },
      {
        title: "B2 整合評論文章",
        lessons: [
          lesson(
            "指出城市長期課題",
            "Modern cities face problems that require long term planning.",
            "現代城市面臨需要長期規劃的問題。",
            "relative clause for complex issues",
            "long term planning",
            [["problems that require", "需要處理的問題", "that 引導關係子句說明問題的特性。"]],
            [
              ["Cities face problems that require long term planning.", "城市面臨需要長期規劃的問題。"],
              ["Modern cities require long term planning.", "現代城市需要長期規劃。"],
            ],
          ),
          lesson(
            "限制科技解方",
            "While technology offers solutions it cannot replace public cooperation.",
            "雖然科技提供解方，但它無法取代大眾合作。",
            "while for concession",
            "public cooperation",
            [["cannot replace", "無法取代", "用來指出某項工具的限制。"]],
            [
              ["Although technology offers solutions it cannot replace public cooperation.", "雖然科技提供解方，但它無法取代大眾合作。"],
              ["Technology cannot replace public cooperation although it offers solutions.", "雖然科技提供解方，但它無法取代大眾合作。"],
            ],
          ),
          lesson(
            "連結理解與政策成效",
            "Policies are more effective when residents understand their purpose.",
            "當居民理解政策目的時，政策會更有效。",
            "when clause for effectiveness",
            "residents understand",
            [["when residents understand their purpose", "當居民理解政策目的時", "when 引出成效成立的條件。"]],
            [
              ["Policies are effective when residents understand their purpose.", "當居民理解政策目的時，政策會有效。"],
              ["When residents understand their purpose policies are more effective.", "當居民理解政策目的時，政策會更有效。"],
            ],
          ),
          lesson(
            "提出社群合作假設",
            "If communities worked together they could create lasting change.",
            "如果社群共同合作，就能創造長久的改變。",
            "second conditional for collective action",
            "lasting change",
            [["worked together", "共同合作", "together 強調共同行動。"]],
            [
              ["Communities could create lasting change if they worked together.", "如果社群共同合作，就能創造長久的改變。"],
              ["If people worked together they could create lasting change.", "如果人們共同合作，就能創造長久的改變。"],
            ],
          ),
        ],
      },
    ],
  },
];

const PROMPTS = {
  i: "我",
  you: "你／你們",
  me: "我（受詞）",
  my: "我的",
  we: "我們",
  her: "她的／她",
  it: "它／這件事",
  they: "他們／它們",
  their: "他們的",
  your: "你的",
  our: "我們的",
  the: "定冠詞（中文通常不翻譯）",
  a: "一個",
  an: "一個",
  this: "這個",
  that: "那個／用來連接子句",
  what: "什麼／所……的事",
  who: "用來描述人的關係代名詞",
  each: "每一個",
  other: "其他的／彼此的另一方",
  one: "一個；代替前面提過的事物",
  another: "另一個",
  both: "兩者都",
  someone: "某人",
  everyone: "每個人",
  have: "已經／有",
  has: "已經／有（第三人稱單數）",
  had: "已經／有（過去式）",
  am: "是／正在",
  is: "是",
  are: "是",
  was: "是／正在（過去）",
  were: "是（過去）",
  been: "be 的過去分詞",
  be: "be 動詞原形",
  can: "可以／能夠",
  could: "可以；能夠（較委婉或假設）",
  would: "會；用於假設或委婉表達",
  will: "將會",
  should: "應該",
  may: "可能",
  not: "不",
  cannot: "無法",
  to: "不定詞標記／到",
  for: "持續／為了",
  at: "在",
  in: "在……裡／依照",
  on: "在……上／進行",
  after: "在……之後",
  when: "當……時",
  if: "如果",
  because: "因為",
  so: "所以",
  although: "雖然",
  while: "同時／雖然",
  whereas: "然而；相較之下",
  whether: "是否",
  and: "和；以及",
  or: "或",
  than: "比",
  from: "從",
  by: "藉由／由",
  with: "和／具有",
  of: "……的",
  as: "如同／作為",
  here: "這裡",
  there: "那裡",
  home: "家",
  alone: "獨自",
  never: "從未",
  where: "哪裡／……所在之處",
  since: "自從",
  now: "現在",
  about: "關於",
  earlier: "更早",
  according: "與 to 組成「根據」",
  instead: "與 of 組成「而不是」",
  rather: "與 than 組成「而不是」",
  clearly: "清楚地",
  during: "在……期間",
  before: "以前／在……之前",
  again: "再一次",
  please: "請",
  early: "提早",
  abroad: "在國外",
  next: "下一個",
  very: "非常",
  less: "較少",
  later: "之後",
  carefully: "仔細地",
  recently: "最近",
  differently: "不同地",
  together: "一起",
  more: "更多／更",
  worked: "工作過",
  traveled: "旅行過",
  cooking: "正在煮飯",
  called: "打電話給",
  arrived: "抵達",
  hope: "希望",
  study: "學習",
  saving: "正在儲蓄",
  finish: "完成",
  meet: "見面",
  find: "找到",
  think: "認為",
  prefer: "比較喜歡",
  costs: "花費",
  finished: "完成了",
  choose: "選擇",
  helps: "幫助",
  explain: "說明",
  need: "需要",
  helped: "幫助了",
  agreed: "同意了",
  delayed: "延誤的",
  missed: "錯過了",
  tell: "告訴",
  change: "更改",
  improves: "改善",
  leave: "離開／出發",
  use: "使用",
  organize: "安排／整理",
  sent: "傳送",
  spent: "花費了",
  make: "使得",
  apologized: "道歉了",
  forgotten: "忘記了",
  listen: "傾聽",
  needs: "需要",
  known: "認識",
  respect: "尊重",
  decided: "決定了",
  follow: "遵循",
  kept: "持續",
  practicing: "練習",
  wanted: "想要",
  feel: "感到／感覺",
  offers: "提供",
  understand: "理解",
  support: "支持",
  remain: "持續保持",
  argue: "主張",
  encourage: "鼓勵",
  create: "造成／創造",
  consider: "考量",
  compare: "比較",
  completed: "完成",
  expected: "預期",
  suggested: "建議了",
  revise: "修改",
  appreciate: "感謝",
  identifies: "指出",
  working: "處理／工作中",
  claims: "聲稱",
  increased: "增加了",
  introduced: "推出／引進",
  raised: "提出",
  affect: "影響",
  check: "檢查",
  provides: "提供",
  interpret: "解讀",
  seems: "看似",
  learned: "學會了",
  ask: "詢問",
  making: "做出／形成",
  avoid: "避免",
  improve: "改善",
  creating: "帶來／造成",
  designed: "設計",
  reduce: "減少",
  ensure: "確保",
  benefits: "使……受益／好處（依句中用法）",
  focuses: "著重",
  accept: "接受",
  provided: "在……條件下",
  changes: "改變",
  explained: "說明",
  reviewing: "檢視",
  reached: "達成",
  face: "面臨",
  require: "需要",
  replace: "取代",
  years: "年",
  year: "年",
  friend: "朋友",
  english: "英文",
  money: "錢",
  trip: "旅行",
  goal: "目標",
  job: "工作",
  work: "工作",
  public: "大眾的／公共的",
  transportation: "交通運輸",
  plan: "方案／計畫",
  task: "任務",
  option: "選項／方案",
  problem: "問題",
  report: "報告",
  friday: "星期五",
  colleague: "同事",
  morning: "早上",
  class: "課程",
  train: "火車",
  bus: "公車",
  station: "車站",
  booking: "預訂",
  tomorrow: "明天",
  weather: "天氣",
  app: "應用程式",
  schedule: "行程／作息",
  message: "訊息",
  person: "人",
  time: "時間",
  online: "網路上",
  week: "星期",
  technology: "科技",
  daily: "日常的",
  tasks: "工作事項",
  birthday: "生日",
  friends: "朋友們",
  school: "學校",
  opinions: "意見",
  routine: "作息",
  results: "成果",
  goals: "目標",
  view: "觀點",
  proposal: "提案",
  concern: "疑慮",
  issue: "問題",
  education: "教育",
  thinking: "思考",
  solution: "解決方案",
  problems: "問題",
  cost: "成本",
  term: "期",
  impact: "影響",
  project: "專案",
  manager: "經理",
  section: "段落",
  feedback: "回饋",
  weakness: "弱點",
  team: "團隊",
  months: "幾個月",
  policy: "政策",
  experts: "專家",
  concerns: "疑慮",
  article: "文章",
  decision: "決定",
  businesses: "企業",
  source: "來源",
  evidence: "證據",
  people: "人們",
  behavior: "行為",
  ways: "方式",
  culture: "文化",
  questions: "問題",
  assumptions: "假設",
  awareness: "意識／覺察",
  teams: "團隊",
  misunderstandings: "誤解",
  access: "使用機會",
  privacy: "隱私",
  risks: "風險",
  energy: "能源",
  companies: "公司",
  power: "電力／能源",
  system: "系統",
  waste: "浪費",
  governments: "政府",
  progress: "進步",
  community: "社群",
  quality: "品質",
  savings: "節省",
  offer: "提議",
  deadline: "期限",
  figures: "數據",
  presentation: "簡報",
  sides: "雙方",
  agreement: "協議",
  cities: "城市",
  solutions: "解方",
  cooperation: "合作",
  policies: "政策",
  residents: "居民",
  purpose: "目的",
  communities: "社群",
  three: "三",
  several: "幾個",
  small: "小型的",
  better: "更好的",
  useful: "有用的／實用的",
  difficult: "困難的",
  high: "高等的",
  last: "上一個／去年",
  first: "一開始／第一",
  new: "新的",
  good: "好的",
  main: "主要的",
  practical: "實際的",
  effective: "有效的",
  independent: "獨立的",
  flexible: "有彈性的",
  cheaper: "較便宜的",
  additional: "額外的",
  long: "長期的",
  final: "最後的",
  patient: "有耐心的",
  wrong: "錯誤的",
  convenient: "方便的",
  important: "重要的",
  different: "不同的",
  confident: "有信心的",
  reliable: "可靠的",
  same: "相同的",
  polite: "有禮貌的",
  distant: "疏遠的",
  cultural: "文化的",
  unnecessary: "不必要的",
  clean: "潔淨的",
  whole: "整個的",
  short: "短期的",
  clear: "清楚的",
  reasonable: "合理的",
  modern: "現代的",
  lasting: "長久的",
  she: "她",
  planning: "規劃",
};

const LEMMAS = {
  worked: "work",
  traveled: "travel",
  cooking: "cook",
  called: "call",
  arrived: "arrive",
  saving: "save",
  finished: "finish",
  helps: "help",
  explained: "explain",
  helped: "help",
  agreed: "agree",
  delayed: "delay",
  missed: "miss",
  improves: "improve",
  sent: "send",
  spent: "spend",
  apologized: "apologize",
  forgotten: "forget",
  needs: "need",
  known: "know",
  decided: "decide",
  kept: "keep",
  practicing: "practice",
  wanted: "want",
  offers: "offer",
  costs: "cost",
  completed: "complete",
  expected: "expect",
  suggested: "suggest",
  identifies: "identify",
  working: "work",
  claims: "claim",
  increased: "increase",
  introduced: "introduce",
  raised: "raise",
  provides: "provide",
  seems: "seem",
  learned: "learn",
  making: "make",
  creating: "create",
  designed: "design",
  benefits: "benefit",
  focuses: "focus",
  changes: "change",
  reviewing: "review",
  reached: "reach",
  years: "year",
  tasks: "task",
  friends: "friend",
  opinions: "opinion",
  results: "result",
  goals: "goal",
  problems: "problem",
  months: "month",
  experts: "expert",
  concerns: "concern",
  businesses: "business",
  people: "person",
  ways: "way",
  questions: "question",
  assumptions: "assumption",
  teams: "team",
  misunderstandings: "misunderstanding",
  risks: "risk",
  companies: "company",
  governments: "government",
  savings: "saving",
  figures: "figure",
  sides: "side",
  cities: "city",
  solutions: "solution",
  policies: "policy",
  residents: "resident",
  communities: "community",
};

const PRONOUNS = new Set([
  "i",
  "you",
  "me",
  "we",
  "her",
  "it",
  "they",
  "she",
  "he",
  "what",
  "who",
  "someone",
  "everyone",
  "other",
  "one",
  "another",
]);
const DETERMINERS = new Set([
  "my",
  "their",
  "your",
  "our",
  "the",
  "a",
  "an",
  "this",
  "that",
  "several",
  "each",
  "both",
  "last",
  "next",
]);
const PREPOSITIONS = new Set([
  "to",
  "for",
  "at",
  "in",
  "on",
  "before",
  "after",
  "from",
  "by",
  "with",
  "of",
  "about",
  "during",
  "than",
  "since",
  "according",
]);
const CONJUNCTIONS = new Set([
  "when",
  "if",
  "because",
  "so",
  "although",
  "while",
  "whereas",
  "whether",
  "and",
  "or",
  "that",
  "provided",
]);
const AUXILIARIES = new Set([
  "have",
  "has",
  "had",
  "am",
  "is",
  "are",
  "was",
  "were",
  "been",
  "be",
  "can",
  "could",
  "would",
  "will",
  "should",
  "may",
  "cannot",
]);
const VERBS = new Set([
  "worked",
  "traveled",
  "cooking",
  "called",
  "arrived",
  "saving",
  "costs",
  "finished",
  "helps",
  "explained",
  "helped",
  "agreed",
  "delayed",
  "missed",
  "improves",
  "sent",
  "spent",
  "apologized",
  "forgotten",
  "needs",
  "known",
  "decided",
  "kept",
  "practicing",
  "wanted",
  "offers",
  "completed",
  "expected",
  "suggested",
  "identifies",
  "working",
  "claims",
  "increased",
  "introduced",
  "raised",
  "provides",
  "seems",
  "learned",
  "making",
  "creating",
  "designed",
  "focuses",
  "reviewing",
  "reached",
  "hope",
  "study",
  "finish",
  "meet",
  "find",
  "think",
  "prefer",
  "choose",
  "explain",
  "need",
  "tell",
  "change",
  "leave",
  "use",
  "organize",
  "make",
  "listen",
  "respect",
  "follow",
  "feel",
  "understand",
  "support",
  "remain",
  "argue",
  "encourage",
  "create",
  "consider",
  "compare",
  "revise",
  "appreciate",
  "affect",
  "check",
  "interpret",
  "ask",
  "avoid",
  "improve",
  "reduce",
  "ensure",
  "accept",
  "face",
  "require",
  "replace",
]);
const NOUNS = new Set([
  "home",
  "friend",
  "friends",
  "english",
  "year",
  "years",
  "money",
  "trip",
  "goal",
  "goals",
  "job",
  "work",
  "transportation",
  "plan",
  "task",
  "tasks",
  "option",
  "problem",
  "problems",
  "report",
  "friday",
  "colleague",
  "morning",
  "class",
  "train",
  "bus",
  "station",
  "booking",
  "tomorrow",
  "weather",
  "app",
  "schedule",
  "message",
  "person",
  "people",
  "time",
  "week",
  "technology",
  "birthday",
  "school",
  "routine",
  "result",
  "results",
  "view",
  "proposal",
  "concern",
  "concerns",
  "issue",
  "education",
  "thinking",
  "solution",
  "solutions",
  "cost",
  "term",
  "impact",
  "project",
  "manager",
  "section",
  "feedback",
  "weakness",
  "team",
  "teams",
  "month",
  "months",
  "policy",
  "policies",
  "expert",
  "experts",
  "article",
  "decision",
  "business",
  "businesses",
  "source",
  "evidence",
  "behavior",
  "way",
  "ways",
  "culture",
  "question",
  "questions",
  "assumption",
  "assumptions",
  "awareness",
  "misunderstanding",
  "misunderstandings",
  "access",
  "privacy",
  "risk",
  "risks",
  "energy",
  "company",
  "companies",
  "power",
  "system",
  "waste",
  "government",
  "governments",
  "progress",
  "community",
  "communities",
  "quality",
  "savings",
  "offer",
  "deadline",
  "figure",
  "figures",
  "presentation",
  "side",
  "sides",
  "agreement",
  "city",
  "cities",
  "cooperation",
  "purpose",
  "resident",
  "residents",
  "planning",
  "changes",
]);
const ADJECTIVES = new Set([
  "public",
  "better",
  "useful",
  "difficult",
  "patient",
  "delayed",
  "wrong",
  "daily",
  "convenient",
  "good",
  "important",
  "different",
  "new",
  "confident",
  "main",
  "practical",
  "effective",
  "independent",
  "flexible",
  "cheaper",
  "additional",
  "long",
  "final",
  "reliable",
  "same",
  "polite",
  "distant",
  "cultural",
  "unnecessary",
  "clean",
  "whole",
  "short",
  "reasonable",
  "modern",
  "lasting",
  "small",
  "high",
]);
const ADVERBS = new Set([
  "here",
  "there",
  "alone",
  "again",
  "please",
  "early",
  "abroad",
  "next",
  "very",
  "less",
  "later",
  "carefully",
  "recently",
  "together",
  "more",
  "online",
  "now",
  "never",
  "where",
  "earlier",
  "instead",
  "clearly",
  "rather",
  "first",
]);

const normalizeWord = (word) =>
  word.replace(/^[^A-Za-z]+|[^A-Za-z']+$/g, "").toLowerCase();

const wordsOf = (text) =>
  text
    .trim()
    .replace(/[.!?]$/g, "")
    .split(/\s+/)
    .filter(Boolean);

const slug = (value) =>
  value
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const partOfSpeech = (word, sentenceWords, tokenIndex) => {
  const normalized = normalizeWord(word);
  const previous = normalizeWord(sentenceWords[tokenIndex - 1] ?? "");
  const next = normalizeWord(sentenceWords[tokenIndex + 1] ?? "");
  if (normalized === "support") {
    return ["needs", "additional", "public"].includes(previous)
      ? "noun 名詞"
      : "verb 動詞";
  }
  if (normalized === "change") {
    return previous === "to" ? "verb 動詞" : "noun 名詞";
  }
  if (normalized === "benefits") {
    return previous === "progress" ? "verb 動詞" : "noun 名詞";
  }
  if (normalized === "more") {
    return NOUNS.has(next) ? "determiner 限定詞" : "adverb 副詞";
  }
  if (PRONOUNS.has(normalized)) return "pronoun 代名詞";
  if (DETERMINERS.has(normalized)) return "determiner 限定詞";
  if (PREPOSITIONS.has(normalized)) return "preposition 介系詞";
  if (CONJUNCTIONS.has(normalized)) return "conjunction 連接詞";
  if (AUXILIARIES.has(normalized)) return "auxiliary verb 助動詞";
  if (VERBS.has(normalized)) return "verb 動詞";
  if (ADJECTIVES.has(normalized)) return "adjective 形容詞";
  if (ADVERBS.has(normalized)) return "adverb 副詞";
  if (NOUNS.has(normalized)) return "noun 名詞";
  if (/^\d+$/.test(normalized) || ["three"].includes(normalized)) {
    return "number 數詞";
  }
  return "noun 名詞";
};

const semanticRole = (pos) => {
  if (pos.startsWith("verb") || pos.startsWith("auxiliary")) return "動作或狀態";
  if (pos.startsWith("preposition")) return "片語關係";
  if (pos.startsWith("conjunction")) return "子句連接";
  if (pos.startsWith("adjective")) return "特徵描述";
  if (pos.startsWith("adverb")) return "時間、方式或程度";
  if (pos.startsWith("pronoun") || pos.startsWith("determiner")) return "指稱或限定";
  return "核心內容";
};

const promptFor = (word) => {
  const normalized = normalizeWord(word);
  const prompt = PROMPTS[normalized];
  if (prompt) {
    return {
      prompt,
      promptType:
        PREPOSITIONS.has(normalized) ||
        CONJUNCTIONS.has(normalized) ||
        AUXILIARIES.has(normalized) ||
        DETERMINERS.has(normalized)
          ? "grammar"
          : "meaning",
    };
  }
  return {
    prompt: "依整句與語塊語意填入",
    promptType: "context",
  };
};

const lemmaFor = (word) => {
  const normalized = normalizeWord(word);
  return LEMMAS[normalized] ?? normalized;
};

const unique = (values) => [...new Set(values.filter(Boolean))];

const latestDistinctSentence = (sentences, currentSentence) => {
  for (let index = sentences.length - 1; index >= 0; index -= 1) {
    if (sentences[index].sentence !== currentSentence) {
      return sentences[index];
    }
  }
  throw new Error(`找不到「${currentSentence}」的已學干擾句。`);
};

const resolveLexemes = (text, answerLexemes, label) =>
  unique(
    wordsOf(text).map((word) => {
      const candidates = answerLexemes.get(normalizeWord(word));
      const lexemeId = candidates?.values().next().value;
      if (!lexemeId) {
        throw new Error(`${label} 使用尚未正式教過的單字：${word}`);
      }
      return lexemeId;
    }),
  );

const addAnswerLexeme = (answerLexemes, answer, lexemeId) => {
  const key = normalizeWord(answer);
  const current = answerLexemes.get(key) ?? new Set();
  current.add(lexemeId);
  answerLexemes.set(key, current);
};

const rowsFromFiles = async (files) => {
  const groups = await Promise.all(
    files.map(async (file) =>
      parseCourseCsv(await readFile(resolve(file), "utf8")),
    ),
  );
  return groups.flat();
};

const buildLevel = (definition, prerequisiteRows) => {
  const rows = [];
  const patterns = [];
  const recognition = [];
  const textResponses = [];
  const passages = [];
  const taughtLexemes = new Set(prerequisiteRows.map((row) => row.lexeme_id));
  const answerLexemes = new Map();
  prerequisiteRows.forEach((row) =>
    addAnswerLexeme(answerLexemes, row.answer, row.lexeme_id),
  );
  const knownSentences = Array.from(
    new Map(
      prerequisiteRows.map((row) => [
        row.sentence_id,
        {
          id: row.sentence_id,
          sentence: row.sentence,
          translation: row.translation,
        },
      ]),
    ).values(),
  );

  definition.units.forEach((unit, unitIndex) => {
    const unitNumber = unitIndex + 1;
    const unitId = `${definition.fileStem}-u${String(unitNumber).padStart(2, "0")}`;
    const passageId = `${unitId}-p01`;
    const unitLessonRecords = [];

    unit.lessons.forEach((item, lessonIndex) => {
      const lessonNumber = lessonIndex + 1;
      const lessonId = `${unitId}-l${String(lessonNumber).padStart(2, "0")}`;
      const sentenceId = `${lessonId}-s01`;
      const patternId = `${lessonId}-pattern`;
      const sentenceWords = wordsOf(item.sentence);
      const chunkMembership = new Map();
      item.chunks.forEach(([text, translation, note], chunkIndex) => {
        const chunkWords = wordsOf(text).map(normalizeWord);
        const normalizedSentenceWords = sentenceWords.map(normalizeWord);
        const startIndex = normalizedSentenceWords.findIndex(
          (_, candidateIndex) =>
            chunkWords.every(
              (chunkWord, offset) =>
                normalizedSentenceWords[candidateIndex + offset] ===
                chunkWord,
            ),
        );
        if (startIndex < 0) {
          throw new Error(`${lessonId} 找不到完整語塊：${text}`);
        }
        chunkWords.forEach((_, offset) => {
          const tokenIndex = startIndex + offset;
          if (chunkMembership.has(tokenIndex)) {
            throw new Error(`${lessonId} 的 token 不可同時屬於兩個語塊。`);
          }
          chunkMembership.set(tokenIndex, {
              id: slug(text),
              text,
              translation,
              order: chunkIndex + 1,
              note,
          });
        });
      });

      sentenceWords.forEach((answer, tokenIndex) => {
        const lemma = lemmaFor(answer);
        const lexemeId = slug(lemma);
        const pos = partOfSpeech(answer, sentenceWords, tokenIndex);
        const posCode = pos.split(" ")[0].replace(/[^a-z]/g, "");
        const isNewWord = !taughtLexemes.has(lexemeId);
        taughtLexemes.add(lexemeId);
        addAnswerLexeme(answerLexemes, answer, lexemeId);
        const prompt = promptFor(answer);
        const chunk = chunkMembership.get(tokenIndex);
        rows.push({
          level: definition.level,
          unit_id: unitId,
          unit_title: unit.title,
          passage_id: passageId,
          passage_order: "1",
          sentence_id: sentenceId,
          sentence_order: String(lessonNumber),
          sentence_pattern_id: patternId,
          pattern_name: item.grammar,
          pattern_cefr: definition.level,
          is_new_sentence_pattern: "TRUE",
          lesson_id: lessonId,
          lesson_title: item.title,
          sentence: item.sentence,
          translation: item.translation,
          grammar: item.grammar,
          occurrence_id: `${lessonId}-p01-s01-t${String(tokenIndex + 1).padStart(2, "0")}`,
          token_order: String(tokenIndex + 1),
          token_id: `${lexemeId}-${slug(answer)}-${posCode}`,
          lexeme_id: lexemeId,
          sense_id: `${lexemeId}-${posCode}-01`,
          type: "word",
          answer,
          lemma,
          prompt: prompt.prompt,
          prompt_type: prompt.promptType,
          partOfSpeech: pos,
          dictionary_pos: pos,
          context_pos: pos,
          semanticRole: semanticRole(pos),
          chunk_id: chunk?.id ?? "",
          chunk_text: chunk?.text ?? "",
          chunk_translation: chunk?.translation ?? "",
          chunk_order: chunk ? String(chunk.order) : "",
          chunk_note: chunk?.note ?? "",
          pattern_id: patternId,
          kk_us: "",
          ipa_us: "",
          ipa_standalone: "",
          ipa_in_sentence: "",
          kk: "",
          ipa: "",
          syllables: "",
          stress_syllable: "",
          display_syllables: "",
          note:
            prompt.promptType === "context"
              ? "進階課程減少逐字翻譯，請結合整句與語塊理解用法。"
              : "",
          audio_method: "web_speech_fallback",
          audio_status: "pending",
          word_audio_source: "",
          audio_source: "",
          sentence_audio_source: "",
          license: "",
          is_new_word: isNewWord ? "TRUE" : "FALSE",
          is_new_pattern: tokenIndex === 0 ? "TRUE" : "FALSE",
          is_new_combination: chunk ? "TRUE" : "FALSE",
          is_new_content:
            isNewWord || tokenIndex === 0 ? "TRUE" : "FALSE",
          qa_status: QA_STATUS,
        });
      });

      const sourceLexemes = resolveLexemes(
        item.sentence,
        answerLexemes,
        sentenceId,
      );
      const sourceChunks = unique(
        item.chunks.map(([text]) => slug(text)),
      );
      const examples = item.variants.map(
        ([sentence, translation], variantIndex) => {
          const requiredLexemeIds = resolveLexemes(
            sentence,
            answerLexemes,
            `${lessonId} transfer ${variantIndex + 1}`,
          );
          return {
            id: `${lessonId}-transfer-${String(variantIndex + 1).padStart(2, "0")}`,
            practiceLessonId: lessonId,
            sourceSentenceId: sentenceId,
            sentencePatternId: patternId,
            passageId,
            sentence,
            translation,
            hintKeywords: item.grammar,
            skeleton: item.grammar,
            requiredLexemeIds,
            requiredChunkIds: [],
            slotValues: [
              {
                slotId: "sentence",
                text: sentence,
                requiredLexemeIds,
                requiredChunkIds: [],
              },
            ],
            qaStatus: QA_STATUS,
          };
        },
      );
      patterns.push({
        id: patternId,
        cefr: definition.level,
        enabledForTransfer: true,
        template: item.grammar,
        slots: [
          {
            slotId: "sentence",
            role: "完整句型變化",
            allowedLexemeIds: unique(
              examples.flatMap((example) => example.requiredLexemeIds),
            ),
            allowedChunkIds: [],
            restrictions: ["保持核心句型與語意功能"],
          },
        ],
        examples,
        qaStatus: QA_STATUS,
      });

      const distractor = latestDistinctSentence(
        knownSentences,
        item.sentence,
      );
      const recognitionOptions = [item.translation];
      for (
        let index = knownSentences.length - 1;
        recognitionOptions.length < 4 && index >= 0;
        index -= 1
      ) {
        if (!recognitionOptions.includes(knownSentences[index].translation)) {
          recognitionOptions.push(knownSentences[index].translation);
        }
      }
      if (recognitionOptions.length < 4) {
        throw new Error(`${lessonId} 缺少四個不重複的閱讀辨識選項。`);
      }
      recognition.push({
        id: `${lessonId}-recognition-01`,
        lessonId,
        sentenceId,
        sentencePatternId: patternId,
        passageId,
        type: "english-to-chinese",
        instruction: "請選出最符合英文句子的繁體中文意思。",
        stem: item.sentence,
        requiredLexemeIds: sourceLexemes,
        requiredChunkIds: sourceChunks,
        options: recognitionOptions.slice(0, 4).map((text, optionIndex) => ({
          id:
            optionIndex === 0
              ? "correct"
              : `distractor-${optionIndex}`,
          text,
        })),
        correctOptionId: "correct",
        qaStatus: QA_STATUS,
      });

      const textOptionSentences = [item.sentence, distractor.sentence];
      for (
        let index = knownSentences.length - 1;
        textOptionSentences.length < 4 && index >= 0;
        index -= 1
      ) {
        if (!textOptionSentences.includes(knownSentences[index].sentence)) {
          textOptionSentences.push(knownSentences[index].sentence);
        }
      }
      if (textOptionSentences.length < 4) {
        throw new Error(`${lessonId} 缺少四個不重複的文字選答選項。`);
      }
      if (new Set(textOptionSentences).size !== textOptionSentences.length) {
        throw new Error(`${lessonId} 的文字選答選項重複。`);
      }
      textResponses.push({
        id: `${lessonId}-response-01`,
        lessonId,
        sourceSentenceId: sentenceId,
        sentencePatternId: patternId,
        passageId,
        promptLanguage: "zh-Hant",
        prompt: `請選出符合「${item.translation.replace(/[。！？]$/g, "")}」的英文句子。`,
        targetTranslation: item.translation,
        format: "choice",
        options: textOptionSentences.map((text, optionIndex) => ({
          id:
            optionIndex === 0
              ? "correct"
              : `distractor-${optionIndex}`,
          text,
          requiredLexemeIds: resolveLexemes(
            text,
            answerLexemes,
            `${lessonId} response ${optionIndex + 1}`,
          ),
          requiredChunkIds: [],
        })),
        correctOptionId: "correct",
        qaStatus: QA_STATUS,
      });

      const record = {
        id: sentenceId,
        lessonId,
        sentence: item.sentence,
        translation: item.translation,
        focus: item.focus,
      };
      unitLessonRecords.push(record);
      knownSentences.push(record);
    });

    const focusOptions = unitLessonRecords.map((record) => record.focus);
    focusOptions.forEach((focus, index) => {
      if (
        !unitLessonRecords[index].sentence
          .toLowerCase()
          .includes(focus.toLowerCase())
      ) {
        throw new Error(
          `${unitLessonRecords[index].id} 的 passage focus 不在來源句：${focus}`,
        );
      }
    });
    passages.push({
      passageId,
      level: definition.level,
      questions: unitLessonRecords.map((record, questionIndex) => ({
        id: `${passageId}-q${String(questionIndex + 1).padStart(2, "0")}`,
        sourceSentenceId: record.id,
        questionLanguage: "zh-Hant",
        question: `根據文章，第 ${questionIndex + 1} 句提到的重點是什麼？`,
        options: focusOptions,
        optionMetadata: focusOptions.map((text) => ({
          text,
          requiredLexemeIds: resolveLexemes(
            text,
            answerLexemes,
            `${passageId}/${text}`,
          ),
          requiredChunkIds: [],
        })),
        correctAnswer: record.focus,
        evidenceSentenceIds: [record.id],
        qaStatus: QA_STATUS,
      })),
      qaStatus: QA_STATUS,
    });
  });

  return {
    rows,
    patternData: {
      schemaVersion: 2,
      level: definition.level,
      patterns,
    },
    readingData: {
      schemaVersion: 2,
      level: definition.level,
      recognition,
      textResponses,
      passages,
    },
  };
};

const main = async () => {
  const a1Rows = await rowsFromFiles(["public/data/a1-course-v3.csv"]);
  const a2Rows = await rowsFromFiles(["public/data/a2-course-v1.csv"]);
  const generated = new Map();
  let prerequisiteRows = [...a1Rows, ...a2Rows];

  for (const definition of LEVELS) {
    const result = buildLevel(definition, prerequisiteRows);
    generated.set(definition.level, result);
    prerequisiteRows = [...prerequisiteRows, ...result.rows];

    await writeFile(
      resolve(`public/data/${definition.fileStem}-course-v1.csv`),
      `${serializeCourseCsv(result.rows)}\r\n`,
      "utf8",
    );
    await writeFile(
      resolve(`public/data/${definition.fileStem}-pattern-exercises.json`),
      `${JSON.stringify(result.patternData, null, 2)}\n`,
      "utf8",
    );
    await writeFile(
      resolve(`public/data/${definition.fileStem}-reading-exercises.json`),
      `${JSON.stringify(result.readingData, null, 2)}\n`,
      "utf8",
    );
  }

  for (const [level, result] of generated) {
    console.log(
      `${level}: ${new Set(result.rows.map((row) => row.unit_id)).size} units, ` +
        `${new Set(result.rows.map((row) => row.lesson_id)).size} lessons, ` +
        `${result.rows.length} occurrences`,
    );
  }
};

await main();
