# Farmer-First Upgrade (v2)

## 1. Why v1 was not useful enough
v1 was a record-keeping dashboard. It needed the farmer to (a) read English, (b) type numeric sensor-style readings that a farmer
without sensors does not have, and (c) interpret percentages. It only answered "irrigation required: yes/no".

## 2. What v2 does for the farmer
| Feature | How it works | Where |
| --- | --- | --- |
| **My Farm home** | One card per field, colour = urgency, icon + one-sentence advice per issue | `farmer-home.html`, `GET /api/advisory` |
| **Quick Soil Check (no typing)** | Farmer squeezes soil: Dry -> 20 %, Moist -> 45 %, Wet -> 85 % moisture; saved as a normal reading, so alerts/history/irrigation rules keep working | `quick-check.html`, `POST /api/monitoring/quick` |
| **Action advice** | Rule engine: irrigate now (+ litres estimate), water soon, too wet (crop-specific), heat stress, cold risk, fungus risk, harvest in <=10 days, no/old reading | `AdvisoryEngine.java` |
| **Weather aware** | Open-Meteo forecast for the field's town; rain >= 60 % or >= 5 mm -> "wait, do not water now"; also supplies temperature/humidity automatically | `weather.js`, `advisor.js` |
| **Voice output** | Browser SpeechSynthesis reads advice in English/Hindi/Telugu/Tamil/Kannada; "Read this page" on every farmer page | `voice.js` |
| **Voice input / assistant** | Big "Ask by voice" button; keyword intents: farm status, water, rain, warnings, check soil, what to grow, history, help. Typed fallback for browsers without speech recognition | `assistant.js` |
| **Speak to fill forms** | A mic button is added to every text/number box (names, areas, readings) and to login/register | `voice.js`, `shell.js` |
| **Mobile-number login** | Login accepts phone or email; sign-up needs only name + phone + password | `AuthService.java` |
| **Safer sign-up** | Public registration can no longer create ADMINISTRATOR accounts | `AuthService.register` |

## 3. Water estimate (documented heuristic - not a measured value)
`target = max(crop minimum moisture + 10)` clamped to 40-50 %; `deficit = target - current`;
`1 % deficit ~ 2.5 mm` over a 25 cm root zone; `1 mm over 1 acre = 4046.86 L`. Shown as "about" and rounded to 1000 L.
Rice, maize, wheat, tomato and groundnut use the existing `crop_requirements` table, so advice stays consistent with the recommendation module.

## 4. Architecture (unchanged layering)
Controller (`AdvisoryController`, `MonitoringController`) -> Service (`AdvisoryService`, `MonitoringService.addQuickCheck`) ->
pure rule class (`AdvisoryEngine`, no Spring, unit-tested) -> Repository. The API returns advice as **codes + parameters**
(`IRRIGATE_NOW {litres, depthCm}`), and `i18n.js` turns them into sentences in the chosen language - one rule set, five languages, same text for screen and speech.

## 5. API additions
- `GET /api/advisory` and `GET /api/advisory/{fieldId}` - advice per field
- `POST /api/monitoring/quick` `{fieldId, soilFeel: DRY|MOIST|WET, temperature?, humidity?}`
- `POST /api/auth/login` - field `email` now accepts a mobile number too
- `POST /api/auth/register` - `email` optional, `role` ignored (always FARMER)

## 6. Honest limitations / future work
- Voice quality depends on the phone: a Telugu/Tamil/Kannada text-to-speech voice must be installed (Android: Settings > Text-to-speech). The app warns when it is missing.
- Speech recognition needs internet and works in Chrome/Edge (not Firefox). Spoken phone numbers are best-effort; the keyboard always works.
- Translations were written for this project; have a native speaker review them before field use.
- Soil "feel" is an approximation of moisture; a real sensor can still POST to `/api/monitoring`.
- Not built (need paid/third-party accounts): SMS/WhatsApp alerts, live mandi prices, pest photo diagnosis, offline PWA mode.

## 7. How to test
- Backend rules: `cd backend && ./mvnw test` (includes `AdvisoryEngineTest`, no database needed for that class).
- Manual: run the app, log in with `9123456789` / `farmer123`, switch language, tap **Listen**, tap **Ask by voice** and say "do I need water", open **Check Soil**.
