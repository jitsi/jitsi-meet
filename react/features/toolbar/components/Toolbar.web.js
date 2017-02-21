/* @flow */

declare var APP: Object;

import React from 'react';

import AbstractToolbar from './AbstractToolbar';
import DEFAULT_TOOLBAR_BUTTONS from './defaultToolbarButtons';
import { FeedbackButton } from '../../feedback';

import UIEvents from '../../../../service/UI/UIEvents';

/**
 * For legacy reasons, inline style for display none.
 *
 * @private
 * @type {{
 *     display: string
 * }}
 */
const _DISPLAY_NONE_STYLE = {
    display: 'none'
};

export default class Toolbar extends AbstractToolbar {

    componentWillMount() {
        const [
            primaryToolbarButtons,
            secondaryToolbarButtons
        ] = interfaceConfig.TOOLBAR_BUTTONS.reduce((acc, value) => {
            const button = DEFAULT_TOOLBAR_BUTTONS[value];

            if (button) {
                const place = this._getToolbarButtonPlace(button);

                acc[place].push(button);
            }
        }, {
            primaryToolbar: [],
            secondaryToolbar: []
        });

        this.setState({ primaryToolbarButtons, secondaryToolbarButtons });
    }

    componentDidMount() {
        APP.UI.addListener(UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            this._onSideToolbarContainerToggled);

        APP.UI.addListener(UIEvents.LOCAL_RAISE_HAND_CHANGED,
            this._onLocalRaiseHandChanged);

        APP.UI.addListener(UIEvents.FULLSCREEN_TOGGLED,
            this._onFullScreenToggled);

        APP.UI.addListener(UIEvents.SHOW_CUSTOM_TOOLBAR_BUTTON_POPUP,
            this._onShowCustomToolbarPopup);

    }

    componentWillUnmount() {
        APP.UI.removeListener(UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            this._onSideToolbarContainerToggled);

        APP.UI.removeListener(UIEvents.LOCAL_RAISE_HAND_CHANGED,
            this._onLocalRaiseHandChanged);

        APP.UI.removeListener(UIEvents.FULLSCREEN_TOGGLED,
            this._onFullScreenToggled);

        APP.UI.removeListener(UIEvents.SHOW_CUSTOM_TOOLBAR_BUTTON_POPUP,
            this._onShowCustomToolbarPopup);
    }

    /**
     * Get place for toolbar button.
     * Now it can be in main toolbar or in extended (left) toolbar
     *
     * @param btn {string}
     * @returns {string}
     */
    _getToolbarButtonPlace(btn) {
        return interfaceConfig.MAIN_TOOLBAR_BUTTONS.includes(btn) ?
            'mainToolbar' :
            'secondaryToolbar';
    }

    /**
     * Adds the given button to the main (top) or extended (left) toolbar.
     *
     * @param {Object} button - The button to add.
     * @param {boolean} isSplitter - If this button is a splitter button for
     * the dialog, which means that a special splitter style will be applied.
     */
    _renderToolbarButton(button, isSplitter) {
        const toolbarId = this._getToolbarButtonId(button);

        const buttonElement = <a />

        if (button.className) {
            buttonElement.className = button.className;
        }

        if (isSplitter) {
            const splitter = <span className="toolbar__splitter" />;

            document.getElementById(toolbarId).appendChild(splitter);
        }

        buttonElement.id = button.id;

        if (button.html)
            buttonElement.innerHTML = button.html;

        //TODO: remove it after UI.updateDTMFSupport fix
        if (button.hidden)
            buttonElement.style.display = 'none';

        if (button.shortcutAttr)
            buttonElement.setAttribute("shortcut", button.shortcutAttr);

        if (button.content)
            buttonElement.setAttribute("content", button.content);

        if (button.i18n)
            buttonElement.setAttribute("data-i18n", button.i18n);

        buttonElement.setAttribute("data-container", "body");
        buttonElement.setAttribute("data-placement", "bottom");
        this._addPopups(buttonElement, button.popups);

        document.getElementById(toolbarId)
            .appendChild(buttonElement);
    }

    /**
     * Event handler for full screen toggled event.
     *
     * @param {boolean} isFullScreen - Flag showing whether app in full
     * screen mode.
     * @returns {void}
     */
    _onFullScreenToggled(isFullScreen) {
        APP.UI.Toolbar._handleFullScreenToggled(isFullScreen);
    }


    /**
     * Event handler for side toolbar container toggled event.
     *
     * @param {string} containerId - ID of the container.
     * @param {boolean} isVisible - Flag showing whether container
     * is visible.
     * @returns {void}
     */
    _onSideToolbarContainerToggled(containerId, isVisible) {
        APP.UI.Toolbar._handleSideToolbarContainerToggled(containerId, isVisible);
    }

    /**
     * Event handler for local raise hand changed event.
     *
     * @param {boolean} isRaisedHand - Flag showing whether hand is raised.
     * @returns {void}
     */
    _onLocalRaiseHandChanged(isRaisedHand) {
        APP.UI.Toolbar._setToggledState("toolbar_button_raisehand", isRaisedHand);
    }

    /**
     * Show custom popup/tooltip for a specified button.
     *
     * @param {string} popupSelectorID - The selector id of the popup to show.
     * @param {boolean} show - True or false/show or hide the popup.
     * @param {number} timeout - The time to show the popup.
     * @returns {void}
     */
    _onShowCustomToolbarPopup(popupSelectorID, show, timeout) {
        const gravity = $(popupSelectorID).attr('tooltip-gravity');
        AJS.$(popupSelectorID)
            .tooltip({
                trigger: 'manual',
                html: true,
                gravity: gravity,
                title: 'title'});
        if (show) {
            AJS.$(popupSelectorID).tooltip('show');
            setTimeout(() => {
                // hide the tooltip
                AJS.$(popupSelectorID).tooltip('hide');
            }, timeout);
        } else {
            AJS.$(popupSelectorID).tooltip('hide');
        }
    }

    _renderPrimaryToolbar() {
        const isSplitter = interfaceConfig.MAIN_TOOLBAR_SPLITTER_INDEX !== undefined
            && index === interfaceConfig.MAIN_TOOLBAR_SPLITTER_INDEX;

        return (
            <div id = 'mainToolbarContainer'>
                <div
                    className = 'notice'
                    id = 'notice'
                    style = { _DISPLAY_NONE_STYLE }>
                            <span
                                className = 'noticeText'
                                id = 'noticeText' />
                </div>
                <div
                    className = 'toolbar'
                    id = 'mainToolbar' >

                </div>
            </div>
        );
    }

    _renderSecondaryToolbar() {
        return (
            <div
                className = 'toolbar'
                id = 'extendedToolbar'>
                <div id = 'extendedToolbarButtons' />

                <FeedbackButton />

                <div id = 'sideToolbarContainer' />
            </div>
        );
    }

    render() {
        return (
            <div>
                {
                    this._renderPrimaryToolbar()
                }
                {
                    this._renderSecondaryToolbar()
                }
            </div>
        );
    }
}
