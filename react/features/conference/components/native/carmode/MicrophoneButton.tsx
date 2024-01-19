import React, { useCallback, useState } from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import {
    ACTION_SHORTCUT_PRESSED as PRESSED,
    ACTION_SHORTCUT_RELEASED as RELEASED,
    createShortcutEvent
} from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { IReduxState } from '../../../../app/types';
import { AUDIO_MUTE_BUTTON_ENABLED } from '../../../../base/flags/constants';
import { getFeatureFlag } from '../../../../base/flags/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconMic, IconMicSlash } from '../../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../../base/media/constants';
import { isLocalTrackMuted } from '../../../../base/tracks/functions';
import { isAudioMuteButtonDisabled } from '../../../../toolbox/functions.any';
import { muteLocal } from '../../../../video-menu/actions';

import styles from './styles';

const LONG_PRESS = 'long.press';

/**
 * Implements a round audio mute/unmute button of a custom size.
 *
 * @returns {JSX.Element} - The audio mute round button.
 */
const MicrophoneButton = (): JSX.Element | null => {
    const dispatch = useDispatch();
    const audioMuted = useSelector((state: IReduxState) => isLocalTrackMuted(state['features/base/tracks'],
        MEDIA_TYPE.AUDIO));
    const disabled = useSelector(isAudioMuteButtonDisabled);
    const enabledFlag = useSelector((state: IReduxState) => getFeatureFlag(state, AUDIO_MUTE_BUTTON_ENABLED, true));
    const [ longPress, setLongPress ] = useState(false);

    if (!enabledFlag) {
        return null;
    }

    const onPressIn = useCallback(() => {
        !disabled && dispatch(muteLocal(!audioMuted, MEDIA_TYPE.AUDIO));
    }, [ audioMuted, disabled ]);

    const onLongPress = useCallback(() => {
        if (!disabled && !audioMuted) {
            sendAnalytics(createShortcutEvent(
                'push.to.talk',
                PRESSED,
                {},
                LONG_PRESS));
            setLongPress(true);
        }
    }, [ audioMuted, disabled, setLongPress ]);

    const onPressOut = useCallback(() => {
        if (longPress) {
            setLongPress(false);
            sendAnalytics(createShortcutEvent(
                'push.to.talk',
                RELEASED,
                {},
                LONG_PRESS
            ));
            dispatch(muteLocal(true, MEDIA_TYPE.AUDIO));
        }
    }, [ longPress, setLongPress ]);

    return (
        <TouchableOpacity
            onLongPress = { onLongPress }
            onPressIn = { onPressIn }
            onPressOut = { onPressOut } >
            <View
                style = { [
                    styles.microphoneStyles.container,
                    !audioMuted && styles.microphoneStyles.unmuted
                ] as ViewStyle[] }>
                <View
                    style = { styles.microphoneStyles.iconContainer as ViewStyle }>
                    <Icon
                        src = { audioMuted ? IconMicSlash : IconMic }
                        style = { styles.microphoneStyles.icon } />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default MicrophoneButton;
