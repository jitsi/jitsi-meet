// @flow

import React, { PureComponent } from 'react';
import { Image } from 'react-native';

import styles from './styles';

export const DEFAULT_AVATAR = require('../../../../../../images/avatar.png');

type Props = {

    /**
     * Callback for load errors.
     */
    onError: Function,

    /**
     * Size of the avatar.
     */
    size: number,

    /**
     * URI of the avatar to load.
     */
    uri: string
};

/**
 * Implements a private class that is used to fetch and render remote avatars based on an URI.
 */
export default class RemoteAvatar extends PureComponent<Props> {

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { onError, size, uri } = this.props;

        return (
            <Image
                defaultSource = { DEFAULT_AVATAR }
                onError = { onError }
                resizeMode = 'cover'
                source = {{ uri }}
                style = { styles.avatarContent(size) } />
        );
    }
}
