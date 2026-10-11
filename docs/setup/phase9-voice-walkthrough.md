# Phase 9 Level 1 — Browser voice evaluator walkthrough

Use fictional profiles and adult-spoken fictional utterances. Mock AI needs no paid keys. This shared demo does not provide privacy between visitors and does not certify child-audio processing.

## Supported path

Use an available current desktop Chrome on Windows over localhost (or HTTPS). Edge/Safari recognition service availability varies; constructor support alone is not a promise of working recognition. Firefox without SpeechRecognition keeps the complete text path. Record actual browser/OS versions, processing mode and observed capabilities in the implementation report.

1. Start PostgreSQL and follow local-development setup. Run `pnpm dev` and open http://localhost:3000.
2. Enter the demo and create an alias such as `VozEstrella`; choose Luna or Max.
3. Open a free conversation. The default mode is local-only and the language is English (US). The microphone is enabled only after a read-only check proves on-device support and an installed pack. No pack is downloaded.
4. If local recognition is unavailable, use the in-app **Adultos** link. Read the voice-processing explanation and explicitly choose **Permitir servicio del navegador**. Audio may leave the device for browser-vendor processing. This choice is not verified legal parental consent.
5. Return using the in-app **Perfiles** link and open the fictional profile/conversation. A full reload resets the choice; use internal links to preserve it during this demo visit.
6. Press **Usar micrófono**, allow browser permission if requested and say “I like dogs.” No getUserMedia permission probe is performed. The avatar becomes listening only when recognition starts. Capture stops after at most 30 seconds.
7. Press **Parar y revisar**. Review/edit the final transcript, then press **Confirmar y enviar**. No recognition result submits automatically. Verify a single accepted child turn and ordinary server XP. To test no submission, capture another phrase and choose **Descartar voz** or **Descartar borrador**.
8. Press **Escuchar** on an avatar reply. Confirm audible English, speaking state during actual playback, **Detener voz** and **Volver a escuchar**. Start the microphone during playback and verify immediate interruption. Text always stays readable.
9. Select **Español** before a new capture. Using a fictional test scenario, confirm `nadie me quiere` to exercise deterministic Spanish support: no child bubble, no XP, no autoplay. If a local Spanish voice exists, manually play and confirm Spanish; otherwise verify the explicit readable-text fallback. Do not substitute an English voice.
10. Navigate away, hide the tab, end a session and log out while speech is active. Verify capture/playback stop. Re-entering or reloading never retains browser-service approval. Transcripts that were not submitted are gone.
11. In an unsupported browser, type `dog`, send it and verify the ordinary response/XP. Record the actual browser used; disabling APIs in tests is simulated evidence, not a real-device claim.

## Retention and recovery

Only reviewed, confirmed, submitted text becomes an ordinary conversation message. Accepted text can persist on the server; unresolved confirmed text can persist in the original adult/profile/session sessionStorage record for at most 15 minutes. Navigation/reload offers explicit retry with identical UUID/body/mode/time, never automatic replay. Expiry removes text and retains the existing non-text operation marker. TalkyTown stores no audio, interim draft or complete browser transcript history. Timers cannot run in suspended tabs; expiry is checked on resume.

## Limitations

The app uses voices exposed by the browser's SpeechSynthesis API, not TalkyTown ML models. A voice present elsewhere in Windows is not proof that the browser exposes it. If no local English voice is listed, English replies stay readable; changing microphone language does not translate avatar replies. Exact reviewed wellbeing responses are Spanish and can use an available Spanish voice independently of English.

An adult who wants to add a Windows TTS voice can use **Speech settings → Manage voices → Add voices**, choose English (United States), and then restart the browser and verify its actual voice list. This is an optional, explicit operating-system download, never initiated by TalkyTown and separate from STT language packs. Do not assume Narrator natural voices are exposed through Web Speech. See [Microsoft's supported voices and installation instructions](https://support.microsoft.com/en-us/accessibility/windows/narrator/appendix-a-supported-languages-and-voices). No system settings, voice packs or registry entries were changed during this implementation.

Recognition can normalize grammar and miss words or disclosures; this does not assess pronunciation. English and Spanish support are independent. Browser-service recognition may fail because of permissions, policy, network, service or language availability. Local voices depend on OS installation and may be shared by both avatars. Generative/native speech can mispronounce safe text. No optional models, audio upload endpoints, cloud SDKs or real-time speech-to-speech architecture are part of Level 1.

## Manual evidence to return

Record date, OS/browser version, local-only capability result, chosen processing mode, microphone permission/result, reviewed fictional phrase, audible English/Spanish or unavailable-voice fallback, Stop/Replay/interruption, hiding/navigation/logout and unsupported-browser typing. Mark any unperformed check explicitly. Automated API fakes do not replace this evidence.
