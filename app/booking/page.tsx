"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

const TYPES = [{label:"Discovery Call",duration:30},{label:"Product Demo",duration:45},{label:"Strategic Discussion",duration:60}]
const TIMES = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM"]
const SCENES = [{name:"morning",start:0,end:11},{name:"day",start:11,end:16},{name:"evening",start:16,end:19},{name:"night",start:19,end:24}]
const LA_TZ = "America/Los_Angeles"
function hourOf(t:string){const [hm,meridiem]=t.split(" ");const [h,m]=hm.split(":").map(Number);return (h%12)+(meridiem==="PM"?12:0)+m/60}
function isoDay(d:Date){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
export default function BookingPage(){
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1))
 const [date,setDate]=useState("")
 const [time,setTime]=useState("")
 const [kind,setKind]=useState(0)
 const [now,setNow]=useState(new Date())
 const [step,setStep]=useState(false)
 const [name,setName]=useState("")
 const [email,setEmail]=useState("")
 const [company,setCompany]=useState("")
 const [status,setStatus]=useState("")
 const [available,setAvailable]=useState<string[]|null>(null)
 const [loading,setLoading]=useState(false)
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer)},[])
 useEffect(()=>{setTime("");setAvailable(null);if(!date)return;let active=true;setLoading(true);fetch(`/api/booking/availability?date=${date}&duration=${TYPES[kind].duration}`).then(async r=>{if(!r.ok)throw Error("Calendar availability is not configured");return r.json()}).then(data=>{if(active)setAvailable(data.times)}).catch(()=>{if(active)setAvailable(null)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[date,kind])
 const localTime=new Intl.DateTimeFormat("en-US",{timeZone:LA_TZ,hour:"numeric",minute:"2-digit",hour12:true}).format(now)
 const displayTime=time||localTime
 const scene=SCENES.find(s=>hourOf(displayTime)>=s.start&&hourOf(displayTime)<s.end)?.name||"night"
 const firstDay=new Date(month.getFullYear(),month.getMonth(),1).getDay()
 const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate()
 const today=isoDay(new Date())
 const monthLabel=month.toLocaleString("en-US",{month:"long",year:"numeric"})
 const chosenLabel=date?new Date(date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}):"Choose a date"
 async function submit(e:React.FormEvent){e.preventDefault();setStatus("Booking…");try{const r=await fetch("/api/booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date,time,duration:TYPES[kind].duration,type:TYPES[kind].label,name,email,company})});const data=await r.json();if(!r.ok)throw Error(data.error||"Booking unavailable");setStatus("Confirmed! Check your email for your invitation.")}catch(err){setStatus(err instanceof Error?err.message:"Could not book. Please try again.")}}
 return <main className="relative min-h-screen overflow-hidden bg-[#071323] text-white">
 <div aria-hidden className="fixed inset-0">
 {SCENES.map(s=><div key={s.name} className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1700ms]" style={{backgroundImage:`url(/booking-scenes/la-${s.name}.webp)`,opacity:scene===s.name?1:0}}/>)}
 <div className="absolute inset-0 bg-gradient-to-r from-[#030917]/75 via-[#030917]/20 to-[#030917]/15"/>
 </div>
 <div className="relative z-10 mx-auto flex min-h-screen max-w-[1700px] flex-col px-5 py-6 sm:px-12">
 <header className="flex items-center justify-between"><Link href="/" className="text-2xl font-light tracking-[.22em]">DONNA</Link><span className="text-[10px] tracking-[.34em] text-white/70">CALM INTELLIGENCE</span></header>
 <div className="mt-9 flex flex-1 flex-col items-start justify-between gap-12 lg:flex-row">
 <section className="w-full max-w-[395px] rounded-[24px] border border-white/25 bg-[#091425]/70 p-5 shadow-2xl backdrop-blur-2xl sm:p-6">
 <p className="text-[10px] tracking-[.3em] text-white/60">BOOK A MEETING</p><h1 className="mt-3 text-[30px] font-light leading-tight">Let's talk about<br/>your business.</h1><p className="mt-2 text-sm leading-relaxed text-white/65">Choose a time and we'll prepare a personalized conversation.</p>
 {!step?<><div className="mt-5 grid grid-cols-3 gap-2">{TYPES.map((t,i)=><button key={t.label} onClick={()=>setKind(i)} className={`rounded-xl border p-2 text-center text-[11px] transition ${kind===i?"border-indigo-400 bg-indigo-500/30":"border-white/15 bg-white/5 hover:bg-white/10"}`}>{t.label}<span className="mt-1 block text-[10px] text-white/55">{t.duration} min</span></button>)}</div>
 <div className="mt-5 flex items-center justify-between"><span className="text-sm">{monthLabel}</span><div className="flex gap-2"><button aria-label="Previous month" className="px-2" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button><button aria-label="Next month" className="px-2" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div></div>
 <div className="mt-3 grid grid-cols-7 gap-1 text-center">{["S","M","T","W","T","F","S"].map((d,i)=><span key={i} className="py-1 text-[10px] text-white/45">{d}</span>)}{Array.from({length:firstDay},(_,i)=><span key={"empty"+i}/>)}{Array.from({length:days},(_,i)=>{const day=isoDay(new Date(month.getFullYear(),month.getMonth(),i+1));const disabled=day<today||new Date(day+"T12:00:00").getDay()%6===0;return <button key={day} disabled={disabled} onClick={()=>setDate(day)} className={`aspect-square rounded-full text-xs transition ${date===day?"bg-indigo-500 shadow-[0_0_20px_#6366f1]":"hover:bg-white/15"} disabled:opacity-25`}>{i+1}</button>})}</div>
 <div className="mt-5 flex justify-between text-xs"><span>Available times</span><span className="text-white/55">{chosenLabel}</span></div>
 <div className="mt-3 grid grid-cols-4 gap-2">{TIMES.map(t=><button key={t} disabled={!date||!available?.includes(t)} onClick={()=>setTime(t)} className={`rounded-lg border px-1 py-2 text-[10px] transition ${time===t?"border-indigo-400 bg-indigo-500/70":"border-white/15 bg-black/15 hover:bg-white/10"} disabled:cursor-not-allowed disabled:opacity-25`}>{t}</button>)}</div>
 <p className="mt-3 min-h-4 text-[11px] text-white/55">{loading?"Checking Google Calendar…":date&&!available?"Live booking is being configured.":date&&available?.length===0?"No openings on this date.":""}</p>
 <button disabled={!date||!time} onClick={()=>setStep(true)} className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 py-3 text-sm disabled:opacity-40">Continue →</button></>:
 <form onSubmit={submit} className="mt-6 space-y-3"><p className="text-sm text-white/75">{chosenLabel} at {time} · {TYPES[kind].label}</p><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-sm"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-sm"/><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company (optional)" className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-sm"/><button className="w-full rounded-xl bg-indigo-500 py-3 text-sm">Confirm booking</button><button type="button" onClick={()=>setStep(false)} className="w-full py-2 text-xs text-white/60">← Back</button><p role="status" className="text-xs">{status}</p></form>}
 </section>
 <aside className="self-end text-right lg:mt-10 lg:self-start"><div className="text-[clamp(4rem,10vw,9rem)] font-extralight leading-none tracking-[-.065em] drop-shadow-xl">{displayTime.replace(/\s[AP]M$/,"")}<span className="ml-2 text-xl tracking-normal sm:text-3xl">{displayTime.endsWith("PM")?"PM":"AM"}</span></div><p className="mt-4 text-xs uppercase tracking-[.28em]">{date?chosenLabel:now.toLocaleDateString("en-US",{timeZone:LA_TZ,weekday:"long",month:"long",day:"numeric"})}</p><p className="mt-3 text-xs tracking-[.34em] text-white/80">⌖ LOS ANGELES</p></aside>
 </div></div></main>
}
