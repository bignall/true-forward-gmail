// =============================================================================
// TrueForward - Core Forwarding Engine
// Composes a new email FROM the user's address with the original content
// =============================================================================

/**
 * Performs a "true forward" of a Gmail message.
 * The resulting email comes FROM the authenticated user's address,
 * contains the original body and all attachments, and notes the original sender.
 *
 * @param {string} messageId  - Gmail message ID to forward
 * @param {string} toAddress  - Destination email address
 * @param {string} [subject]  - Optional override subject; defaults to "Fwd: <original subject>"
 * @returns {{ success: boolean, error?: string }}
 */
function trueForwardMessage(messageId, toAddress, subject) {
  try {
    const message = GmailApp.getMessageById(messageId);
    if (!message) throw new Error('Message not found: ' + messageId);

    const originalFrom    = message.getFrom();
    const originalDate    = message.getDate();
    const originalSubject = message.getSubject();
    const originalTo      = message.getTo();

    const forwardSubject  = subject || buildSubject(originalSubject);

    // ── Body ────────────────────────────────────────────────────────────────
    const rawHtml  = message.getBody();            // HTML body
    const rawPlain = message.getPlainBody();        // plain-text fallback

    const forwardHeader = buildForwardHeader({
      from:    originalFrom,
      date:    originalDate,
      subject: originalSubject,
      to:      originalTo
    });

    const htmlBody  = forwardHeader.html  + (rawHtml  || '<pre>' + escapeHtml(rawPlain) + '</pre>');
    const plainBody = forwardHeader.plain + (rawPlain || '');

    // ── Attachments ─────────────────────────────────────────────────────────
    const attachments = message.getAttachments({ includeInlineImages: true, includeAttachments: true });

    // ── Send ─────────────────────────────────────────────────────────────────
    // GmailApp.sendEmail supports htmlBody and attachments natively
    const options = {
      htmlBody:    htmlBody,
      attachments: attachments,
      name:        getUserDisplayName()
    };

    GmailApp.sendEmail(toAddress, forwardSubject, plainBody, options);

    // Log the forward for the audit trail
    logForward({ messageId, toAddress, originalFrom, originalSubject, forwardSubject });

    return { success: true };

  } catch (e) {
    console.error('trueForwardMessage error:', e.message, e.stack);
    return { success: false, error: e.message };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildSubject(originalSubject) {
  if (!originalSubject) return 'Fwd: (no subject)';
  // Avoid double-prefixing
  if (/^fwd?:/i.test(originalSubject.trim())) return originalSubject;
  return 'Fwd: ' + originalSubject;
}

function buildForwardHeader({ from, date, subject, to }) {
  const dateStr = date ? date.toLocaleString() : 'unknown';

  const plain = [
    '---------- Forwarded message ---------',
    'From: '    + from,
    'Date: '    + dateStr,
    'Subject: ' + subject,
    'To: '      + to,
    '',
    ''
  ].join('\n');

  const html = `
<div style="border-left:2px solid #ccc; padding-left:12px; margin:16px 0; color:#555; font-family:sans-serif; font-size:13px;">
  <p style="margin:0 0 4px 0;"><strong>---------- Forwarded message ---------</strong></p>
  <p style="margin:0 0 2px 0;"><strong>From:</strong> ${escapeHtml(from)}</p>
  <p style="margin:0 0 2px 0;"><strong>Date:</strong> ${escapeHtml(dateStr)}</p>
  <p style="margin:0 0 2px 0;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
  <p style="margin:0 0 8px 0;"><strong>To:</strong> ${escapeHtml(to)}</p>
</div>
`;

  return { plain, html };
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getUserDisplayName() {
  try {
    const email = Session.getActiveUser().getEmail();
    if (!email) return ''; // empty in trigger context
    // Capitalize the local part as a reasonable fallback
    const local = email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  } catch (_) {
    return '';
  }
}

/**
 * Append a record to a Sheet named "ForwardLog" for auditing.
 * Creates the sheet if it doesn't exist.
 */
function logForward({ messageId, toAddress, originalFrom, originalSubject, forwardSubject }) {
  try {
    const ss = getOrCreateLogSheet();
    ss.appendRow([
      new Date(),
      messageId,
      originalFrom,
      originalSubject,
      toAddress,
      forwardSubject
    ]);
  } catch (e) {
    // Logging failure should never break the forward itself
    console.warn('logForward failed:', e.message);
  }
}

function getOrCreateLogSheet() {
  const SHEET_NAME = 'ForwardLog';
  let ss;
  try {
    ss = SpreadsheetApp.openById(getConfig('logSheetId'));
  } catch (_) {
    // No sheet configured or invalid — create one
    const newSS = SpreadsheetApp.create('TrueForward Log');
    saveConfig('logSheetId', newSS.getId());
    ss = newSS;
  }

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Message ID', 'Original From', 'Original Subject', 'Forwarded To', 'Forward Subject']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
