/* global $, APP, interfaceConfig */

import { setDocumentEditingState } from '../../../react/features/etherpad';
import { getToolboxHeight } from '../../../react/features/toolbox';

import VideoLayout from '../videolayout/VideoLayout';
import LargeContainer from '../videolayout/LargeContainer';
import UIEvents from '../../../service/UI/UIEvents';
import Filmstrip from '../videolayout/Filmstrip';

/**
 * Etherpad options.
 */
const options = $.param({
    showControns: true,
    showChat: false,
    showLineNumbers: true,
    useMonospaceFont: false
});

/**
 *
 */
function bubbleIframeMouseMove(iframe) {
    const existingOnMouseMove = iframe.contentWindow.onmousemove;

    iframe.contentWindow.onmousemove = function(e) {
        if (existingOnMouseMove) {
            existingOnMouseMove(e);
        }
        const evt = document.createEvent('MouseEvents');
        const boundingClientRect = iframe.getBoundingClientRect();

        evt.initMouseEvent(
            'mousemove',
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

const ETHERPAD_CONTAINER_TYPE = 'etherpad';

/**
 * Container for Etherpad iframe.
 */
class Etherpad extends LargeContainer {
    /**
     * Creates new Etherpad object
     */
    constructor(domain, name) {
        super();

        const iframe = document.createElement('iframe');

        iframe.id = 'etherpadIFrame';
        iframe.src = `${domain + name}?${options}`;
        iframe.frameBorder = 0;
        iframe.scrolling = 'no';
        iframe.width = DEFAULT_WIDTH;
        iframe.height = DEFAULT_HEIGHT;
        iframe.setAttribute('style', 'visibility: hidden;');

        this.container.appendChild(iframe);

        iframe.onload = function() {
            // eslint-disable-next-line no-self-assign
            document.domain = document.domain;
            bubbleIframeMouseMove(iframe);

            setTimeout(() => {
                const doc = iframe.contentDocument;

                // the iframes inside of the etherpad are
                // not yet loaded when the etherpad iframe is loaded
                const outer = doc.getElementsByName('ace_outer')[0];

                bubbleIframeMouseMove(outer);

                const inner = doc.getElementsByName('ace_inner')[0];

                bubbleIframeMouseMove(inner);
            }, 2000);
        };

        this.iframe = iframe;
    }

    /**
     *
     */
    get isOpen() {
        return Boolean(this.iframe);
    }

    /**
     *
     */
    get container() {
        return document.getElementById('etherpad');
    }

    /**
     *
     */
    resize(containerWidth, containerHeight) {
        let height, width;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            height = containerHeight - getToolboxHeight();
            width = containerWidth - Filmstrip.getFilmstripWidth();
        } else {
            height = containerHeight - Filmstrip.getFilmstripHeight();
            width = containerWidth;
        }

        $(this.iframe)
            .width(width)
            .height(height);
    }

    /**
     *
     */
    show() {
        const $iframe = $(this.iframe);
        const $container = $(this.container);
        const self = this;

        return new Promise(resolve => {
            $iframe.fadeIn(300, () => {
                self.bodyBackground = document.body.style.background;
                document.body.style.background = '#eeeeee';
                $iframe.css({ visibility: 'visible' });
                $container.css({ zIndex: 2 });

                APP.store.dispatch(setDocumentEditingState(true));

                resolve();
            });
        });
    }

    /**
     *
     */
    hide() {
        const $iframe = $(this.iframe);
        const $container = $(this.container);

        document.body.style.background = this.bodyBackground;

        return new Promise(resolve => {
            $iframe.fadeOut(300, () => {
                $iframe.css({ visibility: 'hidden' });
                $container.css({ zIndex: 0 });

                APP.store.dispatch(setDocumentEditingState(false));

                resolve();
            });
        });
    }

    /**
     * @return {boolean} do not switch on dominant speaker event if on stage.
     */
    stayOnStage() {
        return true;
    }
}

/**
 * Manager of the Etherpad frame.
 */
export default class EtherpadManager {
    /**
     *
     */
    constructor(domain, name, eventEmitter) {
        if (!domain || !name) {
            throw new Error('missing domain or name');
        }

        this.domain = domain;
        this.name = name;
        this.eventEmitter = eventEmitter;
        this.etherpad = null;
    }

    /**
     *
     */
    get isOpen() {
        return Boolean(this.etherpad);
    }

    /**
     *
     */
    isVisible() {
        return VideoLayout.isLargeContainerTypeVisible(ETHERPAD_CONTAINER_TYPE);
    }

    /**
     * Create new Etherpad frame.
     */
    openEtherpad() {
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
    toggleEtherpad() {
        if (!this.isOpen) {
            this.openEtherpad();
        }

        const isVisible = this.isVisible();

        VideoLayout.showLargeVideoContainer(
            ETHERPAD_CONTAINER_TYPE, !isVisible);

        this.eventEmitter
            .emit(UIEvents.TOGGLED_SHARED_DOCUMENT, !isVisible);

        APP.store.dispatch(setDocumentEditingState(!isVisible));
    }
}
