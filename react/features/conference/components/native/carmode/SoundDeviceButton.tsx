import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { openSheet } from '../../../../base/dialog/actions';
import Button from '../../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../../base/ui/constants.native';
import AudioRoutePickerDialog from '../../../../mobile/audio-mode/components/AudioRoutePickerDialog';

import AudioIcon from './AudioIcon';
import styles from './styles';

/**
 * Button for selecting sound device in carmode.
 *
 * @returns {JSX.Element} - The sound device button.
 */
const SelectSoundDevice = (): JSX.Element => {
    const dispatch = useDispatch();

    const onSelect = useCallback(() =>
        dispatch(openSheet(AudioRoutePickerDialog))
    , [ dispatch ]);

    return (
        <Button
            accessibilityLabel = 'carmode.actions.selectSoundDevice'
            icon = { AudioIcon }
            labelKey = 'carmode.actions.selectSoundDevice'
            onClick = { onSelect }
            style = { styles.soundDeviceButton }
            type = { BUTTON_TYPES.SECONDARY } />
    );
};

export default SelectSoundDevice;
