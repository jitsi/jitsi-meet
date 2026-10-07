/**
 * The texts of the system-wide user notification in one language.
 */
export interface ISystemWideUserNotificationLabels {

    /**
     * The label of the button which opens the link.
     */
    button?: string;

    /**
     * The description.
     */
    description?: string;

    /**
     * The label of the button which hides the notification for good.
     */
    dontShowAgain?: string;

    /**
     * The title.
     */
    title?: string;
}

/**
 * The config of the system-wide user notification.
 */
export interface ISystemWideUserNotificationConfig {

    /**
     * Identifies the notification. The users who chose not to see a notification again see the notification again
     * when its id changes. Defaults to the url.
     */
    id?: string;

    /**
     * The texts, by language code. A missing language or text falls back to English.
     */
    labels?: Record<string, ISystemWideUserNotificationLabels>;

    /**
     * The link which is opened in the browser.
     */
    url?: string;
}
