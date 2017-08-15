import Button from '@atlaskit/button';
import { FieldText } from '@atlaskit/field-text';
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
         * The internal reference to the React {@code component} for display
         * the meeting link in an input element.
         *
         * @private
         * @type {ReactComponent}
         */
        this._inputComponent = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
        this._onDropdownTriggerInputChange
            = this._onDropdownTriggerInputChange.bind(this);
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

        return (
            <div className = 'form-control'>
                <label className = 'form-control__label'>
                    { t('dialog.shareLink') }
                </label>
                <div className = 'form-control__container'>
                    <div className = 'form-control__input-container'>
                        <FieldText
                            compact = { true }
                            id = 'inviteLinkRef'
                            isLabelHidden = { true }
                            isReadOnly = { true }
                            label = 'invite link'
                            onChange = { this._onDropdownTriggerInputChange }
                            ref = { this._setInput }
                            shouldFitContainer = { true }
                            type = 'text'
                            value = { inputValue } />
                    </div>
                    <Button
                        appearance = 'default'
                        onClick = { this._onClick }
                        shouldFitContainer = { true }
                        type = 'button'>
                        { t('dialog.copy') }
                    </Button>
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
            const { input } = this._inputComponent;

            input.select();
            document.execCommand('copy');
            input.blur();
        } catch (err) {
            logger.error('error when copying the text', err);
        }
    }

    /**
     * This is a no-op function used to stub out FieldText's onChange in order
     * to prevent FieldText from printing prop type validation errors. FieldText
     * is used as a trigger for the dropdown in {@code ShareLinkForm} to get the
     * desired AtlasKit input look for the UI.
     *
     * @returns {void}
     */
    _onDropdownTriggerInputChange() {
        // Intentionally left empty.
    }

    /**
     * Sets the internal reference to the React Component wrapping the input
     * with id {@code inviteLinkRef}.
     *
     * @param {ReactComponent} inputComponent - React Component for displaying
     * an input for displaying the meeting link.
     * @private
     * @returns {void}
     */
    _setInput(inputComponent) {
        this._inputComponent = inputComponent;
    }
}

export default translate(ShareLinkForm);
