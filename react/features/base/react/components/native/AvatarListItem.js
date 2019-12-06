// @flow

import React, { Component } from 'react';
import { Text } from 'react-native';

import { Avatar } from '../../../avatar';
import { StyleType } from '../../../styles';

import { type Item } from '../../Types';

import Container from './Container';
import styles, { AVATAR_SIZE, UNDERLAY_COLOR } from './styles';

type Props = {

    /**
     * If true, only the avatar gets rendered, no lines of text.
     */
    avatarOnly?: boolean,

    /**
     * Preferred size of the avatar.
     */
    avatarSize?: number,

    /**
     * One of the expected status strings (e.g. 'available') to render a badge on the avatar, if necessary.
     */
    avatarStatus?: ?string,

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
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            avatarOnly,
            avatarSize = AVATAR_SIZE,
            avatarStatus,
            avatarStyle
        } = this.props;
        const { avatar, colorBase, lines, title } = this.props.item;

        return (
            <Container
                onClick = { this.props.onPress }
                style = { styles.listItem }
                underlayColor = { UNDERLAY_COLOR }>
                <Avatar
                    colorBase = { colorBase }
                    displayName = { title }
                    size = { avatarSize }
                    status = { avatarStatus }
                    style = { avatarStyle }
                    url = { avatar } />
                { avatarOnly || <Container style = { styles.listItemDetails }>
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
                </Container>}
                { this.props.children }
            </Container>
        );
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
