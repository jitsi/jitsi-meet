/* global interfaceConfig */

import UIUtil from '../util/UIUtil';

/**
 * Responsible for drawing audio levels.
 */
const AudioLevels = {
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
        let audioSpan
            = document.getElementById(elementID)
                .getElementsByClassName('audioindicator');

        // Make sure the audio span is still around.
        if (audioSpan && audioSpan.length > 0) {
            audioSpan = audioSpan[0];
        } else {
            return;
        }

        const audioTopDots
            = audioSpan.getElementsByClassName('audiodot-top');
        const audioDotMiddle
            = audioSpan.getElementsByClassName('audiodot-middle');
        const audioBottomDots
            = audioSpan.getElementsByClassName('audiodot-bottom');

        // First take care of the middle dot case.
        if (index === 0) {
            audioDotMiddle[0].style.opacity = opacity;

            return;
        }

        // Index > 0 : we are setting non-middle dots.
        index--;// eslint-disable-line no-param-reassign
        audioBottomDots[index].style.opacity = opacity;
        audioTopDots[this.sideDotsCount - index - 1].style.opacity = opacity;
    },

    /**
     * Updates the audio level of the large video.
     *
     * @param audioLevel the new audio level to set.
     */
    updateLargeVideoAudioLevel(elementId, audioLevel) {
        const element = document.getElementById(elementId);

        if (!UIUtil.isVisible(element)) {
            return;
        }

        let level = parseFloat(audioLevel);

        level = isNaN(level) ? 0 : level;

        let shadowElement = element.getElementsByClassName('dynamic-shadow');

        if (shadowElement && shadowElement.length > 0) {
            shadowElement = shadowElement[0];
        }

        shadowElement.style.boxShadow = this._updateLargeVideoShadow(level);
    },

    /**
     * Updates the large video shadow effect.
     */
    _updateLargeVideoShadow(level) {
        const scale = 2;

        // Internal circle audio level.
        const int = {
            level: level > 0.15 ? 20 : 0,
            color: interfaceConfig.AUDIO_LEVEL_PRIMARY_COLOR
        };

        // External circle audio level.
        const ext = {
            level: parseFloat(
                ((int.level * scale * level) + int.level).toFixed(0)),
            color: interfaceConfig.AUDIO_LEVEL_SECONDARY_COLOR
        };

        // Internal blur.
        int.blur = int.level ? 2 : 0;

        // External blur.
        ext.blur = ext.level ? 6 : 0;

        return [
            `0 0 ${int.blur}px ${int.level}px ${int.color}`,
            `0 0 ${ext.blur}px ${ext.level}px ${ext.color}`
        ].join(', ');
    }
};

export default AudioLevels;
