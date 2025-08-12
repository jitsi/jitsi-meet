import type { Participant } from '../../helpers/Participant';
import { config } from '../../helpers/TestsConfig';
import { joinParticipant } from '../../helpers/participants';
import { IToken, ITokenOptions, generateToken } from '../../helpers/token';

export function generateJaasToken(options: ITokenOptions): IToken {
    if (!config.jaas.enabled) {
        throw new Error('JaaS is not configured.');
    }

    // Don't override the keyId and keyPath if they are already set in options, allow tests to set them.
    return generateToken({
        ...options,
        keyId: options.keyId || config.jaas.kid,
        keyPath: options.keyPath || config.jaas.privateKeyPath
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
 * @param roomName the name of the room to join, if any. If not provided, the ctx generated one will be used.
 * @returns {Promise<Participant>} The Participant that has joined the MUC.
 */
export async function joinMuc(instanceId: 'p1' | 'p2' | 'p3' | 'p4', token?: IToken, roomName?: string):
Promise<Participant> {
    if (!config.jaas.enabled) {
        throw new Error('JaaS is not configured.');
    }

    return await joinParticipant({
        name: instanceId,
        token
    }, {
        forceTenant: config.jaas.tenant,
        roomName
    });
}
