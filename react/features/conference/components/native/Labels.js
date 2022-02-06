// @flow

import React, { Component } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { TranscribingLabel } from '../../../transcribing';
import { VideoQualityLabel } from '../../../video-quality';

import { LabelHitSlop, LABEL_ID_INSECURE_ROOM_NAME, LABEL_ID_QUALITY, LABEL_ID_TRANSCRIBING } from './constants';
import styles from './styles';

import { InsecureRoomNameLabel } from './';

type Props = {

    /**
     * Creates a function to be invoked when the onPress of the touchables are
     * triggered.
     */
    createOnPress: Function
}

/**
 * A container that renders the conference indicators, if any.
 */
class Labels extends Component<Props> {

    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        return (
            <View pointerEvents = 'box-none'>
                <View
                    pointerEvents = 'box-none'
                    style = { styles.indicatorContainer }>
                    <TouchableOpacity
                        hitSlop = { LabelHitSlop }
                        onPress = {
                            this.props.createOnPress(LABEL_ID_TRANSCRIBING)
                        } >
                        <TranscribingLabel />
                    </TouchableOpacity>
                    <TouchableOpacity
                        hitSlop = { LabelHitSlop }
                        onPress = {
                            this.props.createOnPress(LABEL_ID_INSECURE_ROOM_NAME)
                        } >
                        <InsecureRoomNameLabel />
                    </TouchableOpacity>
                    <TouchableOpacity
                        hitSlop = { LabelHitSlop }
                        onPress = {
                            this.props.createOnPress(LABEL_ID_QUALITY) } >
                        <VideoQualityLabel />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

export default Labels;
