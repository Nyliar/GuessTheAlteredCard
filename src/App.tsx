import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import catalog from "./data/characters.json";
import { Account } from "./Account";
import { copy } from "./copy";
import { applyResult, cardForDay, dayKey, formatRemaining, illustrationsInPool, msUntilNextDay, type DailyRecord } from "./daily";
import { cardImageUrl } from "./draw";
import { isCorrectGuess } from "./guess";
import { canReveal, emptyHints, hintCount, hintsForNextStep, HINT_KINDS, revealHint, type HintKind, type Hints } from "./hints";
import { summarize } from "./history";
import { DAILY_LIMIT } from "./mode";
import { factionLabel, setLabel, typeLabel } from "./labels";
import { suggestNames, type NameSuggestion } from "./names";
import { publicUrl } from "./publicUrl";
import { disconnect, type ReunionUser } from "./reunion";
import { earnedPoints, playedStep } from "./score";
import { shareText } from "./share";
import { cardsInPool } from "./sets";
import { Stage } from "./Stage";
import { StatsPage } from "./StatsPage";
import { loadDaily, loadHistory, loadSkipFirst, loadStats, recordGame, recordShare, saveDaily, saveSkipFirst, saveStats } from "./storage";
import type { Character, HintStep, Lang } from "./types";

const cards = cardsInPool(catalog.characters as Character[]);
const dailyCards = illustrationsInPool(cards);
const LANG_KEY = "wtc-lang";

interface Session {
  card: Character;
  step: HintStep;
  phase: "playing" | "correct" | "miss";
  awarded: number | null;
  hints: Hints;
  skippedFirst: boolean;
}

