import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { batch, useDispatch } from 'react-redux';

import { hideSheet } from '../../../../base/dialog/actions';
import BottomSheet from '../../../../base/dialog/components/native/BottomSheet';
import Button from '../../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../../base/ui/constants.native';
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
            <View style = { styles.highlightDialog as StyleProp<ViewStyle> }>
                <Text style = { styles.highlightDialogHeading as StyleProp<TextStyle> }>
                    { `${t('recording.highlightMoment')}?` }
                </Text>
                <Text style = { styles.highlightDialogText as StyleProp<TextStyle> }>
                    { t('recording.highlightMomentSucessDescription') }
                </Text>
                <View style = { styles.highlightDialogButtonsContainer as StyleProp<ViewStyle> } >
                    <Button
                        accessibilityLabel = 'dialog.Cancel'
                        labelKey = 'dialog.Cancel'
                        onClick = { closeDialog }
                        type = { BUTTON_TYPES.SECONDARY } />
                    <View style = { styles.highlightDialogButtonsSpace as StyleProp<ViewStyle> } />
                    <Button
                        accessibilityLabel = 'recording.highlight'
                        labelKey = 'recording.highlight'
                        onClick = { highlightMoment }
                        type = { BUTTON_TYPES.PRIMARY } />
                </View>
            </View>
        </BottomSheet>
    );
};

export default HighlightDialog;
