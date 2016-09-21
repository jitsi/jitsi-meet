/* global $ */
import UIUtil from "../util/UIUtil";

export default class InteractiveMicrophone {
    constructor (options) {
        Object.assign(this, {
            container: document.createElement('div'),
            level: 0,
            silence: false
        }, options);

        this.min = 0;
        this.max = 100;
    }

    /**
     * @param value {boolean} Is microphone muted?
     */
    mute (value) {
        this.silence = value;

        return this;
    }

    /**
     * @param level {number} Current audio level in % (between 0 and 100)
     */
    volume (level) {
        level = parseInt(level, 10);

        if (isNaN(level)) {
            return;
        }

        level = level < this.min ? this.min : level;
        level = level > this.max ? this.max : level;

        this.level = level;

        return this;
    }

    redraw () {
        var container = $(this.container),
            elements = container.find('.interactive-mic'),
            muteDisplayStyle = this.silence ? 'block' : 'none',
            micDisplayStyle = this.silence ? 'none' : 'block',
            level = (this.max - this.level).toFixed(0);

        if (!elements.length) {
            elements = this.render();
            container.append(elements);
        }

        elements.each(function () {
            var elem = $(this);
            elem.find('.mic-muted').css({
                display: muteDisplayStyle
            });
            elem.find('.mic-layer').css({
                display: micDisplayStyle
            });
            elem.find('.mic-level').css({
                display: micDisplayStyle,
                height: level + '%'
            });
        });

        return this;
    }

    render () {
        var elem = $(`
            <div class="interactive-mic toolbar-icon audioMuted">
                <div class="mic-muted">
                    <i class="icon-mic-disabled"></i>
                </div>
                <div class="mic-layer">
                    <i class="icon-microphone"></i>
                </div>
                <div class="mic-level">
                    <i class="icon-microphone"></i>
                </div>
            </div>
        `);
        var muteIndicator = elem.find('.mic-muted').get(0);

        UIUtil
            .setTooltip(muteIndicator, "videothumbnail.mute", "top");

        return elem;
    }
}