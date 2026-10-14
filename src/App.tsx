import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import catalog from "./data/characters.json";
import { Account } from "./Account";
import { copy } from "./copy";
import { applyResult, cardForDay, dayKey, formatRemaining, msUntilNextDay, type DailyRecord } from "./daily";
import { isCorrectGuess } from "./guess";
import { summarize } from "./history";
import { DAILY_LIMIT } from "./mode";
import { factionLabel, setLabel, typeLabel } from "./labels";
import { namesFor } from "./names";
import { disconnect, loadUser, type ReunionUser } from "./reunion";
import { earnedPoints } from "./score";
import { shareText } from "./share";
import { cardsInPool } from "./sets";
import { Stage } from "./Stage";
import { StatsPage } from "./StatsPage";
import { loadDaily, loadHistory, loadStats, recordGame, recordShare, saveDaily, saveStats } from "./storage";
import type { Character, HintStep, Lang } from "./types";

const cards = cardsInPool(catalog.characters as Character[]);
const LANG_KEY = "wtc-lang";

interface Session {
  card: Character;
  step: HintStep;
  phase: "playing" | "correct" | "miss";
  awarded: number | null;
  hints: number;
}

export function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const text = copy[lang];
  const suggestions = useMemo(() => namesFor(cards, lang), [lang]);
  const [today, setToday] = useState(dayKey);
  const [session, setSession] = useState<Session>(() => readToday(dayKey()));
  const [stats, setStats] = useState(loadStats);
  const [guess, setGuess] = useState("");
  const [note, setNote] = useState("");
  const [artReady, setArtReady] = useState(false);
  const [broken, setBroken] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [remaining, setRemaining] = useState(() => formatRemaining(msUntilNextDay()));
  const [user, setUser] = useState<ReunionUser | null>(null);
  const [showStats, setShowStats] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rememberUser = useCallback((next: ReunionUser | null) => setUser(next), []);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = dayKey();
      setToday((current) => (current === next ? current : next));
      if (DAILY_LIMIT) setRemaining(formatRemaining(msUntilNextDay()));
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setSession(readToday(today));
    setGuess("");
    setNote("");
    setArtReady(false);
    setBroken(false);
  }, [today]);

  useEffect(() => {
    if (session.phase === "playing") inputRef.current?.focus({ preventScroll: true });
  }, [session.card.reference, session.phase]);

  useEffect(() => {
    const record: DailyRecord = {
      date: today,
      reference: session.card.reference,
      step: session.step,
      phase: session.phase,
      awarded: session.awarded,
      hints: session.hints,
    };
    saveDaily(record);
  }, [today, session]);

  function finish(phase: "correct" | "miss", points: number) {
    const solved = phase === "correct";
    recordGame({
      reference: session.card.reference,
      points,
      solved,
      foil: solved && session.step <= 1,
    });
    setSession((current) => ({ ...current, phase, awarded: points }));
    setNote("");
    setStats((prev) => {
      const updated = applyResult(prev, points, today, DAILY_LIMIT, phase === "correct");
      if (updated !== prev) saveStats(updated);
      return updated;
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (session.phase !== "playing" || !artReady) return;
    const typed = guess.trim();
    if (!typed) return;
    const answers = [session.card.name.en, session.card.name.fr];
    if (!isCorrectGuess(typed, answers, false)) {
      if (session.step < 3) {
        setSession((current) => ({ ...current, step: (current.step + 1) as HintStep }));
        setGuess("");
        setNote(text.miss);
        return;
      }
      finish("miss", 0);
      return;
    }
    finish("correct", earnedPoints(session.step, session.hints));
  }

  function revealMore() {
    if (session.phase !== "playing" || !artReady || session.step >= 3) return;
    setSession((current) => ({ ...current, step: (current.step + 1) as HintStep }));
    setGuess("");
    setNote("");
    inputRef.current?.focus({ preventScroll: true });
  }

  function giveUp() {
    if (session.phase !== "playing" || !artReady) return;
    finish("miss", 0);
  }

  function takeHint() {
    if (session.phase !== "playing" || !artReady || session.hints >= 3) return;
    setSession((current) => ({ ...current, hints: current.hints + 1 }));
  }

  async function shareResult() {
    const message = shareText({
      step: session.step,
      solved: session.phase === "correct",
      foil: session.phase === "correct" && session.step <= 1,
      date: today,
      lang,
    });
    let shared = false;
    try {
      if (navigator.share) {
        await navigator.share({ text: message });
        shared = true;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(message);
        setNote(text.shared);
        shared = true;
      } catch {
        return;
      }
    }
    if (shared && loadUser()) recordShare();
  }

  function playAnother() {
    const pool = cards.filter((card) => card.reference !== session.card.reference);
    const card = pool[Math.floor(Math.random() * pool.length)] ?? session.card;
    setSession({ card, step: 0, phase: "playing", awarded: null, hints: 0 });
    setGuess("");
    setNote("");
    setArtReady(false);
    setBroken(false);
  }

  const revealed = session.phase !== "playing";
  const primary = lang === "fr" ? session.card.name.fr : session.card.name.en;
  const secondary = lang === "fr" ? session.card.name.en : session.card.name.fr;
  const stake = session.phase === "playing" ? earnedPoints(session.step, session.hints) : session.awarded;
  const chances = Math.max(0, 4 - session.step - (session.phase === "playing" ? 0 : 1));
  const details = [session.card.type, session.card.factionName, session.card.setName].filter(Boolean).join(" · ");
  const hintNames = [text.hintType, text.hintFaction, text.hintSet];
  const revealedHints = [
    typeLabel(session.card.type, lang),
    factionLabel(session.card.factionName, lang),
    setLabel(session.card.set, session.card.setName, lang),
  ];

  return (
    <>
      <header className="site-header">
        <div className="header-content">
          <button type="button" className="brand" onClick={() => setShowStats(false)}>
            <span className="title1">Guess the</span>
            <span className="title2"> Altered Card !</span>
          </button>
          <div className="header-buttons">
            <button
              type="button"
              className="header-button language-toggle"
              aria-label={text.language}
              onClick={() => setLang((current) => (current === "fr" ? "en" : "fr"))}
            >
              <span className={lang === "fr" ? undefined : "translucent"}>🇫🇷</span>
              <span aria-hidden="true"> / </span>
              <span className={lang === "en" ? undefined : "translucent"}>🇬🇧</span>
            </button>
            <Account
              lang={lang}
              user={user}
              onUser={rememberUser}
              onOpenStats={() => setShowStats(true)}
            />
          </div>
        </div>
      </header>

    {showStats && user ? (
      <StatsPage
        lang={lang}
        pseudo={user.pseudo}
        summary={summarize(loadHistory())}
        cards={cards}
        onBack={() => setShowStats(false)}
        onDisconnect={() => {
          disconnect();
          setUser(null);
          setShowStats(false);
        }}
      />
    ) : (
    <main className="app">
      <img className="banner" src="/banner.webp" alt="" />
      <p className="ledeMain">
        {DAILY_LIMIT ? text.ledeDaily : ""}
        {text.lede}
      </p>
      <p className="ledeSub">
        {text.ledePoints}
      </p>
      <p className="ledeSub2">
        {text.ledeHint}
      </p>

      <section className="stats" aria-label={text.score}>
        <div><span>{text.score}</span><strong>{stake == null ? "–" : stake}</strong></div>
        <div><span>{text.streak}</span><strong>{stats.streak}</strong></div>
        <div><span>{text.today}</span><strong>{chances}</strong></div>
      </section>

      {broken ? (
        <div className="stage">
          <p className="empty">{text.artFailed}</p>
          <button type="button" onClick={() => { setBroken(false); setLoadAttempt((value) => value + 1); }}>
            {text.retry}
          </button>
        </div>
      ) : (
        <Stage
          key={`${session.card.reference}-${loadAttempt}`}
          card={session.card}
          step={session.step}
          revealed={revealed}
          foil={session.phase === "correct" && session.step <= 1}
          onReady={() => setArtReady(true)}
          onError={() => setBroken(true)}
        />
      )}

      {session.phase === "playing" && (
        <div className="hints">
          <p>
            {revealedHints.map((value, index) => (
              <span key={hintNames[index]}>
                {index > 0 && " - "}
                {index < session.hints ? value : `${hintNames[index]} ?`}
              </span>
            ))}
          </p>
          {session.hints < 3 && (
            <button className="altered-button hint-button" type="button" onClick={takeHint} disabled={!artReady}>
              {text.hint}
            </button>
          )}
        </div>
      )}

      {session.phase === "playing" ? (
        <form className={note ? "guess wrong" : "guess"} onSubmit={submit}>
          <input
            ref={inputRef}
            value={guess}
            list="character-names"
            aria-label={text.nameLabel}
            placeholder={text.placeholder}
            autoCapitalize="words"
            spellCheck={false}
            onChange={(event) => {
              setGuess(event.target.value);
              setNote("");
            }}
          />
          <datalist id="character-names">
            {suggestions.map((name) => <option key={name} value={name} />)}
          </datalist>
          <button className="altered-button" type="submit" disabled={!artReady}>{text.guess}</button>
          {session.step < 3 && (
            <button className="altered-button" type="button" onClick={revealMore} disabled={!artReady}>
              {text.nextStep}
            </button>
          )}
          <button className="altered-button" type="button" onClick={giveUp} disabled={!artReady}>
            {text.giveUp}
          </button>
        </form>
      ) : (
        <section className="reveal" aria-live="polite">
          <h2>{primary}</h2>
          {secondary && secondary !== primary && <p>{secondary}</p>}
          <p>
            {details}
            {session.awarded != null && session.awarded > 0 ? ` · +${session.awarded}` : ` · 0 ${text.points}`}
          </p>
          {DAILY_LIMIT && <p>{text.nextIn} {remaining}.</p>}
          <div className="reveal-actions">
            {!DAILY_LIMIT && (
              <button type="button" onClick={playAnother}>{text.next}</button>
            )}
            <button className="altered-button" type="button" onClick={() => void shareResult()}>{text.share}</button>
          </div>
        </section>
      )}

      <p className="feedback" role="status">{note}</p>

    </main>
    )}
      <footer className="site-footer">
        <div className="header-content">
          <p>
            {text.footerBefore}
            <a href="https://github.com/PolluxTroy0/Altered-TCG-Card-Database">{text.footerLink}</a>
            {text.footerAfter}
          </p>
        </div>
      </footer>
    </>
  );
}

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "fr") return saved;
  } catch {
    // Keep the browser language when storage is blocked.
  }
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

function readToday(day: string): Session {
  const saved = loadDaily();
  const resume = saved?.date === day ? cards.find((card) => card.reference === saved.reference) : undefined;
  if (saved && resume && saved.date === day) {
    return { card: resume, step: saved.step, phase: saved.phase, awarded: saved.awarded, hints: saved.hints };
  }
  return { card: cardForDay(cards, day), step: 0, phase: "playing", awarded: null, hints: 0 };
}
