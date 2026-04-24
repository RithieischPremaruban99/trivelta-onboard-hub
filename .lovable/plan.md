## Goal
Use the uploaded green Surt logo (`Surt_Green.png`) wherever the Surt brand is shown in the onboarding flow — specifically when the client clicks the info button on the Surt KYC field.

## Current state
- `src/lib/logo-url.ts` has a custom override mapping `surt.com` → `/logos/surt.png`.
- `src/components/form/FieldInfo.tsx` reads that URL via `getLogoUrl()` and renders it in the "Providers" section of the info side-panel.
- The existing `public/logos/surt.png` is the old logo.

## Change
1. Overwrite `public/logos/surt.png` with the uploaded `user-uploads://Surt_Green.png` file.

That's the only change. No code edits needed because:
- The mapping already points to `/logos/surt.png`.
- The `FieldInfo` component already renders that path via `<img src={logo} />` with `object-contain`, which preserves transparency and aspect ratio.

## Verification
- Open the onboarding/prospect form, scroll to the KYC integration field, click the info icon → side-panel opens → "Surt" provider tile shows the new green logo.