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

    const description = t('visitors.joinMeeting.description');
    const okLabel = t('dialog.Ok');
    const title = t('visitors.joinMeeting.title');
    const wishToSpeak = t('visitors.joinMeeting.wishToSpeak');

    return (
        <Dialog.Container
            coverScreen = { false }
            visible = { visible }>
            <Dialog.Title>{ title }</Dialog.Title>
            <Dialog.Description>
                { description }
                <View style = { styles.raiseHandButton as ViewStyle }>
                    {/* @ts-ignore */}
                    <RaiseHandButton disableClick = { true } />
                </View>
            </Dialog.Description>
            <Dialog.Description>{ wishToSpeak }</Dialog.Description>
            <Dialog.Button
                accessibilityLabel = { okLabel }
                label = { okLabel }
                onPress = { closeDialog } />
        </Dialog.Container>
    );
}
