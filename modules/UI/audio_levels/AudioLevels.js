import UIUtil from '../util/UIUtil';

const AudioLevels = {
    updateLargeVideoAudioLevel(elementId, audioLevel) {
        const element = document.getElementById(elementId);

        if (!UIUtil.isVisible(element)) {
            return;
        }

        const level = parseFloat(audioLevel) || 0;
        const shadowElement = element.querySelector('.dynamic-shadow');

        if (shadowElement) {
            shadowElement.style.boxShadow = this._updateLargeVideoShadow(level);
        }
    },

    _updateLargeVideoShadow(level) {
        const scale = 2;
        const int = {
            level: level > 0.15 ? 20 : 0,
            color: interfaceConfig.AUDIO_LEVEL_PRIMARY_COLOR,
            blur: 0
        };

        const ext = {
            level: parseFloat(((int.level * scale * level) + int.level).toFixed(0)),
            color: interfaceConfig.AUDIO_LEVEL_SECONDARY_COLOR,
            blur: 0
        };

        int.blur = int.level ? 2 : 0;
        ext.blur = ext.level ? 6 : 0;

        return `${this._getShadowStyle(int)} ${this._getShadowStyle(ext)}`;
    },

    _getShadowStyle({ blur, level, color }) {
        return `0 0 ${blur}px ${level}px ${color}`;
    }
};

export default AudioLevels;
