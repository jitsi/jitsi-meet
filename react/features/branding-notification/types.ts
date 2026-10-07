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
     * Identifies the notification. The notification is shown once for every id, so a new id shows it again to the
     * users who have already seen the previous one.
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
