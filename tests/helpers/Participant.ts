/* global APP $ */

import { multiremotebrowser } from '@wdio/globals';
import assert from 'assert';
import { Key } from 'webdriverio';

import { IConfig } from '../../react/features/base/config/configType';
import { urlObjectToString } from '../../react/features/base/util/uri';
import BreakoutRooms from '../pageobjects/BreakoutRooms';
import ChatPanel from '../pageobjects/ChatPanel';
import Filmstrip from '../pageobjects/Filmstrip';
import IframeAPI from '../pageobjects/IframeAPI';
import InviteDialog from '../pageobjects/InviteDialog';
import LargeVideo from '../pageobjects/LargeVideo';
import LobbyScreen from '../pageobjects/LobbyScreen';
import Notifications from '../pageobjects/Notifications';
import ParticipantsPane from '../pageobjects/ParticipantsPane';
import PasswordDialog from '../pageobjects/PasswordDialog';
import PreJoinScreen from '../pageobjects/PreJoinScreen';
import SecurityDialog from '../pageobjects/SecurityDialog';
import SettingsDialog from '../pageobjects/SettingsDialog';
import Toolbar from '../pageobjects/Toolbar';
import VideoQualityDialog from '../pageobjects/VideoQualityDialog';

import { LOG_PREFIX, logInfo } from './browserLogger';
import { IContext, IJoinOptions } from './types';

export const P1 = 'p1';
export const P2 = 'p2';
export const P3 = 'p3';
export const P4 = 'p4';

interface IWaitForSendReceiveDataOptions {
    checkReceive?: boolean;
    checkSend?: boolean;
    msg?: string;
    timeout?: number;
}

/**
 * Participant.
 */
export class Participant {
    /**
     * The current context.
     *
     * @private
     */
    private _name: string;
    private _endpointId: string;
    private _jwt?: string;

    /**
     * The default config to use when joining.
     *
     * @private
     */
    private config = {
        analytics: {
            disabled: true
        },

        // if there is a video file to play, use deployment config,
        // otherwise use lower resolution to avoid high CPU usage
        constraints: process.env.VIDEO_CAPTURE_FILE ? undefined : {
            video: {
                height: {
                    ideal: 360,
                    max: 360,
                    min: 180
                },

                // @ts-ignore
                width: {
                    ideal: 640,
                    max: 640,
                    min: 320
                },
                frameRate: {
                    max: 30
                }
            }
        },
        resolution: process.env.VIDEO_CAPTURE_FILE ? undefined : 360,

        requireDisplayName: false,
        testing: {
            testMode: true
        },
        disableAP: true,
        disable1On1Mode: true,
        disableModeratorIndicator: true,
        enableTalkWhileMuted: false,
        gatherStats: true,
        p2p: {
            enabled: false,
            useStunTurn: false
        },
        pcStatsInterval: 1500,
        prejoinConfig: {
            enabled: false
        },
        toolbarConfig: {
            alwaysVisible: true
        }
    } as IConfig;

    /**
     * Creates a participant with given name.
     *
     * @param {string} name - The name of the participant.
     * @param {string }jwt - The jwt if any.
     */
    constructor(name: string, jwt?: string) {
        this._name = name;
        this._jwt = jwt;
    }

    /**
     * A wrapper for <tt>this.driver.execute</tt> that would catch errors, print them and throw them again.
     *
     * @param {string | ((...innerArgs: InnerArguments) => ReturnValue)} script - The script that will be executed.
     * @param {any[]} args - The rest of the arguments.
     * @returns {ReturnValue} - The result of the script.
     */
    async execute<ReturnValue, InnerArguments extends any[]>(
            script: string | ((...innerArgs: InnerArguments) => ReturnValue),
            ...args: InnerArguments): Promise<ReturnValue> {
        try {
            return await this.driver.execute(script, ...args);
        } catch (error) {
            console.error('An error occured while trying to execute a script: ', error);
            throw error;
        }
    }

    /**
     * Returns participant endpoint ID.
     *
     * @returns {Promise<string>} The endpoint ID.
     */
    async getEndpointId(): Promise<string> {
        if (!this._endpointId) {
            this._endpointId = await this.execute(() => { // eslint-disable-line arrow-body-style
                return APP?.conference?.getMyUserId();
            });
        }

        return this._endpointId;
    }

