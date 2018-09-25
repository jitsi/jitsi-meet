// @flow

import React, { Component } from 'react';
import Swipeout from 'react-native-swipeout';

import { ColorPalette } from '../../../styles';

import Container from './Container';
import Text from './Text';
import styles, { UNDERLAY_COLOR } from './styles';
import type { Item } from '../../Types';

type Props = {

    /**
     * item containing data to be rendered
     */
    item: Item,

    /**
     * Function to be invoked when an Item is pressed. The Item's URL is passed.
     */
    onPress: ?Function,

    /**
     * Function to be invoked when secondary action was performed on an Item.
     */
    secondaryAction: ?Function,

    /**
     * Optional array of on-slide actions this list should support. For details
     * see https://github.com/dancormier/react-native-swipeout.
     */
    slideActions?: Array<Object>
}

/**
 * Implements a React/Native {@link Component} that renders the Navigate Section
 * List Item
 *
 * @extends Component
 */
export default class NavigateSectionListItem extends Component<Props> {
    /**
     * Constructor of the NavigateSectionList component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);
        this._getAvatarColor = this._getAvatarColor.bind(this);
        this._renderItemLine = this._renderItemLine.bind(this);
        this._renderItemLines = this._renderItemLines.bind(this);
    }

    _getAvatarColor: string => Object;

    /**
     * Returns a style (color) based on the string that determines the color of
     * the avatar.
     *
     * @param {string} colorBase - The string that is the base of the color.
     * @private
     * @returns {Object}
     */
    _getAvatarColor(colorBase) {
        if (!colorBase) {
            return null;
        }
        let nameHash = 0;

        for (let i = 0; i < colorBase.length; i++) {
            nameHash += colorBase.codePointAt(i);
        }

        return styles[`avatarColor${(nameHash % 5) + 1}`];
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
        const { slideActions } = this.props;
        const { id, colorBase, lines, title } = this.props.item;
        const avatarStyles = {
            ...styles.avatar,
            ...this._getAvatarColor(colorBase)
        };
        let right;

        // NOTE: The {@code Swipeout} component has an onPress prop encapsulated
        // in the {@code right} array, but we need to bind it to the ID of the
        // item too.

        if (slideActions) {
            right = [];
            for (const slideAction of slideActions) {
                right.push({
                    backgroundColor: slideAction.backgroundColor,
                    onPress: slideAction.onPress.bind(undefined, id),
                    text: slideAction.text
                });
            }
        }

        return (
            <Swipeout
                backgroundColor = { ColorPalette.transparent }
                right = { right }>
                <Container
                    onClick = { this.props.onPress }
                    style = { styles.listItem }
                    underlayColor = { UNDERLAY_COLOR }>
                    <Container style = { styles.avatarContainer }>
                        <Container style = { avatarStyles }>
                            <Text style = { styles.avatarContent }>
                                {title.substr(0, 1).toUpperCase()}
                            </Text>
                        </Container>
                    </Container>
                    <Container style = { styles.listItemDetails }>
                        <Text
                            numberOfLines = { 1 }
                            style = { [
                                styles.listItemText,
                                styles.listItemTitle
                            ] }>
                            {title}
                        </Text>
                        {this._renderItemLines(lines)}
                    </Container>
                    { this.props.secondaryAction
                        && this._renderSecondaryAction() }
                </Container>
            </Swipeout>
        );
    }
}
