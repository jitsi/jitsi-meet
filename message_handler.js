var messageHandler = (function(my) {

    /**
     * Shows a message to the user.
     *
     * @param titleString the title of the message
     * @param messageString the text of the message
     */
    my.openMessageDialog = function(titleString, messageString) {
        $.prompt(messageString,
            {
                title: titleString,
                persistent: false
            }
        );
    };

    /**
     * Shows a message to the user with two buttons: first is given as a parameter and the second is Cancel.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param persistent boolean value which determines whether the message is persistent or not
     * @param leftButton the fist button's text
     * @param submitFunction function to be called on submit
     * @param loadedFunction function to be called after the prompt is fully loaded
     * @param closeFunction function to be called after the prompt is closed
     */
    my.openTwoButtonDialog = function(titleString, msgString, persistent, leftButton,
                                      submitFunction, loadedFunction, closeFunction) {
        var buttons = {};
        buttons[leftButton] = true;
        buttons.Cancel = false;
        $.prompt(msgString, {
            title: titleString,
            persistent: false,
            buttons: buttons,
            defaultButton: 1,
            loaded: loadedFunction,
            submit: submitFunction,
            close: closeFunction
        });
    };

    /**
     * Shows a message to the user with two buttons: first is given as a parameter and the second is Cancel.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param persistent boolean value which determines whether the message is persistent or not
     * @param buttons object with the buttons. The keys must be the name of the button and value is the value
     * that will be passed to submitFunction
     * @param submitFunction function to be called on submit
     * @param loadedFunction function to be called after the prompt is fully loaded
     */
    my.openDialog = function(titleString, msgString, persistent, buttons, submitFunction, loadedFunction) {
        $.prompt(msgString, {
            title: titleString,
            persistent: false,
            buttons: buttons,
            defaultButton: 1,
            loaded: loadedFunction,
            submit: submitFunction
        });
    };

    /**
     * Shows a dialog with different states to the user.
     *
     * @param statesObject object containing all the states of the dialog
     * @param loadedFunction function to be called after the prompt is fully loaded
     * @param stateChangedFunction function to be called when the state of the dialog is changed
     */
    my.openDialogWithStates = function(statesObject, loadedFunction, stateChangedFunction) {


        var myPrompt = $.prompt(statesObject);

        myPrompt.on('impromptu:loaded', loadedFunction);
        myPrompt.on('impromptu:statechanged', stateChangedFunction);
    };

    /**
     * Shows a dialog prompting the user to send an error report.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param error the error that is being reported
     */
    my.openReportDialog = function(titleString, msgString, error) {
        my.openMessageDialog(titleString, msgString);
        console.log(error);
        //FIXME send the error to the server
    };

    /**
     *  Shows an error dialog to the user.
     * @param title the title of the message
     * @param message the text of the messafe
     */
    my.showError = function(title, message) {
        if(!(title || message)) {
            title = title || "Oops!";
            message = message || "There was some kind of error";
        }
        messageHandler.openMessageDialog(title, message);
    };

    my.notify = function(displayName, cls, message) {
        toastr.info(
            '<span class="nickname">' +
                displayName +
            '</span><br>' +
            '<span class=' + cls + '>' +
                message +
            '</span>');
    };

    return my;
}(messageHandler || {}));