    /**
     * The driver it uses.
     */
    get driver() {
        return multiremotebrowser.getInstance(this._name);
    }

    /**
     * The name.
     */
    get name() {
        return this._name;
    }

    /**
     * Adds a log to the participants log file.
     *
     * @param {string} message - The message to log.
     * @returns {void}
     */
    log(message: string): void {
        logInfo(this.driver, message);
    }

    /**
     * Joins conference.
     *
     * @param {IContext} ctx - The context.
     * @param {IJoinOptions} options - Options for joining.
     * @returns {Promise<void>}
     */
    async joinConference(ctx: IContext, options: IJoinOptions = {}): Promise<void> {
        const config = {
            room: ctx.roomName,
            configOverwrite: {
                ...this.config,
                ...options.configOverwrite || {}
            },
            interfaceConfigOverwrite: {
                SHOW_CHROME_EXTENSION_BANNER: false
            }
        };

        if (!options.skipDisplayName) {
            // @ts-ignore
            config.userInfo = {
                displayName: this._name
            };
        }

        if (ctx.iframeAPI) {
            config.room = 'iframeAPITest.html';
        }

        let url = urlObjectToString(config) || '';

        if (ctx.iframeAPI) {
            const baseUrl = new URL(this.driver.options.baseUrl || '');

            // @ts-ignore
            url = `${this.driver.iframePageBase}${url}&domain="${baseUrl.host}"&room="${ctx.roomName}"`;

            if (process.env.IFRAME_TENANT) {
                url = `${url}&tenant="${process.env.IFRAME_TENANT}"`;
            } else if (baseUrl.pathname.length > 1) {
                // remove leading slash
                url = `${url}&tenant="${baseUrl.pathname.substring(1)}"`;
            }
        }
        if (this._jwt) {
            url = `${url}&jwt="${this._jwt}"`;
        }

        await this.driver.setTimeout({ 'pageLoad': 30000 });

        let urlToLoad = url.startsWith('/') ? url.substring(1) : url;

        if (options.preferGenerateToken && !ctx.iframeAPI && ctx.isJaasAvailable() && process.env.IFRAME_TENANT) {
            // This to enables tests like invite, which can force using the jaas auth instead of the provided token
            urlToLoad = `/${process.env.IFRAME_TENANT}/${urlToLoad}`;
        }

        // drop the leading '/' so we can use the tenant if any
        await this.driver.url(urlToLoad);

        await this.waitForPageToLoad();

        if (ctx.iframeAPI) {
            const mainFrame = this.driver.$('iframe');

            await this.driver.switchFrame(mainFrame);
        }

        if (!options.skipWaitToJoin) {
            await this.waitToJoinMUC();
        }

        await this.postLoadProcess();
    }

    /**
     * Loads stuff after the page loads.
     *
     * @returns {Promise<void>}
     * @private
     */
    private async postLoadProcess(): Promise<void> {
        const driver = this.driver;

        const parallel = [];

        parallel.push(this.execute((name, sessionId, prefix) => {
            APP?.UI?.dockToolbar(true);

            // disable keyframe animations (.fadeIn and .fadeOut classes)
            $('<style>.notransition * { '
                + 'animation-duration: 0s !important; -webkit-animation-duration: 0s !important; transition:none; '
                + '} </style>') // @ts-ignore
                    .appendTo(document.head);

            // @ts-ignore
            $('body').toggleClass('notransition');

            document.title = `${name}`;

            console.log(`${new Date().toISOString()} ${prefix} sessionId: ${sessionId}`);

            // disable the blur effect in firefox as it has some performance issues
            const blur = document.querySelector('.video_blurred_container');

            if (blur) {
                // @ts-ignore
                document.querySelector('.video_blurred_container').style.display = 'none';
            }
        }, this._name, driver.sessionId, LOG_PREFIX));

        await Promise.all(parallel);
    }

    /**
     * Waits for the page to load.
     *
     * @returns {Promise<void>}
     */
    async waitForPageToLoad(): Promise<void> {
        return this.driver.waitUntil(
            () => this.execute(() => document.readyState === 'complete'),
            {
                timeout: 30_000, // 30 seconds
                timeoutMsg: `Timeout waiting for Page Load Request to complete for ${this.name}.`
            }
        );
    }

