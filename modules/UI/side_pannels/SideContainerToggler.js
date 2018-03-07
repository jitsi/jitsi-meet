/* global $, APP */
import UIEvents from '../../../service/UI/UIEvents';
import { setVisiblePanel } from '../../../react/features/side-panel';

/**
 * Handles open and close of the extended toolbar side panel
 * (chat, settings, etc.).
 *
 * @type {{init, toggle, isVisible, hide, show, resize}}
 */
const SideContainerToggler = {
    /**
     * Initialises this toggler by registering the listeners.
     *
     * @param eventEmitter
     */
    init(eventEmitter) {
        this.eventEmitter = eventEmitter;

        // We may not have a side toolbar container, for example, in
        // filmstrip-only mode.
        const sideToolbarContainer
            = document.getElementById('sideToolbarContainer');

        if (!sideToolbarContainer) {
            return;
        }

        // Adds a listener for the animationend event that would take care of
        // hiding all internal containers when the extendedToolbarPanel is
        // closed.
        sideToolbarContainer.addEventListener(
            'animationend',
            e => {
                if (e.animationName === 'slideOutExt') {
                    $('#sideToolbarContainer').children()
                    .each(function() {
                        /* eslint-disable no-invalid-this */
                        if ($(this).hasClass('show')) {
                            SideContainerToggler.hideInnerContainer($(this));
                        }
                        /* eslint-enable no-invalid-this */
                    });
                }
            },
            false);
    },

    /**
     * Toggles the container with the given element id.
     *
     * @param {String} elementId the identifier of the container element to
     * toggle
     */
    toggle(elementId) {
        const elementSelector = $(`#${elementId}`);
        const isSelectorVisible = elementSelector.hasClass('show');

        if (isSelectorVisible) {
            this.hide();
            APP.store.dispatch(setVisiblePanel(null));
        } else {
            if (this.isVisible()) {
                $('#sideToolbarContainer').children()
                .each(function() {
                    /* eslint-disable no-invalid-this */
                    if ($(this).id !== elementId && $(this).hasClass('show')) {
                        SideContainerToggler.hideInnerContainer($(this));
                    }
                    /* eslint-enable no-invalid-this */
                });
            }

            if (!this.isVisible()) {
                this.show();
            }

            this.showInnerContainer(elementSelector);
            APP.store.dispatch(setVisiblePanel(elementId));
        }
    },

    /**
     * Returns {true} if the side toolbar panel is currently visible,
     * otherwise returns {false}.
     */
    isVisible() {
        return $('#sideToolbarContainer').hasClass('slideInExt');
    },

    /**
     * Returns {true} if the side toolbar panel is currently hovered and
     * {false} otherwise.
     */
    isHovered() {
        return $('#sideToolbarContainer:hover').length > 0;
    },

    /**
     * Hides the side toolbar panel with a slide out animation.
     */
    hide() {
        $('#sideToolbarContainer')
            .removeClass('slideInExt')
.addClass('slideOutExt');
    },

    /**
     * Shows the side toolbar panel with a slide in animation.
     */
    show() {
        if (!this.isVisible()) {
            $('#sideToolbarContainer')
                .removeClass('slideOutExt')
.addClass('slideInExt');
        }
    },

    /**
     * Hides the inner container given by the selector.
     *
     * @param {Object} containerSelector the jquery selector for the
     * element to hide
     */
    hideInnerContainer(containerSelector) {
        containerSelector.removeClass('show').addClass('hide');

        this.eventEmitter.emit(UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            containerSelector.attr('id'), false);
    },

    /**
     * Shows the inner container given by the selector.
     *
     * @param {Object} containerSelector the jquery selector for the
     * element to show
     */
    showInnerContainer(containerSelector) {

        // Before showing the container, make sure there is no other visible.
        // If we quickly show a container, while another one is animating
        // and animation never ends, so we do not really hide the first one and
        // we end up with to shown panels
        $('#sideToolbarContainer').children()
        .each(function() {
            /* eslint-disable no-invalid-this */
            if ($(this).hasClass('show')) {
                SideContainerToggler.hideInnerContainer($(this));
            }
            /* eslint-enable no-invalid-this */
        });

        containerSelector.removeClass('hide').addClass('show');

        this.eventEmitter.emit(UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            containerSelector.attr('id'), true);
    },

    /**
     * TO FIX: do we need to resize the chat?
     */
    resize() {
        // let [width, height] = UIUtil.getSidePanelSize();
        // Chat.resizeChat(width, height);
    }
};

export default SideContainerToggler;
