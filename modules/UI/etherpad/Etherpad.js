/* global APP, interfaceConfig */

import $ from 'jquery';

import { setDocumentEditingState, toggleDocument } from '../../../react/features/etherpad/actions';
import { getSharedDocumentUrl } from '../../../react/features/etherpad/functions';
import { getToolboxHeight } from '../../../react/features/toolbox/functions.web';
import Filmstrip from '../videolayout/Filmstrip';
import LargeContainer from '../videolayout/LargeContainer';
import VideoLayout from '../videolayout/VideoLayout';


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
    constructor(url) {
        super();

        const iframe = document.createElement('iframe');

        iframe.id = 'etherpadIFrame';
        iframe.src = url;
        iframe.style.border = 0;
        iframe.scrolling = 'no';
        iframe.width = DEFAULT_WIDTH;
        iframe.height = DEFAULT_HEIGHT;
        iframe.setAttribute('style', 'visibility: hidden;');

        this.container.appendChild(iframe);

        this.iframe = iframe;

        const closeBtn = document.createElement('button');

        closeBtn.id = 'etherpad-close-btn';
        closeBtn.setAttribute('aria-label', 'Close shared document');
        closeBtn.style.cssText = [
            'position:absolute',
            'top:12px',
            'right:12px',
            'z-index:10',
            'background:rgba(0,0,0,0.55)',
            'border:none',
            'border-radius:4px',
            'color:#fff',
            'cursor:pointer',
            'font-size:18px',
            'line-height:1',
            'padding:5px 9px',
            'display:none'
        ].join(';');
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', () => APP.store.dispatch(toggleDocument()));
        this.container.appendChild(closeBtn);
        this.closeBtn = closeBtn;
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
            $iframe.fadeIn(300, () => {
                self.bodyBackground = document.body.style.background;
                document.body.style.background = '#eeeeee';
                $iframe.css({ visibility: 'visible' });
                $container.css({ zIndex: 2 });
                self.closeBtn.style.display = 'block';

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
                this.closeBtn.style.display = 'none';

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
    constructor() {
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
        this.etherpad = new Etherpad(getSharedDocumentUrl(APP.store.getState));
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

        APP.store.dispatch(setDocumentEditingState(!isVisible));
    }
}
