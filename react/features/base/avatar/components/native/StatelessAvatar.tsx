import React, { Component } from 'react';
import { Image, Text, TextStyle, View, ViewStyle } from 'react-native';

import Icon from '../../../icons/components/Icon';
import { StyleType } from '../../../styles/functions.native';
import { isIcon } from '../../functions';
import { IAvatarProps } from '../../types';

import styles from './styles';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DEFAULT_AVATAR = require('../../../../../../images/avatar.png');

interface IProps extends IAvatarProps {

    /**
     * One of the expected status strings (e.g. 'available') to render a badge on the avatar, if necessary.
     */
    status?: string;

    /**
     * External style passed to the component.
     */
    style?: StyleType;

    /**
     * The URL of the avatar to render.
     */
    url?: string;
}

/**
 * Implements a stateless avatar component that renders an avatar purely from what gets passed through
 * props.
 */
export default class StatelessAvatar extends Component<IProps> {

    /**
     * Instantiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onAvatarLoadError = this._onAvatarLoadError.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { initials, size, style, url } = this.props;

        let avatar;

        if (isIcon(url)) {
            avatar = this._renderIconAvatar(url);
        } else if (url) {
            avatar = this._renderURLAvatar();
        } else if (initials) {
            avatar = this._renderInitialsAvatar();
        } else {
            avatar = this._renderDefaultAvatar();
        }

        return (
            <View>
                <View
                    style = { [
                        styles.avatarContainer(size) as ViewStyle,
                        style
                    ] }>
                    { avatar }
                </View>
                { this._renderAvatarStatus() }
            </View>
        );
    }

    /**
     * Renders a badge representing the avatar status.
     *
     * @returns {React$Elementaa}
     */
    _renderAvatarStatus() {
        const { size, status } = this.props;

        if (!status) {
            return null;
        }

        return (
            <View style = { styles.badgeContainer }>
                <View style = { styles.badge(size, status) as ViewStyle } />
            </View>
        );
    }

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
     * Renders the icon avatar.
     *
     * @param {Object} icon - The icon component to render.
     * @returns {React$Element<*>}
     */
    _renderIconAvatar(icon: Function) {
        const { color, size } = this.props;

        return (
            <View
                style = { [
                    styles.initialsContainer as ViewStyle,
                    {
                        backgroundColor: color
                    }
                ] }>
                <Icon
                    src = { icon }
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
                    styles.initialsContainer as ViewStyle,
                    {
                        backgroundColor: color
                    }
                ] }>
                <Text style = { styles.initialsText(size) as TextStyle }> { initials } </Text>
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

                // @ts-ignore
                onError = { onAvatarLoadError }
                resizeMode = 'cover'
                source = {{ uri: url }}
                style = { styles.avatarContent(size) } />
        );
    }

    /**
     * Handles avatar load errors.
     *
     * @returns {void}
     */
    _onAvatarLoadError() {
        const { onAvatarLoadError, onAvatarLoadErrorParams = {} } = this.props;

        if (onAvatarLoadError) {
            onAvatarLoadError({
                ...onAvatarLoadErrorParams,
                dontRetry: true
            });
        }
    }
}