    /**
     * Waits for the tile view to display.
     */
    async waitForTileViewDisplay(reverse = false) {
        await this.driver.$('//div[@id="videoconference_page" and contains(@class, "tile-view")]').waitForDisplayed({
            reverse,
            timeout: 10_000,
            timeoutMsg: `Tile view did not display in 10s for ${this.name}`
        });
    }

    /**
     * Checks if the participant is in the meeting.
     */
    isInMuc() {
        return this.execute(() => typeof APP !== 'undefined' && APP.conference?.isJoined());
    }

    /**
     * Checks if the participant is a moderator in the meeting.
     */
    async isModerator() {
        return await this.execute(() => typeof APP !== 'undefined'
            && APP.store?.getState()['features/base/participants']?.local?.role === 'moderator');
    }

    /**
     * Checks if the meeting supports breakout rooms.
     */
    async isBreakoutRoomsSupported() {
        return await this.execute(() => typeof APP !== 'undefined'
            && APP.store?.getState()['features/base/conference'].conference?.getBreakoutRooms()?.isSupported());
    }

    /**
     * Checks if the participant is in breakout room.
     */
    async isInBreakoutRoom() {
        return await this.execute(() => typeof APP !== 'undefined'
            && APP.store?.getState()['features/base/conference'].conference?.getBreakoutRooms()?.isBreakoutRoom());
    }

    /**
     * Waits to join the muc.
     *
     * @returns {Promise<void>}
     */
    async waitToJoinMUC(): Promise<void> {
        return this.driver.waitUntil(
            () => this.isInMuc(),
            {
                timeout: 10_000, // 10 seconds
                timeoutMsg: `Timeout waiting to join muc for ${this.name}`
            }
        );
    }

    /**
     * Waits for ICE to get connected.
     *
     * @returns {Promise<void>}
     */
    waitForIceConnected(): Promise<void> {
        return this.driver.waitUntil(() =>
            this.execute(() => APP?.conference?.getConnectionState() === 'connected'), {
            timeout: 15_000,
            timeoutMsg: `expected ICE to be connected for 15s for ${this.name}`
        });
    }

    /**
     * Waits for ICE to get connected on the p2p connection.
     *
     * @returns {Promise<void>}
     */
    waitForP2PIceConnected(): Promise<void> {
        return this.driver.waitUntil(() =>
            this.execute(() => APP?.conference?.getP2PConnectionState() === 'connected'), {
            timeout: 15_000,
            timeoutMsg: `expected P2P ICE to be connected for 15s for ${this.name}`
        });
    }

    /**
     * Waits for send and receive data.
     *
     * @param {Object} options
     * @param {boolean} options.checkSend - If true we will chec
     * @returns {Promise<void>}
     */
    waitForSendReceiveData({
        checkSend = true,
        checkReceive = true,
        timeout = 15_000,
        msg
    } = {} as IWaitForSendReceiveDataOptions): Promise<void> {
        if (!checkSend && !checkReceive) {
            return Promise.resolve();
        }

        const lMsg = msg ?? `expected to ${
            checkSend && checkReceive ? 'receive/send' : checkSend ? 'send' : 'receive'} data in 15s for ${this.name}`;

        return this.driver.waitUntil(() => this.execute((pCheckSend: boolean, pCheckReceive: boolean) => {
            const stats = APP?.conference?.getStats();
            const bitrateMap = stats?.bitrate || {};
            const rtpStats = {
                uploadBitrate: bitrateMap.upload || 0,
                downloadBitrate: bitrateMap.download || 0
            };

            return (rtpStats.uploadBitrate > 0 || !pCheckSend) && (rtpStats.downloadBitrate > 0 || !pCheckReceive);
        }, checkSend, checkReceive), {
            timeout,
            timeoutMsg: lMsg
        });
    }

    /**
     * Waits for remote streams.
     *
     * @param {number} number - The number of remote streams to wait for.
     * @returns {Promise<void>}
     */
    async waitForRemoteStreams(number: number): Promise<void> {
        return await this.driver.waitUntil(async () => await this.execute(
            count => (APP?.conference?.getNumberOfParticipantsWithTracks() ?? -1) >= count,
            number
        ), {
            timeout: 15_000,
            timeoutMsg: `expected number of remote streams:${number} in 15s for ${this.name}`
        });
    }

