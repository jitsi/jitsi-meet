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

const Button = ({ children, ...rest }) => (
    <div
        { ...rest }
        onClick = { signDeepLink } >
        <div className = 'invite-more-button-text'>
            { children }
        </div>
    </div>
);

export default Button;
