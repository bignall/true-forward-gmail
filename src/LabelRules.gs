// =============================================================================
// TrueForward - Automatic Label Rule Processor
// Runs every 5 minutes via a time-based trigger.
// For each enabled rule: finds emails with that label, forwards them,
// then moves them to a "sent" sub-label.
// =============================================================================

// Label naming convention:
//   User creates:            "TrueForward/receipts"  (the trigger label)
//   We auto-create:          "TrueForward/receipts/sent"  (processed archive)
// The user applies the parent label to emails they want auto-forwarded.
// We track processed emails by adding the /sent child label and removing the parent.

const PROCESSED_SUFFIX = '/sent';

/**
 * Main entry point called by the time-based trigger.
 * Uses LockService to prevent overlapping runs.
 */
function processLabelRules() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    console.log('processLabelRules: another instance is still running, skipping');
    return;
  }

  try {
    const rules = getLabelRules().filter(r => r.enabled);
    if (rules.length === 0) return;

    let totalProcessed = 0;
    let totalFailed = 0;

    rules.forEach(rule => {
      try {
        const result = processRule(rule);
        totalProcessed += result.forwarded;
        totalFailed += result.failed;
      } catch (e) {
        console.error(`processLabelRules: error on rule "${rule.labelName}":`, e.message);
      }
    });

    if (totalProcessed > 0 || totalFailed > 0) {
      console.log(`processLabelRules: forwarded ${totalProcessed}, failed ${totalFailed}`);
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Process a single label rule. Returns counts of forwarded and failed messages.
 */
function processRule(rule) {
  const label = GmailApp.getUserLabelByName(rule.labelName);
  if (!label) {
    console.warn(`processRule: label not found: ${rule.labelName}`);
    return { forwarded: 0, failed: 0 };
  }

  // Get or create the "sent" archive label
  const sentLabelName = rule.labelName + PROCESSED_SUFFIX;
  let sentLabel = GmailApp.getUserLabelByName(sentLabelName);
  if (!sentLabel) {
    sentLabel = GmailApp.createLabel(sentLabelName);
  }

  // Fetch threads with this label (up to 20 at a time to respect quotas)
  const threads = label.getThreads(0, 20);
  let totalForwarded = 0;
  let totalFailed = 0;

  threads.forEach(thread => {
    let threadForwarded = 0;
    let threadFailed = 0;

    thread.getMessages().forEach(msg => {
      const result = trueForwardMessage(msg.getId(), rule.address);
      if (result.success) {
        threadForwarded++;
      } else {
        threadFailed++;
        console.error(`processRule: failed to forward msg ${msg.getId()}: ${result.error}`);
      }
    });

    // Only swap labels when ALL messages in the thread succeeded
    if (threadFailed === 0 && threadForwarded > 0) {
      thread.addLabel(sentLabel);
      thread.removeLabel(label);
    } else if (threadFailed > 0) {
      console.warn(`processRule: ${threadFailed} message(s) failed in thread, keeping label for retry`);
    }

    totalForwarded += threadForwarded;
    totalFailed += threadFailed;
  });

  return { forwarded: totalForwarded, failed: totalFailed };
}

/**
 * Manually trigger processing of all rules right now.
 * Called from the Settings UI "Run Now" button.
 * Returns actual success/failure counts.
 */
function runRulesNow() {
  const rules = getLabelRules().filter(r => r.enabled);
  if (rules.length === 0) {
    return { success: true, forwarded: 0, failed: 0, message: 'No active rules to run.' };
  }

  let totalForwarded = 0;
  let totalFailed = 0;

  rules.forEach(rule => {
    try {
      const result = processRule(rule);
      totalForwarded += result.forwarded;
      totalFailed += result.failed;
    } catch (e) {
      console.error(`runRulesNow: error on rule "${rule.labelName}":`, e.message);
      totalFailed++;
    }
  });

  return {
    success: totalFailed === 0,
    forwarded: totalForwarded,
    failed: totalFailed,
    message: totalFailed > 0
      ? `Forwarded ${totalForwarded}, failed ${totalFailed}. Check logs for details.`
      : `Forwarded ${totalForwarded} email(s).`
  };
}

/**
 * Returns a list of all user Gmail labels (for the label picker in Settings UI).
 */
function getGmailLabels() {
  return GmailApp.getUserLabels().map(l => l.getName()).sort();
}
