/* global APP, interfaceConfig, $ */
/* jshint -W101 */

import CanvasUtil from './CanvasUtils';
import FilmStrip from '../videolayout/FilmStrip';

const LOCAL_LEVEL = 'local';

let ASDrawContext = null;
let audioLevelCanvasCache = {};
let dominantSpeakerAudioElement = null;

function _initDominantSpeakerAudioLevels(dominantSpeakerAvatarSize) {
    let ASRadius = dominantSpeakerAvatarSize / 2;
    let ASCenter = (dominantSpeakerAvatarSize + ASRadius) / 2;

    // Draw a circle.
    ASDrawContext.beginPath();
    ASDrawContext.arc(ASCenter, ASCenter, ASRadius, 0, 2 * Math.PI);
    ASDrawContext.closePath();

    // Add a shadow around the circle
    ASDrawContext.shadowColor = interfaceConfig.SHADOW_COLOR;
    ASDrawContext.shadowOffsetX = 0;
    ASDrawContext.shadowOffsetY = 0;
}

/**
 * Resizes the given audio level canvas to match the given thumbnail size.
 */
function _resizeAudioLevelCanvas(   audioLevelCanvas,
                                    thumbnailWidth,
                                    thumbnailHeight) {
    audioLevelCanvas.width = thumbnailWidth + interfaceConfig.CANVAS_EXTRA;
    audioLevelCanvas.height = thumbnailHeight + interfaceConfig.CANVAS_EXTRA;
}

/**
 * Draws the audio level canvas into the cached canvas object.
 *
 * @param id of the user for whom we draw the audio level
 * @param audioLevel the newAudio level to render
 */
function drawAudioLevelCanvas(id, audioLevel) {
    if (!audioLevelCanvasCache[id]) {

        let videoSpanId = getVideoSpanId(id);

        let audioLevelCanvasOrig = $(`#${videoSpanId}>canvas`).get(0);

        /*
         * FIXME Testing has shown that audioLevelCanvasOrig may not exist.
         * In such a case, the method CanvasUtil.cloneCanvas may throw an
         * error. Since audio levels are frequently updated, the errors have
         * been observed to pile into the console, strain the CPU.
         */
        if (audioLevelCanvasOrig) {
            audioLevelCanvasCache[id]
                = CanvasUtil.cloneCanvas(audioLevelCanvasOrig);
        }
    }

    let canvas = audioLevelCanvasCache[id];

    if (!canvas) {
        return;
    }

    let drawContext = canvas.getContext('2d');

    drawContext.clearRect(0, 0, canvas.width, canvas.height);

    let shadowLevel = getShadowLevel(audioLevel);

    if (shadowLevel > 0) {
        // drawContext, x, y, w, h, r, shadowColor, shadowLevel
        CanvasUtil.drawRoundRectGlow(
            drawContext,
            interfaceConfig.CANVAS_EXTRA / 2, interfaceConfig.CANVAS_EXTRA / 2,
            canvas.width - interfaceConfig.CANVAS_EXTRA,
            canvas.height - interfaceConfig.CANVAS_EXTRA,
            interfaceConfig.CANVAS_RADIUS,
            interfaceConfig.SHADOW_COLOR,
            shadowLevel);
    }
}

/**
 * Returns the shadow/glow level for the given audio level.
 *
 * @param audioLevel the audio level from which we determine the shadow
 * level
 */
function getShadowLevel (audioLevel) {
    let shadowLevel = 0;

    if (audioLevel <= 0.3) {
        shadowLevel = Math.round(
            interfaceConfig.CANVAS_EXTRA/2*(audioLevel/0.3));
    } else if (audioLevel <= 0.6) {
        shadowLevel = Math.round(
            interfaceConfig.CANVAS_EXTRA/2*((audioLevel - 0.3) / 0.3));
    } else {
        shadowLevel = Math.round(
            interfaceConfig.CANVAS_EXTRA/2*((audioLevel - 0.6) / 0.4));
    }

    return shadowLevel;
}

/**
 * Returns the video span id corresponding to the given user id
 */
function getVideoSpanId(id) {
    let videoSpanId = null;

    if (id === LOCAL_LEVEL || APP.conference.isLocalId(id)) {
        videoSpanId = 'localVideoContainer';
    } else {
        videoSpanId = `participant_${id}`;
    }

    return videoSpanId;
}

/**
 * The audio Levels plugin.
 */
