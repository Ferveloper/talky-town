# Phase 8 avatar provenance

- Luna: copied from .design/docs/design/stitch/assets/avatars/avatar-luna-owl-transparent-style.png to apps/web/public/avatars/luna.png. The source is an existing 1024×1024 RGB illustration with an opaque white background, despite its filename. CSS uses contained images and a white card; the landing artwork uses multiply blending on a light backdrop. It is not advertised as an alpha cutout.
- Max: new dedicated fox explorer artwork generated with the imagegen skill's built-in image tool on 2026-10-11. Requested a friendly rounded storybook character, small yellow satchel, blue scarf, generous padding and true transparent PNG. No person or Leo asset is relabeled as Max.
- Max original output: exec-f8fad39c-45e6-4731-94a6-ba77a077fdad.png, copied into apps/web/public/avatars/max.png. Visual inspection confirmed fox identity, friendly expression, complete ears/tail/paws and no text.
- Verification: node scripts/verify-avatar.mjs checks PNG RGBA mode and both transparent/visible pixels. Dimensions 1254×1254. SHA-256 46f68ac086e41435958dabbd7b0d409ba242c37a6486b0749990479865bffddf.
- Fonts: local @fontsource/quicksand 500/600/700, package license retained in dependencies. Icons: existing lucide-react. Mission pictograms are platform emoji, so their appearance varies by OS. No remote font, icon or image request is required by the app.

Stitch screens are a visual reference. Reusable React components and CSS implement the approved Spanish UI and real API boundaries; generated HTML is not copied into production.
