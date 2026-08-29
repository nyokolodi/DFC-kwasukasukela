"use client";
import "@livekit/components-styles";
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from "@livekit/components-react";
import { useEffect, useState } from "react";

export default function CircleRoom({circleId}:{circleId:string}){
 const [token,setToken]=useState<string>(); const [error,setError]=useState("");
 useEffect(()=>{fetch(`/api/livekit-token?circleId=${encodeURIComponent(circleId)}`).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error);setToken(j.token)}).catch(e=>setError(e.message))},[circleId]);
 if(error)return <div className="notice">{error}</div>; if(!token)return <div className="notice">Preparing the circle…</div>;
 return <LiveKitRoom token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} connect audio={false} video={false}><RoomAudioRenderer/><StartAudio label="Tap to hear the fire circle"/></LiveKitRoom>
}