    /**
     * Waits for number of participants.
     *
     * @param {number} number - The number of participant to wait for.
     * @param {string} msg - A custom message to use.
     * @returns {Promise<void>}
     */
    waitForParticipants(number: number, msg?: string): Promise<void> {
        return this.driver.waitUntil(
            () => this.execute(count => (APP?.conference?.listMembers()?.length ?? -1) === count, number),
            {
                timeout: 15_000,
                timeoutMsg: msg || `not the expected participants ${number} in 15s for ${this.name}`
            });
    }

    /**
     * Returns the chat panel for this participant.
     */
    getChatPanel(): ChatPanel {
        return new ChatPanel(this);
    }

    /**
     * Returns the BreakoutRooms for this participant.
     *
     * @returns {BreakoutRooms}
     */
    getBreakoutRooms(): BreakoutRooms {
        return new BreakoutRooms(this);
    }

    /**
     * Returns the toolbar for this participant.
     *
     * @returns {Toolbar}
     */
    getToolbar(): Toolbar {
        return new Toolbar(this);
    }

    /**
     * Returns the filmstrip for this participant.
     *
     * @returns {Filmstrip}
     */
    getFilmstrip(): Filmstrip {
        return new Filmstrip(this);
    }

    /**
     * Returns the invite dialog for this participant.
     *
     * @returns {InviteDialog}
     */
    getInviteDialog(): InviteDialog {
        return new InviteDialog(this);
    }

    /**
     * Returns the notifications.
     */
    getNotifications(): Notifications {
        return new Notifications(this);
    }

    /**
     * Returns the participants pane.
     *
     * @returns {ParticipantsPane}
     */
    getParticipantsPane(): ParticipantsPane {
        return new ParticipantsPane(this);
    }

    /**
     * Returns the large video page object.
     *
     * @returns {LargeVideo}
     */
    getLargeVideo(): LargeVideo {
        return new LargeVideo(this);
    }

    /**
     * Returns the videoQuality Dialog.
     *
     * @returns {VideoQualityDialog}
     */
    getVideoQualityDialog(): VideoQualityDialog {
        return new VideoQualityDialog(this);
    }

    /**
     * Returns the security Dialog.
     *
     * @returns {SecurityDialog}
     */
    getSecurityDialog(): SecurityDialog {
        return new SecurityDialog(this);
    }

    /**
     * Returns the settings Dialog.
     *
     * @returns {SettingsDialog}
     */
    getSettingsDialog(): SettingsDialog {
        return new SettingsDialog(this);
    }

    /**
     * Returns the password dialog.
     */
    getPasswordDialog(): PasswordDialog {
        return new PasswordDialog(this);
    }

    /**
     * Returns the prejoin screen.
     */
    getPreJoinScreen(): PreJoinScreen {
        return new PreJoinScreen(this);
    }

    /**
     * Returns the lobby screen.
     */
    getLobbyScreen(): LobbyScreen {
        return new LobbyScreen(this);
    }

    /**
     * Switches to the iframe API context
     */
    async switchToAPI() {
        await this.driver.switchFrame(null);
    }

    /**
     * Switches to the meeting page context.
     */
    switchInPage() {
        const mainFrame = this.driver.$('iframe');

        return this.driver.switchFrame(mainFrame);
    }

    /**
     * Returns the iframe API for this participant.
     */
    getIframeAPI() {
        return new IframeAPI(this);
    }

    /**
     * Hangups the participant by leaving the page. base.html is an empty page on all deployments.
     */
    async hangup() {
        const current = await this.driver.getUrl();

        // already hangup
        if (current.endsWith('/base.html')) {
            return;
        }

        // do a hangup, to make sure unavailable presence is sent
        await this.execute(() => typeof APP !== 'undefined' && APP.conference?.hangup());

        // let's give it some time to leave the muc, we redirect after hangup so we should wait for the
        // change of url
        await this.driver.waitUntil(
            async () => {
                const u = await this.driver.getUrl();

                // trying to debug some failures of reporting not leaving, where we see the close page in screenshot
                console.log(`initialUrl: ${current} currentUrl: ${u}`);

                return current !== u;
            },
            {
                timeout: 8000,
                timeoutMsg: `${this.name} did not leave the muc in 8s initialUrl: ${current}`
            }
        );

        await this.driver.url('/base.html')

            // This was fixed in wdio v9.9.1, we can drop once we update to that version
            .catch(_ => {}); // eslint-disable-line @typescript-eslint/no-empty-function
    }

