// @flow

import React, { Component } from 'react';
import { FieldTextStateless } from '@atlaskit/field-text';

type Props = {

    /**
     * Item ID in list.
     */
    id: string,

    /**
     * Container delete method.
     */
    deleteHandler?: Function,

    /**
     * Can be removed, or changed. Need remove and text handlers.
     */
    editable: boolean,

    /**
     * True if item can't be voted.
     */
    disabled: boolean,

    /**
     * Wether this item is selected before by the user or not.
     */
    selected: boolean,

    /**
     * Text of the voting option.
     */
    text: string,

    /**
     * Container text update method.
     */
    textChangeHandler?: Function,

    /**
     * Option voting handling method.
     */
    voteHandler?: Function,

    /**
     * Number of votes for this option.
     */
    votes: number

};

/**
 * Poll option view component.
 */
class PollChoice extends Component<Props, State> {

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onClickHandler = this._onClickHandler.bind(this);
        this._onTextChange = this._onTextChange.bind(this);
        this._onVoteChange = this._onVoteChange.bind(this);
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const { disabled, editable, selected } = this.props;
        const itemControls = this.props.editable
            ? (
                <div
                    id = { 'poll-item-button' } >
                    <button
                        onClick = { this._onClickHandler }
                        text = { '+' }
                        type = { 'button' } />
                </div>
            ) : (
                <div
                    id = { 'poll-item-votes' } >
                    <label>
                        { this.props.votes }
                    </label>
                </div>
            );

        return (
            <li>
                <div
                    id = { 'poll-item' } >
                    <div
                        id = { 'poll-item-radio' } >
                        <input
                            checked = { selected }
                            disabled = { disabled }
                            onChange = { this._onVoteChange }
                            type = { 'radio' }
                            value = { '' } />
                    </div>
                    <div
                        id = { 'poll-item-text' } >
                        <FieldTextStateless
                            disabled = { !editable }
                            onChange = { this._onTextChange }
                            value = { this.props.text } />
                    </div>
                    { itemControls }
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
        const { deleteHandler } = this.props;

        if (deleteHandler) {
            deleteHandler(this.props.id);
        }
    }

    _onTextChange: (Object) => void;

    /**
     * Text change event handler.
     *
     * @param {Object} event - Text change event.
     * @returns {void}
     */
    _onTextChange(event: Object) {
        const { editable, textChangeHandler } = this.props;

        if (!editable) {
            return;
        }

        if (textChangeHandler) {
            textChangeHandler(this.props.id, event.target.value);
        }

    }

    _onVoteChange: () => boolean;

    /**
     * Radio Button for voting check change.
     *
     * @returns {boolean}
     */
    _onVoteChange() {
        const { disabled, voteHandler } = this.props;

        if (disabled) {
            return;
        }

        if (voteHandler) {
            voteHandler(this.props.id);
        }

        return true;
    }
}

export default PollChoice;