const AudioLevels = {

    init () {
        dominantSpeakerAudioElement =  $('#dominantSpeakerAudioLevel')[0];
        ASDrawContext = dominantSpeakerAudioElement.getContext('2d');

        let parentContainer = $("#dominantSpeaker");
        let dominantSpeakerWidth = parentContainer.width();
        let dominantSpeakerHeight = parentContainer.height();

        dominantSpeakerAudioElement.width = dominantSpeakerWidth;
        dominantSpeakerAudioElement.height = dominantSpeakerHeight;

        let dominantSpeakerAvatar = $("#dominantSpeakerAvatar");
        _initDominantSpeakerAudioLevels(dominantSpeakerAvatar.width());
    },

    /**
     * Updates the audio level canvas for the given id. If the canvas
     * didn't exist we create it.
     */
    createAudioLevelCanvas (id, thumbWidth, thumbHeight) {

        let videoSpanId = (id === "local")
                        ? "localVideoContainer"
                        : `participant_${id}`;

        let videoSpan = document.getElementById(videoSpanId);

        if (!videoSpan) {
            if (id) {
                console.error("No video element for id", id);
            } else {
                console.error("No video element for local video.");
            }
            return;
        }

        let audioLevelCanvas = $(`#${videoSpanId}>canvas`);

        if (!audioLevelCanvas || audioLevelCanvas.length === 0) {

            audioLevelCanvas = document.createElement('canvas');
            audioLevelCanvas.className = "audiolevel";
            audioLevelCanvas.style.bottom
                = `-${interfaceConfig.CANVAS_EXTRA/2}px`;
            audioLevelCanvas.style.left
                = `-${interfaceConfig.CANVAS_EXTRA/2}px`;
            _resizeAudioLevelCanvas(audioLevelCanvas, thumbWidth, thumbHeight);

            videoSpan.appendChild(audioLevelCanvas);
        } else {
            audioLevelCanvas = audioLevelCanvas.get(0);

            _resizeAudioLevelCanvas(audioLevelCanvas, thumbWidth, thumbHeight);
        }
    },

    /**
     * Updates the audio level UI for the given id.
     *
     * @param id id of the user for whom we draw the audio level
     * @param audioLevel the newAudio level to render
     */
    updateAudioLevel (id, audioLevel, largeVideoId) {
        drawAudioLevelCanvas(id, audioLevel);

        let videoSpanId = getVideoSpanId(id);

        let audioLevelCanvas = $(`#${videoSpanId}>canvas`).get(0);

        if (!audioLevelCanvas) {
            return;
        }

        let drawContext = audioLevelCanvas.getContext('2d');

        let canvasCache = audioLevelCanvasCache[id];

        drawContext.clearRect(
            0, 0, audioLevelCanvas.width, audioLevelCanvas.height
        );
        drawContext.drawImage(canvasCache, 0, 0);

        if (id === LOCAL_LEVEL) {
            id = APP.conference.getMyUserId();
            if (!id) {
                return;
            }
        }

        if(id === largeVideoId) {
            window.requestAnimationFrame(function () {
                AudioLevels.updateDominantSpeakerAudioLevel(audioLevel);
            });
        }
    },

    updateDominantSpeakerAudioLevel (audioLevel) {
        if($("#dominantSpeaker").css("visibility") == "hidden"
            || ASDrawContext === null) {
            return;
        }

        ASDrawContext.clearRect(0, 0,
            dominantSpeakerAudioElement.width,
            dominantSpeakerAudioElement.height);

        if (!audioLevel) {
            return;
        }

        ASDrawContext.shadowBlur = getShadowLevel(audioLevel);

        // Fill the shape.
        ASDrawContext.fill();
    },

    updateCanvasSize (localVideo, remoteVideo) {
        let localCanvasWidth
            = localVideo.thumbWidth + interfaceConfig.CANVAS_EXTRA;
        let localCanvasHeight
            = localVideo.thumbHeight + interfaceConfig.CANVAS_EXTRA;
        let remoteCanvasWidth
            = remoteVideo.thumbWidth + interfaceConfig.CANVAS_EXTRA;
        let remoteCanvasHeight
            = remoteVideo.thumbHeight + interfaceConfig.CANVAS_EXTRA;

        let { remoteThumbs, localThumb } = FilmStrip.getThumbs();

        remoteThumbs.children('canvas').each(function () {
            $(this).attr('width', remoteCanvasWidth);
            $(this).attr('height', remoteCanvasHeight);
        });

        if(localThumb) {
            localThumb.children('canvas').each(function () {
                $(this).attr('width', localCanvasWidth);
                $(this).attr('height', localCanvasHeight);
            });
        }
    }
};

export default AudioLevels;
