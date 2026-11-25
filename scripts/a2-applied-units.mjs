// Original A2 applied lessons. Both generators consume these definitions;
// the checked-in CSV and JSON remain the only runtime sources.
import { situationalForms, situationalUnits } from "./a2-situational-units.mjs";
import { arrangementForms, arrangementUnits } from "./a2-everyday-arrangements.mjs";
import { followThroughForms, followThroughUnits } from "./a2-follow-through-units.mjs";
import { coordinationForms, coordinationUnits } from "./a2-coordination-units.mjs";
import { errandsForms, errandsUnits } from "./a2-errands-units.mjs";
import { serviceForms, serviceUnits } from "./a2-services-and-time-units.mjs";
import { instructionForms, instructionUnits } from "./a2-waiting-and-instructions-units.mjs";
import { everydayDecisionsForms, everydayDecisionsUnits } from "./a2-everyday-decisions-units.mjs";
import { localVisitsForms, localVisitsUnits } from "./a2-local-visits-units.mjs";
import { independentErrandsForms, independentErrandsUnits } from "./a2-independent-errands-units.mjs";
import { sharedSpaceForms, sharedSpaceUnits } from "./a2-shared-space-units.mjs";
import { everydayConfirmationForms, everydayConfirmationUnits } from "./a2-everyday-confirmation-units.mjs";
import { everydayTransitionsForms, everydayTransitionsUnits } from "./a2-everyday-transitions-units.mjs";
import { everydayChoicesForms, everydayChoicesUnits } from "./a2-everyday-choices-units.mjs";
import { communityRoutinesForms, communityRoutinesUnits } from "./a2-community-routines-units.mjs";
import { personalServicesForms, personalServicesUnits } from "./a2-personal-services-units.mjs";
import { healthWeatherRideForms, healthWeatherRideUnits } from "./a2-health-weather-ride-units.mjs";
import { clinicMarketLeisureForms, clinicMarketLeisureUnits } from "./a2-clinic-market-leisure-units.mjs";
import { familyStoreRepairForms, familyStoreRepairUnits } from "./a2-family-store-repair-units.mjs";
import { leavePeopleComplaintsForms, leavePeopleComplaintsUnits } from "./a2-leave-people-complaints-units.mjs";
import { bankBillTripForms, bankBillTripUnits } from "./a2-bank-bill-trip-units.mjs";
import { opinionsServicePartyForms, opinionsServicePartyUnits } from "./a2-opinions-service-party-units.mjs";
import { holidayAdviceNeighborForms, holidayAdviceNeighborUnits } from "./a2-holiday-advice-neighbor-units.mjs";
import { routinePlansFavorForms, routinePlansFavorUnits } from "./a2-routine-plans-favor-units.mjs";
import { jobsFoodIndoorsForms, jobsFoodIndoorsUnits } from "./a2-jobs-food-indoors-units.mjs";
import { experiencePassMeetupForms, experiencePassMeetupUnits } from "./a2-experience-pass-meetup-units.mjs";
import { classesParcelsWeekendForms, classesParcelsWeekendUnits } from "./a2-classes-parcels-weekend-units.mjs";
import { rentHealthPlansForms, rentHealthPlansUnits } from "./a2-rent-health-plans-units.mjs";
import { parcelNowCardForms, parcelNowCardUnits } from "./a2-parcel-now-card-units.mjs";
import { abilityRefundRideForms, abilityRefundRideUnits } from "./a2-ability-refund-ride-units.mjs";
import { permissionCompareFrequencyForms, permissionCompareFrequencyUnits } from "./a2-permission-compare-frequency-units.mjs";
import { birthdaySchoolHoldForms, birthdaySchoolHoldUnits } from "./a2-birthday-school-hold-units.mjs";
import { placesWebLostForms, placesWebLostUnits } from "./a2-places-web-lost-units.mjs";
import { petsBusYesterdayForms, petsBusYesterdayUnits } from "./a2-pets-bus-yesterday-units.mjs";
import { interviewFollowupTripForms, interviewFollowupTripUnits } from "./a2-interview-followup-trip-units.mjs";
import { homeSeasonsTeaForms, homeSeasonsTeaUnits } from "./a2-home-seasons-tea-units.mjs";
import { sportsHotelSchoolForms, sportsHotelSchoolUnits } from "./a2-sports-hotel-school-units.mjs";
import { moviesFamilyMarketForms, moviesFamilyMarketUnits } from "./a2-movies-family-market-units.mjs";
import { areaDeliveryHolidayForms, areaDeliveryHolidayUnits } from "./a2-area-delivery-holiday-units.mjs";
import { fittingLocationApologyForms, fittingLocationApologyUnits } from "./a2-fitting-location-apology-units.mjs";
import { goalsBankLostForms, goalsBankLostUnits } from "./a2-goals-bank-lost-units.mjs";
import { musicComputerSurpriseForms, musicComputerSurpriseUnits } from "./a2-music-computer-surprise-units.mjs";
import { forecastTransportHomeForms, forecastTransportHomeUnits } from "./a2-forecast-transport-home-units.mjs";
import { chargerChildhoodChangeForms, chargerChildhoodChangeUnits } from "./a2-charger-childhood-change-units.mjs";
import { recommendOverdueAccidentForms, recommendOverdueAccidentUnits } from "./a2-recommend-overdue-accident-units.mjs";
import { choresFeeCoworkerForms, choresFeeCoworkerUnits } from "./a2-chores-fee-coworker-units.mjs";
import { gymVoicemailStudyForms, gymVoicemailStudyUnits } from "./a2-gym-voicemail-study-units.mjs";
import { seatsShiftGiftForms, seatsShiftGiftUnits } from "./a2-seats-shift-gift-units.mjs";
import { parkingNeighborReturnForms, parkingNeighborReturnUnits } from "./a2-parking-neighbor-return-units.mjs";
import { elevatorRescheduleTeacherForms, elevatorRescheduleTeacherUnits } from "./a2-elevator-reschedule-teacher-units.mjs";
import { tasteBeachAirportForms, tasteBeachAirportUnits } from "./a2-taste-beach-airport-units.mjs";
import { planeImmigrationExchangeForms, planeImmigrationExchangeUnits } from "./a2-plane-immigration-exchange-units.mjs";
import { movingToothPhoneForms, movingToothPhoneUnits } from "./a2-moving-tooth-phone-units.mjs";
import { nightmarketTyphoonBillpayForms, nightmarketTyphoonBillpayUnits } from "./a2-nightmarket-typhoon-billpay-units.mjs";
import { trainTaiwanVolunteerForms, trainTaiwanVolunteerUnits } from "./a2-train-taiwan-volunteer-units.mjs";
import { plantsHobbyBookingForms, plantsHobbyBookingUnits } from "./a2-plants-hobby-booking-units.mjs";
import { babyBreakfastPhotoForms, babyBreakfastPhotoUnits } from "./a2-baby-breakfast-photo-units.mjs";
import { wrongparcelKeyLunchForms, wrongparcelKeyLunchUnits } from "./a2-wrongparcel-key-lunch-units.mjs";
const noun = "noun 名詞";
const verb = "verb 動詞";
const adverb = "adverb 副詞";
const adjective = "adjective 形容詞";
const modal = "modal verb 情態助動詞";
const preposition = "preposition 介系詞";
const pronoun = "pronoun 代名詞";

