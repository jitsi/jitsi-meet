// @flow

export type DialogProps = {

    /**
     * Whether cancel button is disabled. Enabled by default.
     */
    cancelDisabled: ?boolean,

    /**
     * Optional i18n key to change the cancel button title.
     */
    cancelKey: ?string,

    /**
     * The React {@code Component} children which represents the dialog's body.
     */
    children: ?React$Node,

    /**
     * Is ok button enabled/disabled. Enabled by default.
     */
    okDisabled: ?boolean,

    /**
     * Optional i18n key to change the ok button title.
     */
    okKey: ?string,

    /**
     * The handler for onCancel event.
     */
    onCancel: Function,

    /**
     * The handler for the event when submitting the dialog.
     */
    onSubmit: Function,

    /**
     * Additional style to be applied on the dialog.
     *
     * NOTE: Not all dialog types support this!
     */
    style?: Object,

    /**
     * Key to use for showing a title.
     */
    titleKey: ?string,

    /**
     * The string to use as a title instead of {@code titleKey}. If a truthy
     * value is specified, it takes precedence over {@code titleKey} i.e.
     * the latter is unused.
     */
    titleString: ?string
};

/**
 * A preferred (or optimal) dialog size. This constant is reused in many
 * components, where dialog size optimization is suggested.
 *
 * NOTE: Even though we support valious devices, including tablets, we don't
 * want the dialogs to be oversized even on larger devices. This number seems
 * to be a good compromise, but also easy to update.
 */
export const PREFERRED_DIALOG_SIZE = 300;
