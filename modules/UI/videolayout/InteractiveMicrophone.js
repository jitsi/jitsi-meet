/* global $, APP, JitsiMeetJS, interfaceConfig */
import UIUtil from "../util/UIUtil";

export default class InteractiveMicrophone {
    constructor (options) {
        Object.assign(this, {
            container: document.createElement('div'),
            level: 0,
            silence: false
        }, options);

        this.max = 100;
        this.min = 50; // otherwise the progress bar will be almost invisible
    }

    render () {
        var level = (this.max - this.level).toFixed(0);

        /* jshint ignore:start */
        return `
            <div class="interactive-mic toolbar-icon">
                <i class="icon-${ this.silence ? 'mic-disabled' : 'microphone' }"></i>
                <div class="mic-layer" style="display:${ this.silence ? 'none' : 'block' }">
                    <div class="mic-back"></div>
                    <div class="mic-level" style="height:${ level }%"></div>
                </div>
            </div>
        `;
        /* jshint ignore:end */
    }

    redraw () {
        var container = $(this.container),
            elements = container.find('.interactive-mic'),
            pseudo = document.createElement('div');

        pseudo.innerHTML = this.render();

        elements.each(function () {
            var icon = document.createElement('i'),
                elem = pseudo.children[0];

            $(this).replaceWith(elem);

            icon = elem.querySelector('.icon-mic-disabled') || icon;

            UIUtil.setTooltip(icon, "videothumbnail.mute", "top");
        });

        if (!elements.length) {
            container
                .find('.videocontainer__toolbar')
                .append(pseudo.children[0]);
        }

        return this;
    }
    /**
     * Use positive number between 0 and 100 to indicate
     * current audio level.
     * 
     * @param level {number} 
     */
    volume (level) {
        level = parseInt(level, 10);

        if (isNaN(level)) {
            return;
        }

        if (level > 0) {
            level = level < this.min ? this.min : level;
            level = level > this.max ? this.max : level;
        }

        this.level = level;

        return this;
    }

    /**
     * @param value {boolean} Is microphone muted?
     */
    mute (value) {
        this.silence = value;

        return this;
    }
}