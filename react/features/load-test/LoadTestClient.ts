// @ts-expect-error
import { getLogger } from '@jitsi/logger';
// @ts-expect-error
import jwtDecode from 'jwt-decode';

import { IConfig } from '../base/config/configType';

import {
    DEFAULT_MAX_FULL_RESOLUTION_PARTICIPANTS,
    DEFAULT_NUMBER_OF_VISIBLE_TILES,
    VIDEO_QUALITY_LEVELS,
    largeVideoHeight,
    qualityForHeight,
    tileViewTileHeight,
    verticalFilmstripVisibleCount
} from './layout';

const logger = getLogger('load-test-client');

/**
 * The parameters shared by all the clients of a page.
 */
export interface ILoadTestParams {
    /** Whether to attach the incoming media to media elements (only the first client ever does). */
    autoPlayVideo: boolean;

    /** The JWT to connect with, if any. */
    jwt?: string;

    /** Whether to send audio (do GUM for audio and add the track). */
    localAudio: boolean;

    /** Whether to send video. */
    localVideo: boolean;

    /** Whether to receive audio. */
    remoteAudio: boolean;

    /** Whether to receive video. */
    remoteVideo: boolean;

    /** The name of the room to join. */
    roomName: string;

    /** Whether to emulate stage view (the dominant speaker in high resolution) rather than tile view. */
    stageView: boolean;

    /** The height of the window the emulated client is assumed to have, which decides the video sizes it asks for. */
    windowHeight: number;

    /** The width of the window the emulated client is assumed to have. */
    windowWidth: number;
}

interface IReceiverConstraints {
    constraints: Record<string, { maxHeight: number; }>;
    defaultConstraints: { maxHeight: number; };
    lastN: number;
    onStageSources: string[];
}

interface IRemoteVideoSource {
    participantId: string;
    sourceName: string;
}

function appendURLParam(url: string, name: string, value: string): string {
    const newUrl = new URL(url);

    newUrl.searchParams.append(name, value);

    return newUrl.toString();
}

/**
 * A lib-jitsi-meet only conference participant, used to generate load.
 */
export class LoadTestClient {
    readonly id: number;
    readonly config: IConfig;
    readonly params: ILoadTestParams;

    connection: any = null;
    room: any = null;
    numParticipants = 1;
    localTracks: any[] = [];
    remoteTracks: Record<string, any[]> = {};
    visitor = false;

    private dataChannelOpen = false;
    private leaving = false;
    private onStageParticipant: string | null = null;
    private localAudio: boolean;
    private receiverConstraints?: IReceiverConstraints;

    /** The remote video sources, in the order they showed up: the order the filmstrip would list them in. */
    private remoteVideoSources: IRemoteVideoSource[] = [];

    private readonly onConnectionSuccessBound = this.onConnectionSuccess.bind(this);
    private readonly onConnectionFailedBound = this.onConnectionFailed.bind(this);
    private readonly onConnectionRedirectedBound = this.onConnectionRedirected.bind(this);
    private readonly disconnectBound = this.disconnect.bind(this);

    /**
     * Creates a client; call connect() to start it.
     *
     * @param {number} id - The index of the client within the page.
     * @param {IConfig} config - The client's own copy of the config, which it modifies.
     * @param {ILoadTestParams} params - The page parameters.
     */
    constructor(id: number, config: IConfig, params: ILoadTestParams) {
        this.id = id;
        this.config = config;
        this.params = params;
        this.localAudio = params.localAudio;

        this.updateConfig();
    }

    /**
     * Points the XMPP connection URLs and the HTTP conference request URL at the room, as jitsi-meet does
     * (react/features/base/connection/actions.any.ts): deployments that route by room name rely on it.
     *
     * @returns {void}
     */
    private updateConfig(): void {
        const room = this.params.roomName.toLowerCase();
        const conf = this.config as any;

        conf.serviceUrl = conf.bosh = appendURLParam(conf.websocket || conf.bosh, 'room', room);
        if (conf.websocketKeepAliveUrl) {
            conf.websocketKeepAliveUrl = appendURLParam(conf.websocketKeepAliveUrl, 'room', room);
        }
        if (conf.conferenceRequestUrl) {
            conf.conferenceRequestUrl = appendURLParam(conf.conferenceRequestUrl, 'room', room);
        }
    }

    /**
     * Whether the emulated client is in stage view: when asked to, or with fewer than 3 participants, when
     * jitsi-meet does not use tile view either.
     *
     * @returns {boolean}
     */
    private isStageView(): boolean {
        return this.params.stageView || this.numParticipants < 3;
    }

