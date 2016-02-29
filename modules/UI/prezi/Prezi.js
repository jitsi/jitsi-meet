/* global $, APP */
/* jshint -W101 */

import VideoLayout from "../videolayout/VideoLayout";
import LargeContainer from '../videolayout/LargeContainer';
import PreziPlayer from './PreziPlayer';
import UIUtil from '../util/UIUtil';
import UIEvents from '../../../service/UI/UIEvents';
import messageHandler from '../util/MessageHandler';
import ToolbarToggler from "../toolbars/ToolbarToggler";
import SidePanelToggler from "../side_pannels/SidePanelToggler";
import FilmStrip from '../videolayout/FilmStrip';

/**
 * Example of Prezi link.
 */
const defaultPreziLink = "http://prezi.com/wz7vhjycl7e6/my-prezi";
const alphanumRegex = /^[a-z0-9-_\/&\?=;]+$/i;
/**
 * Default aspect ratio for Prezi frame.
 */
const aspectRatio = 16.0 / 9.0;

/**
 * Default Prezi frame width.
 */
const DEFAULT_WIDTH = 640;
/**
 * Default Prezi frame height.
 */
const DEFAULT_HEIGHT = 480;

/**
 * Indicates if the given string is an alphanumeric string.
 * Note that some special characters are also allowed (-, _ , /, &, ?, =, ;) for the
 * purpose of checking URIs.
 * @param {string} unsafeText string to check
 * @returns {boolean}
 */
function isAlphanumeric(unsafeText) {
    return alphanumRegex.test(unsafeText);
}

/**
 * Returns the presentation id from the given url.
 * @param {string} url Prezi link
 * @returns {string} presentation id
 */
function getPresentationId (url) {
    let presId = url.substring(url.indexOf("prezi.com/") + 10);
    return presId.substring(0, presId.indexOf('/'));
}

/**
 * Checks if given string is Prezi url.
 * @param {string} url string to check.
 * @returns {boolean}
 */
function isPreziLink(url) {
    if (url.indexOf('http://prezi.com/') !== 0 && url.indexOf('https://prezi.com/') !== 0) {
        return false;
    }

    let presId = url.substring(url.indexOf("prezi.com/") + 10);
    if (!isAlphanumeric(presId) || presId.indexOf('/') < 2) {
        return false;
    }

    return true;
}

/**
 * Notify user that other user if already sharing Prezi.
 */
function notifyOtherIsSharingPrezi() {
    messageHandler.openMessageDialog(
        "dialog.sharePreziTitle",
        "dialog.sharePreziMsg"
    );
}

/**
 * Ask user if he want to close Prezi he's sharing.
 */
function proposeToClosePrezi() {
    return new Promise(function (resolve, reject) {
        messageHandler.openTwoButtonDialog(
            "dialog.removePreziTitle",
            null,
            "dialog.removePreziMsg",
            null,
            false,
            "dialog.Remove",
            function(e,v,m,f) {
                if (v) {
                    resolve();
                } else {
                    reject();
                }
            }
        );

    });
}

/**
 * Ask user for Prezi url to share with others.
 * Dialog validates client input to allow only Prezi urls.
 */
