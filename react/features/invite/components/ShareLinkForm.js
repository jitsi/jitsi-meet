import React, { Component } from 'react';

import { translate } from '../../base/i18n';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * A React {@code Component} for displaying a value with a copy button to copy
 * the value into the clipboard.
 */
class ShareLinkForm extends Component {
    /**
     * {@code ShareLinkForm}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func,

        /**
         * The value to be displayed and copied into the clipboard.
         */
        toCopy: React.PropTypes.string
    };

    /**
     * Initializes a new {@code ShareLinkForm} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * The internal reference to the DOM/HTML element backing the React
         * {@code Component} input with id {@code inviteLinkRef}. It is
         * necessary for the implementation of copying to the clipboard.
         *
         * @private
         * @type {HTMLInputElement}
         */
        this._inputElement = null;

        // Bind event handlers so they are only bound once for every instance.
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
        const { t } = this.props;
        const inputValue = this.props.toCopy || t('inviteUrlDefaultMsg');

        // FIXME An input HTML element is used here instead of atlaskit's
        // field-text because the latter does not currently support readOnly.
        return (
            <div className = 'form-control'>
                <label className = 'form-control__label'>
                    { t('dialog.shareLink') }
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
                        { t('dialog.copy') }
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
     * Sets the internal reference to the DOM/HTML element backing the React
     * {@code Component} input with id {@code inviteLinkRef}.
     *
     * @param {HTMLInputElement} element - The DOM/HTML element for this
     * {@code Component}'s input.
     * @private
     * @returns {void}
     */
    _setInput(element) {
        this._inputElement = element;
    }
}

export default translate(ShareLinkForm);