    /**
     * Emulation of jitsi-meet's receiver constraints (react/features/video-quality/subscriber.ts) for a client
     * with a window of the configured size, in the common case: no pinning, no screen sharing, default filmstrip.
     *
     * Only the sources that would be visible get a non-zero constraint. In tile view those are the first page of
     * tiles, at the quality the tile height allows (capped at 360 beyond maxFullResolutionParticipants). In stage
     * view the on-stage source gets the large video quality and the first filmstrip page gets the thumbnail quality.
     * The lastN value is what the config says, -1 by default, as in jitsi-meet.
     *
     * @param {boolean} force - Whether to send the constraints even if they did not change.
     * @returns {void}
     */
    private updateReceiverConstraints(force = false): void {
        if (!this.dataChannelOpen || !this.room || this.leaving) {
            return;
        }

        const { windowHeight, windowWidth } = this.params;
        const conf = this.config as any;
        const constraints: IReceiverConstraints = {
            constraints: {},
            defaultConstraints: { maxHeight: VIDEO_QUALITY_LEVELS.NONE },
            lastN: conf.startLastN ?? conf.channelLastN ?? -1,
            onStageSources: []
        };
        const maxFullResolutionParticipants
            = conf.maxFullResolutionParticipants ?? DEFAULT_MAX_FULL_RESOLUTION_PARTICIPANTS;

        if (this.isStageView()) {
            const onStageSource = this.onStageParticipant
                ? this.remoteVideoSources.find(s => s.participantId === this.onStageParticipant)?.sourceName
                : undefined;
            const thumbnailQuality = VIDEO_QUALITY_LEVELS.LOW;

            this.remoteVideoSources.slice(0, verticalFilmstripVisibleCount(windowHeight)).forEach(s => {
                constraints.constraints[s.sourceName] = { maxHeight: thumbnailQuality };
            });

            if (onStageSource) {
                constraints.constraints[onStageSource] = { maxHeight: qualityForHeight(largeVideoHeight(windowHeight)) };
                constraints.onStageSources = [ onStageSource ];
            }
        } else {
            const visible = this.remoteVideoSources.slice(
                0, conf.tileView?.numberOfVisibleTiles ?? DEFAULT_NUMBER_OF_VISIBLE_TILES);
            let quality = qualityForHeight(tileViewTileHeight(this.numParticipants, windowWidth, windowHeight));

            if (maxFullResolutionParticipants !== -1 && visible.length > maxFullResolutionParticipants
                    && quality > VIDEO_QUALITY_LEVELS.STANDARD) {
                quality = VIDEO_QUALITY_LEVELS.STANDARD;
            }

            visible.forEach(s => {
                constraints.constraints[s.sourceName] = { maxHeight: quality };
            });
        }

        if (force || JSON.stringify(constraints) !== JSON.stringify(this.receiverConstraints)) {
            this.receiverConstraints = constraints;
            logger.log(`Participant ${this.id}: receiver constraints ${JSON.stringify(constraints)}`);
            this.room.setReceiverConstraints(constraints);
        }
    }

    /**
     * Records a remote video source, in filmstrip order.
     *
     * @param {Object} track - The remote video track.
     * @returns {void}
     */
    private addRemoteVideoSource(track: any): void {
        const sourceName = track.getSourceName();

        if (sourceName && !this.remoteVideoSources.some(s => s.sourceName === sourceName)) {
            this.remoteVideoSources.push({ participantId: track.getParticipantId(), sourceName });
        }
    }

    /**
     * Picks who is on stage when nobody is or when the on-stage participant left: like jitsi-meet's
     * _electLastVisibleRemoteParticipant, the most recent remote participant with video.
     *
     * @returns {boolean} Whether the on stage participant changed.
     */
    private electOnStageParticipant(): boolean {
        if (this.onStageParticipant && this.room.getParticipantById(this.onStageParticipant)) {
            return false;
        }

        const last = this.remoteVideoSources[this.remoteVideoSources.length - 1];
        const newOnStageParticipant = last?.participantId ?? null;

        if (newOnStageParticipant !== this.onStageParticipant) {
            this.onStageParticipant = newOnStageParticipant;

            return true;
        }

        return false;
    }

    /**
     * Whether a participant ID is a valid ID for stage view.
     *
     * @param {string} id - The participant ID.
     * @returns {boolean}
     */
    private isValidStageViewParticipant(id: string): boolean {
        return id !== this.room.myUserId() && Boolean(this.room.getParticipantById(id));
    }

