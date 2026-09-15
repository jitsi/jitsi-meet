import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';

import { appNavigate } from '../../../app/actions.native';
import { IconCloseLarge } from '../../../base/icons/svg';
import { cancelKnocking } from '../../../lobby/actions.native';

import HeaderNavigationButton from './HeaderNavigationButton';

/**
 * Close icon/text button for the lobby screen based on platform.
 *
 * @returns {React.Component}
 */
const LobbyCloseButton = React.memo(() => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const goBack = useCallback(() => {
        dispatch(cancelKnocking());
        dispatch(appNavigate(undefined));
    }, [ dispatch ]);

    if (Platform.OS === 'ios') {
        return (
            <HeaderNavigationButton
                id = { 'close-screen-button' }
                label = { t('dialog.close') }
                onPress = { goBack } />
        );
    }

    return (
        <HeaderNavigationButton
            id = { 'close-screen-button' }
            onPress = { goBack }
            src = { IconCloseLarge } />
    );
});

LobbyCloseButton.displayName = 'LobbyCloseButton';

export default LobbyCloseButton;
