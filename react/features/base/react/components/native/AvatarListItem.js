// @flow

import React, { Component } from 'react';
import { Text } from 'react-native';

import { Icon } from '../../../font-icons';
import { Avatar } from '../../../participants';
import { StyleType } from '../../../styles';

import { type Item } from '../../Types';

import Container from './Container';
import styles, { AVATAR_SIZE, UNDERLAY_COLOR } from './styles';

type Props = {

    /**
     * Preferred size of the avatar.
     */
    avatarSize?: number,

    /**
     * External style to be applied to the avatar (icon).
     */
    avatarStyle?: StyleType,

    /**
     * External style to be applied to the avatar (text).
     */
    avatarTextStyle?: StyleType,

    /**
     * Children of the component.
     */
    children?: React$Node,

    /**
     * item containing data to be rendered
     */
    item: Item,

    /**
     * External style prop to be applied to the extra lines.
     */
    linesStyle?: StyleType,

    /**
     * Function to invoke on press.
     */
    onPress: ?Function,

    /**
     * External style prop to be applied to the title.
     */
    titleStyle?: StyleType
};

/**
 * Implements a list item with an avatar rendered for it.
 */
export default class AvatarListItem extends Component<Props> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._renderItemLine = this._renderItemLine.bind(this);
    }

    /**
     * Helper function to render the content in the avatar container.
     *
     * @returns {React$Element}
     */
    _getAvatarContent() {
        const {
            avatarSize = AVATAR_SIZE,
            avatarTextStyle
        } = this.props;
        const { avatar, title } = this.props.item;
        const isAvatarURL = Boolean(avatar && avatar.match(/^http[s]*:\/\//i));

        if (isAvatarURL) {
            return (
                <Avatar
                    size = { avatarSize }
                    uri = { avatar } />
            );
        }

        if (avatar && !isAvatarURL) {
            return (
                <Icon name = { avatar } />
            );
        }

        return (
            <Text
                style = { [
                    styles.avatarContent,
                    avatarTextStyle
                ] }>
                { title.substr(0, 1).toUpperCase() }
            </Text>
        );
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            avatarSize = AVATAR_SIZE,
            avatarStyle
        } = this.props;
        const { colorBase, lines, title } = this.props.item;
        const avatarStyles = {
            ...styles.avatar,
            ...this._getAvatarColor(colorBase),
            ...avatarStyle,
            borderRadius: avatarSize / 2,
            height: avatarSize,
            width: avatarSize
        };

        return (
            <Container
                onClick = { this.props.onPress }
                style = { styles.listItem }
                underlayColor = { UNDERLAY_COLOR }>
                <Container style = { styles.avatarContainer }>
                    <Container style = { avatarStyles }>
                        { this._getAvatarContent() }
                    </Container>
                </Container>
                <Container style = { styles.listItemDetails }>
                    <Text
                        numberOfLines = { 1 }
                        style = { [
                            styles.listItemText,
                            styles.listItemTitle,
                            this.props.titleStyle
                        ] }>
                        { title }
                    </Text>
                    {this._renderItemLines(lines)}
                </Container>
                { this.props.children }
            </Container>
        );
    }

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
                style = { [
                    styles.listItemText,
                    this.props.linesStyle
                ] }>
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
}
