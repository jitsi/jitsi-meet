import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextStyle, TouchableOpacity, View } from 'react-native';
import Dialog from 'react-native-dialog';
import { useDispatch, useSelector } from 'react-redux';

import { createFeedbackOpenEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { IJitsiConference } from '../../base/conference/reducer';
import ConfirmDialog from '../../base/dialog/components/native/ConfirmDialog';
import Icon from '../../base/icons/components/Icon';
import { IconFavorite, IconFavoriteSolid } from '../../base/icons/svg';
import BaseTheme from '../../base/ui/components/BaseTheme.native';
import { cancelFeedback, submitFeedback } from '../actions';

import styles from './styles.native';

/**
 * The scores to display for selecting. The score is the index in the array and
 * the value of the index is a translation key used for display in the dialog.
 */
const SCORES = [
    'feedback.veryBad',
    'feedback.bad',
    'feedback.average',
    'feedback.good',
    'feedback.veryGood'
];

const ICON_SIZE = 34;

/**
 * The type of the React {@code Component} props of {@link FeedbackDialog}.
 */
interface IProps {

    /**
     * The JitsiConference that is being rated. The conference is passed in
     * because feedback can occur after a conference has been left, so
     * references to it may no longer exist in redux.
     */
    conference?: IJitsiConference;

    /**
     * Callback invoked when {@code FeedbackDialog} is unmounted.
     */
    onClose?: Function;

    /**
     * The title to display in the dialog. Usually the reason that triggered the feedback.
     */
    title?: string;
}

/**
 * A React {@code Component} for displaying a dialog on native to rate the current
 * conference quality, write a message describing the experience, and submit
 * the feedback.
 *
 * @param {IProps} props - Component's props.
 * @returns {JSX.Element}
 */
const FeedbackDialog = ({ conference, onClose, title }: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _message = useSelector((state: IReduxState) => state['features/feedback'].message);
    const _score = useSelector((state: IReduxState) => state['features/feedback'].score);

    /**
     * The currently entered feedback message.
     */
    const [ message, setMessage ] = useState(_message);

    /**
     * The currently selected score selection index. The score will not
     * be 0 indexed so subtract one to map with SCORES.
     */
    const [ score, setScore ] = useState(_score > -1 ? _score - 1 : _score);

    /**
     * Updates the currently selected score.
     *
     * @param {number} newScore - The index of the selected score in SCORES.
     * @private
     * @returns {void}
     */
    function onScoreSelect(newScore: number) {
        setScore(newScore);
    }

    /**
     * An array of objects with click handlers for each of the scores listed in
     * the constant SCORES. This pattern is used for binding event handlers only
     * once for each score selection icon.
     */
    const scoreClickConfigurations = useRef(SCORES.map((textKey, index) => {
        return {
            _onClick: () => onScoreSelect(index)
        };
    }));

    useEffect(() => {
        sendAnalytics(createFeedbackOpenEvent());

        return () => {
            onClose?.();
        };
    }, []);

    /**
     * Dispatches an action notifying feedback was not submitted. The submitted
     * score will have one added as the rest of the app does not expect 0
     * indexing.
     *
     * @private
     * @returns {boolean} Returns true to close the dialog.
     */
    const onCancel = useCallback(() => {
        const scoreToSubmit = score > -1 ? score + 1 : score;

        dispatch(cancelFeedback(scoreToSubmit, message));

        return true;
    }, [ score, message, dispatch ]);

    /**
     * Updates the known entered feedback message.
     *
     * @param {string} newValue - The new value from updating the textfield for the
     * feedback message.
     * @private
     * @returns {void}
     */
    const onMessageChange = useCallback((newValue: string) => {
        setMessage(newValue);
    }, []);

    /**
     * Dispatches the entered feedback for submission. The submitted score will
     * have one added as the rest of the app does not expect 0 indexing.
     *
     * @private
     * @returns {boolean} Returns true to close the dialog.
     */
    const _onSubmit = useCallback(() => {
        const scoreToSubmit = score > -1 ? score + 1 : score;

        if (conference) {
            dispatch(submitFeedback(scoreToSubmit, message, conference));
        }

        return true;
    }, [ score, message, conference, dispatch ]);

    const scoreIcons = scoreClickConfigurations.current.map((config, index) => {
        const isFilled = index <= score;

        return (
            <TouchableOpacity
                accessibilityLabel = { t(SCORES[index]) }
                accessibilityRole = 'button'
                key = { index }
                onPress = { config._onClick }
                style = { styles.starBtn }>
                <Icon
                    color = { isFilled ? BaseTheme.palette.success01 : BaseTheme.palette.icon03 }
                    size = { ICON_SIZE }
                    src = { isFilled ? IconFavoriteSolid : IconFavorite } />
            </TouchableOpacity>
        );
    });

    return (
        <ConfirmDialog
            cancelLabel = 'dialog.Cancel'
            confirmLabel = 'dialog.Submit'
            descriptionKey = { title }
            isCancelHidden = { false }
            isConfirmHidden = { false }
            onCancel = { onCancel }
            onSubmit = { _onSubmit }
            title = 'feedback.rateExperience'>
            <View style = { styles.dialog }>
                <View style = { styles.rating }>
                    <Text
                        accessibilityLabel = { t('feedback.accessibilityLabel.yourChoice', {
                            rating: score > -1 ? t(SCORES[score]) : ''
                        }) }
                        style = { styles.ratingLabel as TextStyle }>
                        { score > -1 ? t(SCORES[score]) : '' }
                    </Text>
                    <View style = { styles.stars }>
                        { scoreIcons }
                    </View>
                </View>
                <Dialog.Input
                    multiline = { true }
                    numberOfLines = { 3 }
                    onChangeText = { onMessageChange }
                    placeholder = { t('feedback.detailsLabel') }
                    value = { message } />
            </View>
        </ConfirmDialog>
    );
};

export default FeedbackDialog;
