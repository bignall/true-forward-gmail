// =============================================================================
// TrueForward - Settings Card
// Manages forward presets and label-based auto-forward rules
// =============================================================================

/**
 * Builds the full settings card.
 */
function buildSettingsCard() {
  const card = CardService.newCardBuilder()
    .setName('settingsCard')
    .setHeader(
      CardService.newCardHeader()
        .setTitle('True Forward Settings')
        .setSubtitle('Manage destinations & auto-rules')
    );

  card.addSection(buildPresetsSection());
  card.addSection(buildAddPresetSection());
  card.addSection(buildLabelRulesSection());
  card.addSection(buildLabelRulesDescriptionSection());
  card.addSection(buildAddRuleSection());
  card.addSection(buildAboutSection());

  return card.build();
}

// ── Presets Section ───────────────────────────────────────────────────────────

function buildPresetsSection() {
  const presets = getPresets();
  const section = CardService.newCardSection()
    .setHeader('Forward Destinations (Presets)')
    .setCollapsible(false);

  if (presets.length === 0) {
    section.addWidget(
      CardService.newTextParagraph().setText('No presets yet. Add one below.')
    );
    return section;
  }

  presets.forEach(preset => {
    const row = CardService.newDecoratedText()
      .setTopLabel(preset.name)
      .setText(preset.address)
      .setButton(
        CardService.newImageButton()
          .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/delete_grey600_20dp.png')
          .setAltText('Remove')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleRemovePreset')
              .setParameters({ address: preset.address })
          )
      );
    section.addWidget(row);
  });

  return section;
}

function buildAddPresetSection() {
  return CardService.newCardSection()
    .setHeader('Add a Preset')
    .setCollapsible(true)
    .addWidget(
      CardService.newTextInput()
        .setFieldName('newPresetName')
        .setTitle('Display Name')
        .setHint('e.g. QuickBooks Receipts')
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName('newPresetAddress')
        .setTitle('Email Address')
        .setHint('e.g. receipts@quickbooks.com')
    )
    .addWidget(
      CardService.newTextButton()
        .setText('Add Preset')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(CardService.newAction().setFunctionName('handleAddPreset'))
    );
}

// ── Label Rules Section ───────────────────────────────────────────────────────

function buildLabelRulesDescriptionSection() {
  return CardService.newCardSection()
    .setHeader('How Auto-Forward Works')
    .setCollapsible(true)
    .addWidget(
      CardService.newTextParagraph().setText(
        'Apply a Gmail label to any email. True Forward will forward it automatically every hour.\n' +
        'Processed emails are archived under the label with a "/sent" suffix.'
      )
    );
}

function buildLabelRulesSection() {
  const rules = getLabelRules();
  const section = CardService.newCardSection()
    .setHeader('Auto-Forward Rules (Label-based)')
    .setCollapsible(true)
    .setNumUncollapsibleWidgets(rules.length > 0 ? rules.length * 2 + 2 : 1);

  if (rules.length === 0) {
    section.addWidget(
      CardService.newTextParagraph().setText('No rules yet. Add one below.')
    );
    return section;
  }

  rules.forEach(rule => {
    const row = CardService.newDecoratedText()
      .setTopLabel('<b>▸ Label:</b> ' + rule.labelName)
      .setText('→ ' + rule.address)
      .setBottomLabel(rule.enabled ? '● Active' : '○ Paused')
      .setButton(
        CardService.newImageButton()
          .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/delete_grey600_20dp.png')
          .setAltText('Remove rule')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleRemoveRule')
              .setParameters({ labelName: rule.labelName })
          )
      );
    section.addWidget(row);

    // Toggle enabled/disabled
    const toggleBtn = CardService.newTextButton()
      .setText(rule.enabled ? 'Pause this rule' : 'Activate this rule')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('handleToggleRule')
          .setParameters({ labelName: rule.labelName, enabled: String(!rule.enabled) })
      );
    section.addWidget(toggleBtn);
  });

  // Run Now button
  section.addWidget(CardService.newDivider());
  section.addWidget(
    CardService.newTextButton()
      .setText('▶ Run All Rules Now')
      .setOnClickAction(CardService.newAction().setFunctionName('handleRunNow'))
  );

  return section;
}

function buildAddRuleSection() {
  const presets = getPresets();

  const section = CardService.newCardSection()
    .setHeader('Add an Auto-Forward Rule')
    .setCollapsible(true)
    .addWidget(
      CardService.newTextInput()
        .setFieldName('newRuleLabel')
        .setTitle('Gmail Label Name')
        .setHint('e.g. TrueForward/receipts')
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName('newRuleAddress')
        .setTitle('Forward to Address')
        .setHint(presets.length > 0 ? presets[0].address : 'receipts@quickbooks.com')
    )
    .addWidget(
      CardService.newTextButton()
        .setText('Add Rule')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(CardService.newAction().setFunctionName('handleAddRule'))
    );

  return section;
}

function buildAboutSection() {
  return CardService.newCardSection()
    .setHeader('About')
    .setCollapsible(true)
    .addWidget(
      CardService.newTextParagraph().setText(
        'True Forward v1.0\n' +
        'Forwards emails from your address (not the original sender\'s), ' +
        'including all attachments. Useful for services like QuickBooks that ' +
        'identify accounts by the sender\'s email address.\n\n' +
        'Source: github.com/bignall/true-forward-gmail'
      )
    );
}

// ── Action Handlers ───────────────────────────────────────────────────────────

function handleAddPreset(e) {
  const name    = e.formInputs.newPresetName && e.formInputs.newPresetName[0] || '';
  const address = e.formInputs.newPresetAddress && e.formInputs.newPresetAddress[0] || '';

  try {
    addPreset(name, address);
    return refreshSettingsCard('Preset added: ' + name);
  } catch (err) {
    return showError(err.message);
  }
}

function handleRemovePreset(e) {
  try {
    removePreset(e.parameters.address);
    return refreshSettingsCard('Preset removed.');
  } catch (err) {
    return showError(err.message);
  }
}

function handleAddRule(e) {
  const labelName = e.formInputs.newRuleLabel && e.formInputs.newRuleLabel[0] || '';
  const address   = e.formInputs.newRuleAddress && e.formInputs.newRuleAddress[0] || '';

  try {
    addLabelRule(labelName, address);
    return refreshSettingsCard('Rule added for label: ' + labelName);
  } catch (err) {
    return showError(err.message);
  }
}

function handleRemoveRule(e) {
  try {
    removeLabelRule(e.parameters.labelName);
    return refreshSettingsCard('Rule removed.');
  } catch (err) {
    return showError(err.message);
  }
}

function handleToggleRule(e) {
  const enabled = e.parameters.enabled === 'true';
  try {
    toggleLabelRule(e.parameters.labelName, enabled);
    return refreshSettingsCard('Rule ' + (enabled ? 'activated' : 'paused') + '.');
  } catch (err) {
    return showError(err.message);
  }
}

function handleRunNow(_e) {
  try {
    const result = runRulesNow();
    if (!result.success) {
      return showError(result.message);
    }
    return refreshSettingsCard(result.message || 'Rules ran successfully.');
  } catch (err) {
    return showError('Error running rules: ' + err.message);
  }
}

// ── Navigation Helper ─────────────────────────────────────────────────────────

function refreshSettingsCard(notificationText) {
  const response = CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation()
        .updateCard(buildSettingsCard())
    );

  if (notificationText) {
    response.setNotification(
      CardService.newNotification().setText(notificationText)
    );
  }

  return response.build();
}
