// @flow

import { Component } from 'react';

import { createInviteDialogEvent, sendAnalytics } from '../../../analytics';
import {
    NOTIFICATION_TIMEOUT,
    showNotification
} from '../../../notifications';
import { invite } from '../../actions';
import {
    getInviteResultsForQuery,
    getInviteTypeCounts,
    isAddPeopleEnabled,
    isDialOutEnabled,
    isSipInviteEnabled
} from '../../functions';
import logger from '../../logger';

export type Props = {

    /**
     * Whether or not to show Add People functionality.
     */
    _addPeopleEnabled: boolean,

    /**
     * Whether or not call flows are enabled.
     */
    _callFlowsEnabled: boolean,

    /**
     * The URL for validating if a phone number can be called.
     */
    _dialOutAuthUrl: string,

    /**
     * Whether or not to show Dial Out functionality.
     */
    _dialOutEnabled: boolean,

    /**
     * Whether or not to allow sip invites.
     */
     _sipInviteEnabled: boolean,

    /**
     * The JWT token.
     */
    _jwt: string,

    /**
     * The query types used when searching people.
     */
    _peopleSearchQueryTypes: Array<string>,

    /**
     * The URL pointing to the service allowing for people search.
     */
    _peopleSearchUrl: string,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function
};

export type State = {

    /**
     * Indicating that an error occurred when adding people to the call.
     */
    addToCallError: boolean,

    /**
     * Indicating that we're currently adding the new people to the
     * call.
     */
    addToCallInProgress: boolean,

    /**
     * The list of invite items.
     */
    inviteItems: Array<Object>,
};

/**
 * Implements an abstract dialog to invite people to the conference.
 */
export default class AbstractAddPeopleDialog<P: Props, S: State>
    extends Component<P, S> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this._query = this._query.bind(this);
    }

    /**
     * Invite people and numbers to the conference. The logic works by inviting
     * numbers, people/rooms, sip endpoints and videosipgw in parallel. All invitees are
     * stored in an array. As each invite succeeds, the invitee is removed
     * from the array. After all invites finish, close the modal if there are
     * no invites left to send. If any are left, that means an invite failed
     * and an error state should display.
     *
     * @param {Array<Object>} invitees - The items to be invited.
     * @returns {Promise<Array<Object>>}
     */
    _invite(invitees) {
        const inviteTypeCounts = getInviteTypeCounts(invitees);

        sendAnalytics(createInviteDialogEvent(
            'clicked', 'inviteButton', {
                ...inviteTypeCounts,
                inviteAllowed: this._isAddDisabled()
            }));

        if (this._isAddDisabled()) {
            return Promise.resolve([]);
        }

        this.setState({
            addToCallInProgress: true
        });

        const { _callFlowsEnabled, dispatch } = this.props;

        return dispatch(invite(invitees))
            .then(invitesLeftToSend => {
                this.setState({
                    addToCallInProgress: false
                });

                // If any invites are left that means something failed to send
                // so treat it as an error.
                if (invitesLeftToSend.length) {
                    const erroredInviteTypeCounts
                        = getInviteTypeCounts(invitesLeftToSend);

                    logger.error(`${invitesLeftToSend.length} invites failed`,
                        erroredInviteTypeCounts);

                    sendAnalytics(createInviteDialogEvent(
                        'error', 'invite', {
                            ...erroredInviteTypeCounts
                        }));

                    this.setState({
                        addToCallError: true
                    });
                } else if (!_callFlowsEnabled) {
                    const invitedCount = invitees.length;
                    let notificationProps;

                    if (invitedCount >= 3) {
                        notificationProps = {
                            titleArguments: {
                                name: invitees[0].name,
                                count: invitedCount - 1
                            },
                            titleKey: 'notify.invitedThreePlusMembers'
                        };
                    } else if (invitedCount === 2) {
                        notificationProps = {
                            titleArguments: {
                                first: invitees[0].name,
                                second: invitees[1].name
                            },
                            titleKey: 'notify.invitedTwoMembers'
                        };
                    } else if (invitedCount) {
                        notificationProps = {
                            titleArguments: {
                                name: invitees[0].name
                            },
                            titleKey: 'notify.invitedOneMember'
                        };
                    }

                    if (notificationProps) {
                        dispatch(
                            showNotification(notificationProps, NOTIFICATION_TIMEOUT));
                    }
                }

                return invitesLeftToSend;
            });
    }

    /**
     * Indicates if the Add button should be disabled.
     *
     * @private
     * @returns {boolean} - True to indicate that the Add button should
     * be disabled, false otherwise.
     */
    _isAddDisabled() {
        return !this.state.inviteItems.length
            || this.state.addToCallInProgress;
    }

    _query: (?string) => Promise<Array<Object>>;

    /**
     * Performs a people and phone number search request.
     *
     * @param {string} query - The search text.
     * @private
     * @returns {Promise}
     */
    _query(query = '') {
        const {
            _addPeopleEnabled: addPeopleEnabled,
            _dialOutAuthUrl: dialOutAuthUrl,
            _dialOutEnabled: dialOutEnabled,
            _jwt: jwt,
            _peopleSearchQueryTypes: peopleSearchQueryTypes,
            _peopleSearchUrl: peopleSearchUrl,
            _sipInviteEnabled: sipInviteEnabled
        } = this.props;
        const options = {
            addPeopleEnabled,
            dialOutAuthUrl,
            dialOutEnabled,
            jwt,
            peopleSearchQueryTypes,
            peopleSearchUrl,
            sipInviteEnabled
        };

        return getInviteResultsForQuery(query, options);
    }

}

/**
 * Maps (parts of) the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _addPeopleEnabled: boolean,
 *     _dialOutAuthUrl: string,
 *     _dialOutEnabled: boolean,
 *     _jwt: string,
 *     _peopleSearchQueryTypes: Array<string>,
 *     _peopleSearchUrl: string
 * }}
 */
export function _mapStateToProps(state: Object) {
    const {
        callFlowsEnabled,
        dialOutAuthUrl,
        peopleSearchQueryTypes,
        peopleSearchUrl
    } = state['features/base/config'];

    return {
        _addPeopleEnabled: isAddPeopleEnabled(state),
        _callFlowsEnabled: callFlowsEnabled,
        _dialOutAuthUrl: dialOutAuthUrl,
        _dialOutEnabled: isDialOutEnabled(state),
        _jwt: state['features/base/jwt'].jwt,
        _peopleSearchQueryTypes: peopleSearchQueryTypes,
        _peopleSearchUrl: peopleSearchUrl,
        _sipInviteEnabled: isSipInviteEnabled(state)
    };
}
