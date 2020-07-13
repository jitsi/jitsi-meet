// @flow

import React from 'react';

import { createDeepLinkUrl } from '../../../base/util/createDeepLinkUrl';

/**
 * Create a link with createDeepLinkUrl (extended window.URL) method.
 *
 * @returns {Object}
 */
const signDeepLink = () => {
    const currentUrl = new URL(window.location);

    currentUrl.search = '';

    const forward = createDeepLinkUrl({
        type: 'address',
        'x-success': `${currentUrl.toString()}?address={address}`
    });

    window.location = forward;
};

type Props = {
    children: React$Element<*> | string,
};

const Button = ({ children, ...rest }: Props) => (
    <div
        { ...rest }
        onClick = { signDeepLink } >
        <div className = 'invite-more-button-text'>
            { children }
        </div>
    </div>
);

export default Button;
