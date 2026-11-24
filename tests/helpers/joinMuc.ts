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
        // Rejoin in a fresh window and close the one the previous participant used, rather than loading the next
        // page into it (which also made the same URL a real load). On the grid, a window that a participant had
        // joined a conference from has been seen to stop receiving any mouse or keyboard event from the driver once
        // the next page was loaded into it: every command succeeded, the page never saw them. Neither a blank page
        // nor a hangup and base.html in between made a difference, so start from a window the driver has not used.
        // The old one is closed so that the session keeps a single window, which the rest of the helpers assume.
        const oldHandle = await p.driver.getWindowHandle();
        const { handle: newHandle } = await p.driver.newWindow('about:blank', { type: 'tab' });

        await p.driver.switchToWindow(oldHandle);
        await p.driver.closeWindow();
        await p.driver.switchToWindow(newHandle);
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
