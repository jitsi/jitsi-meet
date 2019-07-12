// @flow

import React from 'react';
import { Image, Text, View } from 'react-native';

import { type StyleType } from '../../../styles';

import AbstractStatelessAvatar, { type Props as AbstractProps } from '../AbstractStatelessAvatar';

import styles from './styles';
import { Icon } from '../../../font-icons';

type Props = AbstractProps & {

    /**
     * External style passed to the componant.
     */
    style?: StyleType
};

const DEFAULT_AVATAR = require('../../../../../../images/avatar.png');

/**
 * Implements a stateless avatar component that renders an avatar purely from what gets passed through
 * props.
 */
export default class StatelessAvatar extends AbstractStatelessAvatar<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { initials, size, style, url } = this.props;

        let avatar;

        const icon = this._parseIconUrl(url);

        if (icon) {
            avatar = this._renderIconAvatar(icon);
        } else if (url) {
            avatar = this._renderURLAvatar();
        } else if (initials) {
            avatar = this._renderInitialsAvatar();
        } else {
            avatar = this._renderDefaultAvatar();
        }

        return (
            <View
                style = { [
                    styles.avatarContainer(size),
                    style
                ] }>
                { avatar }
            </View>
        );
    }

    _parseIconUrl: ?string => ?string

    /**
     * Renders the default avatar.
     *
     * @returns {React$Element<*>}
     */
    _renderDefaultAvatar() {
        const { size } = this.props;

        return (
            <Image
                source = { DEFAULT_AVATAR }
                style = { [
                    styles.avatarContent(size),
                    styles.staticAvatar
                ] } />
        );
    }

    /**
     * Renders the initials-based avatar.
     *
     * @param {string} icon - The icon name to render.
     * @returns {React$Element<*>}
     */
    _renderIconAvatar(icon) {
        const { color, size } = this.props;

        return (
            <View
                style = { [
                    styles.initialsContainer,
                    {
                        backgroundColor: color
                    }
                ] }>
                <Icon
                    name = { icon }
                    style = { styles.initialsText(size) } />
            </View>
        );
    }

    /**
     * Renders the initials-based avatar.
     *
     * @returns {React$Element<*>}
     */
    _renderInitialsAvatar() {
        const { color, initials, size } = this.props;

        return (
            <View
                style = { [
                    styles.initialsContainer,
                    {
                        backgroundColor: color
                    }
                ] }>
                <Text style = { styles.initialsText(size) }> { initials } </Text>
            </View>
        );
    }

    /**
     * Renders the url-based avatar.
     *
     * @returns {React$Element<*>}
     */
    _renderURLAvatar() {
        const { onAvatarLoadError, size, url } = this.props;

        return (
            <Image
                defaultSource = { DEFAULT_AVATAR }
                onError = { onAvatarLoadError }
                resizeMode = 'cover'
                source = {{ uri: url }}
                style = { styles.avatarContent(size) } />
        );
    }
}
