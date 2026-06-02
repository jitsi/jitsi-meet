import { Participant } from './Participant';
import { IParticipantJoinOptions, IParticipantOptions } from './types';

/**
 * Creates a new Participant and joins the MUC with the given options. If no room name is specified, the default room
 * name from the context is used.
 *
 * @param participantOptions
 * @param joinOptions options to use when joining the MUC.
 * @returns {Promise<Participant>} The Participant that has joined the MUC.
 */
export async function joinMuc(
        participantOptions?: Partial<IParticipantOptions>,
        joinOptions?: Partial<IParticipantJoinOptions>): Promise<Participant> {

    const name = participantOptions?.name || 'p1';

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
        roomName: joinOptions?.roomName || ctx.roomName,
    });
}

/**
 * Wait until all participants have ICE connected and have sent and received data (their PC stats are ready).
 * @param participants
 */
export async function waitForMedia(participants: Participant[]) {
    await Promise.all(participants.map(p =>
        p.waitForIceConnected().then(() => p.waitForSendReceiveData())
    ));
}
