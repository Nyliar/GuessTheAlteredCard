import { useEffect, useState } from "react";
import { copy } from "./copy";
import { publicUrl } from "./publicUrl";
import { loadUser, loginError, startLogin, type ReunionUser } from "./reunion";
import type { Lang } from "./types";

export function Account({ lang, user, onUser, onOpenStats }: {
  lang: Lang;
  user: ReunionUser | null;
  onUser: (user: ReunionUser | null) => void;
  onOpenStats: () => void;
}) {
  const text = copy[lang];
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const problem = loginError(window.location.search);
    if (problem) {
      setError(problem);
      window.history.replaceState({}, "", import.meta.env.BASE_URL);
    }
    onUser(loadUser());
    setReady(true);
  }, [onUser]);

  return (
    <div className="account">
      <button
        type="button"
        className="header-button account-button"
        aria-label={user ? user.pseudo : text.connect}
        disabled={!ready}
        onClick={() => {
          if (!ready) return;
          if (!user) {
            setError("");
            startLogin();
            return;
          }
          onOpenStats();
        }}
      >
        <img src={publicUrl("reunion.png")} alt="" />
      </button>
      {error && <p className="account-error">{error}</p>}
    </div>
  );
}
