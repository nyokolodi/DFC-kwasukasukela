import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,content-type,x-client-info,apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const base = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!base || !anon || !service) {
      throw new Error("Supabase environment is not configured");
    }

    const auth = req.headers.get("Authorization");
    const admin = createClient(base, service);
    let uid: string | null = null;

    if (auth) {
      const userClient = createClient(base, anon, {
        global: { headers: { Authorization: auth } },
      });
      const {
        data: { user },
      } = await userClient.auth.getUser();
      uid = user?.id ?? null;
    }

    const { storyId } = await req.json();

    const { data: story } = await admin
      .from("stories")
      .select("id,access_level,status")
      .eq("id", storyId)
      .single();

    if (!story || story.status !== "published") {
      throw new Error("Story unavailable");
    }

    let allowed = story.access_level === "public";

    if (!allowed && uid) {
      const { data: entitlements } = await admin
        .from("content_entitlements")
        .select("id")
        .eq("user_id", uid)
        .eq("active", true)
        .or("ends_at.is.null,ends_at.gt." + new Date().toISOString())
        .or("story_id.is.null,story_id.eq." + storyId)
        .limit(1);

      allowed = !!entitlements?.length;
    }

    if (!allowed) {
      throw new Error("Access required");
    }

    const { data: asset } = await admin
      .from("story_audio_assets")
      .select("storage_path")
      .eq("story_id", storyId)
      .eq("variant", "standard")
      .eq("approved", true)
      .maybeSingle();

    if (!asset) {
      throw new Error("Audio not available");
    }

    const { data: signed, error } = await admin.storage
      .from("story-audio-private")
      .createSignedUrl(asset.storage_path, 900);

    if (error) throw error;

    return new Response(JSON.stringify({ url: signed.signedUrl }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unable to create stream URL",
      }),
      {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }
});
