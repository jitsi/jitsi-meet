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

    const forward = createDeepLinkUrl({
        type: 'address',
        'x-success': `${currentUrl.toString()}?address={address}`
    });

    window.location = forward;
};

const Button = () => (
    <div
        className = 'invite-more-button invite-more-deeplink'
        onClick = { signDeepLink } >
        <div className = 'invite-more-button-text'>
            Login with web wallet
        </div>
    </div>
);

export default Button;