const wordUse = (sense, prompt, pos, role, note = "", promptType = "meaning") =>
  ({ sense, prompt, pos, role, note, promptType });
const form = (id, dictionaryPos, display = id, extra = {}) =>
  ({ id, dictionaryPos, display, ...extra });

// Standalone candidates. Known spellings keep their earlier phonetic metadata.
export const appliedForms = {
  speak: form("speak", verb),
  please: form("please", adverb),
  could: form("can", modal, "could", { kk: "/kʊd/", ipa: "/kʊd/", syllables: 1 }),
  say: form("say", verb),
  again: form("again", adverb, "a・GAIN"),
  slowly: form("slowly", adverb, "SLOW・ly"),
  call: form("call", "noun 名詞；verb 動詞"),
  back: form("back", "noun 名詞；adverb 副詞；adjective 形容詞"),
  lunch: form("lunch", noun),
  menu: form("menu", noun, "MEN・u"),
  cup: form("cup", noun),
  of: form("of", preposition),
  tea: form("tea", noun),
  ordered: form("order", "noun 名詞；verb 動詞", "OR・dered", {
    kk: "/ˈɔrdɚd/", ipa: "/ˈɔɹdɚd/", syllables: 2, stress: 1,
  }),
  not: form("not", adverb),
  check: form("check", "noun 名詞；verb 動詞"),
  booked: form("book", "noun 名詞；verb 動詞", "booked", { kk: "/bʊkt/", ipa: "/bʊkt/", syllables: 1 }),
  tonight: form("tonight", "noun 名詞；adverb 副詞", "to・NIGHT"),
  where: form("where", "adverb 副詞；conjunction 連接詞"),
  leave: form("leave", "verb 動詞；noun 名詞"),
  cold: form("cold", "adjective 形容詞；noun 名詞"),
  bring: form("bring", verb),
  extra: form("extra", "adjective 形容詞；adverb 副詞；noun 名詞", "EX・tra"),
  blanket: form("blanket", "noun 名詞；adjective 形容詞；verb 動詞", "BLAN・ket"),
  ...situationalForms(form),
  ...arrangementForms(form),
  ...followThroughForms(form),
  ...coordinationForms(form),
  ...errandsForms(form),
  ...serviceForms(form),
  ...instructionForms(form),
  ...everydayDecisionsForms(form),
  ...localVisitsForms(form),
  ...independentErrandsForms(form),
  ...sharedSpaceForms(form),
  ...everydayConfirmationForms(form),
  ...everydayTransitionsForms(form),
  ...everydayChoicesForms(form),
  ...communityRoutinesForms(form),
  ...personalServicesForms(form),
  ...healthWeatherRideForms(form),
  ...clinicMarketLeisureForms(form),
  ...familyStoreRepairForms(form),
  ...leavePeopleComplaintsForms(form),
  ...bankBillTripForms(form),
  ...opinionsServicePartyForms(form),
  ...holidayAdviceNeighborForms(form),
  ...routinePlansFavorForms(form),
  ...jobsFoodIndoorsForms(form),
  ...experiencePassMeetupForms(form),
  ...classesParcelsWeekendForms(form),
  ...rentHealthPlansForms(form),
  ...parcelNowCardForms(form),
  ...abilityRefundRideForms(form),
  ...permissionCompareFrequencyForms(form),
  ...birthdaySchoolHoldForms(form),
  ...placesWebLostForms(form),
  ...petsBusYesterdayForms(form),
  ...interviewFollowupTripForms(form),
  ...homeSeasonsTeaForms(form),
  ...sportsHotelSchoolForms(form),
  ...moviesFamilyMarketForms(form),
  ...areaDeliveryHolidayForms(form),
  ...fittingLocationApologyForms(form),
  ...goalsBankLostForms(form),
  ...musicComputerSurpriseForms(form),
  ...forecastTransportHomeForms(form),
  ...chargerChildhoodChangeForms(form),
  ...recommendOverdueAccidentForms(form),
  ...choresFeeCoworkerForms(form),
  ...gymVoicemailStudyForms(form),
  ...seatsShiftGiftForms(form),
  ...parkingNeighborReturnForms(form),
  ...elevatorRescheduleTeacherForms(form),
  ...tasteBeachAirportForms(form),
  ...planeImmigrationExchangeForms(form),
  ...movingToothPhoneForms(form),
  ...nightmarketTyphoonBillpayForms(form),
  ...trainTaiwanVolunteerForms(form),
  ...plantsHobbyBookingForms(form),
  ...babyBreakfastPhotoForms(form),
  ...wrongparcelKeyLunchForms(form),
};

