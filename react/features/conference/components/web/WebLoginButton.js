// @flow

import React from 'react';

import { createDeepLinkUrl } from '../../../base/util/createDeepLinkUrl';

/**
 * Create a link with createDeepLinkUrl (window.URL) method.
 *
 * @returns {Object}
 */
const signDeepLink = () => {
    const currentUrl = new URL(window.location);

    currentUrl.search = '';

    return createDeepLinkUrl({
        type: 'address',
        'x-success': `${currentUrl.toString()}?address={address}`
    });
};

const Button = () => (
    <a
        className = 'invite-more-button'
        href = { signDeepLink() } >
            Login with web wallet
    </a>
);

export default Button;