export function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const text = copy[lang];
  const [today, setToday] = useState(dayKey);
  const [session, setSession] = useState<Session>(() => readToday(dayKey()));
  const [stats, setStats] = useState(loadStats);
  const [skipFirst, setSkipFirst] = useState(loadSkipFirst);
  const [guess, setGuess] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [picked, setPicked] = useState(0);
  const [note, setNote] = useState("");
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [artReady, setArtReady] = useState(false);
  const [broken, setBroken] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [remaining, setRemaining] = useState(() => formatRemaining(msUntilNextDay()));
  const [user, setUser] = useState<ReunionUser | null>(null);
  const [showStats, setShowStats] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const matches = useMemo(() => suggestNames(cards, lang, guess), [lang, guess]);
  const showSuggestions = suggestOpen && guess.trim().length > 0;
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
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setSession(readToday(today));
    setGuess("");
    setNote("");
    setArtReady(false);
    setBroken(false);
    setConfirmGiveUp(false);
  }, [today]);

  useEffect(() => {
    if (session.phase === "playing") inputRef.current?.focus({ preventScroll: true });
  }, [session.card.reference, session.phase]);

  useEffect(() => {
    // Wait until the puzzle is on screen, so turning the setting back off from stats
    // still leaves a step-0 game on the first crop.
    if (!skipFirst || showStats) return;
    setSession((current) => {
      if (current.phase !== "playing" || current.step !== 0) return current;
      return { ...current, step: 1, skippedFirst: true, hints: hintsForNextStep(current.hints) };
    });
  }, [skipFirst, showStats]);

  useEffect(() => {
    const record: DailyRecord = {
      date: today,
      reference: session.card.reference,
      step: session.step,
      phase: session.phase,
      awarded: session.awarded,
      hints: session.hints.revealed,
      hintSpent: session.hints.spent,
      skippedFirst: session.skippedFirst,
    };
    saveDaily(record);
  }, [today, session]);

  function finish(phase: "correct" | "miss", step: HintStep) {
    const points = phase === "correct" ? earnedPoints(step, hintCount(session.hints)) : 0;
    const solved = phase === "correct";
    recordGame({
      reference: session.card.reference,
      points,
      solved,
      foil: solved && step <= 1,
    });
    setSession((current) => ({
      ...current,
      step,
      skippedFirst: current.skippedFirst || step > current.step,
      phase,
      awarded: points,
    }));
    setNote("");
    setStats((prev) => {
      const updated = applyResult(prev, points, today, DAILY_LIMIT, phase === "correct");
      if (updated !== prev) saveStats(updated);
      return updated;
    });
  }

  function applyGuess(typed: string) {
    if (session.phase !== "playing" || !artReady) return;
    const step = playedStep(session.step, skipFirst || session.skippedFirst);
    if (!typed) return;
    const answers = [session.card.name.en, session.card.name.fr];
    if (!isCorrectGuess(typed, answers, false)) {
      if (step < 3) {
        setSession((current) => ({
          ...current,
          step: (step + 1) as HintStep,
          skippedFirst: current.skippedFirst || step > current.step,
          hints: hintsForNextStep(current.hints),
        }));
        setGuess("");
        setSuggestOpen(false);
        setNote(text.miss);
        return;
      }
      finish("miss", step);
      return;
    }
    finish("correct", step);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const selected = showSuggestions ? matches[picked] : undefined;
    applyGuess((selected?.name ?? guess).trim());
    setSuggestOpen(false);
  }

  function pickSuggestion(card: NameSuggestion) {
    setGuess(card.name);
    setSuggestOpen(false);
    applyGuess(card.name);
  }

  function onGuessKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSuggestOpen(false);
      return;
    }
    if (!showSuggestions || matches.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPicked((index) => (index + 1) % matches.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setPicked((index) => (index - 1 + matches.length) % matches.length);
    }
  }

  function revealMore() {
    const step = playedStep(session.step, skipFirst || session.skippedFirst);
    if (session.phase !== "playing" || !artReady || step >= 3) return;
    setSession((current) => ({
      ...current,
      step: (step + 1) as HintStep,
      skippedFirst: current.skippedFirst || step > current.step,
      hints: hintsForNextStep(current.hints),
    }));
    setGuess("");
    setNote("");
    inputRef.current?.focus({ preventScroll: true });
  }

  function giveUp() {
    if (session.phase !== "playing" || !artReady) return;
    setConfirmGiveUp(false);
    finish("miss", playedStep(session.step, skipFirst || session.skippedFirst));
  }

  function takeHint(kind: HintKind) {
    if (session.phase !== "playing" || !artReady || !canReveal(session.hints, kind)) return;
    setSession((current) => ({ ...current, hints: revealHint(current.hints, kind) }));
  }

  async function shareResult() {
    const step = playedStep(session.step, session.skippedFirst);
    const message = shareText({
      step,
      solved: session.phase === "correct",
      foil: session.phase === "correct" && step <= 1,
      date: today,
      lang,
      skippedFirst: session.skippedFirst,
      hints: session.hints.revealed,
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
    if (shared) recordShare();
  }

  function playAnother() {
    const pool = dailyCards.filter((card) => card.reference !== session.card.reference);
    const card = pool[Math.floor(Math.random() * pool.length)] ?? session.card;
    setSession({
      card,
      step: skipFirst ? 1 : 0,
      phase: "playing",
      awarded: null,
      hints: emptyHints(),
      skippedFirst: skipFirst,
    });
    setGuess("");
    setNote("");
    setArtReady(false);
    setBroken(false);
  }

  const revealed = session.phase !== "playing";
  const shownStep = playedStep(
    session.step,
    session.phase === "playing" ? skipFirst || session.skippedFirst : session.skippedFirst,
  );
  const primary = lang === "fr" ? session.card.name.fr : session.card.name.en;
  const secondary = lang === "fr" ? session.card.name.en : session.card.name.fr;
  const stake = session.phase === "playing" ? earnedPoints(shownStep, hintCount(session.hints)) : session.awarded;
  const chances = Math.max(0, 4 - shownStep - (session.phase === "playing" ? 0 : 1));
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

    {showStats ? (
      <StatsPage
        lang={lang}
        pseudo={user?.pseudo ?? ""}
        summary={summarize(loadHistory())}
        cards={cards}
        skipFirst={skipFirst}
        onSkipFirst={(next) => {
          saveSkipFirst(next);
          setSkipFirst(next);
        }}
        onBack={() => setShowStats(false)}
        onDisconnect={user ? () => {
          disconnect();
          setUser(null);
          setShowStats(false);
        } : undefined}
      />
    ) : (
    <main className="app">
      <img className="banner" src={publicUrl("banner.webp")} alt="" />
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
      {DAILY_LIMIT && revealed && (
        <p className="next-puzzle">
          <span>{text.nextIn}</span>
          <strong>{remaining}</strong>
        </p>
      )}

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
          step={shownStep}
          revealed={revealed}
          foil={session.phase === "correct" && shownStep <= 1}
          onReady={() => setArtReady(true)}
          onError={() => setBroken(true)}
        />
      )}

      {session.phase === "playing" && (
        <div className="hints">
          {HINT_KINDS.map((kind, index) => {
            const open = session.hints.revealed.includes(kind);
            if (open) return <span key={kind} className="hint-shown">{revealedHints[index]}</span>;
            const allowed = canReveal(session.hints, kind);
            return (
              <button
                key={kind}
                className="altered-button hint-choice"
                type="button"
                onClick={() => takeHint(kind)}
                disabled={!artReady || !allowed}
                title={allowed ? undefined : text.hintLater}
              >
                {allowed ? `${hintNames[index]} ${text.hintPrice}` : `${hintNames[index]} ?`}
              </button>
            );
          })}
          {session.hints.spent && session.hints.revealed.length < HINT_KINDS.length && (
            <p className="hint-note">{text.hintLater}</p>
          )}
        </div>
      )}

      {session.phase === "playing" ? (
        <form className={note ? "guess wrong" : "guess"} onSubmit={submit}>
          <div className="guess-field">
            <input
              ref={inputRef}
              value={guess}
              aria-label={text.nameLabel}
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="character-suggestions"
              aria-activedescendant={showSuggestions && matches[picked] ? `character-suggestion-${picked}` : undefined}
              placeholder={text.placeholder}
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              onFocus={() => {
                if (guess.trim()) setSuggestOpen(true);
              }}
              onBlur={() => setSuggestOpen(false)}
              onKeyDown={onGuessKeyDown}
              onChange={(event) => {
                setGuess(event.target.value);
                setPicked(0);
                setSuggestOpen(true);
                setNote("");
              }}
            />
            {showSuggestions && (
              <ul id="character-suggestions" className="guess-autocomplete" role="listbox">
                {matches.length === 0 ? (
                  <li>{text.noResults}</li>
                ) : matches.map((card, index) => (
                  <li
                    key={card.reference}
                    id={`character-suggestion-${index}`}
                    role="option"
                    aria-selected={index === picked}
                    className={index === picked ? "selected" : undefined}
                    onMouseEnter={() => setPicked(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      pickSuggestion(card);
                    }}
                  >
                    <img src={cardImageUrl(card.reference, lang)} alt="" draggable={false} />
                    <span>{card.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="altered-button" type="submit" disabled={!artReady}>{text.guess}</button>
          {shownStep < 3 && (
            <button className="altered-button" type="button" onClick={revealMore} disabled={!artReady}>
              {text.nextStep}
            </button>
          )}
          <button className="altered-button" type="button" onClick={() => setConfirmGiveUp(true)} disabled={!artReady}>
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
          <div className="reveal-actions">
            {!DAILY_LIMIT && (
              <button type="button" onClick={playAnother}>{text.next}</button>
            )}
            <button className="altered-button" type="button" onClick={() => void shareResult()}>{text.share}</button>
          </div>
        </section>
      )}

      <p className="feedback" role="status">{note}</p>

      {confirmGiveUp && (
        <GiveUpConfirm
          message={text.giveUpConfirm}
          confirmLabel={text.giveUpYes}
          cancelLabel={text.giveUpNo}
          onCancel={() => setConfirmGiveUp(false)}
          onConfirm={giveUp}
        />
      )}

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

function GiveUpConfirm({
  message,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
}: {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="confirm"
      aria-labelledby="give-up-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        const { clientX, clientY } = event;
        const outside = clientX < box.left || clientX > box.right || clientY < box.top || clientY > box.bottom;
        if (outside) onCancel();
      }}
    >
      <p id="give-up-title">{message}</p>
      <div className="confirm-actions">
        <button type="button" className="altered-button" onClick={onCancel} autoFocus>
          {cancelLabel}
        </button>
        <button type="button" className="altered-button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
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
  const card = cardForDay(dailyCards, day);
  const saved = loadDaily();
  const skip = loadSkipFirst();
  if (saved?.date === day && saved.reference === card.reference) {
    const skippedFirst = saved.skippedFirst || (skip && saved.phase === "playing" && saved.step === 0);
    const step = saved.phase === "playing" ? playedStep(saved.step, skippedFirst) : saved.step;
    return {
      card,
      step,
      phase: saved.phase,
      awarded: saved.awarded,
      hints: { revealed: saved.hints, spent: step === saved.step && saved.hintSpent },
      skippedFirst,
    };
  }
  return { card, step: skip ? 1 : 0, phase: "playing", awarded: null, hints: emptyHints(), skippedFirst: skip };
}
