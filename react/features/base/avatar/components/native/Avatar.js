// @flow

import React from 'react';
import { Image, Text, View } from 'react-native';

import { connect } from '../../../redux';
import { type StyleType } from '../../../styles';

import AbstractAvatar, {
    _mapStateToProps,
    type Props as AbstractProps,
    DEFAULT_SIZE
} from '../AbstractAvatar';

import RemoteAvatar, { DEFAULT_AVATAR } from './RemoteAvatar';
import styles from './styles';

type Props = AbstractProps & {

    /**
     * External style of the component.
     */
    style?: StyleType
}

/**
 * Implements an avatar component that has 4 ways to render an avatar:
 *
 * - Based on an explicit avatar URI, if provided
 * - Gravatar, if there is any
 * - Based on initials generated from name or email
 * - Default avatar icon, if any of the above fails
 */
class Avatar extends AbstractAvatar<Props> {

    _onAvatarLoadError: () => void;

    /**
     * Implements {@code AbstractAvatar#_renderDefaultAvatar}.
     *
     * @inheritdoc
     */
    _renderDefaultAvatar() {
        return this._wrapAvatar(
            <Image
                source = { DEFAULT_AVATAR }
                style = { [
                    styles.avatarContent(this.props.size || DEFAULT_SIZE),
                    styles.staticAvatar
                ] } />
        );
    }

    /**
     * Implements {@code AbstractAvatar#_renderGravatar}.
     *
     * @inheritdoc
     */
    _renderInitialsAvatar(initials, color) {
        return this._wrapAvatar(
            <View
                style = { [
                    styles.initialsContainer,
                    {
                        backgroundColor: color
                    }
                ] }>
                <Text style = { styles.initialsText(this.props.size || DEFAULT_SIZE) }> { initials } </Text>
            </View>
        );
    }

    /**
     * Implements {@code AbstractAvatar#_renderGravatar}.
     *
     * @inheritdoc
     */
    _renderURLAvatar(uri) {
        return this._wrapAvatar(
            <RemoteAvatar
                onError = { this._onAvatarLoadError }
                size = { this.props.size || DEFAULT_SIZE }
                uri = { uri } />
        );
    }

    /**
     * Wraps an avatar into a common wrapper.
     *
     * @param {React#Component} avatar - The avatar component.
     * @returns {React#Component}
     */
    _wrapAvatar(avatar) {
        return (
            <View
                style = { [
                    styles.avatarContainer(this.props.size || DEFAULT_SIZE),
                    this.props.style
                ] }>
                { avatar }
            </View>
        );
    }
}

export default connect(_mapStateToProps)(Avatar);