function requestPreziLink() {
    const title = APP.translation.generateTranslationHTML("dialog.sharePreziTitle");
    const cancelButton = APP.translation.generateTranslationHTML("dialog.Cancel");
    const shareButton = APP.translation.generateTranslationHTML("dialog.Share");
    const backButton = APP.translation.generateTranslationHTML("dialog.Back");
    const linkError = APP.translation.generateTranslationHTML("dialog.preziLinkError");
    const i18nOptions = {url: defaultPreziLink};
    const defaultUrl = APP.translation.translateString(
        "defaultPreziLink", i18nOptions
    );

    return new Promise(function (resolve, reject) {
        let dialog = messageHandler.openDialogWithStates({
            state0: {
                html:  `
                    <h2>${title}</h2>
                    <input name="preziUrl" type="text"
                           data-i18n="[placeholder]defaultPreziLink"
                           data-i18n-options="${JSON.stringify(i18nOptions)}"
                           placeholder="${defaultUrl}" autofocus>`,
                persistent: false,
                buttons: [
                    {title: cancelButton, value: false},
                    {title: shareButton, value: true}
                ],
                focus: ':input:first',
                defaultButton: 1,
                submit: function (e, v, m, f) {
                    e.preventDefault();
                    if (!v) {
                        reject('cancelled');
                        dialog.close();
                        return;
                    }

                    let preziUrl = f.preziUrl;
                    if (!preziUrl) {
                        return;
                    }

                    let urlValue = encodeURI(UIUtil.escapeHtml(preziUrl));

                    if (!isPreziLink(urlValue)) {
                        dialog.goToState('state1');
                        return false;
                    }

                    resolve(urlValue);
                    dialog.close();
                }
            },

            state1: {
                html: `<h2>${title}</h2> ${linkError}`,
                persistent: false,
                buttons: [
                    {title: cancelButton, value: false},
                    {title: backButton, value: true}
                ],
                focus: ':input:first',
                defaultButton: 1,
                submit: function (e, v, m, f) {
                    e.preventDefault();
                    if (v === 0) {
                        reject();
                        dialog.close();
                    } else {
                        dialog.goToState('state0');
                    }
                }
            }
        });

    });
}

export const PreziContainerType = "prezi";

/**
 * Container for Prezi iframe.
 */
class PreziContainer extends LargeContainer {

    constructor ({preziId, isMy, slide, onSlideChanged}) {
        super();
        this.reloadBtn = $('#reloadPresentation');

        let preziPlayer = new PreziPlayer(
            'presentation', {
                preziId,
                width: DEFAULT_WIDTH,
                height: DEFAULT_HEIGHT,
                controls: isMy,
                debug: true
            }
        );
        this.preziPlayer = preziPlayer;
        this.$iframe = $(preziPlayer.iframe);

        this.$iframe.attr('id', preziId);

        preziPlayer.on(PreziPlayer.EVENT_STATUS, function({value}) {
            console.log("prezi status", value);
            if (value == PreziPlayer.STATUS_CONTENT_READY && !isMy) {
                preziPlayer.flyToStep(slide);
            }
        });

        preziPlayer.on(PreziPlayer.EVENT_CURRENT_STEP, function({value}) {
            console.log("event value", value);
            onSlideChanged(value);
        });
    }

    /**
     * Change Prezi slide.
     * @param {number} slide slide to show
     */
    goToSlide (slide) {
        if (this.preziPlayer.getCurrentStep() === slide) {
            return;
        }

        this.preziPlayer.flyToStep(slide);

        let animationStepsArray = this.preziPlayer.getAnimationCountOnSteps();
        if (!animationStepsArray) {
            return;
        }

        for (var i = 0; i < parseInt(animationStepsArray[slide]); i += 1) {
            this.preziPlayer.flyToStep(slide, i);
        }
    }

    /**
     * Show or hide "reload presentation" button.
     * @param {boolean} show
     */
    showReloadBtn (show) {
        this.reloadBtn.css('display', show ? 'inline-block' : 'none');
    }

    show () {
        return new Promise(resolve => {
            this.$iframe.fadeIn(300, () => {
                this.$iframe.css({opacity: 1});
                ToolbarToggler.dockToolbar(true);
                resolve();
            });
        });
    }

    hide () {
        return new Promise(resolve => {
            this.$iframe.fadeOut(300, () => {
                this.$iframe.css({opacity: 0});
                this.showReloadBtn(false);
                ToolbarToggler.dockToolbar(false);
                resolve();
            });
        });
    }

    onHoverIn () {
        let rightOffset = window.innerWidth - this.$iframe.offset().left - this.$iframe.width();

        this.showReloadBtn(true);
        this.reloadBtn.css('right', rightOffset);
    }

    onHoverOut (event) {
        let e = event.toElement || event.relatedTarget;

        if (e && e.id != 'reloadPresentation' && e.id != 'header') {
            this.showReloadBtn(false);
        }
    }

