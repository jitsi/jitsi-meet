// @flow
/* eslint-disable comma-dangle, max-len */

import React, { Component } from 'react';


type Props = {

    /**
     * Account or chain name
     */
    participant: Object,

    /**
     * callback form communicating state to parent component
     */
    onDataChange: Function,
};

type State = {

    /**
     * Fiat currency.
     */
    currency: string,

    /**
     * AE value
     */
    value: string,

    /**
     * Any error
     */
    error: string,

    /**
     * Message for the author
     */
    message: string,
};


/**
 * Aeternity tip button react version.
 */
class TipForm extends Component<Props, State> {
    /**
     * Initializes a new TipButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            currency: 'eur',
            value: '0',
            message: `button host ${window.location.host} tip to ${this.props.participant.displayName}`,
            error: ''
        };
        this._onChangeValue = this._onChangeValue.bind(this);
    }


    /**
     * Change ae value.
     *
     * @param {Object} event - Contains new value.
     * @returns {void}
     */
    _onChangeValue({ target: { value } }) {
        this.setState({ value }, () => {
            this.props.onDataChange({ amount: value,
                message: this.state.message });
        });
    }


    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div>
                <div>Tip { this.props.participant.name }</div>
                <input onChange = { this._onChangeValue } />
            </div>

        );
    }
}
export default TipForm;

