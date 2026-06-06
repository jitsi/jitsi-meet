import { Participant } from './Participant';
import { config } from './TestsConfig';
import { joinMuc } from './joinMuc';
import { IToken, ITokenOptions, generateToken } from './token';
import { IParticipantJoinOptions, IParticipantOptions } from './types';

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
 * Creates a new Participant and joins the MUC with the given options. The jaas-specific properties must be set as
 * environment variables (see env.example and TestsConfig.ts). If no room name is specified, the default room name
 * from the context is used.
 *
 * @param participantOptions
 * @param joinOptions options to use when joining the MUC.
 * @returns {Promise<Participant>} The Participant that has joined the MUC.
 */
export async function joinJaasMuc(
        participantOptions?: Partial<IParticipantOptions>,
        joinOptions?: Partial<IParticipantJoinOptions>): Promise<Participant> {

    if (!config.jaas.enabled) {
        throw new Error('JaaS is not configured.');
    }

    return await joinMuc(participantOptions, {
        ...joinOptions,
        tenant: joinOptions?.tenant || config.jaas.tenant
    });
}
