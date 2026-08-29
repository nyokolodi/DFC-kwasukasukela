import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StoryPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const supabase=await createClient(); const {data:s}=await supabase.from("story_catalog").select("*").eq("slug",slug).single(); if(!s) notFound();
 let signedUrl:string|null=null; if(s.audio_path){const {data}=await supabase.storage.from("story-audio-private").createSignedUrl(s.audio_path,600); signedUrl=data?.signedUrl??null;}
 return <section className="section"><span className="pill">{s.language_name}</span><span className="pill">{s.culture_name??"South Africa"}</span><h2>{s.title}</h2><p>{s.summary}</p><p className="muted">For ages {s.age_min}–{s.age_max}{s.duration_seconds?` · ${Math.ceil(s.duration_seconds/60)} minutes`:""}</p>{signedUrl?<audio className="player" controls preload="metadata" src={signedUrl}/>:<div className="notice">Audio will appear after an approved recording is uploaded.</div>}</section>
}
