// @flow

import React, { Component } from 'react';
import { bindActionCreators } from 'redux';

import {
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { translate } from '../../../base/i18n';
import { getLocalParticipant, getParticipantCount, participantUpdated } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { dockToolbox } from '../../../toolbox/actions.web';
import { sendReaction } from '../../actions.any';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import { REACTIONS } from '../../constants';

import ReactionButton from './ReactionButton';

type Props = {

    /**
     * The number of conference participants.
     */
    _participantCount: number,

    /**
     * Used for translation.
     */
    t: Function,

    /**
     * Whether or not the local participant's hand is raised.
     */
    _raisedHand: boolean,

    /**
     * The ID of the local participant.
     */
    _localParticipantID: String,

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Docks the toolbox
     */
    _dockToolbox: Function,

    /**
     * Whether or not it's displayed in the overflow menu.
     */
    overflowMenu: boolean
};

declare var APP: Object;

/**
 * Implements the reactions menu.
 *
 * @returns {ReactElement}
 */
class ReactionsMenu extends Component<Props> {
    /**
     * Initializes a new {@code ReactionsMenu} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onToolbarToggleRaiseHand = this._onToolbarToggleRaiseHand.bind(this);
        this._getReactionButtons = this._getReactionButtons.bind(this);
    }

    _onToolbarToggleRaiseHand: () => void;

    _getReactionButtons: () => Array<React$Element<*>>;

    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.props._dockToolbox(true);
    }

    /**
     * Implements React Component's componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this.props._dockToolbox(false);
    }

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * raise hand.
     *
     * @returns {void}
     */
    _onToolbarToggleRaiseHand() {
        sendAnalytics(createToolbarEvent(
            'raise.hand',
            { enable: !this.props._raisedHand }));
        this._doToggleRaiseHand();
        this.props.dispatch(toggleReactionsMenuVisibility());
    }

    /**
     * Dispatches an action to toggle the local participant's raised hand state.
     *
     * @private
     * @returns {void}
     */
    _doToggleRaiseHand() {
        const { _localParticipantID, _raisedHand } = this.props;
        const newRaisedStatus = !_raisedHand;

        this.props.dispatch(participantUpdated({
            // XXX Only the local participant is allowed to update without
            // stating the JitsiConference instance (i.e. participant property
            // `conference` for a remote participant) because the local
            // participant is uniquely identified by the very fact that there is
            // only one local participant.

            id: _localParticipantID,
            local: true,
            raisedHand: newRaisedStatus
        }));

        APP.API.notifyRaiseHandUpdated(_localParticipantID, newRaisedStatus);
    }

    /**
     * Returns the emoji reaction buttons.
     *
     * @returns {Array}
     */
    _getReactionButtons() {
        const { t, dispatch } = this.props;

        return Object.keys(REACTIONS).map(key => {
            /**
             * Sends reaction message.
             *
             * @returns {void}
             */
            function sendMessage() {
                dispatch(sendReaction(key));
            }

            return (<ReactionButton
                accessibilityLabel = { t(`toolbar.accessibilityLabel.${key}`) }
                icon = { REACTIONS[key].emoji }
                key = { key }
                onClick = { sendMessage }
                toggled = { false }
                tooltip = { t(`toolbar.${key}`) } />);
        });
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _participantCount, _raisedHand, t, overflowMenu } = this.props;

        return (
            <div className = { `reactions-menu ${overflowMenu ? 'overflow' : ''}` }>
                { _participantCount > 1 && <div className = 'reactions-row'>
                    { this._getReactionButtons() }
                </div> }
                <div className = 'raise-hand-row'>
                    <ReactionButton
                        accessibilityLabel = { t('toolbar.accessibilityLabel.raiseHand') }
                        icon = '✋'
                        key = 'raisehand'
                        label = {
                            `${t(`toolbar.${_raisedHand ? 'lowerYourHand' : 'raiseYourHand'}`)}
                            ${overflowMenu ? '' : ' (R)'}`
                        }
                        onClick = { this._onToolbarToggleRaiseHand }
                        toggled = { true } />
                </div>
            </div>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const localParticipant = getLocalParticipant(state);

    return {
        _localParticipantID: localParticipant.id,
        _raisedHand: localParticipant.raisedHand,
        _participantCount: getParticipantCount(state)
    };
}

/**
 * Function that maps parts of Redux actions into component props.
 *
 * @param {Object} dispatch - Redux dispatch.
 * @returns {Object}
 */
function mapDispatchToProps(dispatch) {
    return {
        dispatch,
        ...bindActionCreators(
        {
            _dockToolbox: dockToolbox
        }, dispatch)
    };
}

export default translate(connect(
    mapStateToProps,
    mapDispatchToProps,
)(ReactionsMenu));