    /**
     * Simple emulation of jitsi-meet's stage view participant selection behavior. Doesn't take into account
     * pinning or screen sharing, and the initial behavior is slightly different.
     *
     * @param {string} selected - The new dominant speaker.
     * @param {Array<string>} previous - The previous dominant speakers, most recent first.
     * @returns {boolean} Whether the on stage participant changed.
     */
    private selectStageViewParticipant(selected: string, previous: string[]): boolean {
        let newOnStageParticipant: string | undefined;

        if (this.isValidStageViewParticipant(selected)) {
            newOnStageParticipant = selected;
        } else {
            newOnStageParticipant = previous.find(id => this.isValidStageViewParticipant(id));
        }
        if (newOnStageParticipant && newOnStageParticipant !== this.onStageParticipant) {
            this.onStageParticipant = newOnStageParticipant;

            return true;
        }

        return false;
    }

    /**
     * Mutes or unmutes the local audio, creating the track on first unmute if it does not exist yet.
     *
     * @param {boolean} mute - Whether to mute.
     * @returns {void}
     */
    muteAudio(mute: boolean): void {
        this.localAudio = !mute;

        let localAudioTrack = this.room.getLocalAudioTrack();

        if (mute) {
            localAudioTrack?.mute();

            return;
        }

        if (this.visitor) {
            logger.warn(`Participant ${this.id}: In visitor mode, not unmuting audio.`);

            return;
        }
        if (localAudioTrack) {
            localAudioTrack.unmute();

            return;
        }

        // See if we created it but haven't added it.
        localAudioTrack = this.localTracks.find(track => track.getType() === 'audio');
        if (localAudioTrack) {
            localAudioTrack.unmute();
            this.room.replaceTrack(null, localAudioTrack);
        } else {
            JitsiMeetJS.createLocalTracks({ devices: [ 'audio' ] })
                .then(([ audioTrack ]: any[]) => this.room.addTrack(audioTrack))
                .catch((e: unknown) => logger.error(e));
        }
    }

    /**
     * Called when the number of participants changes.
     *
     * @returns {void}
     */
    private setNumberOfParticipants(): void {
        if (this.id === 0) {
            const el = document.getElementById('participants');

            if (el) {
                el.textContent = String(this.numParticipants);
            }
        }
        this.updateReceiverConstraints();
    }

    private onDataChannelOpened(): void {
        this.dataChannelOpen = true;
        this.updateReceiverConstraints();
    }

    private onDominantSpeakerChanged(selected: string, previous: string[]): void {
        if (this.selectStageViewParticipant(selected, previous) && this.isStageView()) {
            this.updateReceiverConstraints();
        }
    }

    private onTrackRemoved(track: any): void {
        if (track.isLocal() || track.getType() !== 'video') {
            return;
        }

        const sourceName = track.getSourceName();

        this.remoteVideoSources = this.remoteVideoSources.filter(s => s.sourceName !== sourceName);
        this.electOnStageParticipant();
        this.updateReceiverConstraints();
    }

    /**
     * Attaches a media element for a track to the page. Only the first client renders anything.
     *
     * @param {Object} track - The JitsiTrack.
     * @param {string} id - The element ID.
     * @param {boolean} autoplay - Whether the element autoplays.
     * @param {boolean} muted - Whether the element is muted.
     * @returns {void}
     */
    private attachTrack(track: any, id: string, autoplay: boolean, muted = false): void {
        const element = document.createElement(track.getType() === 'video' ? 'video' : 'audio');

        element.id = id;
        element.autoplay = autoplay;
        element.muted = muted;
        document.body.appendChild(element);
        track.attach(element);
    }

    private onLocalTracks(tracks: any[] = []): void {
        this.localTracks = tracks;
        for (let i = 0; i < this.localTracks.length; i++) {
            const track = this.localTracks[i];

            if (track.getType() === 'video') {
                if (this.id === 0) {
                    this.attachTrack(track, `localVideo${i}`, this.params.autoPlayVideo);
                }
                this.room.addTrack(track);
            } else {
                if (this.localAudio) {
                    this.room.addTrack(track);
                } else {
                    track.mute();
                }
                if (this.id === 0) {
                    this.attachTrack(track, `localAudio${i}`, true, true);
                }
            }
        }
    }

