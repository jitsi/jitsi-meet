// @flow

import React, { Component } from 'react';
import { FieldTextStateless } from '@atlaskit/field-text';

type Props = {

    /**
     * Item ID in list.
     */
    id: number,

    /**
     * Container delete method.
     */
    deleteHandler: Function,

    /**
     * Text of the voting option.
     */
    text: string,

    /**
     * Container text update method.
     */
    textChangeHandler: Function
};

/**
 * Poll option view component.
 */
class PollItem extends Component<Props, *> {

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onClickHandler = this._onClickHandler.bind(this);
        this._onTextChange = this._onTextChange.bind(this);
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        return (
            <li>
                <div
                    id = { 'poll-item' } >
                    <div
                        id = { 'poll-item-radio' } >
                        <input
                            type = { 'radio' }
                            value = { '' } />
                    </div>
                    <div
                        id = { 'poll-item-text' } >
                        <FieldTextStateless
                            onChange = { this._onTextChange }
                            value = { this.props.text } />
                    </div>
                    <div
                        id = { 'poll-item-button' } >
                        <button
                            onClick = { this._onClickHandler }
                            type = { 'button' } />
                    </div>
                </div>
            </li>
        );
    }

    _onClickHandler: () => void;

    /**
     * Handles button click.
     *
     * @returns {void}
     */
    _onClickHandler() {
        this.props.deleteHandler(this.props.id);
    }

    _onTextChange: (Object) => void;

    /**
     * Text change event handler.
     *
     * @param {Object} event - Text change event.
     * @returns {void}
     */
    _onTextChange(event: Object) {
        this.props.textChangeHandler(this.props.id, event.target.value);
    }
}

export default PollItem;
