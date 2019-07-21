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
    url?: ?string
};

/**
 * Implements an abstract stateless avatar component that renders an avatar purely from what gets passed through
 * props.
 */
export default class AbstractStatelessAvatar<P: Props> extends PureComponent<P> {
    /**
     * Parses an icon out of a specially constructed icon URL and returns the icon name.
     *
     * @param {string?} url - The url to parse.
     * @returns {string?}
     */
    _parseIconUrl(url: ?string): ?string {
        const match = url && url.match(/icon:\/\/(.+)/i);

        return (match && match[1]) || undefined;
    }
}
