import { alphabet } from "../course-data";

export type AlphabetScreenProps = {
  speak: (text: string, rate?: number, countReplay?: boolean) => void;
};

export function AlphabetScreen({
  speak,
}: AlphabetScreenProps) {
  return (
    <div className="page-stack">
      <section className="page-title">
        <div>
          <span className="eyebrow">隨時可以練習，不設前置門檻</span>
          <h1>A–Z 發音基礎</h1>
          <p>點選字母聽美式字母名稱；熟悉後可直接回到正式課程。</p>
        </div>
        <button className="secondary-button" onClick={() => speak("A B C D E F G", 0.85)}>▶ 播放一段</button>
      </section>
      <section className="alphabet-grid">
        {alphabet.map((entry) => (
          <button key={entry.letter} onClick={() => speak(entry.letter)}>
            <strong>{entry.letter}</strong>
            <span>{entry.letter.toLowerCase()}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
