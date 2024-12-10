/* global APP $ */

import { multiremotebrowser } from '@wdio/globals';

import { IConfig } from '../../react/features/base/config/configType';
import { urlObjectToString } from '../../react/features/base/util/uri';
import Filmstrip from '../pageobjects/Filmstrip';
import IframeAPI from '../pageobjects/IframeAPI';
import ParticipantsPane from '../pageobjects/ParticipantsPane';
import Toolbar from '../pageobjects/Toolbar';
import VideoQualityDialog from '../pageobjects/VideoQualityDialog';

import { LOG_PREFIX, logInfo } from './browserLogger';
import { IContext } from './types';

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
        debug: true,
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
     * Returns participant endpoint ID.
     *
     * @returns {Promise<string>} The endpoint ID.
     */
    async getEndpointId(): Promise<string> {
        if (!this._endpointId) {
            this._endpointId = await this.driver.execute(() => { // eslint-disable-line arrow-body-style
                return APP.conference.getMyUserId();
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
     * @param {IContext} context - The context.
     * @param {boolean} skipInMeetingChecks - Whether to skip in meeting checks.
     * @returns {Promise<void>}
     */
    async joinConference(context: IContext, skipInMeetingChecks = false): Promise<void> {
        const config = {
            room: context.roomName,
            configOverwrite: this.config,
            interfaceConfigOverwrite: {
                SHOW_CHROME_EXTENSION_BANNER: false
            },
            userInfo: {
                displayName: this._name
            }
        };

        if (context.iframeAPI) {
            config.room = 'iframeAPITest.html';
        }

        let url = urlObjectToString(config) || '';

        if (context.iframeAPI) {
            const baseUrl = new URL(this.driver.options.baseUrl || '');

            // @ts-ignore
            url = `${this.driver.iframePageBase}${url}&domain="${baseUrl.host}"&room="${context.roomName}"`;

            if (baseUrl.pathname.length > 1) {
                // remove leading slash
                url = `${url}&tenant="${baseUrl.pathname.substring(1)}"`;
            }
        }
        if (this._jwt) {
            url = `${url}&jwt="${this._jwt}"`;
        }

        await this.driver.setTimeout({ 'pageLoad': 30000 });

        // workaround for https://github.com/webdriverio/webdriverio/issues/13956
        if (url.startsWith('file://')) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            await this.driver.url(url).catch(() => {});
        } else {
            await this.driver.url(url.substring(1)); // drop the leading '/' so we can use the tenant if any
        }

        await this.waitForPageToLoad();

        if (context.iframeAPI) {
            const mainFrame = this.driver.$('iframe');

            await this.driver.switchFrame(mainFrame);
        }

        await this.waitToJoinMUC();

        await this.postLoadProcess(skipInMeetingChecks);
    }

    /**
     * Loads stuff after the page loads.
     *
     * @param {boolean} skipInMeetingChecks - Whether to skip in meeting checks.
     * @returns {Promise<void>}
     * @private
     */
    private async postLoadProcess(skipInMeetingChecks: boolean): Promise<void> {
        const driver = this.driver;

        const parallel = [];

        parallel.push(driver.execute((name, sessionId, prefix) => {
            APP.UI.dockToolbar(true);

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

        if (skipInMeetingChecks) {
            await Promise.allSettled(parallel);

            return;
        }

        parallel.push(this.waitForIceConnected());
        parallel.push(this.waitForSendReceiveData());

        await Promise.all(parallel);
    }

    /**
     * Waits for the page to load.
     *
     * @returns {Promise<void>}
     */
    async waitForPageToLoad(): Promise<void> {
        return this.driver.waitUntil(
            () => this.driver.execute(() => document.readyState === 'complete'),
            {
                timeout: 30_000, // 30 seconds
                timeoutMsg: 'Timeout waiting for Page Load Request to complete.'
            }
        );
    }

    /**
     * Checks if the participant is in the meeting.
     */
    isInMuc() {
        return this.driver.execute(() => APP.conference.isJoined());
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
                timeoutMsg: 'Timeout waiting to join muc.'
            }
        );
    }

    /**
     * Waits for ICE to get connected.
     *
     * @returns {Promise<void>}
     */
    async waitForIceConnected(): Promise<void> {
        const driver = this.driver;

        return driver.waitUntil(async () =>
            driver.execute(() => APP.conference.getConnectionState() === 'connected'), {
            timeout: 15_000,
            timeoutMsg: 'expected ICE to be connected for 15s'
        });
    }

    /**
     * Waits for send and receive data.
     *
     * @returns {Promise<void>}
     */
    async waitForSendReceiveData(): Promise<void> {
        const driver = this.driver;

        return driver.waitUntil(async () =>
            driver.execute(() => {
                const stats = APP.conference.getStats();
                const bitrateMap = stats?.bitrate || {};
                const rtpStats = {
                    uploadBitrate: bitrateMap.upload || 0,
                    downloadBitrate: bitrateMap.download || 0
                };

                return rtpStats.uploadBitrate > 0 && rtpStats.downloadBitrate > 0;
            }), {
            timeout: 15_000,
            timeoutMsg: 'expected to receive/send data in 15s'
        });
    }

    /**
     * Waits for remote streams.
     *
     * @param {number} number - The number of remote streams o wait for.
     * @returns {Promise<void>}
     */
    waitForRemoteStreams(number: number): Promise<void> {
        const driver = this.driver;

        return driver.waitUntil(async () =>
            driver.execute(count => APP.conference.getNumberOfParticipantsWithTracks() >= count, number), {
            timeout: 15_000,
            timeoutMsg: 'expected remote streams in 15s'
        });
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
     * Returns the participants pane.
     *
     * @returns {ParticipantsPane}
     */
    getParticipantsPane(): ParticipantsPane {
        return new ParticipantsPane(this);
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
     * Switches to the iframe API context
     */
    async switchToAPI() {
        await this.driver.switchFrame(null);
    }

    /**
     * Switches to the meeting page context.
     */
    async switchInPage() {
        const mainFrame = this.driver.$('iframe');

        await this.driver.switchFrame(mainFrame);
    }

    /**
     * Returns the iframe API for this participant.
     */
    getIframeAPI() {
        return new IframeAPI(this);
    }

    /**
     * Returns the local display name.
     */
    async getLocalDisplayName() {
        const localVideoContainer = this.driver.$('span[id="localVideoContainer"]');

        await localVideoContainer.moveTo();

        const localDisplayName = localVideoContainer.$('span[id="localDisplayName"]');

        return await localDisplayName.getText();
    }
}
