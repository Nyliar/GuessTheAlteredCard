export interface GameResult {
  reference: string;
  points: number;
  solved: boolean;
  foil: boolean;
}

export interface PlayerLog {
  games: GameResult[];
  shares: number;
}

export interface FoundCard {
  reference: string;
  foil: boolean;
}

export interface PlayerSummary {
  played: number;
  solved: number;
  points: number;
  average: number | null;
  foils: number;
  shares: number;
  found: FoundCard[];
}

export const EMPTY_LOG: PlayerLog = { games: [], shares: 0 };

export function normalizeLog(value: unknown): PlayerLog {
  if (!value || typeof value !== "object") return EMPTY_LOG;
  const raw = value as Partial<PlayerLog>;
  const games = Array.isArray(raw.games) ? raw.games.flatMap(normalizeGame) : [];
  const shares = typeof raw.shares === "number" && Number.isFinite(raw.shares) ? Math.max(0, Math.floor(raw.shares)) : 0;
  return { games, shares };
}

export function summarize(log: PlayerLog): PlayerSummary {
  const points = log.games.reduce((sum, game) => sum + game.points, 0);
  const played = log.games.length;
  const found = new Map<string, FoundCard>();
  for (let index = log.games.length - 1; index >= 0; index -= 1) {
    const game = log.games[index];
    if (!game.solved) continue;
    const current = found.get(game.reference);
    if (!current) found.set(game.reference, { reference: game.reference, foil: game.foil });
    else if (game.foil) current.foil = true;
  }
  return {
    played,
    solved: log.games.filter((game) => game.solved).length,
    points,
    average: played === 0 ? null : Math.round((points / played) * 10) / 10,
    foils: log.games.filter((game) => game.foil).length,
    shares: log.shares,
    found: [...found.values()],
  };
}

function normalizeGame(value: unknown): GameResult[] {
  if (!value || typeof value !== "object") return [];
  const game = value as Partial<GameResult>;
  if (typeof game.reference !== "string" || !game.reference) return [];
  const points = typeof game.points === "number" && Number.isFinite(game.points) ? game.points : 0;
  const solved = game.solved === true;
  return [{ reference: game.reference, points, solved, foil: solved && game.foil === true }];
}
