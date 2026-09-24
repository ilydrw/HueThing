import React, { useEffect, useState } from 'react';

function formatClock(date: Date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours || 12;

  const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${paddedMinutes} ${ampm}`;
}

export default function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const syncClock = () => setNow(new Date());
    syncClock();

    const timer = setInterval(syncClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const label = formatClock(now);

  return (
    <div
      aria-label={`Current time ${label}`}
      style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'rgba(255, 255, 255, 0.92)',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        textShadow: '0 2px 10px rgba(8, 8, 10, 0.28)',
        letterSpacing: '0.2px',
        fontFamily: '"SF Pro Display", "Segoe UI", sans-serif'
      }}
    >
      {label}
    </div>
  );
}
