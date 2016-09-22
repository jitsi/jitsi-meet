/* global $ */
import UIUtil from "../util/UIUtil";

/**
 * Creates a new interactive microphone.
 *
 * @class
 */
export default class InteractiveMicrophone {
    /**
     * @constructs InteractiveMicrophone
     * 
     * @param {object} options - Information about microphone.
     * @param {string|HMTLElement|jQuery} options.container - The element 
     * to insert microphone in.
     * @param {number} options.level - Audio level in % (between 0 and 100).
     * @param {boolean} options.silence - Is microphone muted?
     */
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
     * Turns microphone into muted mode.
     * 
     * @param {boolean} value - Is microphone muted?
     * 
     * @returns {this}
     */
    mute (value) {
        this.silence = value;

        return this;
    }

    /**
     * Updates microphone with new audio level.
     *
     * @param {number} level - Current audio level in % (between 0 and 100).
     * 
     * @returns {this}
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

    /**
     * Updates state of the HTML element. Ensures that the element is in DOM.
     * 
     * @returns {this}
     */
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

    /**
     * Creates fresh instance of HTML element for the microphone.
     * 
     * @returns {HTMLElement|jQuery} Representation of the microphone.
     */
    render () {
        var elem = $(`
            <div class="interactive-mic toolbar-icon">
                <div class="mic-muted audioMuted">
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