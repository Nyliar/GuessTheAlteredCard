import { cardImageUrl } from "./draw";
import { HoloCard } from "./HoloCard";
import { copy } from "./copy";
import "./icons.css";
import type { FoundCard, PlayerSummary } from "./history";
import type { Character, Lang } from "./types";

interface StatsPageProps {
  lang: Lang;
  pseudo: string;
  summary: PlayerSummary;
  cards: readonly Character[];
  onBack: () => void;
  onDisconnect: () => void;
}

export function StatsPage({ lang, pseudo, summary, cards, onBack, onDisconnect }: StatsPageProps) {
  const text = copy[lang];
  const average = summary.average == null
    ? "–"
    : summary.average.toLocaleString(lang === "fr" ? "fr-FR" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  const stats = [
    { value: summary.played, title: text.statPlayed, hint: text.statPlayedHint, icon: "played" },
    { value: summary.solved, title: text.statSolved, hint: text.statSolvedHint, icon: "solved" },
    { value: summary.points, title: text.statPoints, hint: text.statPointsHint, icon: "points" },
    { value: average, title: text.statAverage, hint: text.statAverageHint, icon: "average" },
    { value: summary.foils, title: text.statFoils, hint: text.statFoilsHint, icon: "foils" },
    { value: summary.shares, title: text.statShares, hint: text.statSharesHint, icon: "shares" },
  ] as const;

  return (
    <main className="app stats-page">
      <img className="banner stats-banner" src="/stats-banner.webp" alt="" />
      <h2 className="stats-welcome">
        <span className="title1">{text.welcome} </span>
        <span className="title2">{pseudo}</span>
      </h2>
      <section className="section-card">
        <h2>{text.statsTitle}</h2>
        <p>
          {text.statsBefore}
          <strong className="title2">{text.statsName}</strong>
          {text.statsAfter}
        </p>
      </section>
      <section className="player-stats" aria-label={text.statsTitle}>
        {stats.map(({ value, title, hint, icon }) => (
          <div key={title}>
            <strong>{value}</strong>
            <span>{title}<StatIcon name={icon} /></span>
            <small>{hint}</small>
          </div>
        ))}
      </section>
      <section className="section-card">
        <h2>{text.collection}</h2>
        <p>
          {text.collectionBefore}
          <strong className="title2">{text.collectionName}</strong>
          {text.collectionAfter}
        </p>
      </section>
      {summary.found.length === 0 ? (
        <p className="collection-empty">{text.collectionEmpty}</p>
      ) : (
        <div className="collection">
          {summary.found.map((card) => (
            <figure key={card.reference}>
              <HoloCard src={cardImageUrl(card.reference)} foil={card.foil} />
              <figcaption>{cardName(cards, card, lang)}</figcaption>
            </figure>
          ))}
        </div>
      )}
      <div className="stats-actions">
        <button type="button" className="altered-button" onClick={onBack}>{text.backToGame}</button>
        <button type="button" className="altered-button" onClick={onDisconnect}>{text.disconnect}</button>
      </div>
    </main>
  );
}

type StatIconName = "played" | "solved" | "points" | "average" | "foils" | "shares";

const statIconClass = {
  played: "fa-collection",
  solved: "fa-alt-wchampion2",
  points: "fa-altered-x",
  average: "fa-altered-swirl",
  shares: "fa-altered-j",
} as const;

function StatIcon({ name }: { name: StatIconName }) {
  if (name === "foils") return <span className="stat-spark" aria-hidden="true">✨</span>;
  return <i className={`fa-kit ${statIconClass[name]}`} aria-hidden="true" />;
}

function cardName(cards: readonly Character[], card: FoundCard, lang: Lang): string {
  const match = cards.find((entry) => entry.reference === card.reference);
  if (!match) return card.reference;
  return lang === "fr" ? match.name.fr : match.name.en;
}
