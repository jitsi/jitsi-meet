// @flow

import React from 'react';
import { connect } from 'react-redux';

import { CircularLabel } from '../../base/label';
import { translate } from '../../base/i18n';
import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';

import AbstractRecordingLabel, {
    type Props as AbstractProps,
    _abstractMapStateToProps
} from './AbstractRecordingLabel';

/**
 * The translation keys to use when displaying messages. The values are set
 * lazily to work around circular dependency issues with lib-jitsi-meet causing
 * undefined imports.
 *
 * @private
 * @type {Object}
 */
let TRANSLATION_KEYS_BY_MODE = null;

/**
 * Lazily initializes TRANSLATION_KEYS_BY_MODE with translation keys to be used
 * by the {@code RecordingLabel} for messaging recording session state.
 *
 * @private
 * @returns {Object}
 */
function _getTranslationKeysByMode() {
    if (!TRANSLATION_KEYS_BY_MODE) {
        const {
            error: errorConstants,
            mode: modeConstants,
            status: statusConstants
        } = JitsiRecordingConstants;

        TRANSLATION_KEYS_BY_MODE = {
            [modeConstants.FILE]: {
                status: {
                    [statusConstants.PENDING]: 'recording.pending',
                    [statusConstants.OFF]: 'recording.off'
                },
                errors: {
                    [errorConstants.BUSY]: 'recording.failedToStart',
                    [errorConstants.ERROR]: 'recording.error'
                }
            },
            [modeConstants.STREAM]: {
                status: {
                    [statusConstants.PENDING]: 'liveStreaming.pending',
                    [statusConstants.OFF]: 'liveStreaming.off'
                },
                errors: {
                    [errorConstants.BUSY]: 'liveStreaming.busy',
                    [errorConstants.ERROR]: 'liveStreaming.error'
                }
            }
        };
    }

    return TRANSLATION_KEYS_BY_MODE;
}

/**
 * The type of the React {@code Component} props of {@link RecordingLabel}.
 */
type Props = AbstractProps & {

    /**
     * The redux representation of a recording session.
     */
    session: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link RecordingLabel}.
 */
type State = {

    /**
     * Whether or not the {@link RecordingLabel} should be invisible.
     */
    hidden: boolean
};

/**
 * Implements a React {@link Component} which displays the current state of
 * conference recording.
 *
 * @extends {Component}
 */
class RecordingLabel extends AbstractRecordingLabel<Props, State> {
    _autohideTimeout: number;

    state = {
        hidden: false
    };

    static defaultProps = {
        session: {}
    };

    /**
     * Sets a timeout to automatically hide the {@link RecordingLabel} if the
     * recording session started as failed.
     *
     * @inheritdoc
     */
    componentDidMount() {
        if (this.props.session.status === JitsiRecordingConstants.status.OFF) {
            this._setHideTimeout();
        }
    }

    /**
     * Sets a timeout to automatically hide {the @link RecordingLabel} if it has
     * transitioned to off.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(nextProps) {
        const { status } = this.props.session;
        const nextStatus = nextProps.session.status;

        if (status !== JitsiRecordingConstants.status.OFF
            && nextStatus === JitsiRecordingConstants.status.OFF) {
            this._setHideTimeout();
        }
    }

    /**
     * Clears the timeout for automatically hiding the {@link RecordingLabel}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._clearAutoHideTimeout();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this.state.hidden) {
            return null;
        }

        const {
            error: errorConstants,
            mode: modeConstants,
            status: statusConstants
        } = JitsiRecordingConstants;
        const { session } = this.props;
        const allTranslationKeys = _getTranslationKeysByMode();
        const translationKeys = allTranslationKeys[session.mode];
        let circularLabelClass, circularLabelKey, messageKey;

        switch (session.status) {
        case statusConstants.OFF: {
            if (session.error) {
                messageKey = translationKeys.errors[session.error]
                    || translationKeys.errors[errorConstants.ERROR];
            } else {
                messageKey = translationKeys.status[statusConstants.OFF];
            }
            break;
        }
        case statusConstants.ON:
            circularLabelClass = session.mode;
            circularLabelKey = session.mode === modeConstants.STREAM
                ? 'recording.live' : 'recording.rec';
            break;
        case statusConstants.PENDING:
            messageKey = translationKeys.status[statusConstants.PENDING];
            break;
        }

        const className = `recording-label ${
            messageKey ? 'center-message' : ''}`;

        return (
            <div className = { className }>
                { messageKey
                    ? <div>
                        { this.props.t(messageKey) }
                    </div>
                    : <CircularLabel
                        className = { circularLabelClass }
                        label = { this.props.t(circularLabelKey) } /> }
            </div>
        );
    }

    /**
     * Clears the timeout for automatically hiding {@link RecordingLabel}.
     *
     * @private
     * @returns {void}
     */
    _clearAutoHideTimeout() {
        clearTimeout(this._autohideTimeout);
    }

    /**
     * Sets a timeout to automatically hide {@link RecordingLabel}.
     *
     * @private
     * @returns {void}
     */
    _setHideTimeout() {
        this._autohideTimeout = setTimeout(() => {
            this.setState({ hidden: true });
        }, 5000);
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code RecordingLabel}'s props.
 *
 * NOTE: This component has no props other than the abstract ones but keeping
 * the coding style the same for consistency reasons.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The component's own props.
 * @private
 * @returns {{
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Object) {
    return {
        ..._abstractMapStateToProps(state, ownProps)
    };
}

export default translate(connect(_mapStateToProps)(RecordingLabel));
