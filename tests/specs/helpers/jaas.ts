import type { Participant } from '../../helpers/Participant';
import { joinParticipant } from '../../helpers/participants';
import { IToken, ITokenOptions, generateToken } from '../../helpers/token';

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
 * environment variables: IFRAME_TENANT.
 *
 * @param instanceId This is the "name" passed to the Participant, I think it's used to match against one of the
 * pre-configured browser instances in wdio? It must be one of 'p1', 'p2', 'p3', or 'p4'. TODO: figure out how this
 * should be used.
 * @param token the token to use, if any.
 * @returns {Promise<Participant>} The Participant that has joined the MUC.
 */
export async function joinMuc(instanceId: 'p1' | 'p2' | 'p3' | 'p4', token?: IToken):
Promise<Participant> {
    if (!process.env.JAAS_TENANT) {
        throw new Error('JAAS_TENANT environment variables must be set');
    }

    return await joinParticipant({
        name: instanceId,
        token
    }, {
        forceTenant: process.env.JAAS_TENANT
    });
}
