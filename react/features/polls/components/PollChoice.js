// @flow

import React, { Component } from 'react';

type Props = {

    /**
     * The ID of the choice.
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

        return (
            <li>
                <div
                    className = 'pollChoiceContainer' >
                    {
                        !disabled
                        && <div
                            className = 'pollVoteButtonContainer' >
                            <input
                                checked = { selected }
                                id = 'pollVoteButton'
                                onClick = { this._onVoteChange }
                                type = { 'radio' } />
                        </div>
                    }
                    <div
                        className = 'pollChoiceTextContainer' >
                        <span
                            className = { textCSSClass }
                            onClick = { this._onVoteChange } >
                            { text }
                        </span>
                    </div>

                    <div
                        className = 'pollChoiceVotesContainer' >
                        { votes }
                    </div>
                </div>
            </li>
        );
    }

    _onVoteChange: () => void;

    /**
     * Event handler when user click either the choice text or radio button.
     * Call's parent element event handler passing the ID of the chosen choice.
     *
     * @returns {void}
     */
    _onVoteChange() {
        const { disabled, id, onVote } = this.props;

        if (!disabled && onVote) {
            onVote(id);
        }
    }
}

export default PollChoice;
