// @flow

/* eslint-disable react/jsx-no-bind */

import React, { Component } from 'react';
import { bindActionCreators } from 'redux';

import {
    createReactionMenuEvent,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { getLocalParticipant, hasRaisedHand, raiseHand } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { dockToolbox } from '../../../toolbox/actions.web';
import { addReactionToBuffer } from '../../actions.any';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import { REACTIONS } from '../../constants';

import ReactionButton from './ReactionButton';

type Props = {

    /**
     * Docks the toolbox.
     */
    _dockToolbox: Function,

    /**
     * Whether or not it's a mobile browser.
     */
    _isMobile: boolean,

    /**
     * The ID of the local participant.
     */
    _localParticipantID: String,

    /**
     * Whether or not the local participant's hand is raised.
     */
    _raisedHand: boolean,

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Whether or not it's displayed in the overflow menu.
     */
    overflowMenu: boolean,

    /**
     * Used for translation.
     */
    t: Function
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
        const { dispatch, _raisedHand } = this.props;

        sendAnalytics(createToolbarEvent(
            'raise.hand',
            { enable: !_raisedHand }));
        this._doToggleRaiseHand();
        dispatch(toggleReactionsMenuVisibility());
    }

    /**
     * Dispatches an action to toggle the local participant's raised hand state.
     *
     * @private
     * @returns {void}
     */
    _doToggleRaiseHand() {
        const { _raisedHand } = this.props;

        this.props.dispatch(raiseHand(!_raisedHand));
    }

    /**
     * Returns the emoji reaction buttons.
     *
     * @returns {Array}
     */
    _getReactionButtons() {
        const { t, dispatch } = this.props;
        let modifierKey = 'Alt';

        if (window.navigator?.platform) {
            if (window.navigator.platform.indexOf('Mac') !== -1) {
                modifierKey = '⌥';
            }
        }

        return Object.keys(REACTIONS).map(key => {
            /**
             * Sends reaction message.
             *
             * @returns {void}
             */
            function doSendReaction() {
                dispatch(addReactionToBuffer(key));
                sendAnalytics(createReactionMenuEvent(key));
            }

            return (<ReactionButton
                accessibilityLabel = { t(`toolbar.accessibilityLabel.${key}`) }
                icon = { REACTIONS[key].emoji }
                key = { key }
                onClick = { doSendReaction }
                toggled = { false }
                tooltip = { `${t(`toolbar.${key}`)} (${modifierKey} + ${REACTIONS[key].shortcutChar})` } />);
        });
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _raisedHand, t, overflowMenu, _isMobile } = this.props;

        return (
            <div className = { `reactions-menu ${overflowMenu ? 'overflow' : ''}` }>
                <div className = 'reactions-row'>
                    { this._getReactionButtons() }
                </div>
                {_isMobile && (
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
                )}
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
        _isMobile: isMobileBrowser(),
        _raisedHand: hasRaisedHand(localParticipant)
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
    mapDispatchToProps
)(ReactionsMenu));
