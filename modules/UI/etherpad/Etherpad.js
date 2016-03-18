/* global $ */

import VideoLayout from "../videolayout/VideoLayout";
import LargeContainer from '../videolayout/LargeContainer';
import UIUtil from "../util/UIUtil";
import SidePanelToggler from "../side_pannels/SidePanelToggler";
import FilmStrip from '../videolayout/FilmStrip';

/**
 * Etherpad options.
 */
const options = $.param({
    showControns: true,
    showChat: false,
    showLineNumbers: true,
    useMonospaceFont: false
});

function bubbleIframeMouseMove(iframe){
    var existingOnMouseMove = iframe.contentWindow.onmousemove;
    iframe.contentWindow.onmousemove = function(e){
        if(existingOnMouseMove) existingOnMouseMove(e);
        var evt = document.createEvent("MouseEvents");
        var boundingClientRect = iframe.getBoundingClientRect();
        evt.initMouseEvent(
            "mousemove",
            true, // bubbles
            false, // not cancelable
            window,
            e.detail,
            e.screenX,
            e.screenY,
            e.clientX + boundingClientRect.left,
            e.clientY + boundingClientRect.top,
            e.ctrlKey,
            e.altKey,
            e.shiftKey,
            e.metaKey,
            e.button,
            null // no related element
        );
        iframe.dispatchEvent(evt);
    };
}

/**
 * Default Etherpad frame width.
 */
const DEFAULT_WIDTH = 640;
/**
 * Default Etherpad frame height.
 */
const DEFAULT_HEIGHT = 480;

const ETHERPAD_CONTAINER_TYPE = "etherpad";

/**
 * Container for Etherpad iframe.
 */
class Etherpad extends LargeContainer {
    constructor (domain, name) {
        super();

        const iframe = document.createElement('iframe');

        iframe.src = domain + name + '?' + options;
        iframe.frameBorder = 0;
        iframe.scrolling = "no";
        iframe.width = DEFAULT_WIDTH;
        iframe.height = DEFAULT_HEIGHT;
        iframe.setAttribute('style', 'visibility: hidden;');

        this.container.appendChild(iframe);

        iframe.onload = function() {
            document.domain = document.domain;
            bubbleIframeMouseMove(iframe);

            setTimeout(function() {
                const doc = iframe.contentDocument;

                // the iframes inside of the etherpad are
                // not yet loaded when the etherpad iframe is loaded
                const outer = doc.getElementsByName("ace_outer")[0];
                bubbleIframeMouseMove(outer);

                const inner = doc.getElementsByName("ace_inner")[0];
                bubbleIframeMouseMove(inner);
            }, 2000);
        };

        this.iframe = iframe;
    }

    get isOpen () {
        return !!this.iframe;
    }

    get container () {
        return document.getElementById('etherpad');
    }

    resize (containerWidth, containerHeight, animate) {
        let height = containerHeight - FilmStrip.getFilmStripHeight();
        let width = containerWidth;

        $(this.iframe).width(width).height(height);
    }

    show () {
        const $iframe = $(this.iframe);
        const $container = $(this.container);

        return new Promise(resolve => {
            $iframe.fadeIn(300, function () {
                document.body.style.background = '#eeeeee';
                $iframe.css({visibility: 'visible'});
                $container.css({zIndex: 2});
                resolve();
            });
        });
    }

    hide () {
        const $iframe = $(this.iframe);
        const $container = $(this.container);

        return new Promise(resolve => {
            $iframe.fadeOut(300, function () {
                $iframe.css({visibility: 'hidden'});
                $container.css({zIndex: 0});
                resolve();
            });
        });
    }
}

/**
 * Manager of the Etherpad frame.
 */
export default class EtherpadManager {
    constructor (domain, name) {
        if (!domain || !name) {
            throw new Error("missing domain or name");
        }

        this.domain = domain;
        this.name = name;
        this.etherpad = null;
    }

    get isOpen () {
        return !!this.etherpad;
    }

    /**
     * Create new Etherpad frame.
     */
    openEtherpad () {
        this.etherpad = new Etherpad(this.domain, this.name);
        VideoLayout.addLargeVideoContainer(
            ETHERPAD_CONTAINER_TYPE,
            this.etherpad
        );
    }

    /**
     * Toggle Etherpad frame visibility.
     * Open new Etherpad frame if there is no Etherpad frame yet.
     */
    toggleEtherpad () {
        if (!this.isOpen) {
            this.openEtherpad();
        }

        let isVisible = VideoLayout.isLargeContainerTypeVisible(
            ETHERPAD_CONTAINER_TYPE
        );

        VideoLayout.showLargeVideoContainer(
            ETHERPAD_CONTAINER_TYPE, !isVisible);
    }
}
