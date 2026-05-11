import { useEffect, useRef } from 'react';

const COLORS = ['#894468', '#5da9e9', '#27ae60', '#e28743', '#9b59b6', '#e74c3c', '#16a085', '#f39c12'];

export default function StudyAnalytics({ state, fullState }) {
  const barRef = useRef(null);
  const pieRef = useRef(null);

  const subjects = state.subjects || [];

  useEffect(() => {
    drawBar();
    drawPie();
  }, [subjects]);

  const drawBar = () => {
    const canvas = barRef.current;
    if (!canvas || !subjects.length) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const maxMins = Math.max(...subjects.map(s => Math.floor(s.done / 60)), 1);
    const barW = Math.min(40, (W - 60) / subjects.length - 8);
    const barAreaH = H - 50;

    subjects.forEach((s, i) => {
      const mins = Math.floor(s.done / 60) || 0;
      const barH = (mins / maxMins) * barAreaH;
      const x = 30 + i * ((W - 60) / subjects.length) + ((W - 60) / subjects.length - barW) / 2;
      const y = barAreaH - barH + 10;

      if (!isFinite(x) || !isFinite(y) || !isFinite(barW) || !isFinite(barH)) return;

      // Bar fill
      const grad = ctx.createLinearGradient(0, y, 0, barAreaH + 10);
      grad.addColorStop(0, COLORS[i % COLORS.length]);
      grad.addColorStop(1, COLORS[i % COLORS.length] + '66');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
      ctx.fill();

      // Value label
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${mins}m`, x + barW / 2, Math.max(y - 4, 16));

      // Subject label
      ctx.fillStyle = '#88888888';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      const label = s.name.length > 6 ? s.name.substring(0, 6) + '…' : s.name;
      ctx.fillText(label, x + barW / 2, H - 8);
    });
  };

  const drawPie = () => {
    const canvas = pieRef.current;
    if (!canvas || !subjects.length) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const total = subjects.reduce((s, sub) => s + sub.done, 0);
    if (!total) return;

    const cx = W / 2, cy = H / 2 - 10, r = Math.min(cx, cy) - 10;
    let startAngle = -Math.PI / 2;

    subjects.forEach((s, i) => {
      const slice = (s.done / total) * 2 * Math.PI;
      if (!isFinite(slice) || slice <= 0) return;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff44';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label inside slices
      if (slice > 0.3) {
        const midAngle = startAngle + slice / 2;
        const lx = cx + Math.cos(midAngle) * (r * 0.65);
        const ly = cy + Math.sin(midAngle) * (r * 0.65);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round((s.done / total) * 100)}%`, lx, ly);
      }

      startAngle += slice;
    });

    // Center hole
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, 2 * Math.PI);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#faf8f5';
    ctx.fill();

    // Legend
    const legY = H - 20;
    const legX = (W - subjects.length * 60) / 2;
    subjects.slice(0, 5).forEach((s, i) => {
      const x = legX + i * (W / Math.min(subjects.length, 5));
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fillRect(x, legY - 8, 10, 10);
      ctx.fillStyle = '#88888888';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(s.name.substring(0, 4), x + 12, legY);
    });
  };

  if (!subjects.length) {
    return (
      <div className="gc" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px', marginBottom: '16px' ,margin:'10px'}}>
        📊 Start studying to see your analytics!
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '16px',margin:'10px' }}>
      <div className="sl"><span className="sli">📊</span><h3>Study Analytics</h3></div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div className="gc" style={{ flex: 1, minWidth: '140px', padding: '16px', overflow: 'hidden' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>⏱ Time by Subject</div>
          <canvas ref={barRef} width={220} height={140} style={{ width: '100%', height: 'auto' }} />
        </div>
        <div className="gc" style={{ flex: 1, minWidth: '140px', padding: '16px', overflow: 'hidden' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>🥧 Distribution</div>
          <canvas ref={pieRef} width={220} height={160} style={{ width: '100%', height: 'auto' }} />
        </div>
      </div>
    </div>
  );
}
