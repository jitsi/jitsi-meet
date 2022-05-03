import React, { useCallback } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { getFeatureFlag, AUDIO_MUTE_BUTTON_ENABLED } from '../../../../base/flags';
import { Icon, IconMicrophone, IconMicrophoneEmptySlash } from '../../../../base/icons';
import { MEDIA_TYPE } from '../../../../base/media';
import { isLocalTrackMuted } from '../../../../base/tracks';
import { isAudioMuteButtonDisabled } from '../../../../toolbox/functions.any';
import { muteLocal } from '../../../../video-menu/actions';

import styles from './styles';

/**
 * Implements a round audio mute/unmute button of a custom size.
 *
 * @returns {JSX.Element} - The audio mute round button.
 */
const MicrophoneButton = () : JSX.Element => {
    const dispatch = useDispatch();
    const audioMuted = useSelector(state => isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO));
    const disabled = useSelector(isAudioMuteButtonDisabled);
    const enabledFlag = useSelector(state => getFeatureFlag(state, AUDIO_MUTE_BUTTON_ENABLED, true));

    if (!enabledFlag) {
        return null;
    }

    const toggleMute = useCallback(() => {
        !disabled && dispatch(muteLocal(!audioMuted, MEDIA_TYPE.AUDIO));
    }, [ audioMuted, disabled ]);

    return (
        <TouchableOpacity
            onPress = { toggleMute }>
            <View
                style = { [
                    styles.microphoneStyles.container,
                    !audioMuted && styles.microphoneStyles.unmuted
                ] }>
                <View
                    style = { styles.microphoneStyles.iconContainer }>
                    <Icon
                        src = { audioMuted ? IconMicrophoneEmptySlash : IconMicrophone }
                        style = { styles.microphoneStyles.icon } />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default MicrophoneButton;
