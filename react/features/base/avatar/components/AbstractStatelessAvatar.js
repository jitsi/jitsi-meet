// @flow

import { PureComponent } from 'react';

export type Props = {

    /**
     * Color of the (initials based) avatar, if needed.
     */
    color?: string,

    /**
     * Initials to be used to render the initials based avatars.
     */
    initials?: string,

    /**
     * Callback to signal the failure of the loading of the URL.
     */
    onAvatarLoadError?: Function,

    /**
     * Expected size of the avatar.
     */
    size?: number;

    /**
     * The URL of the avatar to render.
     */
    url?: ?string | Object
};

/**
 * Implements an abstract stateless avatar component that renders an avatar purely from what gets passed through
 * props.
 */
export default class AbstractStatelessAvatar<P: Props> extends PureComponent<P> {
    /**
     * Checks if the passed prop is a loaded icon or not.
     *
     * @param {string? | Object?} iconProp - The prop to check.
     * @returns {boolean}
     */
    _isIcon(iconProp: ?string | ?Object): boolean {
        return Boolean(iconProp) && (typeof iconProp === 'object' || typeof iconProp === 'function');
    }
}
