import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useDispatch, batch } from 'react-redux';

import { BottomSheet, hideSheet } from '../../../../base/dialog';
import Button from '../../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../../base/ui/constants';
import { highlightMeetingMoment } from '../../../actions.any';
import styles from '../styles.native';

const HighlightDialog = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const closeDialog = useCallback(() => dispatch(hideSheet()), [ dispatch ]);
    const highlightMoment = useCallback(() => {
        batch(() => {
            dispatch(highlightMeetingMoment());
            dispatch(hideSheet());
        });
    }, [ dispatch ]);

    return (
        <BottomSheet>
            <View style = { styles.highlightDialog }>
                <Text style = { styles.highlightDialogHeading }>{ `${t('recording.highlightMoment')}?` }</Text>
                <Text style = { styles.highlightDialogText }>
                    { t('recording.highlightMomentSucessDescription') }
                </Text>
                <View style = { styles.highlightDialogButtonsContainer } >
                    <Button
                        accessibilityLabel = 'dialog.Cancel'
                        label = 'dialog.Cancel'
                        onPress = { closeDialog }
                        type = { BUTTON_TYPES.SECONDARY } />
                    <View style = { styles.highlightDialogButtonsSpace } />
                    <Button
                        accessibilityLabel = 'recording.highlight'
                        label = 'recording.highlight'
                        onPress = { highlightMoment }
                        type = { BUTTON_TYPES.PRIMARY } />
                </View>
            </View>
        </BottomSheet>
    );
};

export default HighlightDialog;
