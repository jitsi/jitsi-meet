export interface IBrandingNotification {

    /**
     * The translation key of the label of the button which opens the link.
     */
    actionKey: string;

    /**
     * The translation key of the description.
     */
    descriptionKey: string;

    /**
     * The translation key of the label of the button which hides the notification for good.
     */
    dontShowAgainKey: string;

    /**
     * Identifies the notification. The notification is shown until the user chooses not to see it again, so a new id
     * shows it again to the users who have hidden the previous one.
     */
    id: string;

    /**
     * The translation key of the title.
     */
    titleKey?: string;

    /**
     * The link which is opened in the browser.
     */
    url: string;
}
