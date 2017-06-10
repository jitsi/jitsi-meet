import React from 'react';

export const DIALOG_PROP_TYPES = {
    /**
     * Whether cancel button is disabled. Enabled by default.
     */
    cancelDisabled: React.PropTypes.bool,

    /**
     * Optional i18n key to change the cancel button title.
     */
    cancelTitleKey: React.PropTypes.string,

    /**
     * Is ok button enabled/disabled. Enabled by default.
     */
    okDisabled: React.PropTypes.bool,

    /**
     * Optional i18n key to change the ok button title.
     */
    okTitleKey: React.PropTypes.string,

    /**
     * The handler for onCancel event.
     */
    onCancel: React.PropTypes.func,

    /**
     * The handler for the event when submitting the dialog.
     */
    onSubmit: React.PropTypes.func,

    /**
     * Used to obtain translations in children classes.
     */
    t: React.PropTypes.func,

    /**
     * Key to use for showing a title.
     */
    titleKey: React.PropTypes.string,

    /**
     * The string to use as a title instead of {@code titleKey}. If a truthy
     * value is specified, it takes precedence over {@code titleKey} i.e.
     * the latter is unused.
     */
    titleString: React.PropTypes.string
};
