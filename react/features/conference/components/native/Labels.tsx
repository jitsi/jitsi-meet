import React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import isInsecureRoomName from '../../../base/util/isInsecureRoomName';
import { isUnsafeRoomWarningEnabled } from '../../../prejoin/functions';
import VideoQualityLabel from '../../../video-quality/components/VideoQualityLabel.native';

import InsecureRoomNameLabel from './InsecureRoomNameLabel';
import { LABEL_ID_INSECURE_ROOM_NAME, LABEL_ID_QUALITY, LabelHitSlop } from './constants';
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
 *
 * @param {IProps} props - The React props passed to this component.
 * @returns {JSX.Element}
 */
const Labels = ({ createOnPress }: IProps) => {
    const { t } = useTranslation();

    const isInsecureRoom = useSelector((state: IReduxState) => {
        const { locked, room } = state['features/base/conference'];
        const { lobbyEnabled } = state['features/lobby'];

        return Boolean(isUnsafeRoomWarningEnabled(state)
            && room && isInsecureRoomName(room)
            && !(lobbyEnabled || Boolean(locked)));
    });

    const isLowBandwidth = useSelector(
        (state: IReduxState) => Boolean(state['features/base/low-bandwidth-mode']?.enabled)
    );

    const insecureRoomNameLabel = t('security.insecureRoomNameLabel');
    const qualityLabel = t('videoStatus.labelTooltipLowBandwidthMode');

    return (
        <View pointerEvents = 'box-none'>
            <View
                pointerEvents = 'box-none'
                style = { styles.indicatorContainer as ViewStyle }>
                {isInsecureRoom && (
                    <TouchableOpacity
                        accessibilityLabel = { insecureRoomNameLabel }
                        accessibilityRole = 'button'
                        hitSlop = { LabelHitSlop }
                        onPress = {
                            createOnPress(LABEL_ID_INSECURE_ROOM_NAME)
                        } >
                        <InsecureRoomNameLabel />
                    </TouchableOpacity>
                )}
                {isLowBandwidth && (
                    <TouchableOpacity
                        accessibilityLabel = { qualityLabel }
                        accessibilityRole = 'button'
                        hitSlop = { LabelHitSlop }
                        onPress = {
                            createOnPress(LABEL_ID_QUALITY) } >
                        <VideoQualityLabel />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default Labels;
