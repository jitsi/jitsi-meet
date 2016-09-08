/* global $ */

const ExtendedToolbarToggler = {
    init() {
        document.getElementById("extendedToolbarPanel")
            .addEventListener("animationend", function(e) {
                console.log("ANIM NAME", e.animationName);
                if(e.animationName === "slideOutExt")
                    $("#extendedToolbarPanel").children().each(function() {
                        if ($(this).hasClass("show"))
                            $(this).removeClass("show").addClass("hide");
                    });
            }, false);
    },

    toggle(elementId) {
        let elementSelector = $(`#${elementId}`);
        let isSelectorVisible = elementSelector.hasClass("show");

        if (isSelectorVisible) {
            this.hide();
        }
        else {
            if (this.isVisible())
                $("#extendedToolbarPanel").children().each(function() {
                    if ($(this).id !== elementId && $(this).hasClass("show"))
                        $(this).removeClass("show").addClass("hide");
                });

            if (!this.isVisible())
                this.show();

            elementSelector.removeClass("hide").addClass("show");
        }
    },

    /**
     * Returns true if this toolbar is currently visible, or false otherwise.
     * @return <tt>true</tt> if currently visible, <tt>false</tt> - otherwise
     */
    isVisible() {
        return $("#extendedToolbarPanel").hasClass("slideInExt");
    },

    /**
     * Hides the toolbar with animation or not depending on the animate
     * parameter.
     */
    hide(elementId) {
        $("#extendedToolbarPanel")
            .removeClass("slideInExt").addClass("slideOutExt");
    },

    /**
     * Shows the toolbar with animation or not depending on the animate
     * parameter.
     */
    show(elementId) {
        if (!this.isVisible())
            $("#extendedToolbarPanel")
                .removeClass("slideOutExt").addClass("slideInExt");
    },

    resize () {
        //let [width, height] = UIUtil.getSidePanelSize();
        //Chat.resizeChat(width, height);
    }
};

export default ExtendedToolbarToggler;