    private onRemoteTrack(track: any): void {
        if (!track.isLocal() && track.getType() === 'video') {
            this.addRemoteVideoSource(track);
            this.electOnStageParticipant();
            this.updateReceiverConstraints();
        }

        if (track.isLocal()
            || (track.getType() === 'video' && !this.params.remoteVideo)
            || (track.getType() === 'audio' && !this.params.remoteAudio)) {
            return;
        }
        const participant = track.getParticipantId();

        if (!this.remoteTracks[participant]) {
            this.remoteTracks[participant] = [];
        }

        if (this.id !== 0) {
            return;
        }

        const idx = this.remoteTracks[participant].push(track);

        this.attachTrack(track, `${participant}${track.getType()}${idx}`, true);
    }

    private onConferenceJoined(): void {
        logger.log(`Participant ${this.id} Conference joined`);

        // Delay processing USER_JOINED events until the MUC is fully joined,
        // otherwise the apparent conference size will be wrong.
        this.numParticipants = this.room.getParticipantCount();
        this.setNumberOfParticipants();
        this.room.on(JitsiMeetJS.events.conference.USER_JOINED, this.onUserJoined.bind(this));
        this.room.on(JitsiMeetJS.events.conference._MEDIA_SESSION_STARTED, this.onMediaSessionStarted.bind(this));
    }

    /**
     * Handles start muted events, when audio and/or video are muted due to startAudioMuted or startVideoMuted
     * policy.
     *
     * @returns {void}
     */
    private onStartMuted(): void {
        // Give it some time, as it may be currently in the process of muting
        setTimeout(() => {
            const localAudioTrack = this.room.getLocalAudioTrack();

            if (this.localAudio && localAudioTrack?.isMuted()) {
                localAudioTrack.unmute();
            }

            const localVideoTrack = this.room.getLocalVideoTrack();

            if (this.params.localVideo && localVideoTrack?.isMuted()) {
                localVideoTrack.unmute();
            }
        }, 2000);
    }

    private onUserJoined(id: string): void {
        this.numParticipants++;
        this.setNumberOfParticipants();
        this.remoteTracks[id] = [];
    }

    private onMediaSessionStarted(): void {
        this.updateReceiverConstraints(true);
    }

    private onUserLeft(id: string): void {
        this.numParticipants--;
        this.remoteVideoSources = this.remoteVideoSources.filter(s => s.participantId !== id);
        if (this.onStageParticipant === id) {
            this.onStageParticipant = null;
            this.electOnStageParticipant();
        }
        this.setNumberOfParticipants();

        const tracks = this.remoteTracks[id];

        if (!tracks || this.id !== 0) {
            return;
        }

        for (let i = 0; i < tracks.length; i++) {
            const container = document.getElementById(`${id}${tracks[i].getType()}${i + 1}`);

            if (container) {
                tracks[i].detach(container);
                container.parentElement?.removeChild(container);
            }
        }
    }

    private onPrivateMessage(_id: string, text: string): void {
        switch (text) {
        case 'video on':
            this.onVideoOnMessage();
            break;
        }
    }

    /**
     * Handles 'video on' private messages.
     *
     * @returns {void}
     */
    private onVideoOnMessage(): void {
        if (this.visitor) {
            logger.warn(`Participant ${this.id}: In visitor mode, not turning video on.`);

            return;
        }

        logger.debug(`Participant ${this.id}: Turning my video on!`);

        const localVideoTrack = this.room.getLocalVideoTrack();

        if (localVideoTrack?.isMuted()) {
            logger.debug(`Participant ${this.id}: Unmuting existing video track.`);
            localVideoTrack.unmute();
        } else if (!localVideoTrack) {
            JitsiMeetJS.createLocalTracks({ devices: [ 'video' ] })
                .then(([ videoTrack ]: any[]) => this.room.replaceTrack(null, videoTrack))
                .then(() => {
                    logger.debug(`Participant ${this.id}: Successfully added a new video track for unmute.`);
                })
                .catch((e: unknown) => logger.error(e));
        } else {
            logger.log(`Participant ${this.id}: No-op! We are already video unmuted!`);
        }
    }

    private onConferenceFailed(error: unknown): void {
        if (error !== JitsiMeetJS.errors.conference.REDIRECTED) {
            logger.error(error);
        }
    }

