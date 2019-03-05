// @flow

import React, { Component } from 'react';
import { FieldTextStateless } from '@atlaskit/field-text';

import { translate } from '../../base/i18n';
import { Container } from '../../base/react';

import EditablePollChoice from './EditablePollChoice';

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
     * Function handler when poll choice text change.
     */
    onChoiceTextChange: Function,

    /**
     * Function handler when a key is pressed in the choices' text fields.
     */
    onKeyDown: Function,

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
        const { onQuestionTextChange, t } = this.props;
        const choices = Object.keys(this.props.choices)
            .map(this._renderPollChoice);

        return (
            <Container>
                <FieldTextStateless
                    autoFocus = { true }
                    id = 'pollQuestion'
                    isLabelHidden = { true }
                    onChange = { onQuestionTextChange }
                    placeholder = { t('polls.questionPlaceholder') }
                    type = 'text' />

                <div
                    className = 'pollChoicesListContainer' >
                    <ul
                        className = 'pollChoicesList' >
                        { choices }
                    </ul>
                </div>
            </Container>
        );
    }

    _renderPollChoice: (string, number) => React$Node;

    /**
     * Renders choices' list item.
     *
     * @param {string} item - List item.
     * @param {number} id - Item key.
     * @returns {Component}
     */
    _renderPollChoice(item: string, id: number) {
        const { onChoiceTextChange, onKeyDown, onRemoveChoice } = this.props;
        const text = this.props.choices[item].text;

        return (
            <EditablePollChoice
                id = { item }
                key = { id.toString() }
                onDelete = { onRemoveChoice }
                onKeyDown = { onKeyDown }
                onTextChange = { onChoiceTextChange }
                text = { text } />
        );
    }
}

export default translate(PollCreateForm);
