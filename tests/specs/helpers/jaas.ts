import { Participant } from '../../helpers/Participant';
import { IToken, ITokenOptions, generateToken } from '../../helpers/token';

/**
 * Creates a new Participant and joins the MUC with the given name. The jaas-specific properties must be set as
 * environment variables: JAAS_DOMAIN and JAAS_TENANT, JAAS_KID, JAAS_PRIVATE_KEY_PATH.
 *
 * @param roomName The name of the room to join, without the tenant.
 * @param instanceId This is the "name" passed to the Participant, I think it's used to match against one of the
 * pre-configured browser instances in wdio? It must be one of 'p1', 'p2', 'p3', or 'p4'. TODO: figure out how this
 * should be used.
 * @param token the token to use, if any.
 */
export async function loadPage(roomName: string, instanceId: 'p1' | 'p2' | 'p3' | 'p4', token?: IToken) {
    if (!process.env.JAAS_DOMAIN || !process.env.JAAS_TENANT) {
        throw new Error('JAAS_DOMAIN and JAAS_TENANT environment variables must be set');
    }

    // TODO: this should re-use code from Participant (e.g. setting config).
    let url = `https://${process.env.JAAS_DOMAIN}/${process.env.JAAS_TENANT}/${roomName}`;

    if (token) {
        url += `?jwt=${token.jwt}`;
    }
    url += '#config.prejoinConfig.enabled=false&config.requireDisplayName=false';

    const newParticipant = new Participant(instanceId, token);

    try {
        await newParticipant.driver.setTimeout({ 'pageLoad': 30000 });

        // Force a refresh if URL changes only in hash params. TODO: clean this up when reactoring.
        const currentUrl = await newParticipant.driver.getUrl();

        if (currentUrl.split('#')[0] === url.split('#')[0]) {
            console.log('Refreshing the page to ensure the URL is loaded correctly');
            await newParticipant.driver.url(url);
            await newParticipant.driver.refresh();
        } else {
            await newParticipant.driver.url(url);
        }
        await newParticipant.waitForPageToLoad();
    } catch (error) {
    }

    return newParticipant;
}

export function generateJaasToken(options: ITokenOptions): IToken {
    if (!process.env.JAAS_PRIVATE_KEY_PATH || !process.env.JAAS_KID) {
        throw new Error('JAAS_PRIVATE_KEY_PATH and JAAS_KID environment variables must be set');
    }

    // Don't override the keyId and keyPath if they are already set in options, allow tests to set them.
    return generateToken({
        ...options,
        keyId: options.keyId || process.env.JAAS_KID,
        keyPath: options.keyPath || process.env.JAAS_PRIVATE_KEY_PATH,
    });
}

/**
 * Creates a new Participant and joins the MUC with the given name. The jaas-specific properties must be set as
 * environment variables: JAAS_DOMAIN and IFRAME_TENANT.
 *
 * @param roomName The name of the room to join, without the tenant.
 * @param instanceId This is the "name" passed to the Participant, I think it's used to match against one of the
 * pre-configured browser instances in wdio? It must be one of 'p1', 'p2', 'p3', or 'p4'. TODO: figure out how this
 * should be used.
 * @param token the token to use, if any.
 */
export async function joinMuc(roomName: string, instanceId: 'p1' | 'p2' | 'p3' | 'p4', token?: IToken) {
    const participant = await loadPage(roomName, instanceId, token);

    try {
        await participant.waitForMucJoinedOrError();
    } catch (error) {
    }

    return participant;
}
