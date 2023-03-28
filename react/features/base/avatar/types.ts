export interface IAvatarProps {

    /**
     * Color of the (initials based) avatar, if needed.
     */
    color?: string;

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

    /**
     * The URL of the avatar to render.
     */
    url?: string | Function;
}
