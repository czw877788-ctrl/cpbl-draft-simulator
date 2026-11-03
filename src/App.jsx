import React, { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, ChevronRight, CircleHelp, Database, Download, RotateCcw, Search, Shield, Trophy, Upload } from 'lucide-react'
import { scorePlayer, formatStat } from './engine/rating'
import { autoPick, getCurrentTeam, makeDraftOrder } from './engine/draftEngine'

const TEAMS = ['中信兄弟', '統一7-ELEVEn獅', '樂天桃猿', '富邦悍將', '味全龍', '台鋼雄鷹']
const TEAM_SHORT = {'中信兄弟':'兄弟','統一7-ELEVEn獅':'統一','樂天桃猿':'樂天','富邦悍將':'富邦','味全龍':'味全','台鋼雄鷹':'台鋼'}

export default function App() {
  const [dataset, setDataset] = useState(null)
  const [season, setSeason] = useState('2024')
  const [myTeam, setMyTeam] = useState(TEAMS[0])
  const [rounds, setRounds] = useState(3)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('全部')
  const [picks, setPicks] = useState([])
  const [status, setStatus] = useState('setup')
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/players.json`).then(r => r.json()).then(setDataset).catch(() => setDataset({ players: [], drafts: [], sourceNote: '資料載入失敗' }))
  }, [])

  const draft = dataset?.drafts?.find(d => String(d.year) === String(season))
  const rawPlayers = draft?.playerPool?.map(id => dataset.players.find(p => p.id === id)).filter(Boolean) || []
  const players = useMemo(() => rawPlayers.map(p => ({...p, rating: scorePlayer(p)})), [dataset, season])
  const available = players.filter(p => !picks.some(x => x.playerId === p.id))
  const order = makeDraftOrder(TEAMS)
  const currentTeam = getCurrentTeam(order, picks)
  const currentRound = Math.floor(picks.length / TEAMS.length) + 1
  const filtered = available.filter(p => {
    const match = `${p.name} ${p.school || ''} ${p.position || ''}`.toLowerCase().includes(query.toLowerCase())
    return match && (roleFilter === '全部' || p.role === roleFilter)
  })
  const totalPicks = rounds * TEAMS.length
  const isMyTurn = status === 'drafting' && currentTeam === myTeam && picks.length < totalPicks
  const completed = picks.length >= totalPicks || available.length === 0

  function begin() { setPicks([]); setStatus('drafting') }
  function makePick(player) {
    if (!player || picks.some(x => x.playerId === player.id)) return
    setPicks(prev => [...prev, { pick: prev.length + 1, round: Math.floor(prev.length / TEAMS.length) + 1, team: currentTeam, playerId: player.id }])
  }
  function runAI() {
    let next = [...picks]
    let left = players.filter(p => !next.some(x => x.playerId === p.id))
    while (next.length < totalPicks && left.length) {
      const team = getCurrentTeam(order, next)
      const p = autoPick(team, left)
      next.push({ pick: next.length + 1, round: Math.floor(next.length / TEAMS.length) + 1, team, playerId: p.id })
      left = left.filter(x => x.id !== p.id)
    }
    setPicks(next)
  }
  function reset() { setPicks([]); setStatus('setup') }
  function importJSON(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (!Array.isArray(parsed.players) || !Array.isArray(parsed.drafts)) throw new Error('格式不正確')
        setDataset(parsed)
        setSeason(String(parsed.drafts[0]?.year || '2024'))
        setPicks([]); setStatus('setup')
        alert('資料匯入成功')
      } catch (e) { alert(`匯入失敗：${e.message}`) }
    }
    reader.readAsText(file)
    event.target.value = ''
  }
  function exportResults() {
    const result = picks.map(p => ({...p, player: players.find(x => x.id === p.playerId)?.name || p.playerId}))
    const blob = new Blob([JSON.stringify({year: season, userTeam: myTeam, picks: result}, null, 2)], {type:'application/json'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `cpbl-draft-${season}-results.json`; a.click(); URL.revokeObjectURL(a.href)
  }

  if (!dataset) return <main className="loading">載入 CPBL 選秀資料中…</main>
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Activity size={21}/></div><div><b>CPBL DRAFT</b><span>SIMULATOR · MVP 0.1</span></div></div>
      <div className="top-actions"><button className="ghost" onClick={() => setShowGuide(v=>!v)}><CircleHelp size={16}/> 使用說明</button><label className="import-btn"><Upload size={16}/> 匯入資料<input type="file" accept=".json,application/json" onChange={importJSON}/></label></div>
    </header>

    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="live-dot"/> BASEBALL FRONT OFFICE</div><h1>打造你的<br/><em>選秀王朝</em></h1><p>以 CPBL 歷史與球員公開成績為基礎，扮演球團 GM，做出每一個選秀決策。</p>
        <div className="hero-meta"><span><Shield size={14}/> 六支球團</span><span><Database size={14}/> 數據評分</span><span><Trophy size={14}/> 歷史選秀模式</span></div>
      </div>
      <div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="big-ball">⚾</div><div className="art-caption">THE NEXT<br/>GENERATION</div></div>
    </section>

    {showGuide && <div className="notice"><b>操作方式</b><p>選擇選秀年度與球團後開始。輪到你時，在候選名單按「選擇球員」；其他球團由簡易 AI 依照需求位置與數據分數挑選。可匯入符合範本格式的 JSON。示範資料不是官方選秀名單。</p></div>}

    {status === 'setup' ? <section className="setup-grid">
      <div className="panel setup-panel"><div className="section-kicker">01 / CONFIGURATION</div><h2>建立選秀情境</h2>
        <label className="field-label">選秀年度</label><select value={season} onChange={e=>setSeason(e.target.value)}>{dataset.drafts.map(d=><option key={d.year} value={d.year}>{d.year} 年選秀 · {d.label || '歷史重選'}</option>)}</select>
        <label className="field-label">選擇你的球團</label><div className="team-grid">{TEAMS.map((t,i)=><button key={t} className={`team-choice ${myTeam===t?'selected':''}`} onClick={()=>setMyTeam(t)}><span className={`team-badge team-${i}`}>{TEAM_SHORT[t]}</span><span>{t}</span>{myTeam===t&&<span className="check">✓</span>}</button>)}</div>
        <label className="field-label">模擬輪數</label><div className="round-options">{[1,2,3,4,5].map(n=><button key={n} className={rounds===n?'active':''} onClick={()=>setRounds(n)}>{n} 輪</button>)}</div>
        <button className="primary wide" onClick={begin} disabled={!players.length}>開始選秀 <ArrowRight size={17}/></button>
        {!players.length && <small className="warning">此年度尚無候選球員資料，請匯入資料集。</small>}
      </div>
      <div className="panel data-panel"><div className="section-kicker">02 / PLAYER POOL</div><h2>本屆候選球員</h2><div className="pool-stat"><strong>{players.length.toString().padStart(2,'0')}</strong><span>PLAYERS<br/>IN THE POOL</span></div><div className="mini-bars"><div><span>投手</span><b>{players.filter(p=>p.role==='投手').length}</b><i style={{width:`${players.length?players.filter(p=>p.role==='投手').length/players.length*100:0}%`}}/></div><div><span>野手</span><b>{players.filter(p=>p.role!=='投手').length}</b><i style={{width:`${players.length?players.filter(p=>p.role!=='投手').length/players.length*100:0}%`}}/></div></div><div className="data-source"><Database size={16}/><div><b>資料狀態</b><span>{dataset.sourceNote || '已載入本機 JSON 資料'}</span></div></div><p className="muted small">選秀分數由輸入的職棒成績計算，只用於候選球員排序，不代表球探評價或未來成績預測。</p></div>
    </section> : <section className="draft-layout">
      <div className="draft-main">
        <div className="draft-heading"><div><div className="section-kicker">LIVE DRAFT ROOM / {season}</div><h2>{completed?'選秀完成':'第 '+currentRound+' 輪選秀'}</h2><p>{completed?'本次模擬選秀已結束。':`目前順位 #${picks.length+1} · ${currentTeam} ${currentTeam===myTeam?'（你的球團）':'（AI 球團）'}`}</p></div><button className="outline" onClick={reset}><RotateCcw size={15}/> 重新開始</button></div>
        <div className="progress"><div style={{width:`${Math.min(100,picks.length/totalPicks*100)}%`}}/></div><div className="progress-label"><span>選秀進度</span><b>{picks.length} / {totalPicks}</b></div>
        {isMyTurn && <div className="turn-banner"><span className="live-dot"/> 輪到你了！請選擇一位球員</div>}
        {!completed && !isMyTurn && <div className="ai-banner"><Activity size={16}/> AI 球團正在評估候選名單… <button onClick={runAI}>執行下一個選擇 <ChevronRight size={15}/></button></div>}
        {completed && <div className="complete-banner"><Trophy/> 選秀完成！你可以匯出結果或重新開始。</div>}
        <div className="list-toolbar"><div className="searchbox"><Search size={16}/><input placeholder="搜尋球員、學校或守位…" value={query} onChange={e=>setQuery(e.target.value)}/></div><select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option>全部</option><option>投手</option><option>內野手</option><option>外野手</option><option>捕手</option></select></div>
        <div className="player-list">{filtered.map((p,i)=><div className="player-row" key={p.id}><div className="rank">{String(i+1).padStart(2,'0')}</div><div className={`avatar ${p.role==='投手'?'pitcher':''}`}>{p.role==='投手'?'P':p.position?.slice(0,2)||'IF'}</div><div className="player-info"><b>{p.name}</b><span>{p.school || '資料未提供'} · {p.position || p.role}</span><small>{formatStat(p)}</small></div><div className="rating"><b>{p.rating}</b><span>STAT SCORE</span></div>{isMyTurn?<button className="pick-btn" onClick={()=>makePick(p)}>選擇球員</button>:<span className="locked">待選</span>}</div>)}
          {!filtered.length && <div className="empty">沒有符合條件的候選球員</div>}
        </div>
      </div>
      <aside className="draft-side"><div className="panel"><div className="side-title"><b>選秀結果</b><span>{picks.length} PICKS</span></div><div className="pick-list">{picks.slice().reverse().map(p=>{const player=players.find(x=>x.id===p.playerId);return <div className="pick-item" key={p.pick}><span className="pick-number">#{p.pick}</span><div><b>{player?.name || p.playerId}</b><small>{p.team} · 第 {p.round} 輪</small></div></div>})}{!picks.length&&<p className="muted small">尚未有人選秀</p>}</div><button className="outline wide" onClick={exportResults} disabled={!picks.length}><Download size={15}/> 匯出選秀結果</button></div>
        <div className="panel"><div className="side-title"><b>各隊選秀數</b></div>{TEAMS.map(t=><div className="team-count" key={t}><span>{t}</span><b>{picks.filter(p=>p.team===t).length}</b></div>)}</div></aside>
    </section>}
    <footer><span>CPBL DRAFT SIMULATOR · FAN-MADE PROJECT</span><span>非中華職棒官方產品</span></footer>
  </div>
}