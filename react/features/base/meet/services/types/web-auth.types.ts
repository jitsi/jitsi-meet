export interface WebAuthParams {
    mnemonic: string;
    newToken: string;
}

export interface WebAuthMessage {
    type: 'INTERNXT_AUTH_SUCCESS' | 'INTERNXT_AUTH_ERROR';
    payload?: WebAuthParams;
    error?: string;
}

export interface WebAuthConfig {
    popupWidth: number;
    popupHeight: number;
    authTimeoutMs: number;
    popupCheckIntervalMs: number;
    popupName: string;
    authOriginParam: string;
    loginPath: string;
    signupPath: string;
}

export const WEB_AUTH_MESSAGE_TYPES = {
    SUCCESS: 'INTERNXT_AUTH_SUCCESS',
    ERROR: 'INTERNXT_AUTH_ERROR',
} as const;

export const WEB_AUTH_STORAGE_KEYS = {
    NEW_TOKEN: "xNewToken",
} as const;

export const WEB_AUTH_CONFIG: WebAuthConfig = {
    popupWidth: 500,
    popupHeight: 700,
    authTimeoutMs: 5 * 60 * 1000,
    popupCheckIntervalMs: 500,
    popupName: 'InternxtAuth',
    authOriginParam: 'authOrigin=meet',
    loginPath: '/login',
    signupPath: '/new',
};
