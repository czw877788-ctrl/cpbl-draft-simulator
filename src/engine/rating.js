// Descriptive score only: it ranks the supplied season/career stats.
// It is not a projection, scouting grade, or official CPBL rating.
export function scorePlayer(player) {
  if (player.role === '投手') {
    const era = Number(player.stats?.era ?? 5)
    const whip = Number(player.stats?.whip ?? 1.5)
    const k9 = Number(player.stats?.k9 ?? 6)
    const bb9 = Number(player.stats?.bb9 ?? 3.5)
    const score = 50 + (4.5 - era) * 7 + (1.45 - whip) * 22 + (k9 - 7) * 2.2 + (3.5 - bb9) * 2.5
    return clamp(score)
  }
  const ops = Number(player.stats?.ops ?? 0.65)
  const avg = Number(player.stats?.avg ?? 0.25)
  const hr = Number(player.stats?.hr ?? 0)
  const sb = Number(player.stats?.sb ?? 0)
  const score = 50 + (ops - 0.7) * 85 + (avg - 0.25) * 65 + Math.min(hr, 30) * 0.35 + Math.min(sb, 30) * 0.18
  return clamp(score)
}
function clamp(n) { return Math.max(1, Math.min(99, Math.round(n))) }

export function formatStat(player) {
  const s = player.stats || {}
  if (player.role === '投手') return `ERA ${fmt(s.era, 2)} · WHIP ${fmt(s.whip, 2)} · K/9 ${fmt(s.k9, 1)}`
  return `AVG ${fmt(s.avg, 3)} · OPS ${fmt(s.ops, 3)} · HR ${s.hr ?? '—'}`
}
function fmt(n, d) { return n == null ? '—' : Number(n).toFixed(d) }