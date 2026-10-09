export function Radar({ data, size = 280 }: { data: { label: string; value: number }[]; size?: number }) {
  const c = size / 2;
  const r = size / 2 - 64;
  const n = data.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v];
  };
  const poly = data.map((d, i) => pt(i, Math.max(0.04, d.value / 100)).join(",")).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-[320px]">
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} points={data.map((_, i) => pt(i, s).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.08)" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" />;
      })}
      <polygon points={poly} fill="url(#radarFill)" stroke="#a78bfa" strokeWidth="1.5" />
      {data.map((d, i) => {
        const [x, y] = pt(i, Math.max(0.04, d.value / 100));
        const [lx, ly] = pt(i, 1.14);
        return (
          <g key={d.label}>
            <circle cx={x} cy={y} r="3" fill="#c4b5fd" />
            <text x={lx} y={ly} fill="#94a3b8" fontSize="9.5" textAnchor={Math.abs(lx - c) < 8 ? "middle" : lx > c ? "start" : "end"} dominantBaseline="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