const lesson = (title, sentence, translation, grammar, patternId, template, skeleton, roles, variants, distractors, responseSources, uses = {}, chunks = []) =>
  ({ title, sentence, translation, grammar, patternId, template, skeleton, roles, variants, distractors, responseSources, uses, chunks });
const variant = (id, translation, parts) => ({ id, translation, parts });
const chunk = (id, text, translation, note) => ({ id, text, translation, note });
const line = (sentence, translation) => ({ sentence, translation });
const question = (prompt, evidence, correct, ...distractors) => ({ prompt, evidence, correct, distractors });

const politePlease = wordUse("please-request", "請（讓請求更有禮貌）", adverb, "禮貌標記", "please 不代表同意或感謝；在這裡是禮貌請求。", "context");
const couldRequest = wordUse("could-polite-request", "能不能……？（禮貌請求）", modal, "禮貌請求", "Could you／we…? 在此是禮貌請求，不是描述過去。後面接原形動詞。", "grammar");
const speak = wordUse("speak-talk", "說話／交談", verb, "交談動作", "speak to + 人，表示和那個人說話。");
const after = wordUse("after-following-event", "在……之後", preposition, "較晚的時間", "after lunch 表示午餐後，不是午餐時。", "grammar");
const quantityOf = wordUse("of-quantity-content", "接杯子裡的飲料", preposition, "容器和內容物的連接", "a cup of + 飲料，表示「一杯……」。", "grammar");
const canRequest = wordUse("can-interactive-permission", "可以……嗎？", modal, "詢問許可", "can 後面接原形動詞。", "grammar");
const youSubject = wordUse("you-subject-request", "你（主詞）", pronoun, "被請求的人", "", "grammar");
const youObject = wordUse("you-object-recipient", "你（受詞）", "pronoun 代名詞（受格）", "動作的對象", "", "grammar");

