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
    onDelete: Function,

    /**
     * Text of the voting option.
     */
    text: string,

    /**
     * Function handler when a key is pressed in the text field.
     */
    onKeyDown: Function,

    /**
     * Container text update method.
     */
    onTextChange: Function
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

        this._onClickHandler = this._onClickHandler.bind(this);
        this._onTextChange = this._onTextChange.bind(this);
    }

    _onClickHandler: () => void;

    /**
     * Handles button click.
     *
     * @returns {void}
     */
    _onClickHandler() {
        const { id, onDelete } = this.props;

        onDelete(id);
    }

    _onTextChange: (Object) => void;

    /**
     * Text change event handler.
     *
     * @param {Object} event - Text change event.
     * @returns {void}
     */
    _onTextChange(event: Object) {
        const { id, onTextChange } = this.props;

        onTextChange(id, event.target.value);
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const { onKeyDown, text } = this.props;

        return (
            <li>
                <div
                    className = 'pollChoiceContainer' >
                    <div
                        className = 'pollChoiceTextContainer' >
                        <FieldTextStateless
                            id = 'pollChoiceText'
                            isLabelHidden = { true }
                            onChange = { this._onTextChange }
                            onKeyDown = { onKeyDown }
                            shouldFitContainer = { true }
                            value = { text } />
                    </div>
                    <div
                        className = 'pollChoiceRemoveButtonContainer' >
                        <button
                            id = 'pollChoiceRemoveButton'
                            onClick = { this._onClickHandler }
                            type = 'button'>
                            ×
                        </button>
                    </div>
                </div>
            </li>
        );
    }
}

export default EditablePollChoice;
