/* global interfaceConfig */

import UIUtil from "../util/UIUtil";

/**
 * Responsible for drawing audio levels.
 */
const AudioLevels = {

    /**
     * The number of dots.
     *
     * IMPORTANT: functions below assume that this is an odd number.
     */
    _AUDIO_LEVEL_DOTS: 5,

    /**
     * Creates the audio level indicator span element.
     *
     * IMPORTANT: This function assumes that the number of dots is an
     * odd number.
     *
     * @return {Element} the document element representing audio levels
     */
    createThumbnailAudioLevelIndicator() {

        let audioSpan = document.createElement('span');
        audioSpan.className = 'audioindicator';

        this.sideDotsCount = Math.floor(this._AUDIO_LEVEL_DOTS/2);

        for (let i = 0; i < this._AUDIO_LEVEL_DOTS; i++) {
            let audioDot = document.createElement('span');

            // The median index will be equal to the number of dots on each
            // side.
            if (i === this.sideDotsCount)
                audioDot.className = "audiodot-middle";
            else
                audioDot.className = (i < this.sideDotsCount)
                                    ? "audiodot-top"
                                    : "audiodot-bottom";

            audioSpan.appendChild(audioDot);
        }
        return audioSpan;
    },

    /**
     * Updates the audio level UI for the given id.
     *
     * @param {string} id id of the user for whom we draw the audio level
     * @param {number} audioLevel the newAudio level to render
     */
    updateThumbnailAudioLevel (id, audioLevel) {

        // First make sure we are sensitive enough.
        audioLevel *= 1.2;
        audioLevel = Math.min(audioLevel, 1);

        // Let's now stretch the audio level over the number of dots we have.
        let stretchedAudioLevel = (this.sideDotsCount + 1) * audioLevel;
        let dotLevel = 0.0;

        for (let i = 0; i < (this.sideDotsCount + 1); i++) {

            dotLevel = Math.min(1, Math.max(0, (stretchedAudioLevel - i)));
            this._setDotLevel(id, i, dotLevel);
        }
    },

    /**
     * Fills the dot(s) with the specified "index", with as much opacity as
     * indicated by "opacity".
     *
     * @param {string} elementID the parent audio indicator span element
     * @param {number} index the index of the dots to fill, where 0 indicates
     * the middle dot and the following increments point toward the
     * corresponding pair of dots.
     * @param {number} opacity the opacity to set for the specified dot.
     */
    _setDotLevel(elementID, index, opacity) {

        let audioSpan = document.getElementById(elementID)
            .getElementsByClassName("audioindicator");

        // Make sure the audio span is still around.
        if (audioSpan && audioSpan.length > 0)
            audioSpan = audioSpan[0];
        else
            return;

        let audioTopDots
            = audioSpan.getElementsByClassName("audiodot-top");
        let audioDotMiddle
            = audioSpan.getElementsByClassName("audiodot-middle");
        let audioBottomDots
            = audioSpan.getElementsByClassName("audiodot-bottom");

        // First take care of the middle dot case.
        if (index === 0){
            audioDotMiddle[0].style.opacity = opacity;
            return;
        }

        // Index > 0 : we are setting non-middle dots.
        index--;
        audioBottomDots[index].style.opacity = opacity;
        audioTopDots[this.sideDotsCount - index - 1].style.opacity = opacity;
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
