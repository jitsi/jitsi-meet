import React, { Component } from 'react';
import { GestureResponderEvent } from 'react-native';

import { IconPlus } from '../../../icons/svg';
import IconButton from '../../../ui/components/native/IconButton';
import { BUTTON_TYPES } from '../../../ui/constants.any';
import { Item } from '../../types';

import AvatarListItem from './AvatarListItem';
import Text from './Text';
import styles from './styles';

interface IProps {

    /**
     * Item containing data to be rendered.
     */
    item: Item;

    /**
     * Function to be invoked when an item is long pressed. The item is passed.
     */
    onLongPress?: (e?: GestureResponderEvent) => void;

    /**
     * Function to be invoked when an Item is pressed. The Item's URL is passed.
     */
    onPress?: (e?: GestureResponderEvent) => void;

    /**
     * Function to be invoked when secondary action was performed on an Item.
     */
    secondaryAction?: (e?: GestureResponderEvent) => void;
}

/**
 * Implements a React/Native {@link Component} that renders the Navigate Section
 * List Item.
 *
 * @augments Component
 */
export default class NavigateSectionListItem extends Component<IProps> {
    /**
     * Constructor of the NavigateSectionList component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._renderItemLine = this._renderItemLine.bind(this);
        this._renderItemLines = this._renderItemLines.bind(this);
    }

    /**
     * Renders a single line from the additional lines.
     *
     * @param {string} line - The line text.
     * @param {number} index - The index of the line.
     * @private
     * @returns {React$Node}
     */
    _renderItemLine(line: string, index: number) {
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

    /**
     * Renders the additional item lines, if any.
     *
     * @param {Array<string>} lines - The lines to render.
     * @private
     * @returns {Array<React$Node>}
     */
    _renderItemLines(lines?: string[]) {
        return lines?.length ? lines.map(this._renderItemLine) : null;
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
            <IconButton
                onPress = { secondaryAction }
                src = { IconPlus }
                type = { BUTTON_TYPES.PRIMARY } />
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
