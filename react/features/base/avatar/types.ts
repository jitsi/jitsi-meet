export interface IAvatarProps {

    /**
     * Whether assistive technologies should announce the name of the person the avatar stands for. Off by
     * default, because most places render the name right next to the avatar and would read it twice. Turn it
     * on where the avatar is the only thing that identifies the person, such as the pre-join preview.
     */
    accessibilityAnnounceName?: boolean;

    /**
     * Color of the (initials based) avatar, if needed.
     */
    color?: string;

    /**
     * Name of the person the avatar stands for. Only announced when accessibilityAnnounceName is set.
     */
    displayName?: string;

    /**
     * The user icon(browser only).
     */
    iconUser?: any;

    /**
     * Initials to be used to render the initials based avatars.
     */
    initials?: string;

    /**
     * Callback to signal the failure of the loading of the URL.
     */
    onAvatarLoadError?: Function;

    /**
     * Additional parameters to be passed to onAvatarLoadError function.
     */
    onAvatarLoadErrorParams?: Object;

    /**
     * Expected size of the avatar.
     */
    size?: number;
}
