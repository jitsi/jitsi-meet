import { Participant } from '../helpers/Participant';

import BaseDialog from './BaseDialog';
import BasePageObject from './BasePageObject';

const LOCAL_VIDEO_XPATH = '//span[@id="localVideoContainer"]';
const LOCAL_VIDEO_MENU_TRIGGER = '#local-video-menu-trigger';
const LOCAL_USER_CONTROLS = 'aria/Local user controls';
const HIDE_SELF_VIEW_BUTTON_XPATH = '//div[contains(@class, "popover")]//div[@id="hideselfviewButton"]';

/**
 * Filmstrip elements.
 */
export default class Filmstrip extends BasePageObject {
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
            timeoutMsg: `Audio mute icon is${reverse ? '' : ' not'} displayed for ${testee.name}`
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
     * Returns the remote video id of a participant with endpointID.
     * @param endpointId
     */
    async getRemoteVideoId(endpointId: string) {
        const remoteDisplayName = this.participant.driver.$(`span[id="participant_${endpointId}"]`);

        await remoteDisplayName.moveTo();

        return await this.participant.driver.execute(eId =>
            document.evaluate(`//span[@id="participant_${eId}"]//video`,
                document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.srcObject?.id, endpointId);
    }

    /**
     * Returns the local video id.
     */
    async getLocalVideoId() {
        return await this.participant.driver.execute(
            'return document.getElementById("localVideo_container").srcObject.id');
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

    /**
     * Grants moderator rights to a participant.
     * @param participant
     */
    async grantModerator(participant: Participant) {
        await this.clickOnRemoteMenuLink(await participant.getEndpointId(), 'grantmoderatorlink', true);
    }

    /**
     * Clicks on the link in the remote participant actions menu.
     * @param participantId
     * @param linkClassname
     * @param dialogConfirm
     * @private
     */
    private async clickOnRemoteMenuLink(participantId: string, linkClassname: string, dialogConfirm: boolean) {
        const thumbnail = this.participant.driver.$(
            `//span[@id='participant_${participantId}']//span[@id='remotevideomenu']`);

        await thumbnail.moveTo();

        const popoverElement = this.participant.driver.$(
            `//div[contains(@class, 'popover')]//div[contains(@class, '${linkClassname}')]`);

        await popoverElement.waitForExist();
        await popoverElement.waitForDisplayed();
        await popoverElement.click();

        if (dialogConfirm) {
            await new BaseDialog(this.participant).clickOkButton();
        }
    }

    /**
     * Mutes the audio of a participant.
     * @param participant
     */
    async muteAudio(participant: Participant) {
        const participantId = await participant.getEndpointId();

        await this.participant.driver.$(`#participant-item-${participantId}`).moveTo();

        await this.participant.driver.$(`button[data-testid="mute-audio-${participantId}"]`).click();
    }

    /**
     * Mutes the video of a participant.
     * @param participant
     */
    async muteVideo(participant: Participant) {
        await this.clickOnRemoteMenuLink(await participant.getEndpointId(), 'mutevideolink', true);
    }

    /**
     * Kicks a participant.
     * @param participantId
     */
    async kickParticipant(participantId: string) {
        await this.clickOnRemoteMenuLink(participantId, 'kicklink', true);
    }

    /**
     * Clicks on the hide self view button from local video.
     */
    async hideSelfView() {
        // open local video menu
        await this.participant.driver.$(LOCAL_VIDEO_MENU_TRIGGER).moveTo();
        await this.participant.driver.$(LOCAL_USER_CONTROLS).moveTo();

        // click Hide self view button
        const hideSelfViewButton = this.participant.driver.$(HIDE_SELF_VIEW_BUTTON_XPATH);

        await hideSelfViewButton.waitForExist();
        await hideSelfViewButton.waitForClickable();
        await hideSelfViewButton.click();
    }

    /**
     * Checks whether the local self view is displayed or not.
     */
    async assertSelfViewIsHidden(hidden: boolean) {
        await this.participant.driver.$(LOCAL_VIDEO_XPATH).waitForDisplayed({
            reverse: hidden,
            timeout: 5000,
            timeoutMsg: `Local video thumbnail is${hidden ? '' : ' not'} displayed for ${this.participant.name}`
        });
    }

    /**
     * Toggles the filmstrip.
     */
    async toggle() {
        const toggleButton = this.participant.driver.$('#toggleFilmstripButton');

        await toggleButton.moveTo();
        await toggleButton.waitForDisplayed();
        await toggleButton.click();
    }

    /**
     * Asserts that the remote videos are hidden or not.
     * @param reverse
     */
    async assertRemoteVideosHidden(reverse = false) {
        await this.participant.driver.waitUntil(
            async () =>
                await this.participant.driver.$$('//div[@id="remoteVideos" and contains(@class, "hidden")]').length > 0,
            {
                timeout: 10_000, // 10 seconds
                timeoutMsg: `Timeout waiting fore remote videos to be hidden: ${!reverse}.`
            }
        );
    }
}
