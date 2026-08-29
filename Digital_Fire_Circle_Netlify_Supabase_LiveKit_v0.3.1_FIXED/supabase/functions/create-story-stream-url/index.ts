import { createClient } from "supabase";

Deno.serve(async (req) => {
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const storyId = body?.storyId;
    if (!storyId) return Response.json({ error: "storyId is required" }, { status: 400 });

    const { data: story, error: storyError } = await sb
      .from("stories")
      .select("id,status,access_level")
      .eq("id", storyId)
      .eq("status", "published")
      .single();

    if (storyError || !story) {
      return Response.json({ error: "Story not found" }, { status: 404 });
    }

    // Phase 1: only public stories are streamable.
    // Subscriber/school/restricted entitlement checks will be added with the
    // billing + entitlement tables before those access levels are published.
    if (story.access_level !== "public") {
      return Response.json({ error: "This story requires an entitlement" }, { status: 403 });
    }

    const { data: audio, error: audioError } = await sb
      .from("story_audio_assets")
      .select("storage_path")
      .eq("story_id", storyId)
      .eq("variant", "standard")
      .eq("approved", true)
      .single();

    if (audioError || !audio) {
      return Response.json({ error: "Audio not found" }, { status: 404 });
    }

    const { data, error } = await sb
      .storage
      .from("story-audio-private")
      .createSignedUrl(audio.storage_path, 600);

    if (error || !data?.signedUrl) {
      return Response.json({ error: error?.message ?? "Unable to create stream URL" }, { status: 500 });
    }

    return Response.json({ url: data.signedUrl, expiresIn: 600 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
});
