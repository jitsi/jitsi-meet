// @flow

import React, { Component } from 'react';
import { Dialog } from '../../base/dialog';
import {
    Container
} from '../../base/react';
import { FieldTextStateless } from '@atlaskit/field-text';
import PollItem from './PollItem';
import AddPollItem from './AddPollItem';

type Props = {
    question: string,
    items: Array<Object>
};

type State = {
    question: string,
    items: Array<Object>
};

/**
 * Polls main dialog view component.
 */
class PollDialog extends Component<Props, State> {
    lastID: number;

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.lastID = 0;

        // assign list ids if needed
        const items = [];

        this.props.items.forEach(x => {
            items.push({
                ...x,
                id: this.lastID++
            });
        });

        this.state = {
            question: this.props.question,
            items
        };

        this._addItem = this._addItem.bind(this);
        this._renderItem = this._renderItem.bind(this);
        this._removeItem = this._removeItem.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onQuestionTextChange = this._onQuestionTextChange.bind(this);
        this._pollItemTextChange = this._pollItemTextChange.bind(this);
    }

    _addItem: (void) => void;

    /**
     * Add new item to the list.
     *
     * @returns {void}
     */
    _addItem() {
        const newItems = [ ...this.state.items, {
            id: this.lastID++,
            text: ''
        } ];

        this.setState({
            items: newItems
        });
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const items = this.state.items.map(this._renderItem);

        return (
            <Dialog
                okTitleKey = 'dialog.startPoll'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.polls'
                width = 'small' >
                <Container>
                    <FieldTextStateless
                        autoFocus = { true }
                        id = { 'poll-question' }
                        onChange = { this._onQuestionTextChange }
                        placeholder = { 'Ask a question...' }
                        type = 'text' />

                    <div>
                        <ul
                            id = { 'poll-items-list' } >
                            { items }
                        </ul>
                    </div>

                    <AddPollItem
                        addItemHandler = { this._addItem } />
                </Container>
            </Dialog>
        );
    }

    _removeItem: (number) => void;

    /**
     * Removes an item from list.
     *
     * @param {number} id - ID of item in list.
     * @returns {void}
     */
    _removeItem(id: number) {
        const newItems = this.state.items.filter(x => x.id !== id);

        this.setState({
            items: newItems
        });
    }

    _renderItem: (Object, number) => void;

    /**
     * Renders list item.
     *
     * @param {Object} item - List item.
     * @param {number} id - Item key.
     * @returns {Component}
     */
    _renderItem(item: Object, id: number) {
        return (
            <PollItem
                deleteHandler = { this._removeItem }
                id = { item.id }
                key = { id.toString() }
                text = { item.text }
                textChangeHandler = { this._pollItemTextChange } />
        );
    }

    _onSubmit: () => void;

    /**
     * Submit button handler.
     *
     * @returns {boolean}
     */
    _onSubmit() {
        return true;
    }

    _onQuestionTextChange: (Object) => void;

    /**
     * Update the question text in local state.
     *
     * @param {event} event - Keyboard event.
     * @returns {void}
     */
    _onQuestionTextChange(event: Object) {
        const text: string = event.target.value;

        this.setState({
            question: text
        });
    }

    _pollItemTextChange: (number, string) => void;

    /**
     * Item text change handler.
     *
     * @param {number} id - ID of the item with change.
     * @param {string} text - New text.
     * @returns {void}
     */
    _pollItemTextChange(id: number, text: string) {
        const updatedItems = this.state.items.slice();
        const itemIndex = updatedItems.findIndex(x => x.id === id);

        if (itemIndex > -1) {
            updatedItems[itemIndex].text = text;
            this.setState({
                items: updatedItems
            });
        }
    }
}

export default PollDialog;
