// @flow

import React, { Component } from 'react';
import { FieldTextStateless } from '@atlaskit/field-text';

import { translate } from '../../base/i18n';

type Props = {

    /**
     * Item ID in list.
     */
    id: string,

    /**
     * Container delete method.
     */
    onDelete: Function,

    /**
     * Function handler when a key is pressed in the text field.
     */
    onKeyDown: Function,

    /**
     * Container text update method.
     */
    onTextChange: Function,

    /**
     * The i18n translate function.
     */
    t: Function,

    /**
     * Text of the voting option.
     */
    text: string
};

/**
 * Poll choice that can be edited view component.
 */
class EditablePollChoice extends Component<Props, *> {

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onDeleteChoiceClicked = this._onDeleteChoiceClicked.bind(this);
        this._onChoiceTextChanged = this._onChoiceTextChanged.bind(this);
    }

    _onDeleteChoiceClicked: () => void;

    /**
     * Event handler when the delete button of the choice is clicked. Call's
     * parent event handler passing the choice ID.
     *
     * @returns {void}
     */
    _onDeleteChoiceClicked() {
        const { id, onDelete } = this.props;

        onDelete(id);
    }

    _onChoiceTextChanged: (Object) => void;

    /**
     * Event handler when the poll choice text has been modified. Call's
     * parent event handler passing the choice ID and new text.
     *
     * @param {Object} event - Text change event.
     * @returns {void}
     */
    _onChoiceTextChanged(event: Object) {
        const { id, onTextChange } = this.props;

        onTextChange(id, event.target.value);
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const { onKeyDown, t, text } = this.props;

        return (
            <li>
                <div
                    className = 'pollChoiceContainer' >
                    <div
                        className = 'pollChoiceTextContainer' >
                        <FieldTextStateless
                            id = 'pollChoiceText'
                            isLabelHidden = { true }
                            onChange = { this._onChoiceTextChanged }
                            onKeyDown = { onKeyDown }
                            placeholder = { t('polls.choicesPlaceholder') }
                            shouldFitContainer = { true }
                            value = { text } />

                        <span
                            className = 'pollChoiceRemoveButton'
                            onClick = { this._onDeleteChoiceClicked } >
                            ×
                        </span>
                    </div>
                </div>
            </li>
        );
    }
}

export default translate(EditablePollChoice);
