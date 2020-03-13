/* global $, APP, interfaceConfig */

import { setDrawEditingState } from '../../../react/features/etherdraw';
import { getToolboxHeight } from '../../../react/features/toolbox';

import VideoLayout from '../videolayout/VideoLayout';
import LargeContainer from '../videolayout/LargeContainer';
import UIEvents from '../../../service/UI/UIEvents';
import Filmstrip from '../videolayout/Filmstrip';

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
 * Default Etherdraw frame width.
 */
const DEFAULT_WIDTH = 640;

/**
 * Default Etherdraw frame height.
 */
const DEFAULT_HEIGHT = 480;

const ETHERDRAW_CONTAINER_TYPE = 'etherdraw';

/**
 * Container for Etherdraw iframe.
 */
class Etherdraw extends LargeContainer {
    /**
     * Creates new Etherdraw object
     */
    constructor(domain, name) {
        super();

        const iframe = document.createElement('iframe');

        iframe.id = 'etherdrawIFrame';
        this.domain = `${domain}/d/`;

        iframe.src = `${this.domain + name}`;
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
                // const doc = iframe.contentDocument;

                // the iframes inside of the etherdraw are
                // not yet loaded when the etherdraw iframe is loaded
                // const outer = doc.getElementsByName('ace_outer')[0];
                //
                // bubbleIframeMouseMove(outer);
                //
                // const inner = doc.getElementsByName('ace_inner')[0];
                //
                // bubbleIframeMouseMove(inner);
            }, 2000);
        };

        this.iframe = iframe;
    }

    /**
     *
     */
    resetURL(value) {
        this.iframe.src = `${this.domain + value}`;
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
        return document.getElementById('etherdraw');
    }

    /**
     *
     */
    resize(containerWidth, containerHeight) {
        let height, width;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            height = containerHeight - getToolboxHeight();
            width = containerWidth - Filmstrip.getVerticalFilmstripWidth();
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
            $iframe.fadeIn(500, () => {
                self.bodyBackground = document.body.style.background;
                document.body.style.background = '#eeeeee';
                $iframe.css({ visibility: 'visible' });
                $container.css({ zIndex: 2 });

                APP.store.dispatch(setDrawEditingState(true));

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

                APP.store.dispatch(setDrawEditingState(false));

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
 * Manager of the Etherdraw frame.
 */
export default class EtherdrawManager {
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
        this.etherdraw = null;
    }

    /**
     *
     */
    get isOpen() {
        return Boolean(this.etherdraw);
    }

    /**
     *
     */
    isVisible() {
        return this.name === null || VideoLayout.isLargeContainerTypeVisible(ETHERDRAW_CONTAINER_TYPE);
    }

    /**
     * Create new Etherdraw frame.
     */
    openEtherdraw() {
        this.etherdraw = new Etherdraw(this.domain, this.name);
        VideoLayout.addLargeVideoContainer(
            ETHERDRAW_CONTAINER_TYPE,
            this.etherdraw
        );
    }

    /**
     * Toggle Etherdraw frame visibility.
     * Open new Etherdraw frame if there is no Etherdraw frame yet.
     */
    toggleEtherdraw(name) {
        this.name = name;
        if (!this.isOpen) {
            this.openEtherdraw();
        }

        // const isVisible = this.isVisible();
        const isVisible = this.name === null;

        this.etherdraw.resetURL(this.name);

        VideoLayout.showEtherDraw(ETHERDRAW_CONTAINER_TYPE, !isVisible);

        this.eventEmitter
            .emit(UIEvents.TOGGLED_SHARED_DRAW, !isVisible);

        APP.store.dispatch(setDrawEditingState(!isVisible));
    }
}
