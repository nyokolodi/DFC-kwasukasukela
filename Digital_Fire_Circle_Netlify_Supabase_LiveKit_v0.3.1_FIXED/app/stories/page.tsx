import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StoriesPage(){
 let stories:any[]=[]; let errorMessage="";
 try { const supabase=await createClient(); const {data,error}=await supabase.from("story_catalog").select("*").order("published_at",{ascending:false}); if(error) errorMessage=error.message; else stories=data??[]; } catch { errorMessage="Connect Supabase to load the library."; }
 return <section className="section"><h2>Story Library</h2><p className="muted">Choose a voice, language, place or lesson.</p>{errorMessage&&<div className="notice">{errorMessage}</div>}<div className="grid" style={{marginTop:24}}>{stories.map(s=><Link key={s.id} href={`/stories/${s.slug}`} className="card story-card"><div className="story-cover">🔥</div><div className="story-body"><span className="pill">{s.language_name}</span><span className="pill">Ages {s.age_min}–{s.age_max}</span><h3>{s.title}</h3><p className="muted">{s.summary}</p></div></Link>)}</div>{!stories.length&&!errorMessage&&<div className="notice">No stories published yet. Run the seed file or publish one from the manager portal.</div>}</section>
}
