import React from 'react';

import { createDeepLinkUrl } from '../../../../util';

const signDeepLink = () => {
    // todo: does we need auth before
    const currentUrl = new URL(window.location);

    currentUrl.search = '';

    window.location = createDeepLinkUrl({
        type: '`sign-message`',
        message: `I would like to generate JWT token at ${new Date().toUTCString()}`,
        'x-success': `${currentUrl}?result=success&signature={signature}&fromWallet=true`
    });

    // window.location = createDeepLinkUrl({
    //     type: 'address',
    //     'x-success': `${signLink}?address={address}&balance={balance}&result=success`
    // });
};

const Button = () => (
    <button onClick={signDeepLink}>Searching for an extention... <br/>Login with web wallet</button>
);

export default Button;