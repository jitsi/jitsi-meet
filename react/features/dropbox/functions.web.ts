import { Dropbox, DropboxAuth } from 'dropbox';

import { IReduxState } from '../app/types';

/**
 * Executes the oauth flow.
 *
 * @param {string} authUrl - The URL to oauth service.
 * @returns {Promise<string>} - The URL with the authorization details.
 */
function authorize(authUrl: string): Promise<string> {
    const windowName = `oauth${Date.now()}`;

    return new Promise(resolve => {
        // eslint-disable-next-line prefer-const
        let popup: any;
        const handleAuth = ({ data }: { data: { type: string; url: string; windowName: string; }; }) => {
            if (data && data.type === 'dropbox-login' && data.windowName === windowName) {
                if (popup) {
                    popup.close();
                }
                window.removeEventListener('message', handleAuth);
                resolve(data.url);
            }
        };

        window.addEventListener('message', handleAuth);
        popup = window.open(authUrl, windowName);
    });
}

/**
 * Returns the token's expiry date as UNIX timestamp.
 *
 * @param {number} expiresIn - The seconds in which the token expires.
 * @returns {number} - The timestamp value for the expiry date.
 */
function getTokenExpiresAtTimestamp(expiresIn: number) {
    return new Date(Date.now() + (expiresIn * 1000)).getTime();
}

/**
 * Action to authorize the Jitsi Recording app in dropbox.
 *
 * @param {string} appKey - The Jitsi Recorder dropbox app key.
 * @param {string} redirectURI - The return URL.
 * @returns {Promise<Object>}
 */
export function _authorizeDropbox(
        appKey: string,
        redirectURI: string
): Promise<any> {
    const dropbox = new DropboxAuth({ clientId: appKey });

    return dropbox.getAuthenticationUrl(redirectURI, undefined, 'code', 'offline', undefined, undefined, true)

        // @ts-ignore
        .then(authorize)
        .then(returnUrl => {
            const params = new URLSearchParams(new URL(returnUrl).search);
            const code = params.get('code');

            return dropbox.getAccessTokenFromCode(redirectURI, code ?? '');
        })
        .then((resp: any) => {
            return {
                token: resp.result.access_token,
                rToken: resp.result.refresh_token,
                expireDate: getTokenExpiresAtTimestamp(resp.result.expires_in)
            };
        });
}


/**
 * Gets a new access token based on the refresh token.
 *
 * @param {string} appKey - The dropbox appKey.
 * @param {string} rToken - The refresh token.
 * @returns {Promise}
 */
export function getNewAccessToken(appKey: string, rToken: string) {
    const dropbox = new DropboxAuth({ clientId: appKey });

    dropbox.setRefreshToken(rToken);

    return dropbox.refreshAccessToken() // @ts-ignore
        .then(() => {
            return {
                token: dropbox.getAccessToken(),
                rToken: dropbox.getRefreshToken(),
                expireDate: dropbox.getAccessTokenExpiresAt().getTime()
            };
        });
}

/**
 * Returns the display name for the current dropbox account.
 *
 * @param {string} token - The dropbox access token.
 * @param {string} appKey - The Jitsi Recorder dropbox app key.
 * @returns {Promise<string>}
 */
export function getDisplayName(token: string, appKey: string) {
    const dropboxAPI = new Dropbox({
        accessToken: token,
        clientId: appKey
    });

    return (
        dropboxAPI.usersGetCurrentAccount()
            .then(account => account.result.name.display_name));
}

/**
 * Returns information about the space usage for the current dropbox account.
 *
 * @param {string} token - The dropbox access token.
 * @param {string} appKey - The Jitsi Recorder dropbox app key.
 * @returns {Promise<Object>}
 */
export function getSpaceUsage(token: string, appKey: string) {
    const dropboxAPI = new Dropbox({
        accessToken: token,
        clientId: appKey
    });

    return dropboxAPI.usersGetSpaceUsage().then(space => {
        const { allocation, used } = space.result;

        // @ts-ignore
        const { allocated } = allocation;

        return {
            allocated,
            used
        };
    });
}

/**
 * Returns <tt>true</tt> if the dropbox features is enabled and <tt>false</tt>
 * otherwise.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isEnabled(state: IReduxState) {
    const { dropbox = { appKey: undefined } } = state['features/base/config'];

    return typeof dropbox.appKey === 'string';
}
