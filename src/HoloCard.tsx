import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

interface HoloCardProps {
  src: string;
  foil: boolean;
}

export function HoloCard({ src, foil }: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const foilRef = useRef<HTMLImageElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const bounds = useRef<DOMRect | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const blockScroll = (event: TouchEvent) => event.preventDefault();
    card.addEventListener("touchmove", blockScroll, { passive: false });
    return () => card.removeEventListener("touchmove", blockScroll);
  }, []);

  function onEnter(event: ReactPointerEvent<HTMLDivElement>) {
    bounds.current = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.touchAction = "none";
    if (foil) event.currentTarget.style.scale = "1.02";
    onMove(event);
  }

  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!bounds.current) return;
    const x = event.clientX - bounds.current.left;
    const y = event.clientY - bounds.current.top;
    const xPercentage = clamp(x / bounds.current.width, -0.5, 1.5);
    const yPercentage = clamp(y / bounds.current.height, -0.5, 1.5);
    const xRotation = (xPercentage - 0.5) * 20;
    const yRotation = (0.5 - yPercentage) * 20;
    event.currentTarget.style.transform = `rotateX(${yRotation}deg) rotateY(${xRotation}deg)`;
    if (shineRef.current) {
      shineRef.current.style.backgroundImage =
        `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.6) 10%, transparent 80%)`;
    }
    if (foil && foilRef.current) {
      foilRef.current.style.transform =
        `translate(${xPercentage * 30}%, ${yPercentage * 30}%) rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;
    }
  }

  function onLeave(event: ReactPointerEvent<HTMLDivElement>) {
    bounds.current = null;
    event.currentTarget.style.touchAction = "auto";
    event.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg)";
    event.currentTarget.style.scale = "1";
    if (shineRef.current) shineRef.current.style.backgroundImage = "none";
    if (foilRef.current) {
      foilRef.current.style.transform = "none";
      foilRef.current.style.filter = "opacity(0.5)";
    }
  }

  return (
    <div className="card-scene">
      <div
        ref={cardRef}
        className="card-tilt"
        onPointerEnter={onEnter}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {foil && <img ref={foilRef} className="card-foil" src="/foil.webp" alt="" draggable={false} />}
        <img className="card-face" src={src} alt="" draggable={false} />
        <div ref={shineRef} className="card-shine" />
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
