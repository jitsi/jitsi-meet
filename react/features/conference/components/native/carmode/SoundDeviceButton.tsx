import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { openSheet } from '../../../../base/dialog/actions';
import AudioRoutePickerDialog from '../../../../mobile/audio-mode/components/AudioRoutePickerDialog';

import AudioIcon from './AudioIcon';
import styles from './styles';

/**
 * Button for selecting sound device in carmode.
 *
 * @returns {JSX.Element} - The sound device button.
 */
const SelectSoundDevice = () : JSX.Element => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onSelect = useCallback(() =>
        dispatch(openSheet(AudioRoutePickerDialog))
    , [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('carmode.actions.selectSoundDevice') }
            children = { t('carmode.actions.selectSoundDevice') }
            icon = { AudioIcon }
            labelStyle = { styles.soundDeviceButtonLabel }
            mode = 'contained'
            onPress = { onSelect }
            style = { styles.soundDeviceButton } />
    );
};

export default SelectSoundDevice;
