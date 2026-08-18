import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const WIDTH = 120;
const HEIGHT = 32;
const PAD = 4;

export default function PriceSparkline({ points }) {
  if (!points || points.length < 2) return null;

  const prices = points.map(p => p.price);
  const min = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const max = rawMax === min ? min + 1 : rawMax;

  const toXY = (price, i) => {
    const x = PAD + (i / (points.length - 1)) * (WIDTH - PAD * 2);
    const y = HEIGHT - PAD - ((price - min) / (max - min)) * (HEIGHT - PAD * 2);
    return [x, y];
  };

  const coords = points.map((p, i) => toXY(p.price, i));
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  const first = prices[0];
  const last = prices[prices.length - 1];
  const TrendIcon = last < first ? TrendingDown : last > first ? TrendingUp : Minus;
  const trendColor = last < first ? 'text-green-600' : last > first ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="flex items-center gap-2">
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Price history sparkline">
        <path d={path} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.length <= 8 && coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#0d9488">
            <title>{`R${points[i].price.toFixed(2)} on ${new Date(points[i].recordedAt).toLocaleDateString()}`}</title>
          </circle>
        ))}
      </svg>
      <span className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}>
        <TrendIcon size={12} aria-hidden="true" />
        {last === first ? 'Stable' : `R${Math.abs(last - first).toFixed(2)}`}
      </span>
      <span className="text-[11px] text-gray-400">Lowest R{min.toFixed(2)}</span>
    </div>
  );
}
