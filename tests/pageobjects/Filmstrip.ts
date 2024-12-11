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
     * Returns the remote display name for an endpoint.
     * @param endpointId The endpoint id.
     */
    async getRemoteDisplayName(endpointId: string) {
        const remoteDisplayName = this.participant.driver.$(`span[id="participant_${endpointId}_name"]`);

        await remoteDisplayName.moveTo();

        return await remoteDisplayName.getText();
    }

    /**
     * Pins a participant by clicking on their thumbnail.
     * @param participant The participant.
     */
    async pinParticipant(participant: Participant) {
        const id = participant === this.participant
            ? 'localVideoContainer' : `participant_${await participant.getEndpointId()}`;

        await this.participant.driver.$(`//span[@id="${id}"]`).click();
    }

    /**
     * Gets avatar SRC attribute for the one displayed on small video thumbnail.
     * @param endpointId
     */
    async getAvatar(endpointId: string) {
        const elem = this.participant.driver.$(
            `//span[@id='participant_${endpointId}']//img[contains(@class,'userAvatar')]`);

        return await elem.isExisting() ? elem.getAttribute('src') : null;
    }
}
