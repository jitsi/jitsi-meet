/* global $, APP, interfaceConfig */

import Logger from 'jitsi-meet-logger';
import {
    participantJoined,
    participantLeft,
    pinParticipant
} from '../../../react/features/base/participants';
import { SHARED_URL_PARTICIPANT_NAME } from '../../../react/features/shared-url/constants';
import { dockToolbox, showToolbox } from '../../../react/features/toolbox/actions.web';
import UIEvents from '../../../service/UI/UIEvents';
import { getToolboxHeight } from '../../../react/features/toolbox/functions.web';
import { getSharedURL } from '../../../react/features/shared-url/functions';
import Filmstrip from '../videolayout/Filmstrip';
import LargeContainer from '../videolayout/LargeContainer';
import VideoLayout from '../videolayout/VideoLayout';

const logger = Logger.getLogger(__filename);

/**
 * Default shared URL frame width
 */
 const DEFAULT_WIDTH = 640;

 /**
  * Default shared URL frame height
  */
 const DEFAULT_HEIGHT = 480;
 
 export const SHARED_URL_CONTAINER_TYPE = 'sharedurl';

/**
 * Container for shared URL iframe.
 */
 class SharedURL extends LargeContainer {
    /**
     *
     */
     constructor(sharedURL) {
        super();
        console.warn('Creating Shared URL IFrame');
        console.warn('URL is ' + sharedURL);

        const iframe = document.createElement('iframe');

        iframe.id = 'sharedurlIframe';
        iframe.src = sharedURL;
        iframe.frameBorder = 0;
        iframe.scrolling = 'yes';
        iframe.width = DEFAULT_WIDTH;
        iframe.height = DEFAULT_HEIGHT;
        iframe.setAttribute('style', 'visibility: visible;');

        this.container.appendChild(iframe);

        iframe.onload = function() {
            // eslint-disable-next-line no-self-assign
            // document.domain = document.domain;
        };

        this.$iframe = this.iframe = iframe;
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
        return document.getElementById('sharedurl');
    }

    /**
     *
     */
     // get isOpen() {
     //   return Boolean(this.sharedURLIframe)
    // }

    /**
     * TODO: Make sure we need this function 
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

                // APP.store.dispatch(setDocumentEditingState(true));

                resolve();
            });
        });
    }

    /**
     * TODO: Make sure we need this function
     */
    hide() {
        const $iframe = $(this.iframe);
        const $container = $(this.container);

        document.body.style.background = this.bodyBackground;

        return new Promise(resolve => {
            $iframe.fadeOut(300, () => {
                $iframe.css({ visibility: 'hidden' });
                $container.css({ zIndex: 0 });

                // APP.store.dispatch(setDocumentEditingState(false));

                resolve();
            });
        });
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

        // $(this.iframe).width(width).height(height);
        $(this.iframe).width(width).height(height);
    }

    /**
     * @return {boolean} do not switch on dominant speaker event if on stage.
     * TODO: Determine if this should be true (as for Etherpad) or false (as for Shared Video)
     */
    stayOnStage() {
        return false;
    }
}


/**
 * Manager of shared URL.
 */
export default class SharedURLManager {
    /**
     *
     */
    constructor(eventEmitter) {
        this.from = null // ID of the command sender
        this.eventEmitter = eventEmitter;
        this.isSharedURLShown = this.isVisible();
        this.sharedURL = null; // this is the actual URL we will navigate to
        this.sharedURLIframe = null // the iFrame object in the LargeVideoContainer
        this.initialAttributes = null;
    }

    /**
     *
     */
    isVisible() {
        return VideoLayout.isLargeContainerTypeVisible(SHARED_URL_CONTAINER_TYPE);
    }

    /**
     * Create new shared URL iframe.
     * @param sharedURL - URL we should navigate to
     * 
     */
    openSharedURL(sharedURL) {
        this.sharedURLIframe = new SharedURL(sharedURL);
        VideoLayout.addLargeVideoContainer(
            SHARED_URL_CONTAINER_TYPE,
            this.sharedURLIframe
        );
        // TODO: Need to dispatch to the store
    }

    closeSharedURL() {
        this.sharedURL = null;
        this.sharedURLIframe = null;

        VideoLayout.showLargeVideoContainer(
            SHARED_URL_CONTAINER_TYPE, false
        );
        
        //TODO: Need to dispatch to the store
    }

    /**
     * Indicates if the local user is the owner of the shared URL.
     * @returns {*|boolean}
     */
    isSharedURLOwner() {
        return this.from && APP.conference.isLocalId(this.from);
    }

