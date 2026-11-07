import { useId } from "react";
import { format } from "date-fns";
import { cn, formatPnl } from "@/lib/utils";

export interface EquityPoint {
  date: Date;
  net: number;
}

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 16 };
const MAX_X_LABELS = 7;

/** Cumulative P/L line over the selected period. Pure SVG, no dependency. */
export function EquityChart({ points }: { points: EquityPoint[] }) {
  const gradId = useId();
  if (points.length === 0) return null;

  let running = 0;
  const cumulative = points.map((p) => {
    running += p.net;
    return { date: p.date, value: running };
  });

  const values = cumulative.map((c) => c.value);
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  const span = hi - lo || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + (1 - (v - lo) / span) * innerH;

  const coords = cumulative.map((c, i) => ({ ...c, cx: x(i), cy: y(c.value) }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.cx.toFixed(1)},${c.cy.toFixed(1)}`).join(" ");
  const zeroY = y(0);
  const last = coords[coords.length - 1];
  const area = `${line} L${last.cx.toFixed(1)},${zeroY.toFixed(1)} L${coords[0].cx.toFixed(1)},${zeroY.toFixed(1)} Z`;

  const isUp = last.value >= 0;
  const color = isUp ? "hsl(var(--win))" : "hsl(var(--loss))";
  const step = Math.max(1, Math.ceil(points.length / MAX_X_LABELS));

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        Total{" "}
        <span className={cn("text-sm font-semibold tabular-nums", isUp ? "text-win" : "text-loss")}>
          {formatPnl(last.value)}
        </span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Cumulative profit and loss over the period">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD.left} x2={W - PAD.right} y1={zeroY} y2={zeroY} stroke="hsl(var(--border))" strokeDasharray="4 4" />
        {points.length > 1 && <path d={area} fill={`url(#${gradId})`} />}
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.cx} cy={c.cy} r={i === coords.length - 1 ? 5 : 3} fill="hsl(var(--card))" stroke={color} strokeWidth="2" />
            <circle cx={c.cx} cy={c.cy} r="12" fill="transparent">
              <title>{`${format(c.date, "d MMM")}: ${formatPnl(c.value)}`}</title>
            </circle>
            {i % step === 0 && (
              <text x={c.cx} y={H - 8} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
                {format(c.date, points.length > 10 ? "d" : "EEE d")}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
