/* @flow */

import React from 'react';

import AbstractToolbarButton from './AbstractToolbarButton';

import UIUtil from '../../../../modules/UI/util/UIUtil';

declare var APP: Object;
declare var interfaceConfig: Object;
declare var $: Function;

/**
 * Represents a button in Toolbar on React.
 *
 * @class ToolbarButton
 * @extends AbstractToolbarButton
 */
export default class ToolbarButton extends AbstractToolbarButton {

    /**
     * Initializes new ToolbarButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        this.popups = [];

        // Bind methods to save the context
        const self: any = this;

        self._pushPopup = this._pushPopup.bind(this);

    }

    /**
     * Forces translation of the button and sets shortcut/tooltip
     * after mounting of the component.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this.popups.forEach(popup => {
            APP.translation.translateElement($(popup));
        });

        this._setShortcutAndTooltip();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        type MapOfProps = { [key: string]: * };

        let className = this.props.className;

        if (this.props.toggled) {
            className += ' toggled';
        }

        const popups = this.props.popups || [];
        const id = this.props.id;
        const props: MapOfProps = {
            className,
            id
        };

        props['data-container'] = 'body';
        props['data-placement'] = 'bottom';

        props.onClick = this.props.onClick;

        if (this.props.content) {
            props.content = this.props.content;
        }

        if (this.props.i18n) {
            props['data-i18n'] = this.props.i18n;
        }

        // TODO: remove it after UI.updateDTMFSupport fix
        if (this.props.hidden) {
            props.style = { display: 'none' };
        }

        return (
            <a { ...props } >
                { this._renderInnerElementsIfRequired() }
                { this._renderPopups(popups) }
            </a>
        );
    }

    /**
     * If toolbar button should contain children elements
     * renders them.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderInnerElementsIfRequired() {
        if (this.props.html) {
            return this.props.html;
        }

        return null;
    }

    /**
     * Renders popup element for toolbar button.
     *
     * @param {Array} popups - Array of popup objects.
     * @returns {Array}
     * @private
     */
    _renderPopups(popups: Array<*> = []) {
        return popups.map(popup => {
            let gravity = 'n';

            if (popup.dataAttrPosition) {
                gravity = popup.dataAttrPosition;
            }

            return (
                <div
                    className = { popup.className }
                    data-i18n = { popup.dataAttr }
                    data-tooltip = { gravity }
                    id = { popup.id }
                    key = { popup.id }
                    ref = { this._pushPopup } />
            );
        });
    }

    /**
     * Adds popup to the array property.
     *
     * @param {HTMLElement} popup - Popup element.
     * @returns {void}
     * @private
     */
    _pushPopup(popup) {
        this.popups.push(popup);
    }

    /**
     * Sets shortcut and tooltip for current toolbar button.
     *
     * @private
     * @returns {void}
     */
    _setShortcutAndTooltip() {
        const id = this.props.id;
        const name = this.props.buttonName;

        if (UIUtil.isButtonEnabled(name)) {
            const buttonElement = document.getElementById(id);

            if (!buttonElement) {
                return false;
            }

            const tooltipPosition
                = interfaceConfig.MAIN_TOOLBAR_BUTTONS.indexOf(name) > -1
                ? 'bottom' : 'right';

            UIUtil.setTooltip(buttonElement,
                this.props.tooltipKey,
                tooltipPosition);

            if (this.props.shortcut) {
                APP.keyboardshortcut.registerShortcut(
                    this.props.shortcut,
                    this.props.shortcutAttr,
                    this.props.shortcutFunc,
                    this.props.shortcutDescription
                );
            }
        }
    }
}