export const appliedUnits = [
  {
    id: "a2-u11",
    title: "應用：通話、重述與確認",
    lessons: [
      lesson("在電話中找人", "Can I speak to Amy, please?", "請問可以找 Amy 接電話嗎？",
        "Can I speak to + 人, please? 用來禮貌地請對方接電話。", "phone-ask-to-speak",
        "Can I speak to {person}, please?", "Can I speak to ______, please?",
        ["禮貌詢問", "通話對象與禮貌語"],
        [
          variant("ben", "請問可以找 Ben 接電話嗎？", ["Can I speak to", "Ben, please?"]),
          variant("manager", "請問可以找我的主管接電話嗎？", ["Can I speak to", "my manager, please?"]),
        ],
        ["請問可以找 Ben 接電話嗎？", "請問 Amy 可以再說一次嗎？", "我可以午餐後再打給 Amy。"],
        ["a2-u10-l01", "a2-u10-l03", "a2-u09-l04"],
        {
          can: canRequest,
          speak,
          to: wordUse("to-speech-recipient", "接說話的對象", preposition, "通話對象", "", "grammar"),
          please: politePlease,
        },
        [chunk("speak-to", "speak to", "和……說話", "speak to + 人。在電話上可用來請人接電話。")]),
      lesson("請對方再說一次", "Could you say that again?", "可以再說一次嗎？",
        "用 Could you + 原形動詞禮貌請求。that 指剛才說的話，again 表示再一次。", "phone-ask-to-repeat",
        "{request} say {object} again?", "______ say ______ again?",
        ["請求開頭", "請對方重述"],
        [
          variant("can", "你可以再說一次嗎？", ["Can you", "say that again?"]),
          variant("it", "可以把那句再說一次嗎？", ["Could you", "say it again?"]),
        ],
        ["可以說慢一點嗎？", "你可以先打電話給我嗎？", "我剛才已經說過了。"],
        ["a2-u11-l01", "a2-u10-l03", "a2-u06-l03"],
        {
          could: couldRequest,
          you: youSubject,
          say: wordUse("say-words", "說出", verb, "說出內容", "say 後面可以直接接說的內容。"),
          that: wordUse("that-prior-utterance", "剛才說的那句話", pronoun, "所指內容", "that 指對方剛說過的話。", "context"),
          again: wordUse("again-repeat", "再一次", adverb, "重複動作"),
        },
        [chunk("say-that-again", "say that again", "把剛才的話再說一次", "整組用在沒有聽清楚時。")]),
      lesson("請對方說慢一點", "Could you speak more slowly?", "可以說慢一點嗎？",
        "more slowly 修飾 speak；整句是在請求對方放慢說話速度。", "phone-ask-to-slow-down",
        "{request} speak {speed}?", "______ speak ______?",
        ["請求開頭", "說話速度"],
        [
          variant("can-more", "你可以說慢一點嗎？", ["Can you", "speak more slowly?"]),
          variant("could-slowly", "可以慢慢說嗎？", ["Could you", "speak slowly?"]),
        ],
        ["可以再說一次嗎？", "可以說快一點嗎？", "我可以說慢一點。"],
        ["a2-u11-l01", "a2-u11-l02", "a2-u10-l03"],
        {
          could: couldRequest, you: youSubject, speak,
          more: wordUse("more-degree-comparative", "更（接 slowly）", adverb, "副詞比較級", "more slowly 是 slowly 的比較級。", "grammar"),
          slowly: wordUse("slowly-speech-rate", "慢慢地", adverb, "說話速度"),
        },
        [chunk("more-slowly", "more slowly", "更慢地", "修飾動作，例如 speak more slowly。")]),
      lesson("約好稍後回電", "I can call you back after lunch.", "我可以午餐後再打給你。",
        "call someone back 表示回電；人稱代名詞放在 call 和 back 中間。", "phone-offer-to-call-back",
        "I can call you back {time}.", "I can call you back ______.",
        ["提出回電", "回電時間"],
        [
          variant("dinner", "我可以晚餐後再打給你。", ["I can call you back", "after dinner."]),
          variant("ten", "我可以十點再打給你。", ["I can call you back", "at ten."]),
        ],
        ["我可以午餐前再打給你。", "我可以午餐後跟你見面。", "你可以午餐後打給我。"],
        ["a2-u11-l02", "a2-u11-l03", "a2-u10-l03"],
        {
          can: wordUse("can-offer-action", "可以（提出可行做法）", modal, "提供做法", "", "grammar"),
          call: wordUse("call-phone", "打電話", verb, "回電動作"),
          you: youObject,
          back: wordUse("back-return-a-call", "回（電話）", adverb, "回電標記", "call you back 表示再打電話給你。", "context"),
          after,
          lunch: wordUse("lunch-meal", "午餐", noun, "回電時間的參照"),
        },
        [
          chunk("call-you-back", "call you back", "打電話回覆你", "代名詞 you 放在 call 和 back 之間。"),
          chunk("after-lunch", "after lunch", "午餐後", "after + 事件表示該事件之後。"),
        ]),
    ],
    passage: [
      line("Can I speak to Amy, please?", "來電者：請問可以找 Amy 接電話嗎？"),
      line("This is Amy.", "Amy：我就是 Amy。"),
      line("I can meet you at the station.", "來電者：我可以在車站跟你見面。"),
      line("Could you say that again?", "Amy：可以再說一次嗎？"),
      line("Could you speak more slowly?", "Amy：可以說慢一點嗎？"),
      line("I can call you back after lunch.", "來電者：我可以午餐後再打給你。"),
    ],
    questions: [
      question("這通電話是要找誰？", [1], "Amy.", "Ben.", "My manager.", "My mother."),
      question("來電者原本提議在哪裡見面？", [3], "At the station.", "At school.", "At home.", "At the store."),
      question("Amy 的第二個請求是哪一句？", [4, 5], "Could you speak more slowly?", "Could you say that again?", "Can I speak to Amy, please?", "I can call you back after lunch."),
      question("Amy 請對方再說一次；來電者最後提議午餐後做什麼？", [4, 6], "Call you back.", "Take the bus.", "Meet at the station.", "Wash the dishes."),
    ],
  },
  {
    id: "a2-u12",
    title: "應用：點餐、更正與結帳",
    lessons: [
      lesson("禮貌地要菜單", "May I see the menu, please?", "請問可以看一下菜單嗎？",
        "May I + 原形動詞？可用於服務情境的禮貌請求。the menu 指餐廳的菜單。", "restaurant-request-menu",
        "May {subject} see {menu}, please?", "May ______ see ______, please?",
        ["請求者", "要看哪一份菜單"],
        [
          variant("we", "請問我們可以看一下菜單嗎？", ["May we", "see the menu, please?"]),
          variant("that-menu", "請問我可以看一下那份菜單嗎？", ["May I", "see that menu, please?"]),
        ],
        ["請問可以找 Amy 接電話嗎？", "請問可以看一下那本書嗎？", "請問可以幫我點餐嗎？"],
        ["a2-u11-l01", "a2-u11-l02", "a2-u10-l03"],
        {
          may: wordUse("may-polite-permission", "可以……嗎（禮貌詢問）", modal, "請求許可", "此處 may 是情態助動詞，與月份 May 不同。", "grammar"),
          see: wordUse("see-look-at-item", "看一下", verb, "查看菜單"),
          menu: wordUse("menu-food-list", "菜單", noun, "要看的物品"),
          please: politePlease,
        }),
      lesson("用份量點餐", "I would like a cup of tea.", "我想要一杯茶。",
        "would like + 名詞片語是禮貌點餐說法。a cup of + 飲料表示一杯的份量。", "restaurant-order-with-quantity",
        "{subject} would like a cup of tea.", "______ would like a cup of tea.",
        ["點餐者", "所點的餐點"],
        [
          variant("we", "我們想要一杯茶。", ["We", "would like a cup of tea."]),
          variant("she", "她想要一杯茶。", ["She", "would like a cup of tea."]),
        ],
        ["我想要一杯咖啡。", "我想要一杯水。", "我們想要一杯茶。"],
        ["a2-u12-l01", "a2-u11-l02", "a2-u11-l04"],
        {
          would: wordUse("would-polite-desire", "讓 like 的請求比較禮貌", modal, "禮貌語氣", "would like a cup of tea 不需要加 to；to 後面才接動詞。", "grammar"),
          like: wordUse("like-with-would", "想要（跟 would 一起用）", verb, "表達想點的餐點", "", "context"),
          cup: wordUse("cup-serving", "杯（一杯的份量）", noun, "飲料份量"),
          of: quantityOf,
          tea: wordUse("tea-drink", "茶", noun, "飲料"),
        },
        [
          chunk("would-like", "would like", "想要（禮貌說法）", "接名詞可直接點餐；接動作才用 would like to。"),
          chunk("a-cup-of", "a cup of", "一杯……", "用容器表示一份的份量。"),
        ]),
      lesson("更正送錯的品項", "I ordered tea, not coffee.", "我點的是茶，不是咖啡。",
        "ordered 是 order 的過去式；逗號後的 not + 名詞指出不對的品項。", "restaurant-correct-order",
        "I ordered {actual}, not {mistake}.", "I ordered ______, not ______.",
        ["實際點的品項", "要排除的品項"],
        [
          variant("coffee-tea", "我點的是咖啡，不是茶。", ["I ordered coffee,", "not tea."]),
          variant("water-coffee", "我點的是水，不是咖啡。", ["I ordered water,", "not coffee."]),
        ],
        ["我點的是咖啡，不是茶。", "我點的是水，不是咖啡。", "我想再點一杯茶和一杯咖啡。"],
        ["a2-u12-l02", "a2-u12-l01", "a2-u11-l04"],
        {
          ordered: wordUse("order-food-past", "（已經）點了", "verb 動詞（過去式）", "已做的點餐動作", "order → ordered；在餐廳表示點餐。"),
          not: wordUse("not-contrast-item", "不是（接送錯的品項）", adverb, "排除錯誤品項", "not coffee 省略重複的主詞和動詞。", "context"),
        }),
      lesson("請店員結帳", "Could we have the check, please?", "請問我們可以結帳嗎？",
        "在美式餐廳，the check 指帳單。Could we have…? 是禮貌地請對方拿東西。", "restaurant-ask-for-item",
        "Could {subject} have {item}, please?", "Could ______ have ______, please?",
        ["提出請求者", "想要的物品"],
        [
          variant("i-check", "請問我可以結帳嗎？", ["Could I", "have the check, please?"]),
          variant("we-water", "請問可以給我們一些水嗎？", ["Could we", "have some water, please?"]),
        ],
        ["請問我們可以看菜單嗎？", "請問可以給我們一些水嗎？", "請問我們可以點一杯茶嗎？"],
        ["a2-u12-l01", "a2-u12-l02", "a2-u12-l03"],
        {
          could: couldRequest,
          have: wordUse("have-request-receive", "要／拿到（禮貌請求）", verb, "請店員提供", "Could we have…? 不在問我們是否已經持有東西。", "context"),
          check: wordUse("check-restaurant-bill", "帳單（美式餐廳用語）", noun, "請求的物品", "此處 the check 指餐費帳單，不是「檢查」或「支票」。"),
          please: politePlease,
        },
        [chunk("the-check", "the check", "帳單（美式）", "餐廳結帳時可說 Could we have the check, please?")]),
    ],
    passage: [
      line("May I see the menu, please?", "客人：請問可以看一下菜單嗎？"),
      line("I would like a cup of tea.", "客人：我想要一杯茶。"),
      line("I ordered tea, not coffee.", "客人：我點的是茶，不是咖啡。"),
      line("I am sorry.", "店員：不好意思。"),
      line("Could we have the check, please?", "用餐後，客人：請問我們可以結帳嗎？"),
    ],
    questions: [
      question("客人一開始想看什麼？", [1], "The menu.", "The check.", "A train ticket.", "The email."),
      question("客人向店員點了什麼？", [2], "A cup of tea.", "A cup of coffee.", "More tea.", "Some water."),
      question("對照點餐和更正，客人說自己沒有點哪樣飲料？", [2, 3], "Coffee.", "Tea.", "Water.", "An apple."),
      question("用餐後，客人請店員拿什麼？", [5], "The check.", "The menu.", "Some water.", "A cup of tea."),
    ],
  },
  {
    id: "a2-u13",
    title: "應用：旅館入住與求助",
    lessons: [
      lesson("告知有住宿預訂", "I booked a room for tonight.", "我訂了今晚的房間。",
        "booked 是 book（預訂）的過去式。for tonight 指住宿時間，不是打算今晚才訂。", "hotel-state-reservation",
        "I booked a room for {time}.", "I booked a room for ______.",
        ["告知已有預訂", "預訂時間"],
        [
          variant("tomorrow", "我訂了明天的房間。", ["I booked a room for", "tomorrow."]),
          variant("saturday", "我訂了星期六的房間。", ["I booked a room for", "Saturday."]),
        ],
        ["我有訂明晚的住宿。", "我今晚想要預訂。", "我在問今晚還有沒有房間。"],
        ["a2-u12-l01", "a2-u12-l04", "a2-u11-l04"],
        {
          booked: wordUse("book-reserve-past", "（已經）預訂了", "verb 動詞（過去式）", "已完成預訂", "book 在這裡是動詞「預訂」；booked 的 -ed 發 /t/，不另成音節。"),
          for: wordUse("for-booked-time", "接預訂的時間", preposition, "入住時間", "", "grammar"),
          tonight: wordUse("tonight-evening", "今晚", "noun 名詞（時間）", "預訂的時間"),
        },
        [chunk("booked-a-room", "booked a room", "訂了房間", "用過去式說明已經訂好了。")]),
      lesson("詢問行李可以放哪裡", "Where can I leave my bag?", "我的包包可以放在哪裡？",
        "Where can I + 原形動詞？用來詢問地點。leave 在此指先把物品留在某處。", "hotel-ask-where-to-leave-item",
        "Where can I leave {item}?", "Where can I leave ______?",
        ["詢問安放地點", "想暫放的物品"],
        [
          variant("cellphone", "我的手機可以放在哪裡？", ["Where can I leave", "my cellphone?"]),
          variant("this-bag", "這個包包可以放在哪裡？", ["Where can I leave", "this bag?"]),
        ],
        ["我的包包在哪裡？", "我的手機可以放在哪裡？", "我幾點可以把包包拿走？"],
        ["a2-u13-l01", "a2-u11-l01", "a2-u12-l01"],
        {
          where: wordUse("where-ask-place", "在哪裡", adverb, "詢問地點"),
          can: wordUse("can-ask-permitted-location", "可以（與 Where 搭配詢問地點）", modal, "詢問可行地點", "can 後面用原形 leave。", "grammar"),
          leave: wordUse("leave-place-item", "把……留在某處", verb, "暫放物品", "leave my bag 的重點是把包包留在某處，不是「我離開」。", "context"),
        }),
      lesson("向櫃檯反映房間太冷", "The room is too cold.", "房間太冷了。",
        "too + 形容詞表示程度超過可接受的範圍。這裡用來反映住宿問題。", "hotel-describe-room-problem",
        "{place} is too {adjective}.", "______ is too ______.",
        ["要描述的空間", "超出可接受程度的狀況"],
        [
          variant("bathroom-cold", "浴室太冷了。", ["The bathroom", "is too cold."]),
          variant("room-expensive", "這間房太貴了。", ["The room", "is too expensive."]),
        ],
        ["浴室太冷了。", "房間太貴了。", "房間很冷，但還可以接受。"],
        ["a2-u13-l01", "a2-u13-l02", "a2-u12-l04"],
        {
          is: wordUse("be-linking-state", "連接主詞與狀態的 be 動詞", "linking verb 連綴動詞", "連接房間與溫度", "單數主詞 The room 用 is；中文這裡通常不譯成「是」。", "grammar"),
          too: wordUse("too-excess-degree", "太……（超出可接受程度）", adverb, "不合需求的程度", "too cold 比單純說 cold 多了「冷得不舒服」的意味。", "grammar"),
          cold: wordUse("cold-low-temperature", "冷的", adjective, "房間溫度"),
        },
        [chunk("too-cold", "too cold", "太冷", "too 在此表示過度，不是「也」。")]),
      lesson("請服務人員多拿一條毯子", "Could you bring an extra blanket?", "可以再拿一條毯子給我嗎？",
        "Could you bring + 物品？禮貌請對方送東西來。extra 是另外多一份，不是更大的尺寸。", "hotel-request-extra-item",
        "Could you bring {item}?", "Could you bring ______?",
        ["禮貌請對方送東西", "需要的物品"],
        [
          variant("the-blanket", "可以把那條毯子拿來嗎？", ["Could you bring", "the blanket?"]),
          variant("water", "可以拿一些水來嗎？", ["Could you bring", "some water?"]),
        ],
        ["可以把那條毯子拿來嗎？", "可以拿一些水來嗎？", "我可以再拿一條毯子給你。"],
        ["a2-u13-l01", "a2-u13-l02", "a2-u13-l03"],
        {
          could: couldRequest,
          you: youSubject,
          bring: wordUse("bring-deliver-to-speaker", "拿來", verb, "請對方送來"),
          extra: wordUse("extra-additional", "額外的／再多一份的", adjective, "多要的份數"),
          blanket: wordUse("blanket-cover", "毯子", noun, "需要的物品"),
        },
        [chunk("an-extra-blanket", "an extra blanket", "額外一條毯子", "extra 的開頭是母音，所以用 an。")]),
    ],
    passage: [
      line("I booked a room for tonight.", "旅客：我訂了今晚的房間。"),
      line("Where can I leave my bag?", "旅客：我的包包可以放在哪裡？"),
      line("You can leave it on the table.", "櫃檯人員：你可以先放在桌上。"),
      line("The room is too cold.", "入住後，旅客：房間太冷了。"),
      line("Could you bring an extra blanket?", "旅客：可以再拿一條毯子給我嗎？"),
    ],
    questions: [
      question("這位旅客訂了什麼時候的住宿？", [1], "Tonight.", "Tomorrow.", "Saturday.", "After lunch."),
      question("櫃檯人員說，包包可以放在哪裡？", [3], "On the table.", "At the station.", "On the left.", "At school."),
      question("旅客入住後，希望櫃檯再送什麼來？", [5], "An extra blanket.", "Some water.", "A cup of tea.", "The menu."),
      question("對照最後兩句，旅客為什麼多要一條毯子？", [4, 5], "The room is too cold.", "The room is too expensive.", "The bathroom is too cold.", "I booked a room for tonight."),
    ],
  },
];

