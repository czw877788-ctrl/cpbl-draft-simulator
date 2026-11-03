export function makeDraftOrder(teams) {
  return [...teams]
}
export function getCurrentTeam(order, picks) {
  return order[picks.length % order.length]
}
export function autoPick(team, available) {
  if (!available.length) return null
  // AI prioritizes team positional needs, then the transparent stats score.
  const need = teamNeeds[team] || []
  return [...available].sort((a, b) => {
    const needA = need.includes(a.role) ? 8 : 0
    const needB = need.includes(b.role) ? 8 : 0
    return (b.rating + needB) - (a.rating + needA)
  })[0]
}
export const teamNeeds = {
  '中信兄弟': ['投手', '捕手'],
  '統一7-ELEVEn獅': ['投手', '內野手'],
  '樂天桃猿': ['投手', '外野手'],
  '富邦悍將': ['投手', '捕手'],
  '味全龍': ['內野手', '投手'],
  '台鋼雄鷹': ['投手', '外野手']
}