import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createFeedbackOpenEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { IJitsiConference } from '../../base/conference/reducer';
import { isMobileBrowser } from '../../base/environment/utils';
import Icon from '../../base/icons/components/Icon';
import { IconFavorite, IconFavoriteSolid } from '../../base/icons/svg';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import Dialog from '../../base/ui/components/web/Dialog';
import Input from '../../base/ui/components/web/Input';
import { cancelFeedback, submitFeedback } from '../actions.web';

const useStyles = makeStyles()(theme => {
    return {
        dialog: {
            marginBottom: theme.spacing(1)
        },

        rating: {
            display: 'flex',
            flexDirection: 'column-reverse' as const,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: theme.spacing(4),
            marginBottom: theme.spacing(3)
        },

        ratingLabel: {
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            color: theme.palette.text01,
            marginBottom: theme.spacing(2),
            height: '20px'
        },

        stars: {
            display: 'flex'
        },

        starBtn: {
            display: 'inline-block',
            cursor: 'pointer',
            marginRight: theme.spacing(3),

            '&:last-of-type': {
                marginRight: 0
            },

            '&.active svg': {
                fill: theme.palette.success01
            },

            '&:focus': {
                outline: `1px solid ${theme.palette.action01}`,
                borderRadius: '4px'
            }
        },

        title: {
            fontSize: '16px'
        },

        details: {
            '& textarea': {
                minHeight: '122px'
            }
        }
    };
});

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

const ICON_SIZE = 32;

/**
 * The type of the React {@code Component} props of {@link FeedbackDialog}.
 */
interface IProps {

    /**
     * The JitsiConference that is being rated. The conference is passed in
     * because feedback can occur after a conference has been left, so
     * references to it may no longer exist in redux.
     */
    conference: IJitsiConference;

    /**
     * Callback invoked when {@code FeedbackDialog} is unmounted.
     */
    onClose: Function;

    /**
     * The title to display in the dialog. Usually the reason that triggered the feedback.
     */
    title?: string;
}

/**
 * A React {@code Component} for displaying a dialog to rate the current
 * conference quality, write a message describing the experience, and submit
 * the feedback.
 *
 * @param {IProps} props - Component's props.
 * @returns {JSX}
 */
const FeedbackDialog = ({ conference, onClose, title }: IProps) => {
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _message = useSelector((state: IReduxState) => state['features/feedback'].message);
    const _score = useSelector((state: IReduxState) => state['features/feedback'].score);

    /**
     * The currently entered feedback message.
     */
    const [ message, setMessage ] = useState(_message);

    /**
     * The score selection index which is currently being hovered. The
     * value -1 is used as a sentinel value to match store behavior of
     * using -1 for no score having been selected.
     */
    const [ mousedOverScore, setMousedOverScore ] = useState(-1);

    /**
     * The currently selected score selection index. The score will not
     * be 0 indexed so subtract one to map with SCORES.
     */
    const [ score, setScore ] = useState(_score > -1 ? _score - 1 : _score);

    /**
     * An array of objects with click handlers for each of the scores listed in
     * the constant SCORES. This pattern is used for binding event handlers only
     * once for each score selection icon.
     */
    const scoreClickConfigurations = useRef(SCORES.map((textKey, index) => {
        return {
            _onClick: () => onScoreSelect(index),
            _onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.stopPropagation();
                    e.preventDefault();
                    onScoreSelect(index);
                }
            },
            _onMouseOver: () => onScoreMouseOver(index)
        };
    }));

    useEffect(() => {
        sendAnalytics(createFeedbackOpenEvent());
        if (typeof APP !== 'undefined') {
            APP.API.notifyFeedbackPromptDisplayed();
        }

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
    }, [ score, message ]);

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
     * Sets the currently hovered score to null to indicate no hover is
     * occurring.
     *
     * @private
     * @returns {void}
     */
    const onScoreContainerMouseLeave = useCallback(() => {
        setMousedOverScore(-1);
    }, []);

    /**
     * Updates the known state of the score icon currently behind hovered over.
     *
     * @param {number} newMousedOverScore - The index of the SCORES value currently
     * being moused over.
     * @private
     * @returns {void}
     */
    function onScoreMouseOver(newMousedOverScore: number) {
        setMousedOverScore(newMousedOverScore);
    }

    /**
     * Dispatches the entered feedback for submission. The submitted score will
     * have one added as the rest of the app does not expect 0 indexing.
     *
     * @private
     * @returns {boolean} Returns true to close the dialog.
     */
    const _onSubmit = useCallback(() => {
        const scoreToSubmit = score > -1 ? score + 1 : score;

        dispatch(submitFeedback(scoreToSubmit, message, conference));

        return true;
    }, [ score, message, conference ]);

    const scoreToDisplayAsSelected
        = mousedOverScore > -1 ? mousedOverScore : score;

    const scoreIcons = scoreClickConfigurations.current.map(
        (config, index) => {
            const isFilled = index <= scoreToDisplayAsSelected;
            const activeClass = isFilled ? 'active' : '';
            const className
                = `${classes.starBtn} ${activeClass}`;

            return (
                <span
                    aria-label = { t(SCORES[index]) }
                    className = { className }
                    key = { index }
                    onClick = { config._onClick }
                    onKeyDown = { config._onKeyDown }
                    role = 'button'
                    tabIndex = { 0 }
                    { ...(isMobileBrowser() ? {} : {
                        onMouseOver: config._onMouseOver
                    }) }>
                    {isFilled
                        ? <Icon
                            size = { ICON_SIZE }
                            src = { IconFavoriteSolid } />
                        : <Icon
                            size = { ICON_SIZE }
                            src = { IconFavorite } />}
                </span>
            );
        });


    return (
        <Dialog
            ok = {{
                translationKey: 'dialog.Submit'
            }}
            onCancel = { onCancel }
            onSubmit = { _onSubmit }
            size = 'large'
            titleKey = 'feedback.rateExperience'>
            <div className = { classes.dialog }>
                {title ? <div className = { classes.title }>{t(title)}</div> : null}
                <div className = { classes.rating }>
                    <div
                        className = { classes.stars }
                        onMouseLeave = { onScoreContainerMouseLeave }>
                        {scoreIcons}
                    </div>
                    <div
                        className = { classes.ratingLabel } >
                        <p className = 'sr-only'>
                            {t('feedback.accessibilityLabel.yourChoice', {
                                rating: t(SCORES[scoreToDisplayAsSelected])
                            })}
                        </p>
                        <p
                            aria-hidden = { true }
                            id = 'starLabel'>
                            {t(SCORES[scoreToDisplayAsSelected])}
                        </p>
                    </div>
                </div>
                <div className = { classes.details }>
                    <Input
                        id = 'feedbackTextArea'
                        label = { t('feedback.detailsLabel') }
                        onChange = { onMessageChange }
                        textarea = { true }
                        value = { message } />
                </div>
            </div>
        </Dialog>
    );
};

export default FeedbackDialog;
