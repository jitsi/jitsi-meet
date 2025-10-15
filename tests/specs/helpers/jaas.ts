import { Participant } from '../../helpers/Participant';
import { config } from '../../helpers/TestsConfig';
import { IToken, ITokenOptions, generateToken } from '../../helpers/token';
import { IParticipantJoinOptions, IParticipantOptions } from '../../helpers/types';

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
export async function joinMuc(
        participantOptions?: Partial<IParticipantOptions>,
        joinOptions?: Partial<IParticipantJoinOptions>): Promise<Participant> {

    const name = participantOptions?.name || 'p1';

    if (!config.jaas.enabled) {
        throw new Error('JaaS is not configured.');
    }

    // @ts-ignore
    const p = ctx[name] as Participant;

    if (p) {
        // Load a blank page to make sure the page is reloaded (in case the new participant uses the same URL). Using
        // 'about:blank' was causing problems in the past, if we notice any issues we can change to "base.html".
        await p.driver.url('about:blank');
    }

    const newParticipant = new Participant({
        iFrameApi: participantOptions?.iFrameApi || false,
        name,
        token: participantOptions?.token
    });

    // @ts-ignore
    ctx[name] = newParticipant;

    return await newParticipant.joinConference({
        ...joinOptions,
        tenant: joinOptions?.tenant || config.jaas.tenant,
        roomName: joinOptions?.roomName || ctx.roomName,
    });
}
