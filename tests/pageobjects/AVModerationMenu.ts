import BasePageObject from './BasePageObject';

const START_AUDIO_MODERATION = 'participants-pane-context-menu-start-audio-moderation';
const STOP_AUDIO_MODERATION = 'participants-pane-context-menu-stop-audio-moderation';
const START_VIDEO_MODERATION = 'participants-pane-context-menu-start-video-moderation';
const STOP_VIDEO_MODERATION = 'participants-pane-context-menu-stop-video-moderation';

/**
 * Represents the Audio Video Moderation menu in the participants pane.
 */
export default class AVModerationMenu extends BasePageObject {
    /**
     * Clicks the start audio moderation menu item.
     */
    clickStartAudioModeration() {
        return this.clickButton(START_AUDIO_MODERATION);
    }

    /**
     * Clicks the stop audio moderation menu item.
     */
    clickStopAudioModeration() {
        return this.clickButton(STOP_AUDIO_MODERATION);
    }

    /**
     * Clicks the start video moderation menu item.
     */
    clickStartVideoModeration() {
        return this.clickButton(START_VIDEO_MODERATION);
    }

    /**
     * Clicks the stop audio moderation menu item.
     */
    clickStopVideoModeration() {
        return this.clickButton(STOP_VIDEO_MODERATION);
    }

    /**
     * Clicks a context menu button.
     * @param id
     * @private
     */
    private async clickButton(id: string) {
        const button = this.participant.driver.$(`#${id}`);

        await button.waitForDisplayed();
        await button.click();

        await button.moveTo({
            xOffset: -40,
            yOffset: -40
        });
    }
}
