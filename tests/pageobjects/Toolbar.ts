// eslint-disable-next-line no-unused-vars
import { Participant } from '../helpers/Participant';

const AUDIO_MUTE = 'Mute microphone';
const AUDIO_UNMUTE = 'Unmute microphone';

/**
 * The toolbar elements.
 */
export default class Toolbar {
    private participant: Participant;

    /**
     * Creates toolbar for a participant.
     *
     * @param {Participant} participant - The participants.
     */
    constructor(participant: Participant) {
        this.participant = participant;
    }

    /**
     * Returns the button.
     *
     * @param {string} accessibilityCSSSelector - The selector to find the button.
     * @returns {WebdriverIO.Element} The button.
     * @private
     */
    private getButton(accessibilityCSSSelector: string) {
        return this.participant.driver.$(`[aria-label^="${accessibilityCSSSelector}"]`);
    }

    /**
     * The audio mute button.
     */
    get audioMuteBtn() {
        return this.getButton(AUDIO_MUTE);
    }

    /**
     * The audio unmute button.
     */
    get audioUnMuteBtn() {
        return this.getButton(AUDIO_UNMUTE);
    }

    /**
     * Clicks audio mute button.
     *
     * @returns {Promise<void>}
     */
    async clickAudioMuteButton() {
        await this.participant.log('Clicking on: Audio Mute Button');
        await this.audioMuteBtn.click();
    }

    /**
     * Clicks audio unmute button.
     *
     * @returns {Promise<void>}
     */
    async clickAudioUnmuteButton() {
        await this.participant.log('Clicking on: Audio Unmute Button');
        await this.audioUnMuteBtn.click();
    }
}
