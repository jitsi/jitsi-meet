import React, { Component } from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';

import TranscribingLabel from '../../../transcribing/components/TranscribingLabel.native';
import VideoQualityLabel from '../../../video-quality/components/VideoQualityLabel.native';

import InsecureRoomNameLabel from './InsecureRoomNameLabel';
import { LABEL_ID_INSECURE_ROOM_NAME, LABEL_ID_QUALITY, LABEL_ID_TRANSCRIBING, LabelHitSlop } from './constants';
import styles from './styles';

interface IProps {

    /**
     * Creates a function to be invoked when the onPress of the touchables are
     * triggered.
     */
    createOnPress: Function;
}

/**
 * A container that renders the conference indicators, if any.
 */
class Labels extends Component<IProps> {

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
                    style = { styles.indicatorContainer as ViewStyle }>
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
