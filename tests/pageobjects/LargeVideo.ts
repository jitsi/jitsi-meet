import BasePageObject from './BasePageObject';

/**
 * The large video.
 */
export default class LargeVideo extends BasePageObject {
    /**
     * Returns the elapsed time at which video has been playing.
     *
     * @return {number} - The current play time of the video element.
     */
    async getPlaytime() {
        return this.participant.driver.$('#largeVideo').getProperty('currentTime');
    }

    /**
     * Waits 5s for the large video to switch to passed endpoint id.
     *
     * @param {string} endpointId - The endpoint.
     * @returns {Promise<void>}
     */
    waitForSwitchTo(endpointId: string): Promise<void> {
        return this.participant.driver.waitUntil(async () => endpointId === await this.getResource(), {
            timeout: 5_000,
            timeoutMsg: `expected large video to switch to ${endpointId} for 5s`
        });
    }

    /**
     * Gets avatar SRC attribute for the one displayed on large video.
     */
    async getAvatar() {
        const avatar = this.participant.driver.$('//img[@id="dominantSpeakerAvatar"]');

        return await avatar.isExisting() ? await avatar.getAttribute('src') : null;
    }

    /**
     * Returns the name the avatar on the large video exposes to assistive technologies, or {@code null} when the
     * avatar is decorative (hidden from them) or not shown at all. The avatar is an {@code img} when a picture is
     * loaded and a {@code div} otherwise, so the name is read from whichever attribute carries it.
     */
    async getAvatarAccessibleName(): Promise<string | null> {
        const avatar = this.participant.driver.$('#dominantSpeakerAvatar');

        if (!await avatar.isExisting() || !await avatar.isDisplayed()) {
            return null;
        }

        if (await avatar.getAttribute('aria-hidden') === 'true') {
            return null;
        }

        return (await avatar.getAttribute('aria-label')) ?? (await avatar.getAttribute('alt')) ?? null;
    }

    /**
     * Returns resource part of the JID of the user who is currently displayed in the large video area.
     */
    getResource() {
        return this.participant.execute(() => APP?.UI?.getLargeVideoID());
    }

    /**
     * Returns the source of the large video currently shown.
     */
    getId() {
        return this.participant.execute(() => document.getElementById('largeVideo')?.srcObject?.id);
    }

    /**
     * Checks if the large video is playing or not.
     *
     * @returns {Promise<void>}
     */
    assertPlaying() {
        let lastTime: number;

        return this.participant.driver.waitUntil(async () => {
            const currentTime = parseFloat(await this.getPlaytime());

            if (typeof lastTime === 'undefined') {
                lastTime = currentTime;
            }
            if (currentTime > lastTime) {
                return true;
            }

            lastTime = currentTime;

            return false;
        }, {
            timeout: 5_500,
            interval: 500,
            timeoutMsg:
                `Expected large video for participant ${this.participant.name} to play but it didn't for more than 5s`
        });
    }
}