    /**
     * Start shared URL event emitter if a shared URL is not shown.
     *
     * @param sharedURL
     */
    startSharedURLEmitter(sharedURL) {
        this.sharedURL = sharedURL;
        if (!this.isSharedURLShown) {
            if (sharedURL) {
                this.eventEmitter.emit(
                    UIEvents.UPDATE_SHARED_URL, sharedURL, 'sharing');
            }
        }
    }

    /**
     * Stop shared URL event emitter done by the one who shared the URL.
     */
    stopSharedURLEmitter(sharedURL) {
        if (APP.conference.isLocalId(this.from)) {
            this.eventEmitter.emit(
                UIEvents.UPDATE_SHARED_URL, sharedURL, 'not-sharing');
        }
    }

    /**
     * Shows the player component and starts the process that will be sending
     * updates, if we are the one shared the video.
     *
     * @param id the id of the sender of the command
     * @param sharedURL the shared URL
     * @param attributes
     */
    onSharedURLStart(id, sharedURL, attributes) {
        // TODO: add this once everything is working properly
        // if (this.isSharedURLShown) {
        //    return;
        // }
        // TODO: Perhaps use the isVisible function instead
        this.isSharedURLShown = true;

        // Store the shared URL, although maybe this should be set in the store
        this.sharedURL = sharedURL;

        // the owner of the URL
        this.from = id;

        this.initialAttributes = attributes;

        const self = this;

        self.sharedURLIframe = new SharedURL(sharedURL);

        VideoLayout.addLargeVideoContainer(SHARED_URL_CONTAINER_TYPE, self.sharedURLIframe);

        APP.store.dispatch(participantJoined({

            // FIXME The cat is out of the bag already or rather _room is
            // not private because it is used in multiple other places
            // already such as AbstractPageReloadOverlay.
            conference: APP.conference._room,
            id: self.sharedURL, // this is the actual url string, not the sharedURL container
            isFakeParticipant: true,
            name: SHARED_URL_PARTICIPANT_NAME
        }));

        APP.store.dispatch(pinParticipant(self.sharedURL));
    }

    /**
     * // TODO: do we even need this function, since this was likely for updates within 
     * a video for the SharedVideo feature
     * // TODO: perhaps remove attributes altogether
     * @param sharedURL the URL we should navigate to
     * @param attributes the state of the shared URL
     */
    processURLUpdate(sharedURL, attributes) {
        console.log('Processing URL update...');
        // eslint-disable-next-line eqeqeq
        if (attributes && attributes.state == 'sharing_url') {
            // TODO: write this function:
            this.navigateToURL(sharedURL);
        }
        else {
            this.closeSharedURL();
        }
    }

    /**
     * 
     * @param sharedURL 
     */
    navigateToURL(sharedURL) {
        console.log('Navigating to URL...');
        if (!sharedURL) {
            return;
        }

        if (this.sharedURLIframe) {
            this.sharedURLIframe.contentWindow.document.location.href = sharedURL;
        }
    }

    /**
     * Updates URL
     * @param id the id of the sender of the command
     * @param sharedURL the URL
     * @param attributes
     */
    onSharedURLUpdate(id, sharedURL, attributes) {
        // if we are sending the event ignore
        // if (APP.conference.isLocalId(this.from)) {
        //     return;
        // }
        console.warn('onSharedURLUpdate triggered!');
        if (!this.isSharedURLShown) {
            this.onSharedURLStart(id, sharedURL, attributes);
            return;
        }
    }

    /**
     * Stop shared URL if it is currently displayed
     * @param id the id of the sender of the command
     */
    onSharedURLStop(id, attributes) {
        if (!this.isSharedURLShown) {
            return;
        }

        if (this.from !== id) {
            return;
        }

        APP.store.dispatch(participantLeft(this.sharedURL, APP.conference._room));

        VideoLayout.showLargeVideoContainer(SHARED_URL_CONTAINER_TYPE, false)
            .then(() => {
                VideoLayout.removeLargeVideoContainer(
                    SHARED_URL_CONTAINER_TYPE);

                // revert to original behavior (in case we prevented participants from interacting with website):
                // $('#sharedURL').css('pointer-events', 'auto');

                this.eventEmitter.emit(
                    UIEvents.UPDATE_SHARED_URL, null, 'removed');
            });

        this.sharedURL = null;
        this.isSharedURLShown = false;
        this.initialAttributes = null;
    }
}

