/* global interfaceConfig */

import UIUtil from "../util/UIUtil";
/**
 * Responsible for drawing audio levels.
 */
const AudioLevels = {

    /**
     * The number of dots per class. We have 2 classes of dots "top" and
     * "bottom". The total number of dots will be twice the below value.
     */
    _AUDIO_LEVEL_DOTS: 3,

    /**
     * Creates the audio level indicator span element.
     *
     * @return {Element} the document element representing audio levels
     */
    createThumbnailAudioLevelIndicator() {

        let audioSpan = document.createElement('span');
        audioSpan.className = 'audioindicator';

        for (let i = 0; i < this._AUDIO_LEVEL_DOTS*2; i++) {
            var audioDot = document.createElement('span');
            audioDot.className = (i < this._AUDIO_LEVEL_DOTS)
                                    ? "audiodot-top"
                                    : "audiodot-bottom";

            audioSpan.appendChild(audioDot);
        }
        return audioSpan;
    },

    /**
     * Updates the audio level UI for the given id.
     *
     * @param id id of the user for whom we draw the audio level
     * @param audioLevel the newAudio level to render
     */
    updateThumbnailAudioLevel (id, audioLevel) {
        let audioSpan = document.getElementById(id)
                            .getElementsByClassName("audioindicator");

        if (audioSpan && audioSpan.length > 0)
            audioSpan = audioSpan[0];
        else
            return;

        let audioTopDots
            = audioSpan.getElementsByClassName("audiodot-top");
        let audioBottomDots
            = audioSpan.getElementsByClassName("audiodot-bottom");

        let coloredDots = Math.round(this._AUDIO_LEVEL_DOTS*audioLevel);
        let topColoredDots = this._AUDIO_LEVEL_DOTS - coloredDots;

        for (let i = 0; i < audioTopDots.length; i++) {
            if (i < topColoredDots)
                audioTopDots[i].style.opacity = 0;
            else if (i === topColoredDots && topColoredDots > 0)
                audioTopDots[i].style.opacity = 0.5;
            else
                audioTopDots[i].style.opacity = 1;
        }

        for (let i = 0; i < audioBottomDots.length; i++) {
            if (i < coloredDots)
                audioBottomDots[i].style.opacity = 1;
            else if (i === coloredDots && coloredDots > 0)
                audioBottomDots[i].style.opacity = 0.5;
            else
                audioBottomDots[i].style.opacity = 0;
        }
    },

    /**
     * Updates the audio level of the large video.
     *
     * @param audioLevel the new audio level to set.
     */
    updateLargeVideoAudioLevel(elementId, audioLevel) {
        let element = document.getElementById(elementId);

        if(!UIUtil.isVisible(element))
            return;

        let level = parseFloat(audioLevel);

        level = isNaN(level) ? 0 : level;

        let shadowElement = element.getElementsByClassName("dynamic-shadow");

        if (shadowElement && shadowElement.length > 0)
            shadowElement = shadowElement[0];

        shadowElement.style.boxShadow = this._updateLargeVideoShadow(level);
    },

    /**
     * Updates the large video shadow effect.
     */
    _updateLargeVideoShadow (level) {
        var scale = 2,

        // Internal circle audio level.
        int = {
            level: level > 0.15 ? 20 : 0,
            color: interfaceConfig.AUDIO_LEVEL_PRIMARY_COLOR
        },

        // External circle audio level.
        ext = {
            level: (int.level * scale * level + int.level).toFixed(0),
            color: interfaceConfig.AUDIO_LEVEL_SECONDARY_COLOR
        };

        // Internal blur.
        int.blur = int.level ? 2 : 0;

        // External blur.
        ext.blur = ext.level ? 6 : 0;

        return [
            `0 0 ${ int.blur }px ${ int.level }px ${ int.color }`,
            `0 0 ${ ext.blur }px ${ ext.level }px ${ ext.color }`
        ].join(', ');
    }
};

export default AudioLevels;
