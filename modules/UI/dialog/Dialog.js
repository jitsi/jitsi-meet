/* global APP, $, config, AJS, interfaceConfig, JitsiMeetJS, _ */

class Dialog {
    constructor(msg, config) {
        console.log(config);

        this.options = {
            title: config.title,
            persistent: config.persistent,
            buttons: config.buttons,
            defaultButton: config.defaultButton,
            loaded: config.loaded,
            submit: config.submit,
            close: config.close
        };

        if (typeof msg === 'object') {
            this.options.states = msg;
        } else {
            this.options.msg = msg;
        }

        this._initLayout();

        // Copying Improptu behavior
        this._createDialog();
        this.show();
    }

    _initLayout() {
        let $dialog = $('#demo-dialog');
        let { msg, title, buttons, defaultButton } = this.options;



        console.log('buttons', buttons);
        console.log('defaultButton', defaultButton);

        $dialog.find('.aui-dialog2-header-main').html(title);

        if(msg) {
            $dialog.find('.aui-dialog2-content').html(msg);
        }


        this._initButtons();
    }

    _initButtons() {
        let $dialog = $('#demo-dialog');

        if (!this.options.buttons) {
            let btn = $('<button>');
            btn.addClass('aui-button');
            btn.text('OK');
            this.options.buttons = [btn];
        }

        let { buttons, defaultButton } = this.options;
        let $buttonContainer = $dialog.find('.aui-dialog2-footer-actions');

        for (let key in buttons) {
            $buttonContainer.append(buttons[key]);
        }

        let defaultButtonElement;
        if(buttons[defaultButton]) {
            defaultButtonElement = buttons[defaultButton];
        } else {
            defaultButtonElement = _.last(buttons);
        }
        defaultButtonElement.addClass('aui-button-primary');
    }

    /**
     * Creates dialog instance and store it in
     * property
     * @private
     */
    _createDialog() {
        this.dialog = AJS.dialog2('#demo-dialog');
    }

    /**
     * Method showing dialog
     */
    show() {
        this.dialog.show();
    }

    /**
     * Method hiding dialog
     */
    hide() {
        this.dialog.hide();
    }
}

export default Dialog;