import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ViewStyle } from 'react-native';
import Dialog from 'react-native-dialog';

import { StandaloneRaiseHandButton as RaiseHandButton } from '../../../reactions/components/native/RaiseHandButton';
import styles from '../../components/native/styles';

/**
 * Component that renders the join meeting dialog for visitors.
 *
 * @returns {JSX.Element}
 */
export default function JoinMeetingDialog() {
    const { t } = useTranslation();
    const [ visible, setVisible ] = useState(true);

    const closeDialog = useCallback(() => {
        setVisible(false);
    }, []);

    return (
        <Dialog.Container
            coverScreen = { false }
            visible = { visible }>
            <Dialog.Title>{ t('visitors.joinMeeting.title') }</Dialog.Title>
            <Dialog.Description>
                { t('visitors.joinMeeting.description') }
                <View style = { styles.raiseHandButton as ViewStyle }>
                    {/* @ts-ignore */}
                    <RaiseHandButton disableClick = { true } />
                </View>
            </Dialog.Description>
            <Dialog.Description>{t('visitors.joinMeeting.wishToSpeak')}</Dialog.Description>
            <Dialog.Button
                label = { t('dialog.Ok') }
                onPress = { closeDialog } />
        </Dialog.Container>
    );
}
