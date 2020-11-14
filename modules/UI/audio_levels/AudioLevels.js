/* global interfaceConfig */

import UIUtil from '../util/UIUtil';

/**
 * Responsible for drawing audio levels.
 */
const AudioLevels = {
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
