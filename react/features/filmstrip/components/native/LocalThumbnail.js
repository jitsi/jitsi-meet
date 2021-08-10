// @flow

import React from 'react';
import { View } from 'react-native';

import Thumbnail from './Thumbnail';
import styles from './styles';

/**
 * Component to render a local thumbnail that can be separated from the
 * remote thumbnails later.
 *
 * @returns {ReactElement}
 */
export default function LocalThumbnail() {
    return (
        <View style = { styles.localThumbnail }>
            <Thumbnail />
        </View>
    );
}
