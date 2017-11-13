
export type DialogPropTypes = {

    /**
     * Whether cancel button is disabled. Enabled by default.
     */
    cancelDisabled: boolean,

    /**
     * Optional i18n key to change the cancel button title.
     */
    cancelTitleKey: String,

    /**
     * Is ok button enabled/disabled. Enabled by default.
     */
    okDisabled: boolean,

    /**
     * Optional i18n key to change the ok button title.
     */
    okTitleKey: String,

    /**
     * The handler for onCancel event.
     */
    onCancel: Function,

    /**
     * The handler for the event when submitting the dialog.
     */
    onSubmit: Function,

    /**
     * Used to obtain translations in children classes.
     */
    t: Function,

    /**
     * Key to use for showing a title.
     */
    titleKey: String,

    /**
     * The string to use as a title instead of {@code titleKey}. If a truthy
     * value is specified, it takes precedence over {@code titleKey} i.e.
     * the latter is unused.
     */
    titleString: String
};
