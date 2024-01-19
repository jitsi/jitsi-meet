import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import AbstractVideoTrack, { IProps } from '../AbstractVideoTrack';

import styles from './styles';

/**
 * Component that renders video element for a specified video track.
 *
 * @augments AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack<IProps> {
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
