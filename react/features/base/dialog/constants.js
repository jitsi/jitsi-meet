import PropTypes from 'prop-types';

export const DIALOG_PROP_TYPES = {
    /**
     * Whether cancel button is disabled. Enabled by default.
     */
    cancelDisabled: PropTypes.bool,

    /**
     * Optional i18n key to change the cancel button title.
     */
    cancelTitleKey: PropTypes.string,

    /**
     * Is ok button enabled/disabled. Enabled by default.
     */
    okDisabled: PropTypes.bool,

    /**
     * Optional i18n key to change the ok button title.
     */
    okTitleKey: PropTypes.string,

    /**
     * The handler for onCancel event.
     */
    onCancel: PropTypes.func,

    /**
     * The handler for the event when submitting the dialog.
     */
    onSubmit: PropTypes.func,

    /**
     * Used to obtain translations in children classes.
     */
    t: PropTypes.func,

    /**
     * Key to use for showing a title.
     */
    titleKey: PropTypes.string,

    /**
     * The string to use as a title instead of {@code titleKey}. If a truthy
     * value is specified, it takes precedence over {@code titleKey} i.e.
     * the latter is unused.
     */
    titleString: PropTypes.string
};
