// @flow

import { FieldTextAreaStateless } from '@atlaskit/field-text-area';
import StarIcon from '@atlaskit/icon/glyph/star';
import StarFilledIcon from '@atlaskit/icon/glyph/star-filled';
import React, { Component } from 'react';
import { connect } from '../../base/redux';
import type { Dispatch } from 'redux';

import {
    createFeedbackOpenEvent,
    sendAnalytics
} from '../../analytics';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import { cancelFeedback, submitFeedback } from '../actions';

declare var APP: Object;
declare var interfaceConfig: Object;

const scoreAnimationClass
    = interfaceConfig.ENABLE_FEEDBACK_ANIMATION ? 'shake-rotate' : '';

/**
 * The scores to display for selecting. The score is the index in the array and
 * the value of the index is a translation key used for display in the dialog.
 *
 * @types {string[]}
 */
const SCORES = [
    'feedback.veryBad',
    'feedback.bad',
    'feedback.average',
    'feedback.good',
    'feedback.veryGood'
];

/**
 * The type of the React {@code Component} props of {@link FeedbackDialog}.
 */
type Props = {

    /**
     * The cached feedback message, if any, that was set when closing a previous
     * instance of {@code FeedbackDialog}.
     */
    _message: string,

    /**
     * The cached feedback score, if any, that was set when closing a previous
     * instance of {@code FeedbackDialog}.
     */
    _score: number,

    /**
     * The JitsiConference that is being rated. The conference is passed in
     * because feedback can occur after a conference has been left, so
     * references to it may no longer exist in redux.
     */
    conference: Object,

    /**
     * Invoked to signal feedback submission or canceling.
     */
    dispatch: Dispatch<any>,

    /**
     * Callback invoked when {@code FeedbackDialog} is unmounted.
     */
    onClose: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link FeedbackDialog}.
 */
type State = {

    /**
     * The currently entered feedback message.
     */
    message: string,

    /**
     * The score selection index which is currently being hovered. The value -1
     * is used as a sentinel value to match store behavior of using -1 for no
     * score having been selected.
     */
    mousedOverScore: number,

    /**
     * The currently selected score selection index. The score will not be 0
     * indexed so subtract one to map with SCORES.
     */
    score: number
};

/**
 * A React {@code Component} for displaying a dialog to rate the current
 * conference quality, write a message describing the experience, and submit
 * the feedback.
 *
 * @extends Component
 */
class FeedbackDialog extends Component<Props, State> {
    /**
     * An array of objects with click handlers for each of the scores listed in
     * the constant SCORES. This pattern is used for binding event handlers only
     * once for each score selection icon.
     */
    _scoreClickConfigurations: Array<Object>;

    /**
     * Initializes a new {@code FeedbackDialog} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
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
                _onMouseOver: () => this._onScoreMouseOver(index)
            };
        });

        // Bind event handlers so they are only bound once for every instance.
        this._onCancel = this._onCancel.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onScoreContainerMouseLeave
            = this._onScoreContainerMouseLeave.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
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

        const scoreIcons = this._scoreClickConfigurations.map(
            (config, index) => {
                const isFilled = index <= scoreToDisplayAsSelected;
                const activeClass = isFilled ? 'active' : '';
                const className
                    = `star-btn ${scoreAnimationClass} ${activeClass}`;

                return (
                    <a
                        className = { className }
                        key = { index }
                        onClick = { config._onClick }
                        onMouseOver = { config._onMouseOver }>
                        { isFilled
                            ? <StarFilledIcon
                                label = 'star-filled'
                                size = 'xlarge' />
                            : <StarIcon
                                label = 'star'
                                size = 'xlarge' /> }
                    </a>
                );
            });

        const { t } = this.props;

        return (
            <Dialog
                okKey = 'dialog.Submit'
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'feedback.rateExperience'>
                <div className = 'feedback-dialog'>
                    <div className = 'rating'>
                        <div className = 'star-label'>
                            <p id = 'starLabel'>
                                { t(SCORES[scoreToDisplayAsSelected]) }
                            </p>
                        </div>
                        <div
                            className = 'stars'
                            onMouseLeave = { this._onScoreContainerMouseLeave }>
                            { scoreIcons }
                        </div>
                    </div>
                    <div className = 'details'>
                        <FieldTextAreaStateless
                            autoFocus = { true }
                            className = 'input-control'
                            id = 'feedbackTextArea'
                            label = { t('feedback.detailsLabel') }
                            onChange = { this._onMessageChange }
                            shouldFitContainer = { true }
                            value = { message } />
                    </div>
                </div>
            </Dialog>
        );
    }

    _onCancel: () => boolean;

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

    _onMessageChange: (Object) => void;

    /**
     * Updates the known entered feedback message.
     *
     * @param {Object} event - The DOM event from updating the textfield for the
     * feedback message.
     * @private
     * @returns {void}
     */
    _onMessageChange(event) {
        this.setState({ message: event.target.value });
    }

    /**
     * Updates the currently selected score.
     *
     * @param {number} score - The index of the selected score in SCORES.
     * @private
     * @returns {void}
     */
    _onScoreSelect(score) {
        this.setState({ score });
    }

    _onScoreContainerMouseLeave: () => void;

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
    _onScoreMouseOver(mousedOverScore) {
        this.setState({ mousedOverScore });
    }

    _onSubmit: () => void;

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
function _mapStateToProps(state) {
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

export default translate(connect(_mapStateToProps)(FeedbackDialog));