    /**
     * Returns the local display name element.
     * @private
     */
    private async getLocalDisplayNameElement() {
        const localVideoContainer = this.driver.$('span[id="localVideoContainer"]');

        await localVideoContainer.moveTo();

        return localVideoContainer.$('span[id="localDisplayName"]');
    }

    /**
     * Returns the local display name.
     */
    async getLocalDisplayName() {
        return (await this.getLocalDisplayNameElement()).getText();
    }

    /**
     * Sets the display name of the local participant.
     */
    async setLocalDisplayName(displayName: string) {
        const localDisplayName = await this.getLocalDisplayNameElement();

        await localDisplayName.click();

        await this.driver.keys(displayName);
        await this.driver.keys(Key.Return);

        // just click somewhere to lose focus, to make sure editing has ended
        const localVideoContainer = this.driver.$('span[id="localVideoContainer"]');

        await localVideoContainer.moveTo();
        await localVideoContainer.click();
    }

    /**
     * Gets avatar SRC attribute for the one displayed on local video thumbnail.
     */
    async getLocalVideoAvatar() {
        const avatar
            = this.driver.$('//span[@id="localVideoContainer"]//img[contains(@class,"userAvatar")]');

        return await avatar.isExisting() ? await avatar.getAttribute('src') : null;
    }

    /**
     * Makes sure that the avatar is displayed in the local thumbnail and that the video is not displayed.
     * There are 3 options for avatar:
     *  - defaultAvatar: true - the default avatar (with grey figure) is used
     *  - image: true - the avatar is an image set in the settings
     *  - defaultAvatar: false, image: false - the avatar is produced from the initials of the display name
     */
    async assertThumbnailShowsAvatar(
            participant: Participant, reverse = false, defaultAvatar = false, image = false): Promise<void> {
        const id = participant === this
            ? 'localVideoContainer' : `participant_${await participant.getEndpointId()}`;

        const xpath = defaultAvatar
            ? `//span[@id='${id}']//div[contains(@class,'userAvatar') and contains(@class, 'defaultAvatar')]`
            : `//span[@id="${id}"]//${image ? 'img' : 'div'}[contains(@class,"userAvatar")]`;

        await this.driver.$(xpath).waitForDisplayed({
            reverse,
            timeout: 2000,
            timeoutMsg: `Avatar is ${reverse ? '' : 'not'} displayed in the local thumbnail for ${participant.name}`
        });

        await this.driver.$(`//span[@id="${id}"]//video`).waitForDisplayed({
            reverse: !reverse,
            timeout: 2000,
            timeoutMsg: `Video is ${reverse ? 'not' : ''} displayed in the local thumbnail for ${participant.name}`
        });
    }

    /**
     * Makes sure that the default avatar is used.
     */
    async assertDefaultAvatarExist(participant: Participant): Promise<void> {
        const id = participant === this
            ? 'localVideoContainer' : `participant_${await participant.getEndpointId()}`;

        await this.driver.$(
            `//span[@id='${id}']//div[contains(@class,'userAvatar') and contains(@class, 'defaultAvatar')]`)
            .waitForExist({
                timeout: 2000,
                timeoutMsg: `Default avatar does not exist for ${participant.name}`
            });
    }

    /**
     * Makes sure that the local video is displayed in the local thumbnail and that the avatar is not displayed.
     */
    async asserLocalThumbnailShowsVideo(): Promise<void> {
        await this.assertThumbnailShowsAvatar(this, true);
    }

    /**
     * Make sure a display name is visible on the stage.
     * @param value
     */
    async assertDisplayNameVisibleOnStage(value: string) {
        const displayNameEl = this.driver.$('div[data-testid="stage-display-name"]');

        expect(await displayNameEl.isDisplayed()).toBe(true);
        expect(await displayNameEl.getText()).toBe(value);
    }

    /**
     * Checks if the leave reason dialog is open.
     */
    async isLeaveReasonDialogOpen() {
        return this.driver.$('div[data-testid="dialog.leaveReason"]').isDisplayed();
    }

    /**
     * Returns the audio level for a participant.
     *
     * @param p
     * @return
     */
    async getRemoteAudioLevel(p: Participant) {
        const jid = await p.getEndpointId();

        return await this.execute(id => {
            const level = APP?.conference?.getPeerSSRCAudioLevel(id);

            return level ? level.toFixed(2) : null;
        }, jid);
    }

