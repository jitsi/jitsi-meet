// @flow

import React, { Component } from 'react';
import { Container } from '../../base/react';
import { FieldTextStateless } from '@atlaskit/field-text';
import AddPollItem from './AddPollItem';
import PollChoice from './PollChoice';
import { translate } from '../../base/i18n';

type Props = {

    /**
     * Available poll choices.
     */
    choices: Object,

    /**
     * Redux Store dispatch function.
     */
    dispatch: Function,

    /**
     * Function handler to add a new choice.
     */
    onAddChoice: Function,

    /**
     * Function handler when poll choice text change.
     */
    onChoiceTextChange: Function,

    /**
     * Function handler to remove poll choice.
     */
    onRemoveChoice: Function,

    /**
     * Function handler when question text change.
     */
    onQuestionTextChange: Function,

    /**
     * The i18n translate function.
     */
    t: Function,

    /**
     * Current User ID.
     */
    userID: string,
};

/**
 * Form for creating a new poll.
 */
class PollCreateForm extends Component<Props, *> {

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._renderPollChoice = this._renderPollChoice.bind(this);
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const { onAddChoice, onQuestionTextChange, t } = this.props;
        const choices = Object.keys(this.props.choices)
            .map(this._renderPollChoice);

        return (
            <Container
                className = { 'pollCreateFormContainer' } >
                <FieldTextStateless
                    autoFocus = { true }
                    id = { 'pollQuestion' }
                    isLabelHidden = { true }
                    onChange = { onQuestionTextChange }
                    placeholder = { t('polls.placeholder') }
                    type = 'text' />

                <div
                    className = { 'pollChoicesListContainer' } >
                    <ul
                        id = { 'pollChoicesList' } >
                        { choices }
                    </ul>
                </div>
                <AddPollItem
                    addItemHandler = { onAddChoice } />
            </Container>
        );
    }

    _renderPollChoice: (string, number) => React$Node;

    /**
     * Renders choices' list item.
     *
     * @param {string} item - List item.
     * @param {string} id - Item key.
     * @returns {Component}
     */
    _renderPollChoice(item: string, id: number) {
        const { onChoiceTextChange, onRemoveChoice } = this.props;
        const text = this.props.choices[item].text;

        return (
            <PollChoice
                deleteHandler = { onRemoveChoice }
                disabled = { true }
                editable = { true }
                id = { item }
                key = { id.toString() }
                selected = { false }
                text = { text }
                textChangeHandler = { onChoiceTextChange }
                votes = { 0 } />
        );
    }
}

export default translate(PollCreateForm);
