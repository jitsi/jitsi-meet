/* global $ */

/* eslint-disable no-unused-vars */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';

import { i18next } from '../../../react/features/base/i18n';
/* eslint-enable no-unused-vars */

const positionConfigurations = {
    left: {

        // Align the popover's right side to the target element.
        my: 'right',

        // Align the popover to the left side of the target element.
        at: 'left',

        // Force the popover to fit within the viewport.
        collision: 'fit',

        /**
         * Callback invoked by jQuery UI tooltip.
         *
         * @param {Object} position - The top and bottom position the popover
         * element should be set at.
         * @param {Object} element. - Additional size and position information
         * about the popover element and target.
         * @param {Object} elements.element - Has position and size related data
         * for the popover element itself.
         * @param {Object} elements.target - Has position and size related data
         * for the target element the popover displays from.
         */
        using: function setPositionLeft(position, elements) {
            const { element, target } = elements;

            $('.jitsipopover').css({
                display: 'table',
                left: element.left,
                top: element.top
            });

            // Move additional padding to the right edge of the popover and
            // allow css to take care of width. The padding is used to maintain
            // a hover state between the target and the popover.
            $('.jitsipopover > .jitsipopover__menu-padding')
                .css({ left: element.width });

            // Find the distance from the top of the popover to the center of
            // the target and use that value to position the arrow to point to
            // it.
            const verticalCenterOfTarget = target.height / 2;
            const verticalDistanceFromTops = target.top - element.top;
            const verticalPositionOfTargetCenter
                = verticalDistanceFromTops + verticalCenterOfTarget;

            $('.jitsipopover > .arrow').css({
                left: element.width,
                top: verticalPositionOfTargetCenter
            });
        }
    },
    top: {
        my: "bottom",
        at: "top",
        collision: "fit",
        using: function setPositionTop(position, elements) {
            const { element, target } = elements;
            const calcLeft = target.left - element.left + target.width / 2;
            const paddingLeftPosition = calcLeft - 50;
            const $jistiPopover = $('.jitsipopover');

            $jistiPopover.css({
                display: 'table',
                left: element.left,
                top: element.top
            });
            $jistiPopover.find('.arrow').css({ left: calcLeft });
            $jistiPopover.find('.jitsipopover__menu-padding')
                .css({ left: paddingLeftPosition });
            $jistiPopover.find('.jitsipopover__menu-padding-top')
                .css({ left: paddingLeftPosition });
        }
    }
};
export default (function () {
    /**
     * The default options
     */
    const defaultOptions = {
        skin: 'white',
        content: '',
        hasArrow: true,
        onBeforePosition: undefined,
        position: 'top'
    };

    /**
     * Constructs new JitsiPopover and attaches it to the element
     * @param element jquery selector
     * @param options the options for the popover.
     * @constructor
     */
    function JitsiPopover(element, options)
    {
        this.options = Object.assign({}, defaultOptions, options);
        this.elementIsHovered = false;
        this.popoverIsHovered = false;
        this.popoverShown = false;

        element.data("jitsi_popover", this);
        this.element = element;
        this.template = this.getTemplate();
        var self = this;
        this.element.on("mouseenter", function () {
            self.elementIsHovered = true;
            self.show();
        }).on("mouseleave", function () {
            self.elementIsHovered = false;
            setTimeout(function () {
                self.hide();
            }, 10);
        });
    }

    /**
     * Returns template for popover
     */
    JitsiPopover.prototype.getTemplate = function () {
        const { hasArrow, position, skin } = this.options;

        let arrow = '';
        if (hasArrow) {
            arrow = '<div class="arrow"></div>';
        }

        return  (
            `<div class="jitsipopover ${skin} ${position}">
                <div class="jitsipopover__menu-padding-top"></div>
                ${arrow}
                <div class="jitsipopover__content"></div>
                <div class="jitsipopover__menu-padding"></div>
            </div>`
        );
    };

    /**
     * Shows the popover
     */
    JitsiPopover.prototype.show = function () {
        if(!JitsiPopover.enabled)
            return;
        this.createPopover();
        this.popoverShown = true;
    };

    /**
     * Hides the popover if not hovered or popover is not shown.
     */
    JitsiPopover.prototype.hide = function () {
        if(!this.elementIsHovered && !this.popoverIsHovered &&
            this.popoverShown) {
            this.forceHide();
        }
    };

    /**
     * Hides the popover and clears the document elements added by popover.
     */
    JitsiPopover.prototype.forceHide = function () {
        this.remove();
        this.popoverShown = false;
        if(this.popoverIsHovered) { //the browser is not firing hover events
            //when the element was on hover if got removed.
            this.popoverIsHovered = false;
            this.onHoverPopover(this.popoverIsHovered);
        }
    };

    /**
     * Creates the popover html.
     */
    JitsiPopover.prototype.createPopover = function () {
        let $popover = $('.jitsipopover');

        if (!$popover.length) {
            $('body').append(this.template);

            $popover = $('.jitsipopover');

            $popover.on('mouseenter', () => {
                this.popoverIsHovered = true;
                if (typeof this.onHoverPopover === 'function') {
                    this.onHoverPopover(this.popoverIsHovered);
                }
            });

            $popover.on('mouseleave', () => {
                this.popoverIsHovered = false;
                this.hide();
                if (typeof this.onHoverPopover === 'function') {
                    this.onHoverPopover(this.popoverIsHovered);
                }
            });
        }

        const $popoverContent = $popover.find('.jitsipopover__content');

        /* jshint ignore:start */
        ReactDOM.render(
            <I18nextProvider i18n = { i18next }>
                { this.options.content }
            </I18nextProvider>,
            $popoverContent.get(0),
            () => {
                this.refreshPosition();
            });
        /* jshint ignore:end */
    };

    /**
     * Adds a hover listener to the popover.
     */
    JitsiPopover.prototype.addOnHoverPopover = function (listener) {
        this.onHoverPopover = listener;
    };

    /**
     * Refreshes the position of the popover.
     */
    JitsiPopover.prototype.refreshPosition = function () {
        const positionOptions = Object.assign(
            {},
            positionConfigurations[this.options.position],
            {
                of: this.element
            }
        );
        $(".jitsipopover").position(positionOptions);
    };

    /**
     * Updates the content of popover.
     * @param content new content
     */
    JitsiPopover.prototype.updateContent = function (content) {
        this.options.content = content;
        if (!this.popoverShown) {
            return;
        }
        this.createPopover();
    };

    /**
     * Unmounts any present child React Component and removes the popover itself
     * from the DOM.
     *
     * @returns {void}
     */
    JitsiPopover.prototype.remove = function () {
        const $popover = $('.jitsipopover');
        const $popoverContent = $popover.find('.jitsipopover__content');

        if ($popoverContent.length) {
            ReactDOM.unmountComponentAtNode($popoverContent.get(0));
        }

        $popover.off();
        $popover.remove();
    };

    JitsiPopover.enabled = true;

    return JitsiPopover;
})();
