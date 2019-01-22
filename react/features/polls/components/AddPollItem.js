// @flow

import React, { Component } from 'react';

type Props = {
    addItemHandler: Function
};

/**
 * Input component for adding poll options.
 */
class AddPollItem extends Component<Props, *> {

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onClick = this._onClick.bind(this);
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        return (
            <div
                className = { 'pollNewChoiceButtonContainer' } >
                <button
                    id = { 'pollNewChoiceButton' }
                    onClick = { this._onClick } >
                    +
                </button>
            </div>
        );
    }

    _onClick: (Object) => void;

    /**
     * Button click handler.
     *
     * @param {Object} e - Button click event.
     * @returns {void}
     */
    _onClick(e: Object) {
        e.preventDefault();
        this.props.addItemHandler();
    }
}

export default AddPollItem;
