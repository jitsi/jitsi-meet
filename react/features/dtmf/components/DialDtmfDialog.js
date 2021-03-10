// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React, { Component } from 'react';

import { sendTones } from '../../base/conference';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';

declare var APP: Object;

type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link DialDtmfDialog}.
 */
type State = {

    /**
     * The currently entered number sequence.
     */
    numbers: string,

    /**
     * The currently entered tone duration (ms).
     */
    toneDuration: number,

    /**
     * The currently entered pause duration (ms).
     */
    pauseDuration: number
};

/**
 * A dialog that allows to dial a DTMF number sequence.
 */
class DialDtmfDialog extends Component<Props, State> {

    /**
     * Initializes a new {@code DialDtmfDialog} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            /**
             * The currently entered number sequence.
             *
             * @type {string}
             */
            numbers: '',

            /**
             * The currently entered tone duration (ms).
             *
             * @type {number}
             */
            toneDuration: 150,

            /**
             * The currently entered pause duration (ms).
             *
             * @type {number}
             */
            pauseDuration: 40
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onNumbersChange = this._onNumbersChange.bind(this);
        this._onToneDurationChange = this._onToneDurationChange.bind(this);
        this._onPauseDurationChange = this._onPauseDurationChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { numbers, toneDuration, pauseDuration } = this.state;
        const { t } = this.props;

        return (
            <Dialog
                onSubmit = { this._onSubmit }
                titleKey = { 'dialDtmf.title' }
                width = 'small'>
                <div className = 'dial-dtmf-dialog'>
                    <FieldTextStateless
                        autoFocus = { true }
                        compact = { true }
                        isSpellCheckEnabled = { false }
                        label = { t('dialDtmf.numbers') }
                        name = 'numbers'
                        okDisabled = { false }
                        onChange = { this._onNumbersChange }
                        placeholder = { t('dialDtmf.numbersPlaceholder') }
                        shouldFitContainer = { true }
                        type = 'text'
                        value = { numbers } />
                    <FieldTextStateless
                        compact = { true }
                        isSpellCheckEnabled = { false }
                        label = { t('dialDtmf.toneDuration') }
                        name = 'toneDuration'
                        okDisabled = { false }
                        onChange = { this._onToneDurationChange }
                        shouldFitContainer = { true }
                        type = 'text'
                        value = { toneDuration } />
                    <FieldTextStateless
                        compact = { true }
                        isSpellCheckEnabled = { false }
                        label = { t('dialDtmf.pauseDuration') }
                        name = 'pauseDuration'
                        okDisabled = { false }
                        onChange = { this._onPauseDurationChange }
                        shouldFitContainer = { true }
                        type = 'text'
                        value = { pauseDuration } />
                </div>
            </Dialog>
        );
    }

    _onNumbersChange: (event: Object) => void;

    /**
     * Updates the known entered number sequence.
     *
     * @param {Object} event - The DOM event from updating the textfield for the
     * number sequence.
     * @private
     * @returns {void}
     */
    _onNumbersChange(event) {
        this.setState({ numbers: event.target.value });
    }

    _onToneDurationChange: (event: Object) => void;

    /**
     * Updates the known entered tone duration.
     *
     * @param {Object} event - The DOM event from updating the textfield for the
     * tone duration.
     * @private
     * @returns {void}
     */
    _onToneDurationChange(event) {
        this.setState({ toneDuration: event.target.value });
    }

    _onPauseDurationChange: (event: Object) => void;

    /**
     * Updates the known entered pause duration.
     *
     * @param {Object} event - The DOM event from updating the textfield for the
     * pause duration.
     * @private
     * @returns {void}
     */
    _onPauseDurationChange(event) {
        this.setState({ pauseDuration: event.target.value });
    }

    _onSubmit: () => void;

    /**
     * Dispatches the entered numbers for submission.
     *
     * @private
     * @returns {boolean} Returns true to close the dialog.
     */
    _onSubmit() {
        const { numbers, toneDuration, pauseDuration } = this.state;

        APP.store.dispatch(sendTones(numbers, toneDuration, pauseDuration));

        return true;
    }
}

const mapStateToProps = () => {
    return {
    };
};

export default translate(connect(mapStateToProps)(DialDtmfDialog));
