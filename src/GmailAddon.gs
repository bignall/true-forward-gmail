// =============================================================================
// TrueForward - Gmail Add-on UI (Contextual Card)
// Shows when user has an email open. Displays forward buttons for each preset.
// =============================================================================

/**
 * Entry point for the Gmail contextual trigger.
 * Builds the sidebar card shown when viewing a message.
 */
function onGmailMessage(e) {
  // Opportunistically process label rules if it's been 15+ min since last run
  maybeProcessRules();

  const messageId = e.gmail && e.gmail.messageId;
  const accessToken = e.gmail && e.gmail.accessToken;
  const presets = getPresets();

  const card = CardService.newCardBuilder()
    .setName('trueForwardCard')
    .setHeader(
      CardService.newCardHeader()
        .setTitle('True Forward')
        .setSubtitle('Send from your address')
        .setImageUrl('https://www.gstatic.com/images/icons/material/system/2x/forward_to_inbox_black_24dp.png')
    );

  // ── Preset Buttons Section ────────────────────────────────────────────────
  if (presets.length === 0) {
    const noPresets = CardService.newTextParagraph()
      .setText('No forward destinations configured yet. Open Settings to add one.');
    card.addSection(
      CardService.newCardSection().addWidget(noPresets)
    );
  } else {
    const section = CardService.newCardSection()
      .setHeader('Forward to...');

    presets.forEach(preset => {
      const btn = CardService.newTextButton()
        .setText('→ ' + preset.name + '  (' + preset.address + ')')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('handleForwardClick')
            .setParameters({
              messageId: messageId || '',
              accessToken: accessToken || '',
              address:   preset.address,
              presetName: preset.name
            })
        );
      section.addWidget(btn);
    });

    // Custom address input
    const customInput = CardService.newTextInput()
      .setFieldName('customAddress')
      .setTitle('Or enter a custom address')
      .setHint('someone@example.com');

    const customBtn = CardService.newTextButton()
      .setText('Forward to custom address')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('handleCustomForwardClick')
          .setParameters({ messageId: messageId || '', accessToken: accessToken || '' })
      );

    section.addWidget(customInput);
    section.addWidget(customBtn);

    card.addSection(section);
  }

  // ── Info Section ──────────────────────────────────────────────────────────
  const userEmail = getUserEmail();
  const infoSection = CardService.newCardSection()
    .setCollapsible(true)
    .setHeader('About True Forward')
    .addWidget(
      CardService.newTextParagraph().setText(
        `The forwarded email will appear to come from <b>${userEmail}</b>, ` +
        `with the original sender shown in the body. All attachments are included.`
      )
    )
    .addWidget(
      CardService.newTextButton()
        .setText('⚙ Settings')
        .setOnClickAction(CardService.newAction().setFunctionName('openSettingsCard'))
    );

  card.addSection(infoSection);

  return card.build();
}

/**
 * Homepage trigger (no email selected) — shows settings.
 */
function onHomepage(_e) {
  return buildSettingsCard();
}

// ── Action Handlers ───────────────────────────────────────────────────────────

/**
 * Called when a preset forward button is clicked.
 */
function handleForwardClick(e) {
  const { messageId, accessToken, address, presetName } = e.parameters;

  if (accessToken) GmailApp.setCurrentMessageAccessToken(accessToken);
  if (!messageId) return showError('Could not determine the current message. Please try again.');

  const result = trueForwardMessage(messageId, address);

  if (result.success) {
    return showNotification(`✓ Forwarded to ${presetName} (${address})`);
  } else {
    return showError('Forward failed: ' + result.error);
  }
}

/**
 * Called when the custom address forward button is clicked.
 */
function handleCustomForwardClick(e) {
  const messageId   = e.parameters.messageId;
  const accessToken = e.parameters.accessToken;
  const address     = (e.formInputs && e.formInputs.customAddress && e.formInputs.customAddress[0]) || '';

  if (accessToken) GmailApp.setCurrentMessageAccessToken(accessToken);

  if (!address || !address.includes('@')) {
    return showError('Please enter a valid email address.');
  }
  if (!messageId) {
    return showError('Could not determine the current message. Please try again.');
  }

  const result = trueForwardMessage(messageId, address);

  if (result.success) {
    return showNotification(`✓ Forwarded to ${address}`);
  } else {
    return showError('Forward failed: ' + result.error);
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────

function openSettingsCard(_e) {
  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation().pushCard(buildSettingsCard())
    )
    .build();
}

// ── Notification Helpers ──────────────────────────────────────────────────────

function showNotification(message) {
  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText(message)
    )
    .build();
}

function showError(message) {
  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText('⚠ ' + message)
    )
    .build();
}
