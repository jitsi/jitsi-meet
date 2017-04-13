import React, { Component } from 'react';

import { translate } from '../../base/i18n';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * A React Component for displaying a value with a copy button that can be
 * clicked to copy the value onto the clipboard.
 */
class ShareLinkForm extends Component {
    /**
     * ShareLinkForm component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func,

       /**
         * The value to be displayed and copied onto the clipboard.
         */
        toCopy: React.PropTypes.string
    }

    /**
     * Initializes a new ShareLinkForm instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._inputElement = null;

        this._onClick = this._onClick.bind(this);
        this._setInput = this._setInput.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const inputValue = this.props.toCopy
            || this.props.t('inviteUrlDefaultMsg');

        // FIXME input is used here instead of atlaskit field-text because
        // field-text does not currently support readonly
        return (
            <div className = 'form-control'>
                <label className = 'form-control__label'>
                    { this.props.t('dialog.shareLink') }
                </label>
                <div className = 'form-control__container'>
                    <input
                        className = 'input-control inviteLink'
                        id = 'inviteLinkRef'
                        readOnly = { true }
                        ref = { this._setInput }
                        type = 'text'
                        value = { inputValue } />
                    <button
                        className =
                            'button-control button-control_light copyInviteLink'
                        onClick = { this._onClick }
                        type = 'button'>
                        { this.props.t('dialog.copy') }
                    </button>
                </div>
            </div>
        );
    }

    /**
     * Copies the passed in value to the clipboard.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        try {
            this._inputElement.select();
            document.execCommand('copy');
            this._inputElement.blur();
        } catch (err) {
            logger.error('error when copying the text', err);
        }
    }

    /**
     * Sets the internal reference to the DOM element for the input field so it
     * may be accessed directly.
     *
     * @param {Object} element - DOM element for the component's input.
     * @private
     * @returns {void}
     */
    _setInput(element) {
        this._inputElement = element;
    }
}

export default translate(ShareLinkForm);
