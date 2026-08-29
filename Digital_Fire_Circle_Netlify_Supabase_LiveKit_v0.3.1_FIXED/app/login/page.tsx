"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage(){
 const [email,setEmail]=useState(""); const [message,setMessage]=useState("");
 async function submit(e:FormEvent){e.preventDefault();setMessage("Sending link…"); const supabase=createClient(); const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:`${location.origin}/auth/callback`}}); setMessage(error?error.message:"Check your email for your secure sign-in link.");}
 return <section className="section"><h2>Sign in to the circle</h2><p className="muted">No password required.</p><form className="form" onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="button">Send sign-in link</button>{message&&<div className="notice">{message}</div>}</form></section>
}
