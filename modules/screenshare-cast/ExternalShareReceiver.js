import Logger from '@jitsi/logger';

const logger = Logger.getLogger('modules/screenshare-cast/ExternalShareReceiver');

/**
 * ExternalShareReceiver — direct-cast wireless screenshare, RECEIVER side.
 *
 * A remote sharer (e.g. a laptop) opens a PLAIN RTCPeerConnection straight to THIS
 * Jitsi Meet instance and adds its screen — and, optionally, system audio — tracks.
 * We terminate that peer connection here, take the track(s) off `pc.ontrack`, wrap
 * them as JitsiLocalTracks via the public
 * {@code JitsiMeetJS.createLocalTracksFromMediaStreams}, and hand them to the
 * conference as the local screenshare. No lib-jitsi-meet ProxyConnectionService, no
 * Jingle, no XMPP/Strophe JIDs.
 *
 * This replaces the brittle ProxyConnectionService path. The shape — terminate the
 * peer connection at the TV's Jitsi Meet and let Jitsi move the tracks from this
 * "proxy" PC into the conference PC — is exactly what Spot's screenshare always did,
 * minus the Jingle/XMPP plumbing that made it Chromium-only and audio-less.
 *
 * Design credit: Saúl "saghul" Ibarra Corretgé. His call:
 *   "set up the peer connection directly between the sharer and the TV's instance of
 *    Jitsi Meet, and Jitsi Meet takes the tracks from one PC and puts them into the
 *    other." — "Exactly!"
 * Built on a vanilla RTCPeerConnection so screenshare audio rides along for free and
 * Firefox/Safari are no longer locked out the way ProxyConnectionService locked them.
 *
 * Signalling is plain JSON, carried over the iframe external API (and, in Spaces, the
 * room Durable Object) — never XMPP:
 *   { kind: 'offer',     sdp }        sharer → here   (answered with { kind:'answer', sdp })
 *   { kind: 'answer',    sdp }        here   → sharer
 *   { kind: 'candidate', candidate }  both ways
 *   { kind: 'stop' }                  sharer → here   (tears down)
 */
export default class ExternalShareReceiver {
    /**
     * @param {Object} options
     * @param {Object} options.JitsiMeetJS - The lib-jitsi-meet entry point (provides
     * {@code createLocalTracksFromMediaStreams}).
     * @param {RTCConfiguration} [options.pcConfig] - ICE config for the peer
     * connection. The meeting's own TURN creds work here (same source the old proxy
     * borrowed) — just without the Jingle.
     * @param {Function} options.onSignal - Emit a signalling message back to the
     * sharer: {@code (signal) => void}.
     * @param {Function} options.onTracks - Publish the received screenshare:
     * {@code ({ desktopVideoTrack, desktopAudioTrack }) => void}.
     * @param {Function} [options.onClosed] - Invoked once when the connection closes.
     */
    constructor({ JitsiMeetJS, pcConfig, onSignal, onTracks, onClosed }) {
        this._JitsiMeetJS = JitsiMeetJS;
        this._onSignal = onSignal;
        this._onTracks = onTracks;
        this._onClosed = onClosed;

        this._desktopVideoTrack = null;
        this._desktopAudioTrack = null;
        this._published = false;
        this._closed = false;

        const pc = new RTCPeerConnection(pcConfig || {});

        this._pc = pc;

        pc.addEventListener('icecandidate', ({ candidate }) => {
            if (candidate) {
                this._onSignal({
                    kind: 'candidate',
                    candidate: candidate.toJSON()
                });
            }
        });

        pc.addEventListener('connectionstatechange', () => {
            const state = pc.connectionState;

            logger.info(`external share pc state: ${state}`);

            if (state === 'connected') {
                // By the time the PC is connected, ontrack has fired for every track in
                // the offer, so we know whether audio is present. Publish exactly once.
                this._publish();
            } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
                this.stop();
            }
        });

        pc.addEventListener('track', ({ track }) => this._collectTrack(track));
    }

    /**
     * Handle one inbound signalling message from the sharer.
     *
     * @param {Object} signal - The signalling message (see class doc for shapes).
     * @returns {Promise<void>}
     */
    async handleSignal(signal) {
        if (!signal || this._closed) {
            return;
        }

        try {
            if (signal.kind === 'offer') {
                await this._pc.setRemoteDescription(signal.sdp);
                const answer = await this._pc.createAnswer();

                await this._pc.setLocalDescription(answer);

                // Emit a plain { type, sdp } so it survives structured-clone over
                // postMessage / the room DO (an RTCSessionDescription may not).
                this._onSignal({
                    kind: 'answer',
                    sdp: {
                        type: this._pc.localDescription.type,
                        sdp: this._pc.localDescription.sdp
                    }
                });
            } else if (signal.kind === 'candidate' && signal.candidate) {
                await this._pc.addIceCandidate(signal.candidate);
            } else if (signal.kind === 'stop') {
                this.stop();
            }
        } catch (error) {
            logger.error('external share signal handling failed', error);
        }
    }

    /**
     * Wrap a received MediaStreamTrack as a JitsiLocalTrack and stash it until publish.
     *
     * @param {MediaStreamTrack} track - A track arriving over the peer connection.
     * @private
     * @returns {void}
     */
    _collectTrack(track) {
        // Each received track gets its OWN single-track MediaStream:
        // createLocalTracksFromMediaStreams throws if a stream holds 0 or >1 tracks of
        // the requested kind.
        const stream = new MediaStream([ track ]);
        const isVideo = track.kind === 'video';

        const [ jitsiTrack ] = this._JitsiMeetJS.createLocalTracksFromMediaStreams([ {
            stream,
            track,
            mediaType: track.kind,
            sourceType: 'proxy',
            deviceId: 'proxy:screenshare-cast',
            videoType: isVideo ? 'desktop' : undefined
        } ]);

        if (isVideo) {
            this._desktopVideoTrack = jitsiTrack;
        } else {
            this._desktopAudioTrack = jitsiTrack;
        }

        logger.info(`external share collected ${track.kind} track`);
    }

    /**
     * Hand the collected screenshare track(s) to the conference, exactly once.
     *
     * @private
     * @returns {void}
     */
    _publish() {
        if (this._published || !this._desktopVideoTrack) {
            return;
        }

        this._published = true;
        logger.info(`external share publishing (audio: ${Boolean(this._desktopAudioTrack)})`);
        this._onTracks({
            desktopVideoTrack: this._desktopVideoTrack,
            desktopAudioTrack: this._desktopAudioTrack
        });
    }

    /**
     * Tear down the peer connection. Idempotent.
     *
     * @returns {void}
     */
    stop() {
        if (this._closed) {
            return;
        }

        this._closed = true;

        try {
            this._pc.close();
        } catch (error) {
            // already torn down
        }

        this._onClosed?.();
    }
}
