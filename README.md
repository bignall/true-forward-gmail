# True Forward — Gmail Add-on

A Gmail Add-on that lets you **truly forward** emails **from your own address**, including all attachments. Unlike Gmail's built-in forwarding (which resends the original), True Forward composes a new email from your address with the original content embedded.

## Why this exists

Services like **QuickBooks** (and many ticketing systems, expense trackers, and CRMs) identify accounts by the **sender's email address**. Gmail's native forward sends the original email as-is, so it arrives from the original sender — not you — and the service can't match it to your account.

True Forward solves this by composing a brand new email *from your address* with:
- The original email body (HTML, with fallback to plain text)
- A standard forwarded-message header (original From, Date, Subject, To)
- All attachments and inline images

## Features

| Feature | Description |
|---|---|
| **One-click forward** | Click a preset button in the Gmail sidebar to forward instantly |
| **Custom address** | Type any address in the sidebar without saving it as a preset |
| **Preset destinations** | Save frequently used addresses (e.g. `receipts@quickbooks.com`) |
| **Label-based auto-forward** | Apply a Gmail label → email gets forwarded automatically every hour |
| **Per-rule destinations** | Each label rule can forward to a different address |
| **Pause/resume rules** | Disable a rule without deleting it |
| **Audit log** | Every forward is logged to a Google Sheet |
| **Designed for low volume** | A few dozen emails/day; not for bulk sending |

---

## Setup Instructions

### 1. Create the Apps Script project

1. Go to [script.google.com](https://script.google.com) and click **New project**
2. Name it `True Forward`

### 2. Add the files

Copy each `.gs` file from the `src/` folder into your Apps Script project:

| File | Purpose |
|---|---|
| `ForwardEngine.gs` | Core send logic, attachment handling, audit log |
| `Config.gs` | Preset & rule storage, trigger management |
| `LabelRules.gs` | Background auto-forward processor |
| `GmailAddon.gs` | Gmail sidebar UI |
| `SettingsCard.gs` | Settings page UI |

Replace the contents of `appsscript.json` with the provided `appsscript.json` (enable the manifest editor under **Project Settings → Show appsscript.json**).

### 3. Deploy as an Add-on

1. Click **Deploy → Test deployments**
2. Choose **Gmail Add-on** as the type
3. Click **Install** to install it in your Gmail

For production/sharing:
1. **Deploy → New deployment**
2. Type: **Add-on**
3. Fill in the OAuth consent screen (Google Cloud Console)
4. Submit for review if you want to publish on Google Workspace Marketplace

### 4. First use

Open any email in Gmail. You'll see a **True Forward** panel in the right sidebar (the add-on icon looks like a forward arrow).

- **QuickBooks Receipts** is pre-configured as your first preset
- Go to **Settings** (⚙ icon in the sidebar) to add more presets or set up label rules

---

## How Auto-Forwarding Works

1. In Gmail, create a label — e.g. `TrueForward/receipts`
2. In True Forward Settings, add a rule: label `TrueForward/receipts` → `receipts@quickbooks.com`
3. Gmail's built-in filters can now auto-apply that label to matching emails
4. Every hour, True Forward checks for labeled emails, forwards them, and moves them to `TrueForward/receipts/sent`

> **Tip:** Combine with Gmail Filters (Settings → Filters and Blocked Addresses) to automatically label emails from specific senders or with specific subjects.

---

## Architecture

```
GmailAddon.gs         ← Sidebar UI, button click handlers
SettingsCard.gs       ← Settings page UI and handlers
ForwardEngine.gs      ← Core: reads message, sends new email, logs
Config.gs             ← PropertiesService wrapper for presets/rules/triggers
LabelRules.gs         ← Time-trigger processor for auto-forward rules
appsscript.json       ← Manifest: scopes, add-on registration
```

All configuration is stored in **PropertiesService** (per-user, persists across sessions, private to each user).

---

## Quotas & Limits

This add-on uses the standard Gmail send quota:
- **Free Gmail:** ~500 emails/day
- **Google Workspace:** ~1,500–2,000 emails/day

True Forward is designed for low-volume use (a few emails per day). If you need to forward hundreds of emails, consider using a dedicated transactional email service.

---

## Privacy

- All data (presets, rules) is stored in your own Google account via PropertiesService
- The audit log is written to a Google Sheet **in your own Drive**
- No data is sent to any external server
- The add-on only requests the minimum Gmail scopes needed

---

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Some ideas for future enhancements:
- Configurable check interval (currently 1 hour; add-on minimum)
- Support for forwarding to multiple addresses from one rule
- A "forward and label" option (keep original label, add a done marker)
- Per-preset custom subject prefix

---

## Links

- **Website:** [rbcreativesolutions.net](https://rbcreativesolutions.net)
- **Repository:** [github.com/bignall/true-forward-gmail](https://github.com/bignall/true-forward-gmail)
- **Issues:** [Report a bug or request a feature](https://github.com/bignall/true-forward-gmail/issues/new/choose)

---

## License

GPL v2 License. See [LICENSE](LICENSE).

Copyright (C) 2025 RB Creative Solutions LLC
