// @flow

import React, { Component } from 'react';

import type { Item } from '../../Types';

import AvatarListItem from './AvatarListItem';
import Container from './Container';
import Text from './Text';
import styles from './styles';

type Props = {

    /**
     * Item containing data to be rendered.
     */
    item: Item,

    /**
     * Function to be invoked when an item is long pressed. The item is passed.
     */
    onLongPress: ?Function,

    /**
     * Function to be invoked when an Item is pressed. The Item's URL is passed.
     */
    onPress: ?Function,

    /**
     * Function to be invoked when secondary action was performed on an Item.
     */
    secondaryAction: ?Function
}

/**
 * Implements a React/Native {@link Component} that renders the Navigate Section
 * List Item.
 *
 * @augments Component
 */
export default class NavigateSectionListItem extends Component<Props> {
    /**
     * Constructor of the NavigateSectionList component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._renderItemLine = this._renderItemLine.bind(this);
        this._renderItemLines = this._renderItemLines.bind(this);
    }

    _renderItemLine: (string, number) => React$Node;

    /**
     * Renders a single line from the additional lines.
     *
     * @param {string} line - The line text.
     * @param {number} index - The index of the line.
     * @private
     * @returns {React$Node}
     */
    _renderItemLine(line, index) {
        if (!line) {
            return null;
        }

        return (
            <Text
                key = { index }
                numberOfLines = { 1 }
                style = { styles.listItemText }>
                {line}
            </Text>
        );
    }

    _renderItemLines: Array<string> => Array<React$Node>;

    /**
     * Renders the additional item lines, if any.
     *
     * @param {Array<string>} lines - The lines to render.
     * @private
     * @returns {Array<React$Node>}
     */
    _renderItemLines(lines) {
        return lines && lines.length ? lines.map(this._renderItemLine) : null;
    }

    /**
     * Renders the secondary action label.
     *
     * @private
     * @returns {React$Node}
     */
    _renderSecondaryAction() {
        const { secondaryAction } = this.props;

        return (
            <Container
                onClick = { secondaryAction }
                style = { styles.secondaryActionContainer }>
                <Text style = { styles.secondaryActionLabel }>+</Text>
            </Container>
        );
    }

    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        const { item, onLongPress, onPress, secondaryAction } = this.props;

        return (
            <AvatarListItem
                item = { item }
                onLongPress = { onLongPress }
                onPress = { onPress } >
                { secondaryAction && this._renderSecondaryAction() }
            </AvatarListItem>
        );
    }
}
