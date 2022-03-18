// @flow
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, batch } from 'react-redux';

import { hideDialog, BottomSheet } from '../../../../base/dialog';
import { highlightMeetingMoment } from '../../../actions.any';
import styles from '../styles.native';

const HighlightDialog = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const closeDialog = useCallback(() => dispatch(hideDialog()), [ dispatch ]);
    const highlightMoment = useCallback(() => {
        batch(() => {
            dispatch(highlightMeetingMoment());
            dispatch(hideDialog());
        });
    }, [ dispatch ]);

    return (
        <BottomSheet onCancel = { closeDialog }>
            <View style = { styles.highlightDialog }>
                <Text style = { styles.highlightDialogHeading }>{ `${t('recording.highlightMoment')}?` }</Text>
                <Text style = { styles.highlightDialogText }>
                    { t('recording.highlightMomentSucessDescription') }
                </Text>
                <View style = { styles.highlightDialogButtonsContainer } >
                    <Button
                        accessibilityLabel = { t('dialog.Cancel') }
                        children = { t('dialog.Cancel') }
                        labelStyle = { styles.highlightDialogCancelLabel }
                        mode = 'contained'
                        onPress = { closeDialog }
                        style = { styles.highlightDialogCancelButton } />
                    <View style = { styles.highlightDialogButtonsSpace } />
                    <Button
                        accessibilityLabel = { t('recording.highlight') }
                        children = { t('recording.highlight') }
                        labelStyle = { styles.highlightDialogHighlighLabel }
                        mode = 'contained'
                        onPress = { highlightMoment }
                        style = { styles.highlightDialogHighlightButton } />
                </View>
            </View>
        </BottomSheet>
    );
};

export default HighlightDialog;
