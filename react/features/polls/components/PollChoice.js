// @flow

import React, { Component } from 'react';

type Props = {

    /**
     * Item ID in list.
     */
    id: string,

    /**
     * True if item can't be voted.
     */
    disabled: boolean,

    /**
     * Wether this item is selected before by the user or not.
     */
    selected: boolean,

    /**
     * Text of the voting choice.
     */
    text: string,

    /**
     * Function handler when user vote for this choice.
     */
    onVote?: Function,

    /**
     * Number of votes for this choice.
     */
    votes: number
};

/**
 * Poll option view component.
 */
class PollChoice extends Component<Props, *> {

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onVoteChange = this._onVoteChange.bind(this);
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const { disabled, selected, text, votes } = this.props;
        const textCSSClass = disabled ? 'pollChoiceDisabledText'
            : 'pollChoiceEnabledText';
        const renderedRadioButton = (
            <div
                className = 'pollVoteButtonContainer' >
                <input
                    checked = { selected }
                    id = 'pollVoteButton'
                    onClick = { this._onVoteChange }
                    type = { 'radio' } />
            </div>
        );

        return (
            <li>
                <div
                    className = 'pollChoiceContainer' >
                    { !disabled && renderedRadioButton}
                    <div
                        className = 'pollChoiceTextContainer' >
                        <text
                            className = { textCSSClass }
                            onClick = { this._onVoteChange } >
                            { text }
                        </text>
                    </div>

                    <div
                        className = 'pollChoiceVotesContainer' >
                        <label>
                            { votes }
                        </label>
                    </div>
                </div>
            </li>
        );
    }

    _onVoteChange: () => void;

    /**
     * Radio Button for voting check change.
     *
     * @returns {void}
     */
    _onVoteChange() {
        const { disabled, id, onVote } = this.props;

        if (disabled) {
            return;
        }

        if (onVote) {
            onVote(id);
        }
    }
}

export default PollChoice;
