import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { Dialog } from '../../base/dialog';

import { cancel, checkDialNumber, dial } from '../actions';
import DialOutNumbersForm from './DialOutNumbersForm';

/**
 * Implements a React {@link Component} which allows the user to dial out from
 * the conference.
 */
class DialOutDialog extends Component {
    /**
     * {@code DialOutDialog} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The redux state representing the list of dial-out codes.
         */
        _dialOutCodes: React.PropTypes.array,

        /**
         * Property indicating if a dial number is allowed.
         */
        _isDialNumberAllowed: React.PropTypes.bool,

        /**
         * The function performing the cancel action.
         */
        cancel: React.PropTypes.func,

        /**
         * The function performing the phone number validity check.
         */
        checkDialNumber: React.PropTypes.func,

        /**
         * The function performing the dial action.
         */
        dial: React.PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new {@code DialOutNumbersForm} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * The number to dial.
             */
            dialNumber: '',

            /**
             * Indicates if the dial input is currently empty.
             */
            isDialInputEmpty: true
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDialNumberChange = this._onDialNumberChange.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _isDialNumberAllowed } = this.props;

        return (
            <Dialog
                okDisabled = { this.state.isDialInputEmpty
                    || !_isDialNumberAllowed }
                okTitleKey = 'dialOut.dial'
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'dialOut.dialOut'
                width = 'small'>
                { this._renderContent() }
            </Dialog>
        );
    }

    /**
     * Formats the dial number in a way to remove all non digital characters
     * from it (including spaces, brackets, dash, dot, etc.).
     *
     * @param {string} dialNumber - The phone number to format.
     * @private
     * @returns {string} - The formatted phone number.
     */
    _formatDialNumber(dialNumber) {
        return dialNumber.replace(/\D/g, '');
    }

    /**
     * Renders the dialog content.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderContent() {
        const { _isDialNumberAllowed } = this.props;

        return (
            <div className = 'dial-out-content'>
                { _isDialNumberAllowed ? '' : this._renderErrorMessage() }
                <DialOutNumbersForm
                    onChange = { this._onDialNumberChange } />
            </div>);
    }

    /**
     * Renders the error message to display if the dial phone number is not
     * allowed.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderErrorMessage() {
        const { t } = this.props;

        return (
            <div className = 'dial-out-error'>
                { t('dialOut.phoneNotAllowed') }
            </div>);
    }

    /**
     * Cancel the dial out.
     *
     * @private
     * @returns {boolean} - Returns true to indicate that the dialog should be
     * closed.
     */
    _onCancel() {
        this.props.cancel();

        return true;
    }

    /**
     * Dials the number.
     *
     * @private
     * @returns {boolean} - Returns true to indicate that the dialog should be
     * closed.
     */
    _onSubmit() {
        if (this.props._isDialNumberAllowed) {
            this.props.dial(this.state.dialNumber);
        }

        return true;
    }

    /**
     * Updates the dialNumber and check for validity.
     *
     * @param {string} dialCode - The dial code value.
     * @param {string} dialInput - The dial input value.
     * @private
     * @returns {void}
     */
    _onDialNumberChange(dialCode, dialInput) {
        let formattedDialInput, formattedNumber;

        // if there are no dial out codes it is possible they are disabled
        // so we get the input as is, it can be just a sip address
        if (this.props._dialOutCodes) {
            // We remove all starting zeros from the dial input before attaching
            // it to the country code.
            formattedDialInput = dialInput.replace(/^(0+)/, '');

            const dialNumber = `${dialCode}${formattedDialInput}`;

            formattedNumber = this._formatDialNumber(dialNumber);

            this.props.checkDialNumber(formattedNumber);
        } else {
            formattedNumber = formattedDialInput = dialInput;
        }

        this.setState({
            dialNumber: formattedNumber,
            isDialInputEmpty: !formattedDialInput
            || formattedDialInput.length === 0
        });
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code DialOutDialog}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _isDialNumberAllowed: React.PropTypes.bool
 * }}
 */
function _mapStateToProps(state) {
    const { dialOutCodes, isDialNumberAllowed } = state['features/dial-out'];

    return {
        /**
         * List of dial-out codes.
         *
         * @private
         * @type {array}
         */
        _dialOutCodes: dialOutCodes,

        /**
         * Property indicating if a dial number is allowed.
         *
         * @private
         * @type {boolean}
         */
        _isDialNumberAllowed: isDialNumberAllowed
    };
}

export default translate(
    connect(_mapStateToProps, {
        cancel,
        checkDialNumber,
        dial
    })(DialOutDialog));
