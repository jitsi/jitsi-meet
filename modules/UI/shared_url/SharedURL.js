/* global $, APP, YT, interfaceConfig, onPlayerReady, onPlayerStateChange,
onPlayerError */

import Logger from 'jitsi-meet-logger';
/*
* likely don't need this until things are working:
import {
    createSharedVideoEvent as createEvent,
    sendAnalytics
} from '../../../react/features/analytics';
*/
import {
    participantJoined,
    participantLeft,
    pinParticipant
} from '../../../react/features/base/participants';
import { SHARED_URL_PARTICIPANT_NAME } from '../../../react/features/shared-url/constants';
import { dockToolbox, showToolbox } from '../../../react/features/toolbox/actions.web';
import { getToolboxHeight } from '../../../react/features/toolbox/functions.web';
import UIEvents from '../../../service/UI/UIEvents';
import Filmstrip from '../videolayout/Filmstrip';
import LargeContainer from '../videolayout/LargeContainer';
import VideoLayout from '../videolayout/VideoLayout';

const logger = Logger.getLogger(__filename);

export const SHARED_VIDEO_CONTAINER_TYPE = 'sharedurl';

/**
 * Example shared URL link.
 * @type {string}
 */
const updateInterval = 5000; // milliseconds


/**
 * Manager of shared URL.
 */
export default class SharedURLManager {
    /**
     *
     */
    constructor(emitter) {
        this.emitter = emitter;
        this.isSharedURLShown = false;
        this.sharedURLIframe = null;
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

        if (!this.isSharedURLShown) {
            if (sharedURL) {
                this.emitter.emit(
                    UIEvents.UPDATE_SHARED_URL, sharedURL, 'start');
                /*
                *   perhaps implement this in the future: 
                *   sendAnalytics(createEvent('started'));
                */
            }

            logger.log('SHARED URL CANCELED');
            /*
            *   perhaps implement this in the future:
            *   sendAnalytics(createEvent('canceled'));
            */
        }
    }

    /**
     * Stop shared URL event emitter done by the one who shared the URL.
     */
    stopSharedURLEmitter() {

        if (APP.conference.isLocalId(this.from)) {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            this.emitter.emit(
                UIEvents.UPDATE_SHARED_URL, this.sharedURL, 'stop');
            /*
            *   perhaps implement this in the future:
            *   sendAnalytics(createEvent('stopped'));
            */
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
        if (this.isSharedURLShown) {
            return;
        }

        this.isSharedURLShown = true;

        // the shared URL
        this.sharedURL = sharedURL;

        // the owner of the URL
        this.from = id;

        this.initialAttributes = attributes;

        const self = this;

        // TODO: Sort out how to create a new Iframe in the LargeVideoContainer
        const iframe = window.document.createElement('iframe'); // was player.getIframe();
        


        // eslint-disable-next-line no-use-before-define
        self.sharedURL = new SharedURLContainer({ sharedURL, iframe });

        VideoLayout.addLargeVideoContainer(SHARED_URL_CONTAINER_TYPE, self.sharedURL);

        APP.store.dispatch(participantJoined({

            // FIXME The cat is out of the bag already or rather _room is
            // not private because it is used in multiple other places
            // already such as AbstractPageReloadOverlay.
            conference: APP.conference._room,
            id: self.sharedURL,
            isFakeParticipant: true,
            name: SHARED_URL_PARTICIPANT_NAME
        }));

        APP.store.dispatch(pinParticipant(self.sharedURL));
    }

    /**
     * Process attributes, whether player needs to be paused or seek.
     * @param attributes the attributes with the player state we want
     */
    processURLUpdate(sharedURL, attributes) {
        if (!attributes) {
            return;
        }

        // eslint-disable-next-line eqeqeq
        if (attributes.state == 'sharing_url') {
            // TODO: write this function:
            this.navigateToURL(sharedURL);
        }
        else {
            this.stopSharedURL();
        }
    }

    /**
     * 
     * @param sharedURL 
     */
    navigateToURL(sharedURL) {
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
        if (APP.conference.isLocalId(this.from)) {
            return;
        }

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
                $('#sharedURL').css('pointer-events', 'auto');

                this.emitter.emit(
                    UIEvents.UPDATE_SHARED_URL, null, 'removed');
            });

        this.sharedURL = null;
        this.isSharedURLShown = false;
        this.initialAttributes = null;
    }
}

/**
 * Container for shared video iframe.
 */
class SharedURLContainer extends LargeContainer {
    /**
     *
     */
    constructor({ sharedURL, iframe }) {
        super();

        this.$iframe = $(iframe);
        this.sharedURL = sharedURL;
    }

    /**
     *
     */
    show() {
        const self = this;


        return new Promise(resolve => {
            this.$iframe.fadeIn(300, () => {
                self.bodyBackground = document.body.style.background;
                document.body.style.background = 'black';
                this.$iframe.css({ opacity: 1 });
                APP.store.dispatch(dockToolbox(true));
                resolve();
            });
        });
    }

    /**
     *
     */
    hide() {
        const self = this;

        APP.store.dispatch(dockToolbox(false));

        return new Promise(resolve => {
            this.$iframe.fadeOut(300, () => {
                document.body.style.background = self.bodyBackground;
                this.$iframe.css({ opacity: 0 });
                resolve();
            });
        });
    }

    /**
     *
     */
    onHoverIn() {
        APP.store.dispatch(showToolbox());
    }

    /**
     *
     */
    get id() {
        return this.sharedURL;
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

        this.$iframe.width(width).height(height);
    }

    /**
     * @return {boolean} do not switch on dominant speaker event if on stage.
     */
    stayOnStage() {
        return false;
    }
}