import { useEffect, useRef, useState } from "react";
import { cardImageUrl, drawPuzzle, loadCardImage } from "./draw";
import { HoloCard } from "./HoloCard";
import type { Character, HintStep } from "./types";

interface StageProps {
  card: Character | null;
  step: HintStep;
  revealed: boolean;
  foil?: boolean;
  emptyMessage?: string;
  onReady: () => void;
  onError: () => void;
}

export function Stage({ card, step, revealed, foil = false, emptyMessage, onReady, onError }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const stepRef = useRef(step);
  const revealedRef = useRef(revealed);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  stepRef.current = step;
  revealedRef.current = revealed;
  onReadyRef.current = onReady;
  onErrorRef.current = onError;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!card) return;
    let cancel = false;
    setReady(false);
    imageRef.current = null;
    loadCardImage(card.reference)
      .then((image) => {
        if (cancel) return;
        imageRef.current = image;
        const canvas = canvasRef.current;
        if (canvas && !revealedRef.current) drawPuzzle(canvas, image, stepRef.current, card.reference);
        setReady(true);
        onReadyRef.current();
      })
      .catch(() => {
        if (!cancel) onErrorRef.current();
      });
    return () => {
      cancel = true;
    };
  }, [card]);

  useEffect(() => {
    if (!card || revealed || !imageRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawPuzzle(canvas, imageRef.current, step, card.reference);
    setReady(true);
  }, [card, revealed, step]);

  if (!card) {
    return (
      <div className="stage">
        <p className="empty">{emptyMessage ?? "No card to show."}</p>
      </div>
    );
  }

  if (revealed) {
    return (
      <div className="stage">
        <HoloCard src={cardImageUrl(card.reference)} foil={foil} />
      </div>
    );
  }

  return (
    <div className="stage">
      <canvas
        ref={canvasRef}
        hidden={!ready}
        aria-label="Character art, with the card name hidden"
      />
      {!ready && <p className="waiting">Loading art…</p>}
    </div>
  );
}
