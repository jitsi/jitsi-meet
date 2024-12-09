import { Participant } from '../helpers/Participant';

/**
 * Filmstrip elements.
 */
export default class Filmstrip {
    private participant: Participant;

    /**
     * Initializes for a participant.
     *
     * @param {Participant} participant - The participant.
     */
    constructor(participant: Participant) {
        this.participant = participant;
    }

    /**
     * Asserts that {@code participant} shows or doesn't show the audio
     * mute icon for the conference participant identified by
     * {@code testee}.
     *
     * @param {Participant} testee - The {@code Participant} for whom we're checking the status of audio muted icon.
     * @param {boolean} reverse - If {@code true}, the method will assert the absence of the "mute" icon;
     * otherwise, it will assert its presence.
     * @returns {Promise<void>}
     */
    async assertAudioMuteIconIsDisplayed(testee: Participant, reverse = false): Promise<void> {
        let id;

        if (testee === this.participant) {
            id = 'localVideoContainer';
        } else {
            id = `participant_${await testee.getEndpointId()}`;
        }

        const mutedIconXPath
            = `//span[@id='${id}']//span[contains(@id, 'audioMuted')]//*[local-name()='svg' and @id='mic-disabled']`;

        await this.participant.driver.$(mutedIconXPath).waitForDisplayed({
            reverse,
            timeout: 2000,
            timeoutMsg: `Audio mute icon is ${reverse ? '' : 'not'} displayed for ${testee.name}`
        });
    }

    /**
     * Asserts that {@code participant} shows or doesn't show the video mute icon for the conference participant
     * identified by {@code testee}.
     *
     * @param {Participant} testee - The {@code Participant} for whom we're checking the status of audio muted icon.
     * @param {boolean} reverse - If {@code true}, the method will assert the absence of the "mute" icon;
     * otherwise, it will assert its presence.
     * @returns {Promise<void>}
     */
    async assertVideoMuteIconIsDisplayed(testee: Participant, reverse = false): Promise<void> {
        const isOpen = await this.participant.getParticipantsPane().isOpen();

        if (!isOpen) {
            await this.participant.getParticipantsPane().open();
        }

        const id = `participant-item-${await testee.getEndpointId()}`;
        const mutedIconXPath
            = `//div[@id='${id}']//div[contains(@class, 'indicators')]//*[local-name()='svg' and @id='videoMuted']`;

        await this.participant.driver.$(mutedIconXPath).waitForDisplayed({
            reverse,
            timeout: 2000,
            timeoutMsg: `Video mute icon is ${reverse ? '' : 'not'} displayed for ${testee.name}`
        });

        if (!isOpen) {
            await this.participant.getParticipantsPane().close();
        }
    }

    /**
     * Returns the remote display name for an endpoint.
     * @param endpointId The endpoint id.
     */
    async getRemoteDisplayName(endpointId: string) {
        const remoteDisplayName = this.participant.driver.$(`span[id="participant_${endpointId}_name"]`);

        await remoteDisplayName.moveTo();

        return await remoteDisplayName.getText();
    }
}