    resize (containerWidth, containerHeight) {
        let height = containerHeight - FilmStrip.getFilmStripHeight();

        let width = containerWidth;

        if (height < width / aspectRatio) {
            width = Math.floor(height * aspectRatio);
        }

        this.$iframe.width(width).height(height);
    }

    /**
     * Close Prezi frame.
     */
    close () {
        this.showReloadBtn(false);
        this.preziPlayer.destroy();
        this.$iframe.remove();
    }
}

/**
 * Manager of Prezi frames.
 */
export default class PreziManager {
    constructor (emitter) {
        this.emitter = emitter;

        this.userId = null;
        this.url = null;
        this.prezi = null;

        $("#reloadPresentationLink").click(this.reloadPresentation.bind(this));
    }

    get isPresenting () {
        return !!this.userId;
    }

    get isMyPrezi () {
        return this.userId === APP.conference.localId;
    }

    /**
     * Check if user is currently sharing.
     * @param {string} id user id to check for
     */
    isSharing (id) {
        return this.userId === id;
    }

    handlePreziButtonClicked () {
        if (!this.isPresenting) {
            requestPreziLink().then(
                url => this.emitter.emit(UIEvents.SHARE_PREZI, url, 0),
                err => console.error('PREZI CANCELED', err)
            );
            return;
        }

        if (this.isMyPrezi) {
            proposeToClosePrezi().then(() => this.emitter.emit(UIEvents.STOP_SHARING_PREZI));
        } else {
            notifyOtherIsSharingPrezi();
        }
    }

    /**
     * Reload current Prezi frame.
     */
    reloadPresentation () {
        if (!this.prezi) {
            return;
        }
        let iframe = this.prezi.$iframe[0];
        iframe.src = iframe.src;
    }

    /**
     * Show Prezi. Create new Prezi if there is no Prezi yet.
     * @param {string} id owner id
     * @param {string} url Prezi url
     * @param {number} slide slide to show
     */
    showPrezi (id, url, slide) {
        if (!this.isPresenting) {
            this.createPrezi(id, url, slide);
        }

        if (this.userId === id && this.url === url) {
            this.prezi.goToSlide(slide);
        } else {
            console.error(this.userId, id);
            console.error(this.url, url);
            throw new Error("unexpected presentation change");
        }
    }

    /**
     * Create new Prezi frame..
     * @param {string} id owner id
     * @param {string} url Prezi url
     * @param {number} slide slide to show
     */
    createPrezi (id, url, slide) {
        console.log("presentation added", url);

        this.userId = id;
        this.url = url;

        let preziId = getPresentationId(url);
        let elementId = `participant_${id}_${preziId}`;

        this.$thumb = $(VideoLayout.addRemoteVideoContainer(elementId));
        VideoLayout.resizeThumbnails();
        this.$thumb.css({
            'background-image': 'url(../images/avatarprezi.png)'
        }).click(() => VideoLayout.showLargeVideoContainer(PreziContainerType, true));

        this.prezi = new PreziContainer({
            preziId,
            isMy: this.isMyPrezi,
            slide,
            onSlideChanged: newSlide => {
                if (this.isMyPrezi) {
                    this.emitter.emit(UIEvents.SHARE_PREZI, url, newSlide);
                }
            }
        });

        VideoLayout.addLargeVideoContainer(PreziContainerType, this.prezi);
        VideoLayout.showLargeVideoContainer(PreziContainerType, true);
    }

    /**
     * Close Prezi.
     * @param {string} id owner id
     */
    removePrezi (id) {
        if (this.userId !== id) {
            throw new Error(`cannot close presentation from ${this.userId} instead of ${id}`);
        }

        this.$thumb.remove();
        this.$thumb = null;

        // wait until Prezi is hidden, then remove it
        VideoLayout.showLargeVideoContainer(PreziContainerType, false).then(() => {
            console.log("presentation removed", this.url);

            VideoLayout.removeLargeVideoContainer(PreziContainerType);

            this.userId = null;
            this.url = null;
            this.prezi.close();
            this.prezi = null;
        });
    }
}
