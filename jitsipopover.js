var JitsiPopover = (function () {
    /**
     * Constructs new JitsiPopover and attaches it to the element
     * @param element jquery selector
     * @param options the options for the popover.
     * @constructor
     */
    function JitsiPopover(element, options)
    {
        this.options = {
            skin: "white",
            content: ""
        };
        if(options)
        {
            if(options.skin)
                this.options.skin = options.skin;

            if(options.content)
                this.options.content = options.content;
        }

        this.elementIsHovered = false;
        this.popoverIsHovered = false;
        this.popoverShown = false;

        element.data("jitsi_popover", this);
        this.element = element;
        this.template = ' <div class="jitsipopover ' + this.options.skin +
            '"><div class="arrow"></div><div class="jitsipopover-content"></div>' +
            '<div class="jitsiPopupmenuPadding"></div></div>';
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
     * Shows the popover
     */
    JitsiPopover.prototype.show = function () {
        this.createPopover();
        this.popoverShown = true;

    };

    /**
     * Hides the popover
     */
    JitsiPopover.prototype.hide = function () {
        if(!this.elementIsHovered && !this.popoverIsHovered && this.popoverShown)
        {
            this.forceHide();
        }
    };

    /**
     * Hides the popover
     */
    JitsiPopover.prototype.forceHide = function () {
        $(".jitsipopover").remove();
        this.popoverShown = false;
    };

    /**
     * Creates the popover html
     */
    JitsiPopover.prototype.createPopover = function () {
        $("body").append(this.template);
        $(".jitsipopover > .jitsipopover-content").html(this.options.content);
        var self = this;
        $(".jitsipopover").on("mouseenter", function () {
            self.popoverIsHovered = true;
        }).on("mouseleave", function () {
            self.popoverIsHovered = false;
            self.hide();
        });

        this.refreshPosition();
    };

    /**
     * Refreshes the position of the popover
     */
    JitsiPopover.prototype.refreshPosition = function () {
        $(".jitsipopover").position({
            my: "bottom",
            at: "top",
            collision: "fit",
            of: this.element,
            using: function (position, elements) {
                var calcLeft = elements.target.left - elements.element.left + elements.target.width/2;
                $(".jitsipopover").css({top: position.top, left: position.left, display: "table"});
                $(".jitsipopover > .arrow").css({left: calcLeft});
                $(".jitsipopover > .jitsiPopupmenuPadding").css({left: calcLeft - 50});
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

    return JitsiPopover;


})();