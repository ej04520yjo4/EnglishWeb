import { kkPhoneticGroups } from "../kk-phonetics";
import type { KkPhoneticEntry } from "../kk-phonetics";

export type PhoneticsScreenProps = {
  kkAudioMessage: string;
  playKkAudio: (entry: KkPhoneticEntry, rate?: number) => void;
  playKkSequence: (entries: KkPhoneticEntry[]) => void;
};

export function PhoneticsScreen({
  kkAudioMessage,
  playKkAudio,
  playKkSequence,
}: PhoneticsScreenProps) {
  return (
    <div className="page-stack">
      <section className="page-title kk-page-title">
        <div>
          <span className="eyebrow">獨立練習，不與 A–Z 字母名稱混在一起</span>
          <h1>KK 音標發音</h1>
          <p>點播放鍵直接聽音標本身；例字只用來幫你理解，不會被朗讀。</p>
        </div>
        <div className="kk-summary">
          <strong>41</strong>
          <span>17 個母音・24 個子音</span>
        </div>
      </section>
      <section className="phonetic-guide">
        <div>
          <strong>怎麼使用？</strong>
          <span>先播放單獨音標並跟讀，再用畫面上的例字確認它會出現在哪裡。</span>
        </div>
        <small aria-live="polite">
          {kkAudioMessage || "使用可自由使用的預錄音標樣本，不使用單字語音代替。"}
        </small>
      </section>
      {kkPhoneticGroups.map((group) => (
        <section className="phonetic-section" key={group.id}>
          <div className="section-heading phonetic-section-heading">
            <div>
              <h2>{group.title}</h2>
              <small>{group.subtitle}</small>
            </div>
            <button
              className="secondary-button"
              onClick={() => playKkSequence(group.entries)}
            >
              ▶ 依序播放音標
            </button>
          </div>
          <div className="phonetic-grid">
            {group.entries.map((entry) => (
              <article className="phonetic-card" key={entry.symbol}>
                <div className="phonetic-card-top">
                  <strong>[{entry.symbol}]</strong>
                  <span>{group.id === "vowels" ? "母音" : "子音"}</span>
                </div>
                <div className="phonetic-example">
                  <span>例字</span>
                  <b>{entry.example}</b>
                  <small>{entry.translation}</small>
                </div>
                <p>{entry.tip}</p>
                <div className="phonetic-actions">
                  <button
                    onClick={() => playKkAudio(entry)}
                    aria-label={`播放 KK 音標 ${entry.symbol}`}
                  >
                    ▶ 音標
                  </button>
                  <button
                    onClick={() => playKkAudio(entry, 0.72)}
                    aria-label={`慢速播放 KK 音標 ${entry.symbol}`}
                  >
                    ◁ 慢速
                  </button>
                </div>
                <a
                  className="phonetic-source"
                  href={entry.sourcePage}
                  target="_blank"
                  rel="noreferrer"
                  title={`${entry.author}・${entry.license}`}
                >
                  錄音來源與授權
                </a>
              </article>
            ))}
          </div>
        </section>
      ))}
      <p className="phonetic-note">
        KK 符號用來記錄聲音，不等於英文字母名稱。p、t、k 等短促子音無法像母音一樣延長，
        因此部分開源錄音會搭配簡短載音讓聲音可辨認，但不會朗讀畫面上的例字。
      </p>
    </div>
  );
}
