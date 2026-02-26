# True Forward — Deployment Checklist

Use this when setting up for the first time or publishing.

## Local / Personal Test Deployment

- [ ] Go to https://script.google.com → New Project → name it "True Forward"
- [ ] Enable manifest editor: Project Settings → ☑ Show "appsscript.json" in editor
- [ ] Replace default `appsscript.json` with the one from this repo
- [ ] Create 5 script files and paste in contents from `src/*.gs`:
  - [ ] `ForwardEngine.gs`
  - [ ] `Config.gs`
  - [ ] `LabelRules.gs`
  - [ ] `GmailAddon.gs`
  - [ ] `SettingsCard.gs`
- [ ] Save all files
- [ ] Deploy → Test deployments → Gmail Add-on → Install
- [ ] Open Gmail, find the add-on panel on the right sidebar
- [ ] Open an email and click a forward button to test
- [ ] Authorize the OAuth scopes when prompted

## Publishing to Google Workspace Marketplace

- [ ] Create a Google Cloud Project (console.cloud.google.com)
- [ ] Link it to your Apps Script project (Project Settings → Google Cloud Platform project)
- [ ] Configure OAuth consent screen:
  - [ ] App name: True Forward
  - [ ] User support email
  - [ ] Scopes: Gmail read, send, labels, modify
  - [ ] Add test users while in testing mode
- [ ] Create a Deploy → New deployment (type: Add-on)
- [ ] Go to Google Workspace Marketplace SDK → Configure store listing
  - [ ] Screenshots of the sidebar
  - [ ] Description (use README as starting point)
  - [ ] Privacy policy URL (required — host a simple one)
- [ ] Submit for review (takes ~1-4 weeks for Google to review)

## Notes for Publishing

- You need a **privacy policy** URL. Even a simple one-pager hosted on GitHub Pages works.
- The app will be in "Testing" mode for up to 100 users before review.
- During testing, users see an "unverified app" warning — this is normal.
- After Google approval, the warning goes away.
