"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Code2, MessageCircle, RefreshCcw, BarChart3, List } from "lucide-react"

type ChatbotSettings = {
  greeting: string
  themeColor: string
  position: 'bottom-right' | 'bottom-left'
  profile: 'general' | 'sales' | 'receptionist' | 'marketing'
}

type ConversationSummary = {
  id: string
  last_message_at: string | null
  message_count: number
}

export default function ChatbotControlInterface() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || ""

  const [tab, setTab] = useState<'settings'|'embed'|'conversations'|'analytics'>('settings')
  const [settings, setSettings] = useState<ChatbotSettings>({
    greeting: "Hi! I’m DONNA. How can I help?",
    themeColor: "#2563eb",
    position: 'bottom-right',
    profile: 'general'
  })
  const [saving, setSaving] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [convos, setConvos] = useState<ConversationSummary[]>([])
  const [loadingConvos, setLoadingConvos] = useState(false)

  useEffect(() => {
    // Shell mode - load from localStorage only
    const local = localStorage.getItem('donna_chatbot_settings')
    if (local) setSettings(JSON.parse(local))
  }, [apiBase])

  // Shell mode - localStorage only
  const saveSettings = async () => {
    setSaving(true)
    try {
      localStorage.setItem('donna_chatbot_settings', JSON.stringify(settings))
      // Shell mode - no API call
    } catch (e) {
      console.error('Failed to save settings', e)
    } finally {
      setSaving(false)
    }
  }

  // Shell mode - static demo data
  const reloadConvos = async () => {
    setLoadingConvos(true)
    try {
      // Shell mode - demo conversations
      setConvos([
        { id: '1', title: 'Demo Conversation', last_message: 'Hello!', updated_at: new Date().toISOString() },
        { id: '2', title: 'Another Demo', last_message: 'How can I help?', updated_at: new Date().toISOString() }
      ])
    } catch (e) {
      console.error('Failed to load conversations', e)
    } finally {
      setLoadingConvos(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- load conversations once on mount
  useEffect(() => { reloadConvos() }, [])

  const embedCode = useMemo(() => {
    const pos = settings.position === 'bottom-right' ? 'right:20px;' : 'left:20px;'
    const profile = settings.profile
    const safeThemeColor = /^#[0-9a-fA-F]{3,8}$/.test(settings.themeColor) ? settings.themeColor : '#2563eb'
    // Minimal embeddable widget using older PHP batch API (donna_logic.php)
    const code = `<!-- DONNA Embed (batch mode) -->\n<div id="donna-embed" style="position:fixed; bottom:20px; ${pos} z-index:99999; font-family:system-ui, sans-serif;">\n  <button id="donna-btn" style="background:${safeThemeColor}; color:#fff; border:none; border-radius:999px; padding:12px 16px; box-shadow:0 8px 24px rgba(0,0,0,.2); cursor:pointer;">💬 Chat</button>\n</div>\n<script>(function(){\n  const apiBase=${JSON.stringify(apiBase)};\n  const profile=${JSON.stringify(profile)};\n  const greeting=${JSON.stringify(settings.greeting)};\n  let open=false;\n  const root=document.getElementById('donna-embed');\n  const btn=document.getElementById('donna-btn');\n  const panel=document.createElement('div');\n  panel.style.cssText='display:none; position:fixed; bottom:70px; ${pos} width:320px; height:420px; background:#0b0b0b; color:#fff; border:1px solid rgba(255,255,255,.1); border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,.4); overflow:hidden;';\n  panel.innerHTML='\n    <div style=\\'padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.1); font-size:12px; color:rgba(255,255,255,.7)\\'>DONNA</div>\n    <div id=\\'msgs\\' style=\\'padding:12px; height:320px; overflow:auto; font-size:13px\\'></div>\n    <div style=\\'display:flex; gap:6px; padding:8px; border-top:1px solid rgba(255,255,255,.1)\\'>\n      <input id=\\'inp\\' placeholder=\\'Type a message…\\' style=\\'flex:1; background:#151515; color:#fff; border:1px solid rgba(255,255,255,.15); border-radius:8px; padding:8px; font-size:13px\\'/>\n      <button id=\\'send\\' style=\\'background:${safeThemeColor}; color:#fff; border:none; border-radius:8px; padding:8px 10px;\\'>Send</button>\n    </div>';\n  document.body.appendChild(panel);\n  const msgs=panel.querySelector('#msgs');\n  function add(role, text){const div=document.createElement('div');div.style.margin='6px 0';div.style.whiteSpace='pre-wrap';div.style.opacity=role==='user'?'.9':'.85';div.innerText=text;msgs.appendChild(div);msgs.scrollTop=msgs.scrollHeight;}\n  function send(text){add('user', text);fetch(apiBase+'/api/donna_logic.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text, user_profile:profile, chat_id:'embed-'+Date.now()})}).then(r=>r.json()).then(j=>{add('assistant', j.reply||'');}).catch(()=>add('assistant','Error contacting DONNA.'));}\n  add('assistant', greeting);\n  btn.addEventListener('click',()=>{open=!open; panel.style.display=open?'block':'none';});\n  panel.querySelector('#send').addEventListener('click',()=>{const v=panel.querySelector('#inp').value.trim(); if(!v) return; panel.querySelector('#inp').value=''; send(v);});\n  panel.querySelector('#inp').addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault(); panel.querySelector('#send').click();}});\n})();</script>`
    return code
  }, [settings, apiBase])

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode)
    setEmbedCopied(true)
    setTimeout(()=>setEmbedCopied(false), 1500)
  }

  const totalMessages = useMemo(() => convos.reduce((sum,c)=>sum + c.message_count, 0), [convos])

  return (
    <div className="min-h-screen text-white p-8 glass-dark backdrop-blur" data-tour="chatbot-content">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-green-400"/>
            <h1 className="text-2xl font-light">chatbot control</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={saveSettings} disabled={saving} className="text-sm bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 rounded-lg">{saving? 'saving…':'save'}</button>
            <button onClick={reloadConvos} className="text-sm bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 rounded-lg"><RefreshCcw className="w-4 h-4 inline mr-1"/>refresh</button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(['settings','embed','conversations','analytics'] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-lg text-sm ${tab===t? 'bg-white/20 text-white':'text-white/60 hover:text-white hover:bg-white/10'}`}>{t}</button>
          ))}
        </div>

        {tab==='settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass border border-white/10 rounded-xl p-4">
              <div className="text-sm text-white/80 mb-3">behavior</div>
              <label className="block text-xs text-white/50 mb-1">greeting</label>
              <input value={settings.greeting} onChange={e=>setSettings(s=>({...s,greeting:e.target.value}))} className="w-full glass border border-white/10 rounded px-3 py-2 text-sm mb-3"/>
              <label className="block text-xs text-white/50 mb-1">agent profile</label>
              <select value={settings.profile} onChange={e=>setSettings(s=>({...s,profile:e.target.value as ChatbotSettings['profile']}))} className="w-full glass border border-white/10 rounded px-3 py-2 text-sm">
                <option value="general">General</option>
                <option value="sales">Sales</option>
                <option value="receptionist">Receptionist</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
            <div className="glass border border-white/10 rounded-xl p-4">
              <div className="text-sm text-white/80 mb-3">appearance</div>
              <label className="block text-xs text-white/50 mb-1">theme color</label>
              <input type="color" value={settings.themeColor} onChange={e=>setSettings(s=>({...s,themeColor:e.target.value}))} className="w-16 h-8 bg-transparent border border-white/10 rounded mb-3"/>
              <label className="block text-xs text-white/50 mb-1">position</label>
              <select value={settings.position} onChange={e=>setSettings(s=>({...s,position:e.target.value as ChatbotSettings['position']}))} className="w-full glass border border-white/10 rounded px-3 py-2 text-sm">
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </div>
        )}

        {tab==='embed' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-white/80"><Code2 className="w-4 h-4"/> embed code (PHP batch mode)</div>
              <button onClick={copyEmbed} className="text-xs bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-1.5 rounded">{embedCopied? 'copied':'copy'}</button>
            </div>
            <pre className="text-xs whitespace-pre-wrap glass-dark border border-white/10 rounded p-3 text-white/80">{embedCode}</pre>
            <div className="text-[11px] text-white/40 mt-2">This widget uses your {settings.profile} profile and talks to {apiBase}/api/donna_logic.php. Update CORS if embedding on external domains.</div>
          </div>
        )}

        {tab==='conversations' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-white/80 mb-3"><List className="w-4 h-4"/> saved conversations</div>
            {loadingConvos && <div className="text-sm text-white/50">loading…</div>}
            {!loadingConvos && convos.length===0 && <div className="text-sm text-white/50">no conversations yet</div>}
            <div className="divide-y divide-white/10">
              {convos.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="text-white/80">{c.id}</div>
                  <div className="text-white/40">{c.message_count} messages · {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : 'n/a'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='analytics' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-white/80 mb-3"><BarChart3 className="w-4 h-4"/> analytics</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="glass border border-white/10 rounded p-3">
                <div className="text-white/60 text-xs">conversations</div>
                <div className="text-xl font-light">{convos.length}</div>
              </div>
              <div className="glass border border-white/10 rounded p-3">
                <div className="text-white/60 text-xs">messages</div>
                <div className="text-xl font-light">{totalMessages}</div>
              </div>
              <div className="glass border border-white/10 rounded p-3">
                <div className="text-white/60 text-xs">profile</div>
                <div className="text-xl font-light">{settings.profile}</div>
              </div>
              <div className="glass border border-white/10 rounded p-3">
                <div className="text-white/60 text-xs">position</div>
                <div className="text-xl font-light">{settings.position}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

