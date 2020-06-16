import React from 'react';

import { createDeepLinkUrl } from '../../../../util';

const signDeepLink = () => {
    // todo:

    const currentUrl = new URL(window.location);

    currentUrl.search = '';

    const signLink = createDeepLinkUrl({
        type: 'sign-message',
        message: `I would like to generate JWT token at ${new Date().toUTCString()}`,
        'x-success': `${currentUrl}?address={address}&result=success&signature={signature}&fromWallet=true`
    });

    return createDeepLinkUrl({
        type: 'address',
        'x-success': signLink
    });
};

const Button = () => (
    <a
        className = 'invite-more-button'
        href = { signDeepLink() }
        style = {{ color: 'white', marginTop: 10 }} >
            Login with web wallet
    </a>
);

export default Button;
