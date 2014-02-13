var Etherpad = (function (my) {
    var etherpadName = null;

    /**
     * Initializes the etherpad.
     */
    my.init = function (name) {

        if (config.etherpad_base && !etherpadName) {

            if (!name) {
                // In case we're the focus we generate the name.
                etherpadName = Math.random().toString(36).substring(7) + '_' + (new Date().getTime()).toString();
                shareEtherpad();
            }
            else
                etherpadName = name;
                
            this.domain = config.etherpad_base;
            this.options = "?showControls=true&showChat=false&showLineNumbers=true&useMonospaceFont=false";

            createEtherpadButton();

            this.iframe = document.createElement('iframe');
            this.iframe.src = this.domain + etherpadName + this.options;
            this.iframe.frameBorder = 0;
            this.iframe.scrolling = "no";
            this.iframe.width = $('#largeVideoContainer').width() || 640;
            this.iframe.height = $('#largeVideoContainer').height() || 480;
            this.iframe.setAttribute('style', 'visibility: hidden;');

            document.getElementById('etherpad').appendChild(this.iframe);
        }
    }

    /**
     * Opens/hides the Etherpad.
     */
    my.toggleEtherpad = function (isPresentation) {
        var largeVideo = null;
        if (isPresentationVisible())
            largeVideo = $('#presentation>iframe');
        else
            largeVideo = $('#largeVideo');

        if ($('#etherpad>iframe').css('visibility') == 'hidden') {
            largeVideo.fadeOut(300, function () {
                if (isPresentationVisible())
                    largeVideo.css({opacity:'0'});
                else
                    largeVideo.css({visibility:'hidden'});

                $('#etherpad>iframe').fadeIn(300, function() {
                    $('#etherpad>iframe').css({visibility:'visible'});
                    $('#etherpad').css({zIndex:2});
                });
            });
        }
        else if ($('#etherpad>iframe')) {
            $('#etherpad>iframe').fadeOut(300, function () {
                $('#etherpad>iframe').css({visibility:'hidden'});
                $('#etherpad').css({zIndex:0});
                if (!isPresentation) {
                    $('#largeVideo').fadeIn(300, function() {
                        $('#largeVideo').css({visibility:'visible'});
                    });
                }
            });
        }
    };

    /**
     * Shares the Etherpad name with other participants.
     */
    function shareEtherpad() {
        connection.emuc.addEtherpadToPresence(etherpadName);
        connection.emuc.sendPresence();
    }

    /**
     * Creates the Etherpad button and adds it to the toolbar.
     */
    function createEtherpadButton() {
        //<div class="header_button_separator"></div>
        //<a class="button" onclick='Etherpad.openEtherpad("teeest");'>
        //<i title="Open shared document" class="fa fa-file-text fa-lg"></i></a>
        var separator = document.createElement('div');
        separator.className = 'header_button_separator';

        var button = document.createElement('a');
        button.className = 'button';
        button.setAttribute('onclick', 'Etherpad.toggleEtherpad(0);');
        
        var buttonImage = document.createElement('i');
        buttonImage.setAttribute('title', 'Open shared document');
        buttonImage.className = 'fa fa-file-text fa-lg';

        button.appendChild(buttonImage);

        var toolbar = document.getElementById('toolbar');
        toolbar.insertBefore(button, toolbar.childNodes[toolbar.childNodes.length - 4]);
        toolbar.insertBefore(separator, button);
    }

    /**
     * On Etherpad added to muc.
     */
    $(document).bind('etherpadadded.muc', function (event, jid, etherpadName) {
        console.log("Etherpad added", etherpadName);
        if (config.etherpad_base && !focus) {
            Etherpad.init(etherpadName);
        }
    });

    /**
     * On focus changed event.
     */
    $(document).bind('focusechanged.muc', function (event, focus) {
        console.log("Focus changed");
        if (config.etherpad_base)
            shareEtherpad();
    });

    /**
     * On video selected event.
     */
    $(document).bind('video.selected', function (event, isPresentation) {
        if (!config.etherpad_base)
            return;

        if ($('#etherpad>iframe').css('visibility') != 'hidden')
            Etherpad.toggleEtherpad(isPresentation);
    });

    return my;
}(Etherpad || {}));