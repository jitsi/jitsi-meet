import { PureComponent } from 'react';

export interface IProps {

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

/**
 * Implements an abstract stateless avatar component that renders an avatar purely from what gets passed through
 * props.
 */
export default class AbstractStatelessAvatar<P extends IProps> extends PureComponent<P> {
    /**
     * Checks if the passed prop is a loaded icon or not.
     *
     * @param {string? | Object?} iconProp - The prop to check.
     * @returns {boolean}
     */
    _isIcon(iconProp?: string | Function): iconProp is Function {
        return Boolean(iconProp) && (typeof iconProp === 'object' || typeof iconProp === 'function');
    }
}
