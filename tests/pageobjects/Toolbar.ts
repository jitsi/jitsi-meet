const AUDIO_MUTE = 'Mute microphone';
const AUDIO_UNMUTE = 'Unmute microphone';

/**
 * The toolbar elements.
 */
export default class Toolbar {
    private participant: Participant;

    /**
     * Creates toolbar for a participant.
     * @param participant The participants.
     */
    constructor(participant: Participant) {
        this.participant = participant;
    }

    /**
     * Returns the button.
     * @param accessibilityCSSSelector The selector to find the button.
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
     */
    async clickAudioMuteButton() {
        await this.participant.log('Clicking on: Audio Mute Button');
        await this.audioMuteBtn.click();
    }

    /**
     * Clicks audio unmute button.
     */
    async clickAudioUnmuteButton() {
        await this.participant.log('Clicking on: Audio Unmute Button');
        await this.audioUnMuteBtn.click();
    }
}
