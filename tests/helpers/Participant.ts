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
import Notifications, {
    MAX_USERS_TEST_ID,
    TOKEN_AUTH_FAILED_TEST_ID,
    TOKEN_AUTH_FAILED_TITLE_TEST_ID
} from '../pageobjects/Notifications';
import ParticipantsPane from '../pageobjects/ParticipantsPane';
import PasswordDialog from '../pageobjects/PasswordDialog';
import PreJoinScreen from '../pageobjects/PreJoinScreen';
import SecurityDialog from '../pageobjects/SecurityDialog';
import SettingsDialog from '../pageobjects/SettingsDialog';
import Toolbar from '../pageobjects/Toolbar';
import VideoQualityDialog from '../pageobjects/VideoQualityDialog';
import Visitors from '../pageobjects/Visitors';

import { LOG_PREFIX, logInfo } from './browserLogger';
import { IToken } from './token';
import { IParticipantJoinOptions, IParticipantOptions } from './types';

export const P1 = 'p1';
export const P2 = 'p2';
export const P3 = 'p3';
export const P4 = 'p4';

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
    /**
     * The token that this participant was initialized with.
     */
    private _token?: IToken;

    /**
     * Cache the dial in pin code so that it doesn't have to be read from the UI.
     */
    private _dialInPin?: string;

    private _iFrameApi: boolean = false;

    /**
     * Whether the current frame is the main frame. This could coincide with the Jitsi Meet frame (when it's loaded
     * directly), or not (when it's loaded in an iframe).
     */
    private _inMainFrame: boolean = true;

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
     * Creates a participant with given options.
     */
    constructor(options: IParticipantOptions) {
        this._name = options.name;
        this._token = options.token;
        this._iFrameApi = options.iFrameApi || false;
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
            // @ts-ignore
            return await this.driver.execute(script, ...args);
        } catch (error) {
            console.error('An error occurred while trying to execute a script: ', error);
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
            const wasInMainFrame = this._inMainFrame;

            await this.switchToIFrame();

            this._endpointId = await this.execute(() => { // eslint-disable-line arrow-body-style
                return APP?.conference?.getMyUserId();
            });

            if (wasInMainFrame) {
                await this.switchToMainFrame();
            }
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
    async log(message: string): Promise<void> {
        await logInfo(this.driver, message);
    }

    /**
     * Joins conference.
     *
     * @param {IParticipantJoinOptions} options - Options for joining.
     * @returns {Promise<void>}
     */
    async joinConference(options: IParticipantJoinOptions): Promise<Participant> {
        const config = {
            room: options.roomName,
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

        if (this._iFrameApi) {
            config.room = 'iframeAPITest.html';
        }

        let url = urlObjectToString(config) || '';

        if (this._iFrameApi) {
            const baseUrl = new URL(this.driver.options.baseUrl || '');

            // @ts-ignore
            url = `${this.driver.iframePageBase}${url}&domain="${baseUrl.host}"&room="${options.roomName}"`;

            if (options.tenant) {
                url = `${url}&tenant="${options.tenant}"`;
            } else if (baseUrl.pathname.length > 1) {
                // remove leading slash
                url = `${url}&tenant="${baseUrl.pathname.substring(1)}"`;
            }
        }
        if (this._token?.jwt) {
            url = `${url}&jwt="${this._token.jwt}"`;
        }

        await this.driver.setTimeout({ 'pageLoad': 30000 });

        // drop the leading '/' so we can use the tenant if any
        url = url.startsWith('/') ? url.substring(1) : url;

        if (options.tenant && !this._iFrameApi) {
            // For the iFrame API the tenant is passed in a different way.
            url = `/${options.tenant}/${url}`;
        }

        await this.driver.url(url);

        await this.waitForPageToLoad();

        if (this._iFrameApi) {
            await this.switchToIFrame();
        }

        if (!options.skipWaitToJoin) {
            await this.waitForMucJoinedOrError();
        }

        await this.postLoadProcess();

        return this;
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
     * @returns {Promise<boolean>}
     */
    async waitForPageToLoad(): Promise<boolean> {
        return this.driver.waitUntil(
            () => this.execute(() => {
                console.log(`${new Date().toISOString()} document.readyState: ${document.readyState}`);

                return document.readyState === 'complete';
            }),
            {
                timeout: 30_000, // 30 seconds
                timeoutMsg: `Timeout waiting for Page Load Request to complete for ${this.name}.`
            }
        );
    }

    /**
     * Waits for the tile view to display.
     */
    async waitForTileViewDisplayed(reverse = false) {
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
     * Waits until either the MUC is joined, or a password prompt is displayed, or an authentication failure
     * notification is displayed, or max users notification is displayed.
     */
    async waitForMucJoinedOrError(): Promise<void> {
        await this.driver.waitUntil(async () => {
            return await this.isInMuc() || await this.getPasswordDialog().isOpen()
                || await this.getNotifications().getNotificationText(MAX_USERS_TEST_ID)
                || await this.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TEST_ID)
                || await this.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TITLE_TEST_ID);
        }, {
            timeout: 10_000,
            timeoutMsg: 'Timeout waiting for MUC joined or error.'
        });
    }

    /**
     * Checks if the participant is a moderator in the meeting.
     */
    async isModerator() {
        return await this.execute(() => typeof APP !== 'undefined'
            && APP.store?.getState()['features/base/participants']?.local?.role === 'moderator');
    }

    async isVisitor() {
        return await this.execute(() => APP?.store?.getState()['features/visitors']?.iAmVisitor || false);
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
     * @returns {Promise<boolean>}
     */
    waitForIceConnected(): Promise<boolean> {
        return this.driver.waitUntil(() =>
            this.execute(() => APP?.conference?.getConnectionState() === 'connected'), {
            timeout: 15_000,
            timeoutMsg: `expected ICE to be connected for 15s for ${this.name}`
        });
    }

    /**
     * Waits for ICE to get connected on the p2p connection.
     *
     * @returns {Promise<boolean>}
     */
    waitForP2PIceConnected(): Promise<boolean> {
        return this.driver.waitUntil(() =>
            this.execute(() => APP?.conference?.getP2PConnectionState() === 'connected'), {
            timeout: 15_000,
            timeoutMsg: `expected P2P ICE to be connected for 15s for ${this.name}`
        });
    }

    /**
     * Waits until the conference stats show positive upload and download bitrate (independently).
     *
     * @returns {Promise<boolean>}
     */
    async waitForSendReceiveData(timeout = 15_000, msg?: string): Promise<boolean> {
        const values = await Promise.all([
            await this.waitForSendMedia(timeout, msg ? `${msg} (send)` : undefined),
            await this.waitForReceiveMedia(timeout, msg ? `${msg} (receive)` : undefined)
        ]);

        return values[0] && values[1];
    }

    /**
     * Waits until the conference stats show positive upload bitrate.
     * @param timeout max time to wait in ms
     * @param timeoutMsg the message to log if the timeout is reached
     */
    async waitForSendMedia(
            timeout = 15_000,
            timeoutMsg = `expected to send media in ${timeout / 1000}s for ${this.name}`): Promise<boolean> {

        return this.driver.waitUntil(() => this.execute(() => {
            return APP?.conference?.getStats()?.bitrate?.upload > 0;
        }), {
            timeout,
            timeoutMsg
        });
    }

    /**
     * Waits until the conference stats show positive upload bitrate.
     * @param timeout max time to wait in ms
     * @param timeoutMsg the message to log if the timeout is reached
     */
    async waitForReceiveMedia(
            timeout = 15_000,
            timeoutMsg = `expected to receive media in ${timeout / 1000}s for ${this.name}`): Promise<boolean> {

        return this.driver.waitUntil(() => this.execute(() => {
            return APP?.conference?.getStats()?.bitrate?.download > 0;
        }), {
            timeout,
            timeoutMsg
        });
    }

    /**
     * Waits until there are at least [number] participants that have at least one track.
     *
     * @param {number} number - The number of remote streams to wait for.
     * @returns {Promise<boolean>}
     */
    async waitForRemoteStreams(number: number): Promise<boolean> {
        return await this.driver.waitUntil(async () => await this.execute(
            count => (APP?.conference?.getNumberOfParticipantsWithTracks() ?? -1) >= count,
            number
        ), {
            timeout: 15_000,
            timeoutMsg: `expected number of remote streams:${number} in 15s for ${this.name}`
        });
    }

    /**
     * Waits until the number of participants is exactly the given number.
     *
     * @param {number} number - The number of participant to wait for.
     * @param {string} msg - A custom message to use.
     * @returns {Promise<boolean>}
     */
    waitForParticipants(number: number, msg?: string): Promise<boolean> {
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
     * Returns the Visitors page object.
     *
     * @returns {Visitors}
     */
    getVisitors(): Visitors {
        return new Visitors(this);
    }


    /**
     * Switches to the main frame context (outside the iFrame; where the Jitsi Meet iFrame API is available).
     *
     * If this Participant was initialized with iFrameApi=false this is a no-op.
     */
    async switchToMainFrame() {
        if (!this._iFrameApi || this._inMainFrame) {
            return;
        }

        await this.driver.switchFrame(null);
        this._inMainFrame = true;
    }

    /**
     * Switches to the iFrame context (inside the iFrame; where the Jitsi Meet application runs).
     *
     * If this Participant was initialized with iFrameApi=false this is a no-op.
     */
    async switchToIFrame() {
        if (!this._iFrameApi || !this._inMainFrame) {
            return;
        }

        const iframe = this.driver.$('iframe');

        await this.driver.switchFrame(iframe);
        this._inMainFrame = false;
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
        console.log(`Hanging up (${this.name})`);
        if ((await this.driver.getUrl()).endsWith('/base.html')) {
            console.log(`Already hung up (${this.name})`);

            return;
        }

        // @ts-ignore
        await this.execute(() => window.APP?.conference?.hangup());

        // Wait until _room is unset, which is one of the last things hangup() does.
        await this.driver.waitUntil(
            async () => {
                try {
                    // @ts-ignore
                    return await this.driver.execute(() => window.APP?.conference?._room === undefined);
                } catch (e) {
                    // There seems to be a race condition with hangup() causing the page to change, and execute()
                    // might fail with a Bidi error. Retry.
                    return false;
                }
            },
            {
                timeout: 8000,
                timeoutMsg: `${this.name} failed to hang up`
            }
        );
        console.log(`Hung up (${this.name})`);

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
     * Checks if video is currently received for the given remote endpoint ID (there is a track, it's not muted,
     * and it's streaming status according to the connection-indicator is active).
     */
    async isRemoteVideoReceived(endpointId: string): Promise<boolean> {
        return this.execute(e => JitsiMeetJS.app.testing.isRemoteVideoReceived(e), endpointId);
    }

    /**
     * Checks if the remove video is displayed for the given remote endpoint ID.
     * @param endpointId
     */
    async isRemoteVideoDisplayed(endpointId: string): Promise<boolean> {
        return this.driver.$(
            `//span[@id="participant_${endpointId}" and contains(@class, "display-video")]`).isExisting();
    }

    /**
     * Check if remote video for a specific remote endpoint is both received and displayed.
     * @param endpointId
     */
    async isRemoteVideoReceivedAndDisplayed(endpointId: string): Promise<boolean> {
        return await this.isRemoteVideoReceived(endpointId) && await this.isRemoteVideoDisplayed(endpointId);
    }

    /**
     * Waits for a specific participant to be displayed on large video.
     *
     * @param {string} expectedEndpointId - The endpoint ID of the participant expected on large video.
     * @param {string} timeoutMsg - Optional custom timeout message.
     * @param {number} timeout - Optional timeout in milliseconds (default: 30000).
     * @returns {Promise<void>}
     */
    async waitForParticipantOnLargeVideo(
            expectedEndpointId: string,
            timeoutMsg?: string,
            timeout: number = 30_000): Promise<void> {
        await this.driver.waitUntil(
            async () => await this.getLargeVideo().getResource() === expectedEndpointId,
            {
                timeout,
                timeoutMsg: timeoutMsg || `Expected ${expectedEndpointId} on large video for ${this.name}`
            });
    }

    /**
     * Waits for remote video state - receiving and displayed.
     * @param endpointId
     * @param reverse if true, waits for the remote video to NOT be received AND NOT displayed.
     */
    async waitForRemoteVideo(endpointId: string, reverse = false) {
        if (reverse) {
            await this.driver.waitUntil(async () =>
                !await this.isRemoteVideoReceived(endpointId) && !await this.isRemoteVideoDisplayed(endpointId), {
                timeout: 15_000,
                timeoutMsg: `expected remote video for ${endpointId} to not be received 15s by ${this.name}`
            });
        } else {
            await this.driver.waitUntil(async () =>
                await this.isRemoteVideoReceivedAndDisplayed(endpointId), {
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

    /**
     * Returns the token that this participant was initialized with.
     */
    getToken(): IToken | undefined {
        return this._token;
    }

    /**
     * Gets the dial in pin for the conference. Reads it from the invite dialog if the pin hasn't been cached yet.
     */
    async getDialInPin(): Promise<string> {
        if (!this._dialInPin) {
            const dialInPin = await this.getInviteDialog().getPinNumber();

            await this.getInviteDialog().clickCloseButton();

            this._dialInPin = dialInPin;
        }

        return this._dialInPin;
    }
}
