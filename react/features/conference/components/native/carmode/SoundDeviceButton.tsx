/* eslint-disable lines-around-comment */
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

// @ts-ignore
import { openSheet } from '../../../../base/dialog/actions';
import Button from '../../../../base/react/components/native/Button';
// @ts-ignore
import { BUTTON_TYPES } from '../../../../base/react/constants';
// @ts-ignore
import AudioRoutePickerDialog from '../../../../mobile/audio-mode/components/AudioRoutePickerDialog';

import AudioIcon from './AudioIcon';
// @ts-ignore
import styles from './styles';

/**
 * Button for selecting sound device in carmode.
 *
 * @returns {JSX.Element} - The sound device button.
 */
const SelectSoundDevice = () : JSX.Element => {
    const dispatch = useDispatch();

    const onSelect = useCallback(() =>
        dispatch(openSheet(AudioRoutePickerDialog))
    , [ dispatch ]);

    return (
        <Button
            accessibilityLabel = 'carmode.actions.selectSoundDevice'
            // @ts-ignore
            icon = { AudioIcon }
            label = 'carmode.actions.selectSoundDevice'
            onPress = { onSelect }
            style = { styles.soundDeviceButton }
            type = { BUTTON_TYPES.SECONDARY } />
    );
};

export default SelectSoundDevice;
