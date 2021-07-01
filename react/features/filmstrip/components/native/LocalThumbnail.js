// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import Thumbnail from './Thumbnail';
import styles from './styles';

/**
 * Component to render a local thumbnail that can be separated from the
 * remote thumbnails later.
 */
class LocalThumbnail extends Component<any> {
    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        return (
            <View style = { styles.localThumbnail }>
                <Thumbnail />
            </View>
        );
    }
}

export default LocalThumbnail;
