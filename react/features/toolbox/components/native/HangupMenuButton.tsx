import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { openSheet } from '../../../base/dialog/actions';
import { IconHangup } from '../../../base/icons/svg';
import IconButton from '../../../base/ui/components/native/IconButton';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';

import HangupMenu from './HangupMenu';

/**
 * Button for showing the hangup menu.
 *
 * @returns {JSX.Element} - The hangup menu button.
 */
const HangupMenuButton = (): JSX.Element => {
    const dispatch = useDispatch();

    const onSelect = useCallback(() => {
        dispatch(openSheet(HangupMenu));
    }, [ dispatch ]);

    return (
        <IconButton
            accessibilityLabel = 'toolbar.accessibilityLabel.hangup'
            onPress = { onSelect }
            src = { IconHangup }
            type = { BUTTON_TYPES.PRIMARY } />
    );
};

export default HangupMenuButton;
