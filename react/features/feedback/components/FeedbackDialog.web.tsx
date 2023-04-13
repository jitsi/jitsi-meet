import { Theme } from '@mui/material';
import { ClassNameMap, withStyles } from '@mui/styles';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { createFeedbackOpenEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState, IStore } from '../../app/types';
import { IJitsiConference } from '../../base/conference/reducer';
import { isMobileBrowser } from '../../base/environment/utils';
import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconFavorite, IconFavoriteSolid } from '../../base/icons/svg';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import Dialog from '../../base/ui/components/web/Dialog';
import Input from '../../base/ui/components/web/Input';
import { cancelFeedback, submitFeedback } from '../actions';

const styles = (theme: Theme) => {
    return {
        dialog: {
            marginBottom: theme.spacing(1)
        },

        rating: {
            display: 'flex',
            flexDirection: 'column' as const,
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

        details: {
            '& textarea': {
                minHeight: '122px'
            }
        }
    };
};

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

type Scrollable = {
    scroll: Function;
};

/**
 * The type of the React {@code Component} props of {@link FeedbackDialog}.
 */
interface IProps extends WithTranslation {

    /**
     * The cached feedback message, if any, that was set when closing a previous
     * instance of {@code FeedbackDialog}.
     */
    _message: string;

    /**
     * The cached feedback score, if any, that was set when closing a previous
     * instance of {@code FeedbackDialog}.
     */
    _score: number;

    /**
     * An object containing the CSS classes.
     */
    classes: ClassNameMap<string>;

    /**
     * The JitsiConference that is being rated. The conference is passed in
     * because feedback can occur after a conference has been left, so
     * references to it may no longer exist in redux.
     */
    conference: IJitsiConference;

    /**
     * Invoked to signal feedback submission or canceling.
     */
    dispatch: IStore['dispatch'];

    /**
     * Callback invoked when {@code FeedbackDialog} is unmounted.
     */
    onClose: Function;
}

/**
 * The type of the React {@code Component} state of {@link FeedbackDialog}.
 */
interface IState {

    /**
     * The currently entered feedback message.
     */
    message: string;

    /**
     * The score selection index which is currently being hovered. The value -1
     * is used as a sentinel value to match store behavior of using -1 for no
     * score having been selected.
     */
    mousedOverScore: number;

    /**
     * The currently selected score selection index. The score will not be 0
     * indexed so subtract one to map with SCORES.
     */
    score: number;
}

/**
 * A React {@code Component} for displaying a dialog to rate the current
 * conference quality, write a message describing the experience, and submit
 * the feedback.
 *
 * @augments Component
 */
class FeedbackDialog extends Component<IProps, IState> {
    /**
     * An array of objects with click handlers for each of the scores listed in
     * the constant SCORES. This pattern is used for binding event handlers only
     * once for each score selection icon.
     */
    _scoreClickConfigurations: Array<{
        _onClick: (e: React.MouseEvent) => void;
        _onKeyDown: (e: React.KeyboardEvent) => void;
        _onMouseOver: (e: React.MouseEvent) => void;
    }>;

    _onScrollTop: (node: Scrollable | null) => void;

    /**
     * Initializes a new {@code FeedbackDialog} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        const { _message, _score } = this.props;

        this.state = {
            /**
             * The currently entered feedback message.
             *
             * @type {string}
             */
            message: _message,

            /**
             * The score selection index which is currently being hovered. The
             * value -1 is used as a sentinel value to match store behavior of
             * using -1 for no score having been selected.
             *
             * @type {number}
             */
            mousedOverScore: -1,

            /**
             * The currently selected score selection index. The score will not
             * be 0 indexed so subtract one to map with SCORES.
             *
             * @type {number}
             */
            score: _score > -1 ? _score - 1 : _score
        };

        this._scoreClickConfigurations = SCORES.map((textKey, index) => {
            return {
                _onClick: () => this._onScoreSelect(index),
                _onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                        e.stopPropagation();
                        e.preventDefault();
                        this._onScoreSelect(index);
                    }
                },
                _onMouseOver: () => this._onScoreMouseOver(index)
            };
        });

        // Bind event handlers so they are only bound once for every instance.
        this._onCancel = this._onCancel.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onScoreContainerMouseLeave
            = this._onScoreContainerMouseLeave.bind(this);
        this._onSubmit = this._onSubmit.bind(this);

        // On some mobile browsers opening Feedback dialog scrolls down the whole content because of the keyboard.
        // By scrolling to the top we prevent hiding the feedback stars so the user knows those exist.
        this._onScrollTop = (node: Scrollable | null) => {
            node?.scroll?.(0, 0);
        };
    }

    /**
     * Emits an analytics event to notify feedback has been opened.
     *
     * @inheritdoc
     */
    componentDidMount() {
        sendAnalytics(createFeedbackOpenEvent());
        if (typeof APP !== 'undefined') {
            APP.API.notifyFeedbackPromptDisplayed();
        }
    }

    /**
     * Invokes the onClose callback, if defined, to notify of the close event.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { message, mousedOverScore, score } = this.state;
        const scoreToDisplayAsSelected
            = mousedOverScore > -1 ? mousedOverScore : score;

        const { classes, t } = this.props;

        const scoreIcons = this._scoreClickConfigurations.map(
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
                        { isFilled
                            ? <Icon
                                size = { ICON_SIZE }
                                src = { IconFavoriteSolid } />
                            : <Icon
                                size = { ICON_SIZE }
                                src = { IconFavorite } /> }
                    </span>
                );
            });


        return (
            <Dialog
                ok = {{
                    translationKey: 'dialog.Submit'
                }}
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                size = 'large'
                titleKey = 'feedback.rateExperience'>
                <div className = { classes.dialog }>
                    <div className = { classes.rating }>
                        <div
                            aria-label = { this.props.t('feedback.star') }
                            className = { classes.ratingLabel } >
                            <p id = 'starLabel'>
                                { t(SCORES[scoreToDisplayAsSelected]) }
                            </p>
                        </div>
                        <div
                            className = { classes.stars }
                            onMouseLeave = { this._onScoreContainerMouseLeave }>
                            { scoreIcons }
                        </div>
                    </div>
                    <div className = { classes.details }>
                        <Input
                            autoFocus = { true }
                            id = 'feedbackTextArea'
                            label = { t('feedback.detailsLabel') }
                            onChange = { this._onMessageChange }
                            textarea = { true }
                            value = { message } />
                    </div>
                </div>
            </Dialog>
        );
    }

    /**
     * Dispatches an action notifying feedback was not submitted. The submitted
     * score will have one added as the rest of the app does not expect 0
     * indexing.
     *
     * @private
     * @returns {boolean} Returns true to close the dialog.
     */
    _onCancel() {
        const { message, score } = this.state;
        const scoreToSubmit = score > -1 ? score + 1 : score;

        this.props.dispatch(cancelFeedback(scoreToSubmit, message));

        return true;
    }

    /**
     * Updates the known entered feedback message.
     *
     * @param {string} newValue - The new value from updating the textfield for the
     * feedback message.
     * @private
     * @returns {void}
     */
    _onMessageChange(newValue: string) {
        this.setState({ message: newValue });
    }

    /**
     * Updates the currently selected score.
     *
     * @param {number} score - The index of the selected score in SCORES.
     * @private
     * @returns {void}
     */
    _onScoreSelect(score: number) {
        this.setState({ score });
    }

    /**
     * Sets the currently hovered score to null to indicate no hover is
     * occurring.
     *
     * @private
     * @returns {void}
     */
    _onScoreContainerMouseLeave() {
        this.setState({ mousedOverScore: -1 });
    }

    /**
     * Updates the known state of the score icon currently behind hovered over.
     *
     * @param {number} mousedOverScore - The index of the SCORES value currently
     * being moused over.
     * @private
     * @returns {void}
     */
    _onScoreMouseOver(mousedOverScore: number) {
        this.setState({ mousedOverScore });
    }

    /**
     * Dispatches the entered feedback for submission. The submitted score will
     * have one added as the rest of the app does not expect 0 indexing.
     *
     * @private
     * @returns {boolean} Returns true to close the dialog.
     */
    _onSubmit() {
        const { conference, dispatch } = this.props;
        const { message, score } = this.state;

        const scoreToSubmit = score > -1 ? score + 1 : score;

        dispatch(submitFeedback(scoreToSubmit, message, conference));

        return true;
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code FeedbackDialog}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const { message, score } = state['features/feedback'];

    return {
        /**
         * The cached feedback message, if any, that was set when closing a
         * previous instance of {@code FeedbackDialog}.
         *
         * @type {string}
         */
        _message: message,

        /**
         * The currently selected score selection index.
         *
         * @type {number}
         */
        _score: score
    };
}

export default withStyles(styles)(translate(connect(_mapStateToProps)(FeedbackDialog)));
