/* global APP, interfaceConfig, $ */
/* jshint -W101 */

import CanvasUtil from './CanvasUtils';
import BottomToolbar from '../toolbars/BottomToolbar';

const LOCAL_LEVEL = 'local';

let ASDrawContext = null;
let audioLevelCanvasCache = {};

function initDominantSpeakerAudioLevels() {
    let ASRadius = interfaceConfig.DOMINANT_SPEAKER_AVATAR_SIZE / 2;
    let ASCenter = (interfaceConfig.DOMINANT_SPEAKER_AVATAR_SIZE + ASRadius) / 2;

    // Draw a circle.
    ASDrawContext.arc(ASCenter, ASCenter, ASRadius, 0, 2 * Math.PI);

    // Add a shadow around the circle
    ASDrawContext.shadowColor = interfaceConfig.SHADOW_COLOR;
    ASDrawContext.shadowOffsetX = 0;
    ASDrawContext.shadowOffsetY = 0;
}

/**
 * Resizes the given audio level canvas to match the given thumbnail size.
 */
function resizeAudioLevelCanvas(audioLevelCanvas, thumbnailWidth, thumbnailHeight) {
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
        shadowLevel
            = Math.round(interfaceConfig.CANVAS_EXTRA/2*(audioLevel/0.3));
    } else if (audioLevel <= 0.6) {
        shadowLevel
            = Math.round(interfaceConfig.CANVAS_EXTRA/2*((audioLevel - 0.3) / 0.3));
    } else {
        shadowLevel
            = Math.round(interfaceConfig.CANVAS_EXTRA/2*((audioLevel - 0.6) / 0.4));
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
        ASDrawContext = $('#dominantSpeakerAudioLevel')[0].getContext('2d');
        initDominantSpeakerAudioLevels();
    },

    /**
     * Updates the audio level canvas for the given id. If the canvas
     * didn't exist we create it.
     */
    updateAudioLevelCanvas (id, thumbWidth, thumbHeight) {
        let videoSpanId = 'localVideoContainer';
        if (id) {
            videoSpanId = `participant_${id}`;
        }

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
            audioLevelCanvas.style.bottom = `-${interfaceConfig.CANVAS_EXTRA/2}px`;
            audioLevelCanvas.style.left = `-${interfaceConfig.CANVAS_EXTRA/2}px`;
            resizeAudioLevelCanvas(audioLevelCanvas, thumbWidth, thumbHeight);

            videoSpan.appendChild(audioLevelCanvas);
        } else {
            audioLevelCanvas = audioLevelCanvas.get(0);

            resizeAudioLevelCanvas(audioLevelCanvas, thumbWidth, thumbHeight);
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
            id = APP.conference.localId;
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

        ASDrawContext.clearRect(0, 0, 300, 300);
        if (!audioLevel) {
            return;
        }

        ASDrawContext.shadowBlur = getShadowLevel(audioLevel);

        // Fill the shape.
        ASDrawContext.fill();
    },

    updateCanvasSize (thumbWidth, thumbHeight) {
        let canvasWidth = thumbWidth + interfaceConfig.CANVAS_EXTRA;
        let canvasHeight = thumbHeight + interfaceConfig.CANVAS_EXTRA;

        BottomToolbar.getThumbs().children('canvas').each(function () {
            $(this).attr('width', canvasWidth);
            $(this).attr('height', canvasHeight);
        });

        Object.keys(audioLevelCanvasCache).forEach(function (id) {
            audioLevelCanvasCache[id].width = canvasWidth;
            audioLevelCanvasCache[id].height = canvasHeight;
        });
    }
};

export default AudioLevels;
