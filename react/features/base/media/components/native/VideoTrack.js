/* @flow */

import React from 'react';
import { View } from 'react-native';

import { connect } from '../../../redux';
import AbstractVideoTrack from '../AbstractVideoTrack';
import type { Props } from '../AbstractVideoTrack';

import styles from './styles';

/**
 * Component that renders video element for a specified video track.
 *
 * @extends AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack<Props> {
    /**
     * Renders the video element for the associated video track.
     *
     * @override
     * @returns {ReactElement}
     */
    render() {
        return (
            <View style = { styles.video } >
                { super.render() }
            </View>
        );
    }
}

export default connect()(VideoTrack);
