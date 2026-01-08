import fs from 'fs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { config } from './TestsConfig';

export type ITokenOptions = {
    displayName?: string;
    /**
     * The duration for which the token is valid, e.g. "1h" for one hour.
     */
    exp?: string;
    /**
     * The key ID to use for the token.
     * If not provided, the kid configured with environment variables will be used (see env.example).
     */
    keyId?: string;
    /**
     * The path to the private key file used to sign the token.
     * If not provided, the path configured with environment variables will be used (see env.example).
     */
    keyPath?: string;
    /**
     * Whether to set the 'moderator' flag.
     */
    moderator?: boolean;
    /**
     * The room for which the token is valid, or '*'. Defaults to '*'.
     */
    room?: string;
    sub?: string;
    /**
     * Whether to set the 'visitor' flag.
     */
    visitor?: boolean;
};

export type IToken = {
    /**
     * The JWT headers, for easy reference.
     */
    headers?: any;
    /**
     * The signed JWT.
     */
    jwt: string;
    /**
     * The options used to generate the token.
     */
    options?: ITokenOptions;
    /**
     * The token's payload, for easy reference.
     */
    payload?: any;
};

export function generatePayload(options: ITokenOptions): any {
    const payload = {
        'aud': 'jitsi',
        'iss': 'chat',
        'sub': options?.sub || '',
        'context': {
            'user': {
                'name': options.displayName,
                'id': uuidv4(),
                'avatar': 'https://avatars0.githubusercontent.com/u/3671647',
                'email': 'john.doe@jitsi.org'
            },
            'group': uuidv4(),
            'features': {
                'outbound-call': 'true',
                'transcription': 'true',
                'recording': 'true',
                'sip-outbound-call': true,
                'livestreaming': true
            },
        },
        'room': options.room || '*'
    };

    if (options.moderator) {
        // @ts-ignore
        payload.context.user.moderator = true;
    } else if (options.visitor) {
        // @ts-ignore
        payload.context.user.role = 'visitor';
    }

    return payload;
}

/**
 * Generate a signed token.
 */
export function generateToken(options: ITokenOptions): IToken {
    const keyId = options.keyId || config.jwt.kid;
    const keyPath = options.keyPath || config.jwt.privateKeyPath;
    const headers = {
        algorithm: 'RS256',
        noTimestamp: true,
        expiresIn: options.exp || '24h',
        keyid: keyId,
    };

    if (!keyId) {
        throw new Error('No keyId provided (JWT_KID is not set?)');
    }

    if (!keyPath) {
        throw new Error('No keyPath provided (JWT_PRIVATE_KEY_PATH is not set?)');
    }

    const key = fs.readFileSync(keyPath);
    const payload = generatePayload({
        ...options,
        displayName: options?.displayName || '',
        sub: keyId.substring(0, keyId.indexOf('/'))
    });

    return {
        headers,
        // @ts-ignore
        jwt: jwt.sign(payload, key, headers),
        options,
        payload
    };
}

/**
 * Generated a signed token and return just the JWT string.
 */
export function generateJwt(options: ITokenOptions): string {
    return generateToken(options).jwt;
}
