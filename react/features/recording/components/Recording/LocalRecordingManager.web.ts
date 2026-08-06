import { v4 as uuidV4 } from 'uuid';
import fixWebmDuration from 'webm-duration-fix';

import { IStore } from '../../../app/types';
import { getRoomName } from '../../../base/conference/functions';
import i18next from '../../../base/i18n/i18next';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { PARTICIPANT_ROLE } from '../../../base/participants/constants';
import { getLocalTrack, getTrackState } from '../../../base/tracks/functions';
import { isEmbedded } from '../../../base/util/embedUtils';
import { showWarningNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';
import logger from '../../logger';

interface ISelfRecording {
    on: boolean;
    withVideo: boolean;
}

interface ILocalRecordingManager {
    addAudioTrackToLocalRecording: (track: MediaStreamTrack) => void;
    audioContext: AudioContext | undefined;
    audioDestination: MediaStreamAudioDestinationNode | undefined;
    cachedScreenShareElements?: { lastCheck: number; localVideo: Element | null; remoteVideo: Element | null; };
    cachedScreenSharePaths?: { path1: Path2D; path2: Path2D; };
    canvas: HTMLCanvasElement | undefined;
    checkMemoryUsage: () => void;
    createLayer: (canvas: HTMLCanvasElement | undefined) => any;
    criticalMemoryWarningShown: boolean;
    ctx: any;
    currentMemoryUsage: number;
    dispatch: IStore['dispatch'] | null;
    forceStopAndSave: (() => void) | null;
    getFilename: () => string;
    imageBrand: any;
    initializeAudioMixer: () => void;
    isLeavingFromButton: boolean;
    isRecordingLocally: () => boolean;
    isSupported: () => boolean;
    mediaType: string;
    meetingLeaveHandler: (() => void) | null;
    memoryWarningShown: boolean;
    mixAudioStream: (stream: MediaStream) => void;
    paintID: number;
    recordInterval: any;
    recordVideos: () => any;
    recorder: MediaRecorder | undefined;
    recordingData: Blob[];
    recordingSaved: boolean;
    recordingTimeslice?: number;
    roomName: string;
    saveRecording: (recordingData: Blob[], filename: string) => void;
    selfRecording: ISelfRecording;
    startLocalRecording: (store: IStore, onlySelf: boolean) => Promise<void>;
    stopAutoSave: () => void;
    stopLocalRecording: () => void;
    stream: MediaStream | undefined;
    totalSize: number;
}

const getMimeType = (): string => {
    // Codecs ordered to avoid avc1 issues on resolution changes.
    const possibleTypes = [
        'video/mp4;codecs=h264,aac', // H264 + AAC - most flexible on resolution changes
        'video/mp4;codecs=h264', // Generic H264 - let the browser decide
        'video/webm;codecs=vp8,opus', // VP8 - stable on dynamic changes
        'video/webm;codecs=vp9,opus', // VP9 - higher quality
        'video/mp4', // Base MP4 - fallback (may pick avc1)
        'video/webm' // Base WebM - last resort
    ];

    for (const type of possibleTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    throw new Error('No MIME Type supported by MediaRecorder');
};

const MAX_SIZE = Number.MAX_SAFE_INTEGER; // Unlimited
const MEMORY_SAFETY_THRESHOLD = 536870912; // 512MB memory safety threshold

const RECORDING_LOGO_SRC = 'images/jitsilogo.png';
const RECORDING_FONT = 'sans-serif';

// Helper function to draw the moderator icon.
const drawModeratorIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 12) => {
    // Save the canvas state
    ctx.save();

    // Posiziona e scala
    ctx.translate(x, y);
    ctx.scale(size / 32, size / 32); // The original SVG is 32x32

    // Draw an EMPTY moderator star (outline only) using the real IconModerator path
    ctx.fillStyle = 'transparent'; // Transparent inside
    ctx.strokeStyle = '#ffffff'; // White border
    ctx.lineWidth = 2; // Thicker stroke for better visibility (adapted for the 32x32 scale)

    // Path reale dell'icona host.svg (IconModerator)
    const moderatorPath = 'M16 20.563l5 3-1.313-5.688 4.438-3.875-5.875-0.5-2.25-5.375-2.25 5.375-5.875 0.5 4.438 3.875-1.313 5.688zM29.313 12.313l-7.25 6.313 2.188 9.375-8.25-5-8.25 5 2.188-9.375-7.25-6.313 9.563-0.813 3.75-8.813 3.75 8.813z';

    const path = new Path2D(moderatorPath);

    ctx.stroke(path); // Stroke only, no fill

    // Ripristina stato canvas
    ctx.restore();
};

// Lazily initialize.
let preferredMediaType: string;

const LocalRecordingManager: ILocalRecordingManager = {
    canvas: undefined,
    ctx: null,
    dispatch: null,
    cachedScreenSharePaths: undefined,
    imageBrand: null,
    recordInterval: undefined,
    paintID: 0,
    recordingData: [],
    recorder: undefined,
    stream: undefined,
    audioContext: undefined,
    audioDestination: undefined,
    roomName: '',
    totalSize: MAX_SIZE,
    currentMemoryUsage: 0,
    memoryWarningShown: false,
    criticalMemoryWarningShown: false,
    recordingSaved: false,
    isLeavingFromButton: false,
    selfRecording: {
        on: false,
        withVideo: false
    },

    get mediaType() {
        if (this.selfRecording.on && !this.selfRecording.withVideo) {
            return 'audio/webm;';
        }
        if (!preferredMediaType) {
            preferredMediaType = getMimeType();
        }

        return preferredMediaType;
    },

    /**
     * Initializes audio context used for mixing audio tracks.
     *
     * @returns {void}
     */
    initializeAudioMixer() {
        this.audioContext = new AudioContext();
        this.audioDestination = this.audioContext.createMediaStreamDestination();
    },

    /**
     * Mixes multiple audio tracks to the destination media stream.
     *
     * @param {MediaStream} stream - The stream to mix.
     * @returns {void}
     * */
    mixAudioStream(stream) {
        if (stream.getAudioTracks().length > 0 && this.audioDestination) {
            this.audioContext?.createMediaStreamSource(stream).connect(this.audioDestination);
        }
    },

    /**
     * Adds audio track to the recording stream.
     *
     * @param {MediaStreamTrack} track - The track to be added.
     * @returns {void}
     */
    addAudioTrackToLocalRecording(track) {
        if (this.selfRecording.on) {
            return;
        }
        if (track) {
            const stream = new MediaStream([ track ]);

            this.mixAudioStream(stream);
        }
    },

    /**
     * Returns a filename based ono the Jitsi room name in the URL and timestamp.
     *
     * @returns {string}
     * */
    getFilename() {
        const now = new Date();
        const dateString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;

        return `video_${this.roomName}_${dateString}`;
    },

    /**
     * Saves the recording to file with format optimization.
     *
     * @param {Array} recordingData - The recording data.
     * @param {string} filename - The name of the file.
     * @returns {void}
     * */
    async saveRecording(recordingData, filename) {
        try {
            // Make sure there is valid data to save
            if (!recordingData || recordingData.length === 0) {
                logger.warn('No recording data to save');

                return;
            }

            // @ts-ignore - bypass the TypeScript conflict with BlobOptions
            const blob = new Blob(recordingData, { type: this.mediaType });

            // Make sure the blob has content
            if (blob.size === 0) {
                logger.warn('The recording is empty, nothing to save');

                return;
            }

            // Fix the duration for WebM files (resolves compatibility issues)
            let finalBlob = blob;

            if (this.mediaType.includes('webm') && blob.size > 1000) {
                try {
                    // @ts-ignore
                    finalBlob = await fixWebmDuration(blob);
                } catch (error) {
                    logger.warn('Unable to fix the WebM duration:', error);
                    finalBlob = blob; // Use the original blob on error
                }
            }

            // @ts-ignore -- URL.createObjectURL/revokeObjectURL not typed in this ts-loader context
            const url = URL.createObjectURL(finalBlob);
            const a = document.createElement('a');

            // Determine the extension - prefer MP4 for universal seeking compatibility
            let extension = 'mp4'; // default for maximum compatibility

            // MP4 for universal Windows/macOS native-player compatibility
            if (this.mediaType.includes('mp4')) {
                extension = 'mp4';
            } else if (this.mediaType.includes('webm')) {
                extension = 'webm';
            }

            a.style.display = 'none';
            a.href = url;
            a.download = `${filename}.${extension}`;
            a.click();

            // Cleanup
            // @ts-ignore -- URL.createObjectURL/revokeObjectURL not typed in this ts-loader context
            setTimeout(() => URL.revokeObjectURL(url), 1000);

        } catch (error) {
            logger.error('Error while saving the recording:', error);
        }
    },

    /**
     * Monitors memory usage and warns the user when it grows too large.
     *
     * @returns {void}
     */
    checkMemoryUsage() {
        this.currentMemoryUsage = this.recordingData.reduce((total, chunk) => total + chunk.size, 0);

        // Informational warnings only - no backup is taken.
        if (this.currentMemoryUsage > MEMORY_SAFETY_THRESHOLD) {
            if (this.currentMemoryUsage > MEMORY_SAFETY_THRESHOLD * 2 && !this.memoryWarningShown) {
                // Show a user-visible warning (only once).
                this.memoryWarningShown = true;
                if (this.dispatch) {
                    this.dispatch(showWarningNotification({
                        titleKey: 'recording.highMemoryUsageTitle',
                        descriptionKey: 'recording.highMemoryUsageMessage'
                    }, NOTIFICATION_TIMEOUT_TYPE.LONG));
                } else {
                    logger.warn('Memory usage very high - consider stopping the recording if the meeting is over');
                }
            }
        }
    },


    /**
     * Stops local recording.
     *
     * @returns {void}
     * */
    stopLocalRecording() {
        this.forceStopAndSave?.();

        // Clear restart flags when the recording is stopped manually
        try {
            localStorage.removeItem('jitsi_was_recording_before_reload');
            localStorage.removeItem('jitsi_recording_timestamp');
            localStorage.removeItem('jitsi_recording_onlyself');
            localStorage.removeItem('jitsi_reload_from_stay');
            localStorage.removeItem('jitsi_last_meeting_exit_type');
        } catch (e) {
            // Ignore localStorage errors
        }

        if (this.canvas?.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
        this.canvas = undefined;
        this.ctx = null;
        this.audioContext = undefined;
        this.audioDestination = undefined;
        this.totalSize = MAX_SIZE;
        this.memoryWarningShown = false;
        this.criticalMemoryWarningShown = false;

        // Safety timeout for late-arriving data
        setTimeout(() => {
            if (this.recordingData.length > 0 && !this.recordingSaved) {
                this.recordingSaved = true;
                const dataToSave = [ ...this.recordingData ];

                this.recordingData = [];
                this.saveRecording(dataToSave, this.getFilename());
            }
        }, 1000);
    },
    createLayer(canvas) {
        const layer = document.createElement('canvas');

        // @ts-ignore
        layer.width = canvas.width;
        // @ts-ignore
        layer.height = canvas.height;

        const ctx = layer.getContext('2d');

        // Rendering optimizations for better quality
        if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            // @ts-ignore - experimental property for text quality
            ctx.textRendering = 'geometricPrecision';
        }

        return ctx;
    },
    recordVideos() {
        // Helper that lazily initializes the canvas
        const ensureCanvasExists = () => {
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.canvas.style.imageRendering = 'auto';
                (document.body || document.documentElement).appendChild(this.canvas);

                this.ctx = this.canvas.getContext('2d', {
                    willReadFrequently: true,
                    alpha: false,
                    desynchronized: false,
                    powerPreference: 'default'
                });

                // Also initialize the audio mixer if missing
                if (!this.audioContext) {
                    this.initializeAudioMixer();
                }
            }
        };

        const resizeCanvas = (cssWidth: number, cssHeight: number) => {
            if (!this.canvas || !this.ctx) {
                return;
            }

            const dpr = window.devicePixelRatio || 1;

            const targetWidth = Math.floor(cssWidth * dpr);
            const targetHeight = Math.floor(cssHeight * dpr);

            // Avoid needless resizes (which reset the context)
            if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
                this.canvas.width = targetWidth;
                this.canvas.height = targetHeight;

                this.canvas.style.width = `${cssWidth}px`;
                this.canvas.style.height = `${cssHeight}px`;

                // Reset e applica scala DPR
                this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
        };

        this.imageBrand = new Image();
        this.imageBrand.src = RECORDING_LOGO_SRC;

        // Helper that computes the logo dimensions while keeping its aspect ratio.
        const getLogoDimensions = (targetWidth = 180) => {
            if (!this.imageBrand.complete || this.imageBrand.naturalWidth === 0) {
                return { width: targetWidth, height: 25 }; // Fallback if the image is not loaded
            }

            const aspectRatio = this.imageBrand.naturalWidth / this.imageBrand.naturalHeight;
            const calculatedHeight = targetWidth / aspectRatio;

            return {
                width: targetWidth,
                height: Math.round(calculatedHeight)
            };
        };

        // Cache for screen-share detection - avoids freezes during transitions.
        const cachedScreenShareElements: {
            lastCheck: number;
            localVideo: Element | null;
            remoteVideo: Element | null;
        } = {
            localVideo: null,
            remoteVideo: null,
            lastCheck: 0
        };

        const SCREEN_SHARE_CACHE_DURATION = 200; // Longer cache for transition stability

        const paint = () => {
            // Canvas safety check: make sure it always exists during screen sharing
            if (!this.canvas || !this.ctx) {
                const hasActiveScreenShare = document.querySelector('#localScreenShare_container')
                                           || Array.from(document.querySelectorAll('span[id]')).find(span =>
                                               /^participant_[a-zA-Z0-9]+-v\d+$/.test(span.id)
                                           )?.querySelector('video');

                // Recreate the canvas when needed, without touching the stream
                if (hasActiveScreenShare) {
                    ensureCanvasExists();
                }

                if (!this.canvas || !this.ctx) {
                    logger.warn('Canvas not available - stopping the paint loop');

                    return;
                }
            }

            const store = APP.store;
            const { local, remote } = store.getState()['features/base/participants'];

            // Dynamic resolution based on the number of participants to avoid stalls
            const totalParticipants = Object.keys(remote).length + 1; // +1 for the local participant
            let elementWidth, elementHeight;

            if (totalParticipants <= 4) {
                // 1-4 participants: maximum quality
                elementWidth = 1920;
                elementHeight = 1080;
            } else if (totalParticipants <= 9) {
                // 5-9 participants: medium-high quality
                elementWidth = 1280;
                elementHeight = 720;
            } else {
                // 10+ participants: medium quality to avoid stalls
                elementWidth = 960;
                elementHeight = 540;
            }

            const paddingX = 10;
            const paddingY = 10;

            let videos;
            let numElements = 1;
            let numColumns = 1;
            let numRows = 1;

            const whiteboardVideo: HTMLCanvasElement | null = document.querySelector('.excalidraw__canvas');

            // Screen-share detection with cache to avoid freezes during transitions
            const now = Date.now();

            if ((now - cachedScreenShareElements.lastCheck) > SCREEN_SHARE_CACHE_DURATION) {
                // Update the cache only when needed
                cachedScreenShareElements.localVideo = document.querySelector('#localScreenShare_container');

                const matchingSpan = Array.from(document.querySelectorAll('span[id]')).find(span =>
                    /^participant_[a-zA-Z0-9]+-v\d+$/.test(span.id)
                );

                cachedScreenShareElements.remoteVideo = matchingSpan?.querySelector('video') || null;
                cachedScreenShareElements.lastCheck = now;
            }

            const localScreenShareVideo = cachedScreenShareElements.localVideo;
            const videoEl = cachedScreenShareElements.remoteVideo;

            // If a screen share exists (local or remote), render it with type-specific logic
            if (localScreenShareVideo || videoEl) {
                const videoElement = (localScreenShareVideo || videoEl) as HTMLVideoElement;

                if (!this.canvas || !this.ctx) {
                    logger.warn('Canvas not available for the screen share');

                    return;
                }

                resizeCanvas(elementWidth, elementHeight);

                // Screen-share rendering (Chrome tabs, full screen, windows)
                try {
                    if (videoElement.readyState >= 2
                        && videoElement.videoWidth > 0
                        && !videoElement.paused) {
                        this.ctx.drawImage(videoElement, 0, 0, elementWidth, elementHeight);
                    } else {
                        this.ctx.fillStyle = '#000000';
                        this.ctx.fillRect(0, 0, elementWidth, elementHeight);
                    }
                } catch (error) {
                    logger.debug('Temporary error while rendering the screen share:', error);
                    this.ctx.fillStyle = '#1a1a1a';
                    this.ctx.fillRect(0, 0, elementWidth, elementHeight);
                }

                const layerSharerInfo = this.createLayer(this.canvas);

                layerSharerInfo.fillStyle = 'white';
                layerSharerInfo.font = `bold 16px ${RECORDING_FONT}`;

                // Draw the logo keeping its aspect ratio.
                const logoDims = getLogoDimensions(180);

                layerSharerInfo.drawImage(this.imageBrand, 20, 20, logoDims.width, logoDims.height);

                let sharerName: string = i18next.t('localRecording.screenSharing');

                // Sharer's webcam thumbnail (if available)
                let sharerWebcam: HTMLVideoElement | null = null;

                if (localScreenShareVideo) {
                    // Local share - optimized lookup (avoids a full DOM scan)
                    sharerWebcam = document.querySelector('video[id*="localVideo"]') as HTMLVideoElement
                                  || document.querySelector('.videocontainer video') as HTMLVideoElement;

                    if (local?.name) {
                        sharerName = i18next.t('localRecording.screenSharingOf', { name: local.name });
                    }
                } else if (videoEl) {
                    // Remote share - look up the participant's webcam and name
                    // Find the screen-share container span
                    const screenShareSpan = videoEl.closest('span[id]') as HTMLElement | null;
                    const sharerSpanId = screenShareSpan?.id;

                    if (sharerSpanId) {
                        // Extract the participant ID from the screen share (format: participant_ID-v0)
                        const participantId = sharerSpanId.replace(/-v\d+$/, '');

                        // Extract the real participant ID (without the participant_ prefix)
                        const realParticipantId = participantId.split('_')[1];

                        // Read the name from the Redux store (more reliable than the DOM)
                        const remoteParticipant = realParticipantId ? remote.get(realParticipantId) : null;

                        if (remoteParticipant?.name) {
                            sharerName = i18next.t('localRecording.screenSharingOf', { name: remoteParticipant.name });
                        } else {
                            // Fallback: look in the DOM if not found in the Redux store
                            const sharerNameElement = document.querySelector(`#${participantId}_name`)
                                                     || document.querySelector(`[id*="${participantId}"]:not([id*="-v"]) .displayname`)
                                                     || document.querySelector(`[id*="${realParticipantId}"] .displayname`);

                            if (sharerNameElement?.textContent?.trim()) {
                                const name = sharerNameElement.textContent.trim();

                                sharerName = i18next.t('localRecording.screenSharingOf', { name });
                            }
                        }

                        // Look up the same participant's webcam video using several possible patterns
                        const webcamSpan = document.querySelector(`span[id="${participantId}"]`)
                                          || document.querySelector(`span[id*="${participantId}"]:not([id*="-v"])`)
                                          || document.querySelector(`[id="${participantId}_container"]`);

                        sharerWebcam = webcamSpan?.querySelector('video') as HTMLVideoElement;

                        // If the standard patterns fail, search across all videos
                        if (!sharerWebcam || sharerWebcam.videoWidth === 0) {
                            const allVideos = Array.from(document.querySelectorAll('video'));

                            sharerWebcam = allVideos.find(v =>
                                v.parentElement?.id?.includes(realParticipantId)
                                && !v.parentElement?.id?.includes('-v')
                                && v.videoWidth > 0
                            ) as HTMLVideoElement;
                        }
                    }
                }

                // Draw the webcam thumbnail if available and active
                if (sharerWebcam
                    && sharerWebcam.videoWidth > 0
                    && sharerWebcam.videoHeight > 0
                    && sharerWebcam.srcObject
                    && !sharerWebcam.paused
                    && sharerWebcam.readyState >= 2) { // HAVE_CURRENT_DATA o superiore

                    // Optimized check: use the cache to avoid intensive checks
                    let hasActiveVideoTrack = true; // Assume active to avoid expensive checks

                    // Check only when needed (roughly every 10 frames)
                    if (Math.random() < 0.1) {
                        const mediaStream = sharerWebcam.srcObject as MediaStream;
                        const videoTracks = mediaStream?.getVideoTracks() || [];

                        hasActiveVideoTrack = videoTracks.some(track =>
                            track.enabled && track.readyState === 'live'
                        );
                    }

                    if (hasActiveVideoTrack) {
                        const thumbnailWidth = 165; // 10% larger for better visibility
                        const thumbnailHeight = 92; // Keeps a 16:9 ratio with a 10% increase
                        const thumbnailX = elementWidth - thumbnailWidth - 20; // 20px from the right edge
                        const thumbnailY = 20; // 20px dall'alto

                        // Black border for the thumbnail
                        layerSharerInfo.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        layerSharerInfo.fillRect(thumbnailX - 2, thumbnailY - 2, thumbnailWidth + 4, thumbnailHeight + 4);

                        // Draw the sharer's webcam
                        layerSharerInfo.drawImage(sharerWebcam, thumbnailX, thumbnailY, thumbnailWidth, thumbnailHeight);

                        // Reset colore testo
                        layerSharerInfo.fillStyle = 'white';
                    }
                }

                // Gradient background for the sharer's name (with space for the icon)
                const iconSpace = 25; // Space for the screen-share icon
                const textMetrics = layerSharerInfo.measureText(sharerName);
                const textWidth = textMetrics.width;
                const textHeight = 20; // Approximate text height
                const bgX = 15; // Padding from the edge
                const bgY = elementHeight - 35; // Original position for screen sharing
                const bgWidth = textWidth + iconSpace + 10; // Background width with padding + icon
                const bgHeight = textHeight + 5; // Background height

                // Gradient from dark (bottom) to transparent (top)
                const gradient = layerSharerInfo.createLinearGradient(0, bgY + bgHeight, 0, bgY);

                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)'); // Dark at the bottom
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent at the top

                layerSharerInfo.fillStyle = gradient;
                layerSharerInfo.fillRect(bgX, bgY, bgWidth, bgHeight);

                // Use the real IconScreenshare with its SVG path
                layerSharerInfo.save();
                layerSharerInfo.translate(20, elementHeight - 30);
                layerSharerInfo.scale(0.75, 0.75); // Scale it down
                layerSharerInfo.fillStyle = 'transparent';
                layerSharerInfo.strokeStyle = '#ffffff';
                layerSharerInfo.lineWidth = 1.5;

                // SVG path cache - avoids costly parsing on every frame
                if (!this.cachedScreenSharePaths) {
                    const screenSharePath1 = 'M14.8464 6.22103C14.2729 5.67701 13.327 6.08352 13.327 6.87396V8.60046C8.62852 8.92199 4.8467 12.239 4.52225 16.4471C4.48676 16.9074 4.78878 17.2544 5.14194 17.3656C5.48464 17.4735 5.90666 17.373 6.15309 17.0188C8.33798 13.8785 11.4845 13.1373 13.327 13.0452V15.2002C13.327 15.9986 14.2893 16.4017 14.8583 15.8416L19.1656 11.6016C19.5284 11.2444 19.523 10.6577 19.1536 10.3073L14.8464 6.22103ZM14.827 10.0749V8.27022L17.6708 10.9682L14.827 13.7676V11.5731L14.109 11.5424C12.5831 11.4771 9.42974 11.7986 6.73783 14.1317C7.99338 11.7842 10.7375 10.0749 14.077 10.0749H14.827Z';
                    const screenSharePath2 = 'M4.5 3C2.84315 3 1.5 4.34315 1.5 6V17.25C1.5 18.9069 2.84315 20.25 4.5 20.25H5.25C4.83579 20.25 4.5 20.5858 4.5 21C4.5 21.4142 4.83579 21.75 5.25 21.75H18.75C19.1642 21.75 19.5 21.4142 19.5 21C19.5 20.5858 19.1642 20.25 18.75 20.25H19.5C21.1569 20.25 22.5 18.9069 22.5 17.25V6C22.5 4.34315 21.1569 3 19.5 3H4.5ZM19.5 4.5H4.5C3.67157 4.5 3 5.17157 3 6V17.25C3 18.0784 3.67157 18.75 4.5 18.75H19.5C20.3284 18.75 21 18.0784 21 17.25V6C21 5.17157 20.3284 4.5 19.5 4.5Z';

                    this.cachedScreenSharePaths = {
                        path1: new Path2D(screenSharePath1),
                        path2: new Path2D(screenSharePath2)
                    };
                }

                // Use the cached paths
                layerSharerInfo.stroke(this.cachedScreenSharePaths.path1);
                layerSharerInfo.stroke(this.cachedScreenSharePaths.path2);

                layerSharerInfo.restore();

                // Reset the color for the text
                layerSharerInfo.fillStyle = 'white';
                layerSharerInfo.fillText(
                    sharerName,
                    20 + iconSpace, // Positioned after the icon
                    elementHeight - 15 // Positioned 15px from the bottom edge (lower, within the opaque area)
                );

                this.ctx.drawImage(layerSharerInfo.canvas, 0, 0);

                // Throttling adjusted to the resolution of the shared content
                const isHighRes = videoElement.videoWidth >= 1280 && videoElement.videoHeight >= 720;
                const frameDelay = isHighRes ? 16 : 33; // ~60 FPS for high resolution, ~30 FPS for low

                setTimeout(() => {
                    this.paintID = requestAnimationFrame(paint);
                }, frameDelay);

                return;
            }

            // Fallback: nobody is sharing and the moderator exposes no whiteboard -> show the webcams in a grid.
            if (whiteboardVideo === null || whiteboardVideo.width === 0) {
                videos = Array.from(document.querySelectorAll('span.display-video video')) as HTMLVideoElement[];

                // Keep only videos with active content
                const activeVideos = videos.filter(v =>
                    v.videoWidth > 0
                    && v.videoHeight > 0
                    && v.srcObject
                    && !v.paused
                    && v.readyState >= 2
                );

                numElements = activeVideos.length;

                // If no webcam is active, show an informational screen
                if (numElements === 0) {
                    resizeCanvas(elementWidth, elementHeight);

                    // Dark background
                    this.ctx.fillStyle = '#1a1a1a';
                    this.ctx.fillRect(0, 0, elementWidth, elementHeight);

                    const layerInfo = this.createLayer(this.canvas);

                    layerInfo.fillStyle = 'white';
                    layerInfo.font = `bold 32px ${RECORDING_FONT}`;

                    // Draw the logo keeping its aspect ratio.
                    const logoDims = getLogoDimensions(180);

                    layerInfo.drawImage(this.imageBrand, 20, 20, logoDims.width, logoDims.height);

                    const message = i18next.t('localRecording.noWebcamActive');
                    const messageWidth = layerInfo.measureText(message).width;

                    layerInfo.fillText(
                        message,
                        (elementWidth - messageWidth) / 2,
                        elementHeight / 2
                    );

                    this.ctx.drawImage(layerInfo.canvas, 0, 0);

                    setTimeout(() => {
                        this.paintID = requestAnimationFrame(paint);
                    }, 100); // Slower update when there is no content

                    return;
                }

                videos = activeVideos;
                numColumns = Math.ceil(Math.sqrt(numElements));
                numRows = Math.ceil(numElements / numColumns);
            }

            // Canvas safety check for the grid
            if (!this.canvas || !this.ctx) {
                logger.warn('Canvas not available for the grid');

                return;
            }

            resizeCanvas(
                ((elementWidth + paddingX) * numColumns) + paddingX,
                ((elementHeight + paddingY) * numRows) + paddingY
            );

            const layerParticipantName = this.createLayer(this.canvas);

            layerParticipantName.fillStyle = 'white';

            // Font scaled to the number of participants to keep proportions
            // For a single webcam (full screen) use a smaller size for better proportion
            let scaledFontSize;

            if (numElements === 1) {
                scaledFontSize = 20; // Reduced for full screen
            } else {
                scaledFontSize = Math.max(16, Math.min(28, 28 / Math.sqrt(numElements)));
            }
            layerParticipantName.font = `bold ${scaledFontSize}px ${RECORDING_FONT}`;

            // Draw the logo keeping its aspect ratio.
            const logoDims = getLogoDimensions(180);

            layerParticipantName.drawImage(this.imageBrand, paddingX + 20, paddingY + 20, logoDims.width, logoDims.height);

            let name: any;

            if (whiteboardVideo !== null && whiteboardVideo.width !== 0) {
                this.ctx.drawImage(whiteboardVideo, 0, 0, elementWidth, elementHeight);
            } else {
                for (let i = 0; i < numElements; i++) {
                    const elementX = ((i % numColumns) * (elementWidth + paddingX)) + paddingX;
                    const elementY = (Math.floor(i / numColumns) * (elementHeight + paddingY)) + paddingY;

                    name = '';
                    let isModerator = false;

                    // @ts-ignore
                    if (videos[i].id === 'localVideo_container') {
                        name = local?.name || '';
                        isModerator = local?.role === PARTICIPANT_ROLE.MODERATOR;
                    } else {
                        // @ts-ignore
                        const parentId = document.querySelector('#' + videos[i].id)?.parentElement?.id;

                        name = document.querySelector('#' + parentId + '_name')?.textContent || '';

                        // Find the matching remote participant to check if they are a moderator
                        const participantId = parentId?.replace('_container', '').split('_')[1];
                        const remoteParticipant = participantId ? remote.get(participantId) : null;

                        isModerator = remoteParticipant?.role === PARTICIPANT_ROLE.MODERATOR;
                    }

                    // Gradient background for the participant name (includes space for the moderator icon)
                    if (name) {
                        const textMetrics = layerParticipantName.measureText(name);
                        const textWidth = textMetrics.width;
                        const textHeight = scaledFontSize + 2; // Height based on the font size
                        const iconSpace = isModerator ? 18 : 0; // Space for the moderator icon (12px + 6px padding)

                        const bgX = elementX + 15; // Padding from the edge
                        const bgY = elementY + elementHeight - 40; // Background positioned higher, near the text
                        const bgWidth = textWidth + iconSpace + 10; // Background width with padding + optional icon
                        const bgHeight = textHeight + 5; // Background height

                        // Gradient from dark (bottom) to transparent (top)
                        const gradient = layerParticipantName.createLinearGradient(0, bgY + bgHeight, 0, bgY);

                        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)'); // Dark at the bottom
                        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent at the top

                        layerParticipantName.fillStyle = gradient;
                        layerParticipantName.fillRect(bgX, bgY, bgWidth, bgHeight);

                        // Reset the color for the text
                        layerParticipantName.fillStyle = 'white';
                    }

                    layerParticipantName.fillText(name, elementX + 20, elementY + elementHeight - 15); // Positioned 15px from the bottom edge (lower, within the opaque area)

                    // Draw the moderator icon INSIDE the background if needed
                    if (isModerator && name) {
                        const textMetrics = layerParticipantName.measureText(name);
                        const iconX = elementX + 20 + textMetrics.width + 6; // 6px of space after the name

                        // Proportional Y alignment: lower for a single webcam
                        const iconY = numElements === 1
                            ? elementY + elementHeight - 30 // Star higher for the single view
                            : elementY + elementHeight - 35; // Original position for the grid

                        // Proportional icon size: smaller for full screen
                        const iconSize = numElements === 1 ? 18 : 24;

                        drawModeratorIcon(layerParticipantName, iconX, iconY, iconSize);
                    }

                    // @ts-ignore
                    this.ctx.drawImage(videos[i], elementX, elementY, elementWidth, elementHeight);
                }
            }

            // Final safety check before drawing
            if (!this.canvas || !this.ctx) {
                logger.warn('Canvas lost during rendering');

                return;
            }

            this.ctx.drawImage(layerParticipantName.canvas, 0, 0);
            this.paintID = requestAnimationFrame(paint);
        };

        this.paintID = requestAnimationFrame(paint);

        // FPS tuned for smoothness without overload
        const fps = 25; // 25 FPS - balanced between smoothness and performance

        // SAFARI FIX: set the initial canvas size BEFORE captureStream
        // Safari locks the stream resolution at call time

        if (this.canvas && this.ctx) {
            const initialWidth = 1920;
            const initialHeight = 1080;

            this.canvas.width = initialWidth;
            this.canvas.height = initialHeight;

            this.canvas.style.width = initialWidth + 'px';
            this.canvas.style.height = initialHeight + 'px';

            // reset the transform for safety
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        if (this.canvas && 'captureStream' in this.canvas) {
            // @ts-ignore
            return this.canvas.captureStream(fps);
        } else if (this.canvas && 'webkitCaptureStream' in this.canvas) {
            // @ts-ignore
            return this.canvas.webkitCaptureStream(fps);
        }

        // Fallback if the canvas is not available
        return null;
    },

    /**
     * Starts a local recording.
     *
     * @param {IStore} store - The redux store.
     * @param {boolean} onlySelf - Whether to record only self streams.
     * @returns {void}
     */
    async startLocalRecording(store, onlySelf) {
        const { dispatch, getState } = store;

        // Store dispatch to use it for notifications
        this.dispatch = dispatch;

        // @ts-ignore
        const supportsCaptureHandle = Boolean(navigator.mediaDevices.setCaptureHandleConfig) && !isEmbedded();
        const tabId = uuidV4();

        this.selfRecording.on = onlySelf;
        this.recordingData = [];
        this.roomName = getRoomName(getState()) ?? '';
        const tracks = getTrackState(getState());

        if (onlySelf) {
            let audioTrack: MediaStreamTrack | undefined = getLocalTrack(tracks, MEDIA_TYPE.AUDIO)?.jitsiTrack?.track;
            let videoTrack: MediaStreamTrack | undefined = getLocalTrack(tracks, MEDIA_TYPE.VIDEO)?.jitsiTrack?.track;

            if (!audioTrack) {
                APP.conference.muteAudio(false);
                setTimeout(() => APP.conference.muteAudio(true), 100);
                await new Promise(resolve => {
                    setTimeout(resolve, 100);
                });
            }
            if (videoTrack && videoTrack.readyState !== 'live') {
                videoTrack = undefined;
            }
            audioTrack = getLocalTrack(getTrackState(getState()), MEDIA_TYPE.AUDIO)?.jitsiTrack?.track;
            if (!audioTrack && !videoTrack) {
                throw new Error('NoLocalStreams');
            }
            this.selfRecording.withVideo = Boolean(videoTrack);
            const localTracks = [];

            audioTrack && localTracks.push(audioTrack);
            videoTrack && localTracks.push(videoTrack);
            this.stream = new MediaStream(localTracks);
        } else {
            if (supportsCaptureHandle) {
                // @ts-ignore
                navigator.mediaDevices.setCaptureHandleConfig({
                    handle: `JitsiMeet-${tabId}`,
                    permittedOrigins: [ '*' ]
                });
            }
            const localAudioTrack = getLocalTrack(tracks, MEDIA_TYPE.AUDIO)?.jitsiTrack?.track;

            // Starting chrome 107, the recorder does not record any data if the audio stream has no tracks
            // To fix this we create a track for the local user(muted track)
            if (!localAudioTrack) {
                APP.conference.muteAudio(false);
                setTimeout(() => APP.conference.muteAudio(true), 100);
                await new Promise(resolve => {
                    setTimeout(resolve, 100);
                });
            }

            // handle no mic permission
            if (!getLocalTrack(getTrackState(getState()), MEDIA_TYPE.AUDIO)?.jitsiTrack?.track) {
                throw new Error('NoMicTrack');
            }

            const currentTitle = document.title;

            document.title = i18next.t('localRecording.selectTabTitle');

            this.canvas = document.createElement('canvas');

            // Conservative canvas optimizations for universal compatibility
            this.canvas.style.imageRendering = 'auto'; // More compatible standard

            (document.body || document.documentElement).appendChild(this.canvas);

            this.ctx = this.canvas.getContext('2d', {
                willReadFrequently: true,
                alpha: false, // Performance without transparency
                desynchronized: false, // Conservative for compatibility
                powerPreference: 'default' // Compatible with all devices
            });

            document.title = currentTitle;

            this.initializeAudioMixer();

            const allTracks = getTrackState(getState());

            allTracks.forEach((track: any) => {
                if (track.mediaType === MEDIA_TYPE.AUDIO) {
                    const audioTrack = track?.jitsiTrack?.track;

                    this.addAudioTrackToLocalRecording(audioTrack);
                }
            });

            const videoStream = this.recordVideos();

            this.stream = new MediaStream([
                ...this.audioDestination?.stream.getAudioTracks() || [],
                ...(videoStream ? videoStream.getTracks() : [])
            ]);
        }

        // Let the browser manage quality and bitrate automatically
        // for maximum cross-platform compatibility

        const recorderOptions: MediaRecorderOptions = {
            mimeType: this.mediaType
            // Bitrate specifics removed to let the browser decide
            // Automatic parameters = better compatibility
        };

        // Minimal options for maximum cross-platform compatibility
        if (!onlySelf) {
            // Only for multi-participant recordings
            // Let the browser manage the parameters automatically
        }

        this.recorder = new MediaRecorder(this.stream, recorderOptions);

        this.forceStopAndSave = () => {
            const recorder = this.recorder;

            if (!recorder || recorder.state === 'inactive') {
                return;
            }

            // If we already saved, do nothing
            if (this.recordingSaved) {
                return;
            }

            // SAVE IMMEDIATELY BEFORE stopping the recorder
            // This guarantees the save even if the page closes right after
            if (this.recordingData.length > 0) {
                this.recordingSaved = true; // Set the flag ONLY if we are saving
                const dataToSave = [ ...this.recordingData ];

                this.recordingData = []; // Clear BEFORE saving to avoid duplicates
                this.saveRecording(dataToSave, this.getFilename());
            }

            this.recorder = undefined; // immediate lock to avoid multiple calls

            try {
                recorder.stop();
                // Already saved above - do not clear the flags here because
                // the cleanup is handled upstream in meetingLeaveHandler

            } catch (error) {
                logger.error('Error during forced stop:', error);
                // Even on error, try to save
                if (this.recordingData.length > 0 && !this.recordingSaved) {
                    this.recordingSaved = true;
                    const dataToSave = [ ...this.recordingData ];

                    this.recordingData = [];
                    this.saveRecording(dataToSave, `${this.getFilename()}_rescue`);
                }
            }
        };

        // The native popup is not needed - we rely on pagehide for the real leave

        // Handler for leaving the meeting via the UI (red "Hang up" button click)
        this.meetingLeaveHandler = () => {
            if (this.isRecordingLocally()) {
                this.isLeavingFromButton = true; // Mark that the user is leaving via the button

                // NORMAL EXIT (button): immediately clear all restart flags
                // to avoid a spurious auto-restart on re-entry
                try {
                    localStorage.removeItem('jitsi_was_recording_before_reload');
                    localStorage.removeItem('jitsi_recording_timestamp');
                    localStorage.removeItem('jitsi_recording_onlyself');
                    localStorage.removeItem('jitsi_reload_from_stay');
                    localStorage.setItem('jitsi_last_meeting_exit_type', 'button');
                    localStorage.setItem('jitsi_last_meeting_exit', Date.now().toString());
                } catch (e) {
                }

                this.forceStopAndSave?.();
            }
        };

        this.recorder.addEventListener('dataavailable', e => {
            if (e.data && e.data.size > 0 && !this.recordingSaved) {
                this.recordingData.push(e.data);

                // Check memory instead of totalSize
                this.checkMemoryUsage();

                // Critical check: show a more urgent notification if memory keeps growing (only once)
                if (this.currentMemoryUsage > MEMORY_SAFETY_THRESHOLD * 3 && !this.criticalMemoryWarningShown) {
                    this.criticalMemoryWarningShown = true;
                    if (this.dispatch) {
                        this.dispatch(showWarningNotification({
                            titleKey: 'recording.criticalMemoryUsageTitle',
                            descriptionKey: 'recording.criticalMemoryUsageMessage'
                        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
                    } else {
                        logger.warn(i18next.t('recording.criticalMemoryUsageMessage'));
                    }
                }
            }
        });

        if (!onlySelf) {
            this.recorder.addEventListener('stop', () => {
                this.stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
                cancelAnimationFrame(this.paintID);
            });

            this.stream.addEventListener('inactive', () => {
                this.forceStopAndSave?.();
            });

        }


        // Interval tuned for stability and compatibility
        const recordingInterval = onlySelf ? 4000 : 3000; // Balanced for memory and stability

        this.recordingTimeslice = recordingInterval;
        this.recorder.start(recordingInterval);

        // Reset counters for a clean recording
        this.currentMemoryUsage = 0;
        this.memoryWarningShown = false;
        this.criticalMemoryWarningShown = false;
        this.recordingSaved = false;

        // Safety net: save if the page closes
        window.addEventListener('pagehide', () => {
            if (this.recordingData.length > 0 && !this.recordingSaved) {
                this.recordingSaved = true;
                const dataToSave = [ ...this.recordingData ];

                this.recordingData = [];
                this.saveRecording(dataToSave, this.getFilename());
            }
        });

        // Network disconnection safeguard
        window.addEventListener('offline', () => {
            if (this.isRecordingLocally()) {
                this.forceStopAndSave?.();
            }
        });

        // WebRTC connection-loss safeguard
        if (this.stream) {
            this.stream.addEventListener('inactive', () => {
                if (this.isRecordingLocally()) {
                    this.forceStopAndSave?.();
                }
            });
        }

    },

    /**
     * Whether or not we're currently recording locally.
     *
     * @returns {boolean}
     */
    isRecordingLocally() {
        return Boolean(this.recorder && this.recorder.state === 'recording');
    },

    /**
     * Whether or not local recording is supported in the current environment.
     *
     * @returns {boolean}
     */
    isSupported() {
        return Boolean(MediaRecorder
            && navigator.mediaDevices
            && (navigator.mediaDevices as any).getDisplayMedia);
    },

    /**
     * Stops the auto-save interval.
     *
     * @returns {void}
     */
    stopAutoSave() {
        if (this.recordInterval) {
            clearInterval(this.recordInterval);
            this.recordInterval = undefined;
        }
    },

    forceStopAndSave: null,
    meetingLeaveHandler: null
};

export default LocalRecordingManager;
