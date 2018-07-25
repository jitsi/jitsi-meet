import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import AbstractVideoTrack from '../AbstractVideoTrack';
import styles from './styles';

/**
 * Component that renders video element for a specified video track.
 *
 * @extends AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack {
    /**
     * VideoTrack component's property types.
     *
     * @static
     */
    static propTypes = AbstractVideoTrack.propTypes

    /**
     * Renders video element with animation.
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
