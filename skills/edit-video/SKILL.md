---
name: edit-video
description: Edit a raw talking-head video (long-form) through transcription, silence trimming, mistake review, visual storytelling, real web-page B-roll, motion graphics, a voice-and-SFX mix with no background music, and verified HyperFrames rendering. Use for a complete edit; route a single requested operation directly to its specialist skill.
---

# Edit a video

Keep each project in `video-projects/<slug>/`, preserving the source recording.
Read the workspace guide and the project's brief or DESIGN.md. If a direction is
missing, propose a style from `style-library/registry.json` based on the footage.

Long-form defaults (unless the user asks otherwise): **real web-page B-roll** (step 6)
and **no background music** (step 9).

1. Inspect duration, streams, and source resolution with ffprobe. Copy the source
   into the project's assets or reference an explicitly provided local path.
2. Read `docs/TOOLS-AND-API-KEYS.md` before service setup. Reuse a matching word
   transcript. Otherwise use the student's chosen provider; Nate defaults to
   `node scripts/transcribe-elevenlabs.mjs <source>`. OpenAI Whisper and local
   Whisper are supported workflow alternatives after transcript normalization.
   Check available credentials or local dependencies. Explain uploads and costs
   before any service call whose authorization is still missing.
3. Read `../cut-silences/SKILL.md`. Produce an EDL and a retimed transcript, and
   render the silence pass when editing is authorized.
4. Read `../cut-mistakes/SKILL.md`. Inspect candidates in context and preserve
   intentional emphasis. Record the reviewed cuts. If no mistakes need cutting,
   carry forward the silence output. Match every transcript to its actual video.
5. Read `../video-storytelling/SKILL.md` for the visual arc and
   `../hyperframes-video-beats/SKILL.md` for overlays. Write a beat sheet with
   transcript anchors, one visual idea per beat, and deliberate callbacks.
6. **B-roll from real web pages.** For every spoken claim or noun with a public
   page (announcements, repos, docs, product sites), find the URL and **verify
   that the page shows what the speaker says**.
   - If it doesn't match, skip the beat, or fix the caption when the transcript
     was wrong. For example, "ai.com" was really "dot.com", which redirects to Grok.
   - Drop pages whose numbers contradict the speech, such as geo-localized prices.
   - Record with
     `node .claude/skills/edit-video/scripts/record-broll.mjs <project>/assets/broll/shots.json`.
     It produces one MP4 per shot plus `footage-ledger.json`. Re-record any shot it
     reports `BLOCKED`.
   - Never sign in, type into, or submit a page.
   - Check a mid-frame of each clip for cookie banners and blank loading frames.
   - Use each scene once.
   - Place B-roll two ways:
     - full-screen cutaways of 1–7s, with a clip-path wipe in and out (no
       cross-fades), a slow ~5% push, a domain label, and captions on top;
     - browser-frame shots over the explanation panel.
   - HyperFrames rules:
     - Put each `<video muted playsinline>` in a **non-timed wrapper**. Never nest
       it in a timed `.clip`.
     - Give each clip its own track index.
     - Use `data-media-start` to skip banners and loading frames.
     - Animate the wrapper, not the video.
     - Skip camera punch-ins that fall inside a cutaway.
   - Aim for 10–20% of runtime.
   - Real logos may appear only inside these recordings; designed graphics keep
     brand names as plain text.
7. Read `MOTION_PHILOSOPHY.md`, `../hyperframes/SKILL.md`, and relevant GSAP
   references before authoring. Use `../style-library/SKILL.md` to select or
   adapt a card. Localize every asset used by the composition.
8. Run preflight and HyperFrames lint from the project, plus the transcript-sync
   validator for anchored sub-compositions. Review Studio before the draft.
9. **Audio.**
   - Mix **voice + SFX only, with no background music bed**, unless the user asks
     for music.
   - Master to −16 LUFS integrated, ≤ −1 dBTP.
   - If a music bed was added by mistake, rebuild the mix without it and re-mux it
     onto the existing picture (`ffmpeg -map 0:v -map 1:a -c:v copy`); no
     re-render is needed.
   - Confirm the bed is gone: mix − voice − sfx should be ≈ 0.
10. Render a draft, inspect encoded frames and transitions, and listen across cut
   boundaries.
   - Check face framing, text legibility, black frames, and A/V sync.
   - Check the in, mid and out frames of every B-roll beat.
   - Resolve failures before the final render.
   - Follow any review approvals already provided; do not repeat approval requests
     for the same authorized action.

Deliver:
- the final MP4 path
- edit decisions and the retimed transcript
- the composition
- the B-roll footage ledger
- `VERIFY.md` describing what was checked, the B-roll duration ledger (seconds
  and % of runtime) and any remaining limitations

Copy the final MP4 (copy, not move) to the user's long-form output folder
(default `~/Desktop/Long content/`; use the folder the user names). Give it a
short title filename in the video's language.

An automated detector proposes edits; editorial judgment remains necessary.
