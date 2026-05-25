# FocusGuard — Chrome Extension MVP

A complete Manifest V3 Chrome extension for blocking distracting websites, tracking screen time locally, running Pomodoro/deep-work mode, parent controls, and AI-style weekly focus coaching.

## Features
- One-click blocking for YouTube, Instagram, Reddit, X, Facebook, Netflix
- Custom block list
- Local daily screen-time dashboard
- Pomodoro / deep work focus mode
- Motivational blocked page
- Parent controls MVP: PIN, child mode toggle, daily limit setting
- AI-style weekly focus score/report generated locally
- No external server required

## Install locally
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `focusguard-extension` folder.
5. Pin FocusGuard from the extensions menu.

## Production upgrade ideas
- Add cloud accounts for parent-child sync.
- Replace local AI report with OpenAI/Claude/Gemini API via secure backend.
- Add schedules: block sites from 9 AM–12 PM and 6 PM–9 PM.
- Add encrypted PIN reset and tamper protection.
- Add Stripe/Razorpay subscriptions for Pro plan.

## Suggested pricing
- Free: blocking, Pomodoro, today dashboard
- Pro $4.99/month: AI reports, parent dashboard, schedules, multi-device sync
