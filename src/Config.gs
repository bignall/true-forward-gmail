// =============================================================================
// TrueForward - Configuration Management
// All config is stored in PropertiesService (per-user, persistent)
// =============================================================================

const CONFIG_KEY_PREFIX   = 'tf_';
const PRESETS_KEY         = 'tf_presets';      // JSON array of { name, address }
const LABEL_RULES_KEY     = 'tf_label_rules';  // JSON array of { labelName, address, enabled }
const TRIGGER_ID_KEY      = 'tf_triggerId';

// ── Generic get/set ──────────────────────────────────────────────────────────

function getConfig(key) {
  return PropertiesService.getUserProperties().getProperty(CONFIG_KEY_PREFIX + key);
}

function saveConfig(key, value) {
  PropertiesService.getUserProperties().setProperty(CONFIG_KEY_PREFIX + key, value);
}

// ── Presets ──────────────────────────────────────────────────────────────────

/**
 * Returns array of { name: string, address: string }
 * Default includes the QuickBooks receipts address as a convenience.
 */
function getPresets() {
  const raw = PropertiesService.getUserProperties().getProperty(PRESETS_KEY);
  if (!raw) {
    return [
      { name: 'QuickBooks Receipts', address: 'receipts@quickbooks.com' }
    ];
  }
  try {
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
}

function savePresets(presets) {
  // Validate
  if (!Array.isArray(presets)) throw new Error('Presets must be an array');
  presets.forEach((p, i) => {
    if (!p.name || !p.address) throw new Error(`Preset ${i} missing name or address`);
    if (!isValidEmail(p.address)) throw new Error(`Preset ${i} has invalid email: ${p.address}`);
  });
  PropertiesService.getUserProperties().setProperty(PRESETS_KEY, JSON.stringify(presets));
}

function addPreset(name, address) {
  if (!isValidEmail(address)) throw new Error('Invalid email address: ' + address);
  const presets = getPresets();
  // Prevent duplicates by address
  if (presets.some(p => p.address.toLowerCase() === address.toLowerCase())) {
    throw new Error('A preset with that address already exists');
  }
  presets.push({ name: name.trim(), address: address.trim().toLowerCase() });
  savePresets(presets);
  return presets;
}

function removePreset(address) {
  const presets = getPresets().filter(p => p.address.toLowerCase() !== address.toLowerCase());
  savePresets(presets);
  return presets;
}

// ── Label Rules ──────────────────────────────────────────────────────────────

/**
 * Returns array of { labelName: string, address: string, enabled: boolean }
 */
function getLabelRules() {
  const raw = PropertiesService.getUserProperties().getProperty(LABEL_RULES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
}

function saveLabelRules(rules) {
  if (!Array.isArray(rules)) throw new Error('Rules must be an array');
  PropertiesService.getUserProperties().setProperty(LABEL_RULES_KEY, JSON.stringify(rules));
}

function addLabelRule(labelName, address) {
  if (!isValidEmail(address)) throw new Error('Invalid email address: ' + address);
  if (!labelName || !labelName.trim()) throw new Error('Label name is required');

  const rules = getLabelRules();
  if (rules.some(r => r.labelName.toLowerCase() === labelName.toLowerCase())) {
    throw new Error('A rule for that label already exists');
  }

  // Verify the label exists in Gmail
  const label = GmailApp.getUserLabelByName(labelName);
  if (!label) throw new Error(`Label "${labelName}" not found in your Gmail. Create it first.`);

  rules.push({ labelName: labelName.trim(), address: address.trim().toLowerCase(), enabled: true });
  saveLabelRules(rules);

  // Ensure the background trigger is running
  ensureTimeTrigger();

  return rules;
}

function removeLabelRule(labelName) {
  const rules = getLabelRules().filter(r => r.labelName.toLowerCase() !== labelName.toLowerCase());
  saveLabelRules(rules);
  if (rules.length === 0) removeTimeTrigger(); // Clean up trigger if no rules left
  return rules;
}

function toggleLabelRule(labelName, enabled) {
  const rules = getLabelRules().map(r =>
    r.labelName.toLowerCase() === labelName.toLowerCase() ? { ...r, enabled } : r
  );
  saveLabelRules(rules);
  return rules;
}

// ── Trigger Management ───────────────────────────────────────────────────────

/**
 * Creates a time-based trigger (every 5 minutes) if one doesn't exist.
 */
function ensureTimeTrigger() {
  const existingId = PropertiesService.getUserProperties().getProperty(TRIGGER_ID_KEY);
  if (existingId) {
    // Verify the stored trigger still exists
    const allTriggers = ScriptApp.getProjectTriggers();
    if (allTriggers.some(t => t.getUniqueId() === existingId)) return; // already running
  }

  const trigger = ScriptApp.newTrigger('processLabelRules')
    .timeBased()
    .everyMinutes(5)
    .create();

  PropertiesService.getUserProperties().setProperty(TRIGGER_ID_KEY, trigger.getUniqueId());
}

function removeTimeTrigger() {
  const existingId = PropertiesService.getUserProperties().getProperty(TRIGGER_ID_KEY);
  if (!existingId) return;

  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getUniqueId() === existingId) ScriptApp.deleteTrigger(t);
  });
  PropertiesService.getUserProperties().deleteProperty(TRIGGER_ID_KEY);
}

// ── Utilities ────────────────────────────────────────────────────────────────

function isValidEmail(address) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
}

function getUserEmail() {
  try {
    return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  } catch (_) {
    return '';
  }
}