    /**
     * For the participant to have his audio muted/unmuted from given observer's
     * perspective. The method will fail the test if something goes wrong or
     * the audio muted status is different than the expected one. We wait up to
     * 3 seconds for the expected status to appear.
     *
     * @param testee - instance of the participant for whom we're checking the audio muted status.
     * @param muted - <tt>true</tt> to wait for audio muted status or <tt>false</tt> to wait for the participant to
     * unmute.
     */
    async waitForAudioMuted(testee: Participant, muted: boolean): Promise<void> {
        // Waits for the correct icon
        await this.getFilmstrip().assertAudioMuteIconIsDisplayed(testee, !muted);

        // Extended timeout for 'unmuted' to make tests more resilient to
        // unexpected glitches.
        const timeout = muted ? 3_000 : 6_000;

        // Give it 3 seconds to not get any audio or to receive some
        // depending on "muted" argument
        try {
            await this.driver.waitUntil(async () => {
                const audioLevel = await this.getRemoteAudioLevel(testee);

                if (muted) {
                    if (audioLevel !== null && audioLevel > 0.1) {
                        console.log(`muted exiting on: ${audioLevel}`);

                        return true;
                    }

                    return false;
                }

                // When testing for unmuted we wait for first sound
                if (audioLevel !== null && audioLevel > 0.1) {
                    console.log(`unmuted exiting on: ${audioLevel}`);

                    return true;
                }

                return false;
            },
            { timeout });

            // When testing for muted we don't want to have
            // the condition succeeded
            if (muted) {
                assert.fail(`There was some sound coming from muted: '${this.name}'`);
            } // else we're good for unmuted participant
        } catch (_timeoutE) {
            if (!muted) {
                assert.fail(`There was no sound from unmuted: '${this.name}'`);
            } // else we're good for muted participant
        }
    }


    /**
     * Waits for remote video state - receiving and displayed.
     * @param endpointId
     * @param reverse
     */
    async waitForRemoteVideo(endpointId: string, reverse = false) {
        if (reverse) {
            await this.driver.waitUntil(async () =>
                !await this.execute(epId => JitsiMeetJS.app.testing.isRemoteVideoReceived(`${epId}`),
                    endpointId) && !await this.driver.$(
                    `//span[@id="participant_${endpointId}" and contains(@class, "display-video")]`).isExisting(), {
                timeout: 15_000,
                timeoutMsg: `expected remote video for ${endpointId} to not be received 15s by ${this.name}`
            });
        } else {
            await this.driver.waitUntil(async () =>
                await this.execute(epId => JitsiMeetJS.app.testing.isRemoteVideoReceived(`${epId}`),
                    endpointId) && await this.driver.$(
                    `//span[@id="participant_${endpointId}" and contains(@class, "display-video")]`).isExisting(), {
                timeout: 15_000,
                timeoutMsg: `expected remote video for ${endpointId} to be received 15s by ${this.name}`
            });
        }
    }

    /**
     * Waits for ninja icon to be displayed.
     * @param endpointId When no endpoint id is passed we check for any ninja icon.
     */
    async waitForNinjaIcon(endpointId?: string) {
        if (endpointId) {
            await this.driver.$(`//span[@id='participant_${endpointId}']//span[@class='connection_ninja']`)
                .waitForDisplayed({
                    timeout: 15_000,
                    timeoutMsg: `expected ninja icon for ${endpointId} to be displayed in 15s by ${this.name}`
                });
        } else {
            await this.driver.$('//span[contains(@class,"videocontainer")]//span[contains(@class,"connection_ninja")]')
                .waitForDisplayed({
                    timeout: 5_000,
                    timeoutMsg: `expected ninja icon to be displayed in 5s by ${this.name}`
                });
        }
    }

    /**
     * Waits for dominant speaker icon to appear in remote video of a participant.
     * @param endpointId the endpoint ID of the participant whose dominant speaker icon status will be checked.
     */
    waitForDominantSpeaker(endpointId: string) {
        return this.driver.$(`//span[@id="participant_${endpointId}" and contains(@class, "dominant-speaker")]`)
            .waitForDisplayed({ timeout: 5_000 });
    }
}
