/* global $ */
var JitsiPopover = (function () {
    /**
     * The default options
     */
    const defaultOptions = {
        skin: 'white',
        content: '',
        hasArrow: true,
        onBeforePosition: undefined
    };

    /**
     * Constructs new JitsiPopover and attaches it to the element
     * @param element jquery selector
     * @param options the options for the popover.
     *  - {Function} onBeforePosition - function executed just before
     *      positioning the popover. Useful for translation.
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
        let arrow = '';
        if (this.options.hasArrow) {
            arrow = '<div class="arrow"></div>';
        }
        return  (
            `<div class="jitsipopover ${this.options.skin}">
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
        $(".jitsipopover").remove();
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
        $("body").append(this.template);
        let popoverElem = $(".jitsipopover > .jitsipopover__content");
        popoverElem.html(this.options.content);
        if(typeof this.options.onBeforePosition === "function") {
            this.options.onBeforePosition($(".jitsipopover"));
        }
        var self = this;
        $(".jitsipopover").on("mouseenter", function () {
            self.popoverIsHovered = true;
            if(typeof self.onHoverPopover === "function") {
                self.onHoverPopover(self.popoverIsHovered);
            }
        }).on("mouseleave", function () {
            self.popoverIsHovered = false;
            self.hide();
            if(typeof self.onHoverPopover === "function") {
                self.onHoverPopover(self.popoverIsHovered);
            }
        });

        this.refreshPosition();
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
        $(".jitsipopover").position({
            my: "bottom",
            at: "top",
            collision: "fit",
            of: this.element,
            using: function (position, elements) {
                var calcLeft = elements.target.left - elements.element.left +
                    elements.target.width/2;
                $(".jitsipopover").css(
                    {top: position.top, left: position.left, display: "table"});
                $(".jitsipopover > .arrow").css({left: calcLeft});
                $(".jitsipopover > .jitsipopover__menu-padding").css(
                    {left: calcLeft - 50});
            }
        });
    };

    /**
     * Updates the content of popover.
     * @param content new content
     */
    JitsiPopover.prototype.updateContent = function (content) {
        this.options.content = content;
        if(!this.popoverShown)
            return;
        $(".jitsipopover").remove();
        this.createPopover();
    };

    JitsiPopover.enabled = true;

    return JitsiPopover;
})();

module.exports = JitsiPopover;