const authoring = { lesson, variant, chunk, line, question, wordUse, couldRequest, youSubject };
appliedUnits.push(
  ...situationalUnits(authoring),
  ...arrangementUnits(authoring),
  ...followThroughUnits(authoring),
  ...coordinationUnits(authoring),
  ...errandsUnits(authoring),
  ...serviceUnits(authoring),
  ...instructionUnits(authoring),
  ...everydayDecisionsUnits(authoring),
  ...localVisitsUnits(authoring),
  ...independentErrandsUnits(authoring),
  ...sharedSpaceUnits(authoring),
  ...everydayConfirmationUnits(authoring),
  ...everydayTransitionsUnits(authoring),
  ...everydayChoicesUnits(authoring),
  ...communityRoutinesUnits(authoring),
  ...personalServicesUnits(authoring),
  ...healthWeatherRideUnits(authoring),
  ...clinicMarketLeisureUnits(authoring),
  ...familyStoreRepairUnits(authoring),
  ...leavePeopleComplaintsUnits(authoring),
  ...bankBillTripUnits(authoring),
  ...opinionsServicePartyUnits(authoring),
  ...holidayAdviceNeighborUnits(authoring),
  ...routinePlansFavorUnits(authoring),
  ...jobsFoodIndoorsUnits(authoring),
  ...experiencePassMeetupUnits(authoring),
  ...classesParcelsWeekendUnits(authoring),
  ...rentHealthPlansUnits(authoring),
  ...parcelNowCardUnits(authoring),
  ...abilityRefundRideUnits(authoring),
  ...permissionCompareFrequencyUnits(authoring),
  ...birthdaySchoolHoldUnits(authoring),
  ...placesWebLostUnits(authoring),
  ...petsBusYesterdayUnits(authoring),
  ...interviewFollowupTripUnits(authoring),
  ...homeSeasonsTeaUnits(authoring),
  ...sportsHotelSchoolUnits(authoring),
  ...moviesFamilyMarketUnits(authoring),
  ...areaDeliveryHolidayUnits(authoring),
  ...fittingLocationApologyUnits(authoring),
  ...goalsBankLostUnits(authoring),
  ...musicComputerSurpriseUnits(authoring),
  ...forecastTransportHomeUnits(authoring),
  ...chargerChildhoodChangeUnits(authoring),
  ...recommendOverdueAccidentUnits(authoring),
  ...choresFeeCoworkerUnits(authoring),
  ...gymVoicemailStudyUnits(authoring),
  ...seatsShiftGiftUnits(authoring),
  ...parkingNeighborReturnUnits(authoring),
  ...elevatorRescheduleTeacherUnits(authoring),
  ...tasteBeachAirportUnits(authoring),
  ...planeImmigrationExchangeUnits(authoring),
  ...movingToothPhoneUnits(authoring),
  ...nightmarketTyphoonBillpayUnits(authoring),
  ...trainTaiwanVolunteerUnits(authoring),
  ...plantsHobbyBookingUnits(authoring),
  ...babyBreakfastPhotoUnits(authoring),
  ...wrongparcelKeyLunchUnits(authoring),
);

export const appliedLessonId = (unitId, index) => `${unitId}-l${String(index + 1).padStart(2, "0")}`;
