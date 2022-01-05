// @flow
import React, { Component } from 'react';

/**
 * The type of the React {@code Component} props of {@link Tab}.
 */
type Props = {

    /**
     * The index of the tab.
     */
    index: number,

    /**
     * Indicates if the tab is selected or not.
     */
    isSelected: boolean,

    /**
     * The label of the tab.
     */
    label: string,

    /**
     * Handler for selecting the tab.
     */
    onSelect: Function
}

/**
 * A React component that implements tabs.
 *
 */
export default class Tab extends Component<Props> {
    /**
     * Initializes a new {@code Tab} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSelect = this._onSelect.bind(this);
    }

    _onSelect: () => void;

    /**
     * Selects a tab.
     *
     * @returns {void}
     */
    _onSelect() {
        const { index, onSelect } = this.props;

        onSelect(index);
    }

    /**
     * Implements the React Components's render method.
     *
     * @inheritdoc
     */
    render() {
        const { index, isSelected, label } = this.props;
        const className = `tab${isSelected ? ' selected' : ''}`;

        return (
            <div
                className = { className }
                key = { index }
                onClick = { this._onSelect }>
                { label }
            </div>);
    }
}