    private onConnectionRedirected(vnode: string, focusJid: string): void {
        logger.log(`Participant ${this.id}: redirecting to visitor node ${vnode} with focusJid=${focusJid}`);
        this.connection.disconnect().then(() => {
            this.visitor = true;

            const conf = this.config as any;
            const oldDomain = conf.hosts.domain;

            conf.hosts.domain = `${vnode}.meet.jitsi`;
            conf.hosts.muc = conf.hosts.muc.replace(oldDomain, conf.hosts.domain);
            conf.focusUserJid = focusJid;
            conf.disableFocus = true;

            // Not every deployment configures all three (BOSH only, or no keep-alive URL).
            for (const key of [ 'bosh', 'websocket', 'websocketKeepAliveUrl' ]) {
                if (conf[key]) {
                    conf[key] = appendURLParam(conf[key], 'vnode', vnode);
                }
            }

            this.localTracks.forEach(track => track.mute());

            this.updateConfig();
            this.connect();
        });
    }

    /**
     * Connects to the XMPP server; joins the room once connected.
     *
     * @returns {void}
     */
    connect(): void {
        const { jwt } = this.params;

        if (jwt) {
            try {
                const { context } = jwtDecode<any>(jwt);

                if (context?.user?.role === 'visitor') {
                    (this.config as any).preferVisitor = true;
                }
            } catch (e) {
                logger.error(e);
            }
        }

        this.connection = new JitsiMeetJS.JitsiConnection(null, jwt, this.config);
        this.connection.addEventListener(
            JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, this.onConnectionSuccessBound);
        this.connection.addEventListener(
            JitsiMeetJS.events.connection.CONNECTION_FAILED, this.onConnectionFailedBound);
        this.connection.addEventListener(
            JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, this.disconnectBound);
        this.connection.addEventListener(
            JitsiMeetJS.events.connection.CONNECTION_REDIRECTED, this.onConnectionRedirectedBound);
        this.connection.connect({ name: this.params.roomName });
    }

    private onConnectionSuccess(): void {
        const { roomName, localVideo } = this.params;
        const events = JitsiMeetJS.events.conference;

        this.room = this.connection.initJitsiConference(roomName.toLowerCase(), this.config);
        this.room.on(events.STARTED_MUTED, this.onStartMuted.bind(this));
        this.room.on(events.TRACK_ADDED, this.onRemoteTrack.bind(this));
        this.room.on(events.TRACK_REMOVED, this.onTrackRemoved.bind(this));
        this.room.on(events.CONFERENCE_JOINED, this.onConferenceJoined.bind(this));
        this.room.on(events.DATA_CHANNEL_OPENED, this.onDataChannelOpened.bind(this));
        this.room.on(events.USER_LEFT, this.onUserLeft.bind(this));
        this.room.on(events.PRIVATE_MESSAGE_RECEIVED, this.onPrivateMessage.bind(this));
        this.room.on(events.CONFERENCE_FAILED, this.onConferenceFailed.bind(this));
        // Stage view is also what jitsi-meet uses below 3 participants, so always follow the dominant speaker.
        this.room.on(events.DOMINANT_SPEAKER_CHANGED, this.onDominantSpeakerChanged.bind(this));

        const devices: string[] = [];

        if (!this.visitor) {
            if (localVideo) {
                devices.push('video');
            }
            if (!this.config.disableInitialGUM) {
                devices.push('audio');
            }
        }

        if (devices.length > 0) {
            JitsiMeetJS.createLocalTracks({ devices })
                .then(this.onLocalTracks.bind(this))
                .then(() => this.room.join())
                .catch((error: unknown) => {
                    logger.error(`Participant ${this.id}: failed to create local tracks`, error);
                });
        } else {
            this.room.join();
        }
    }

    private onConnectionFailed(): void {
        logger.error(`Participant ${this.id}: Connection Failed!`);
    }

    /**
     * Called when the connection is disconnected: stops listening on it.
     *
     * @returns {void}
     */
    disconnect(): void {
        logger.log('disconnect!');
        this.connection.removeEventListener(
            JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, this.onConnectionSuccessBound);
        this.connection.removeEventListener(
            JitsiMeetJS.events.connection.CONNECTION_FAILED, this.onConnectionFailedBound);
        this.connection.removeEventListener(
            JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, this.disconnectBound);
    }

    /**
     * Leaves the conference and disconnects, releasing the local tracks.
     *
     * @returns {void}
     */
    unload(): void {
        // Leaving removes every remote track, which would otherwise trigger a flurry of constraint updates.
        this.leaving = true;
        this.localTracks.forEach(track => track.dispose());
        this.room?.leave();
        this.connection?.disconnect();
    }
}
