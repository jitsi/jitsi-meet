import { Component } from 'react';

import { createInviteDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import { getMeetingRegion } from '../../../base/config/functions.any';
import { showErrorNotification, showNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';
import { INotificationProps } from '../../../notifications/types';
import { invite } from '../../actions.any';
import { INVITE_TYPES } from '../../constants';
import {
    getInviteResultsForQuery,
    getInviteTypeCounts,
    isAddPeopleEnabled,
    isDialOutEnabled,
    isSipInviteEnabled
} from '../../functions';
import logger from '../../logger';
import { IInviteSelectItem, IInvitee } from '../../types';

export interface IProps {

    /**
     * Whether or not to show Add People functionality.
     */
    _addPeopleEnabled: boolean;

    /**
     * The app id of the user.
     */
    _appId: string;

    /**
     * Whether or not call flows are enabled.
     */
    _callFlowsEnabled: boolean;

    /**
     * The URL for validating if a phone number can be called.
     */
    _dialOutAuthUrl: string;

    /**
     * Whether or not to show Dial Out functionality.
     */
    _dialOutEnabled: boolean;

    /**
     * The URL for validating if an outbound destination is allowed.
     */
    _dialOutRegionUrl: string;

    /**
     * The JWT token.
     */
    _jwt: string;

    /**
     * The query types used when searching people.
     */
    _peopleSearchQueryTypes: Array<string>;

    /**
     * The localStorage key holding the alternative token for people directory.
     */
    _peopleSearchTokenLocation: string;

    /**
     * The URL pointing to the service allowing for people search.
     */
    _peopleSearchUrl: string;

    /**
     * The region where we connected to.
     */
    _region: string;

    /**
     * Whether or not to allow sip invites.
     */
    _sipInviteEnabled: boolean;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];
}

export interface IState {

    /**
     * Indicating that an error occurred when adding people to the call.
     */
    addToCallError: boolean;

    /**
     * Indicating that we're currently adding the new people to the
     * call.
     */
    addToCallInProgress: boolean;

    /**
     * The list of invite items.
     */
    inviteItems: Array<IInvitee | IInviteSelectItem>;
}

/**
 * Implements an abstract dialog to invite people to the conference.
 */
export default class AbstractAddPeopleDialog<P extends IProps, S extends IState> extends Component<P, S> {
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
     * Retrieves the notification display name for the invitee.
     *
     * @param {IInvitee} invitee - The invitee object.
     * @returns {string}
     */
    _getDisplayName(invitee: IInvitee) {
        if (invitee.type === INVITE_TYPES.PHONE) {
            return invitee.number;
        }

        if (invitee.type === INVITE_TYPES.SIP) {
            return invitee.address;
        }

        return invitee.name ?? '';
    }

    /**
     * Invite people and numbers to the conference. The logic works by inviting
     * numbers, people/rooms, sip endpoints and videosipgw in parallel. All invitees are
     * stored in an array. As each invite succeeds, the invitee is removed
     * from the array. After all invites finish, close the modal if there are
     * no invites left to send. If any are left, that means an invite failed
     * and an error state should display.
     *
     * @param {Array<IInvitee>} invitees - The items to be invited.
     * @returns {Promise<Array<any>>}
     */
    _invite(invitees: IInvitee[]) {
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
            .then((invitesLeftToSend: IInvitee[]) => {
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
                    dispatch(showErrorNotification({
                        titleKey: 'addPeople.failedToAdd'
                    }));
                } else if (!_callFlowsEnabled) {
                    const invitedCount = invitees.length;
                    let notificationProps: INotificationProps | undefined;

                    if (invitedCount >= 3) {
                        notificationProps = {
                            titleArguments: {
                                name: this._getDisplayName(invitees[0]),
                                count: `${invitedCount - 1}`
                            },
                            titleKey: 'notify.invitedThreePlusMembers'
                        };
                    } else if (invitedCount === 2) {
                        notificationProps = {
                            titleArguments: {
                                first: this._getDisplayName(invitees[0]),
                                second: this._getDisplayName(invitees[1])
                            },
                            titleKey: 'notify.invitedTwoMembers'
                        };
                    } else if (invitedCount) {
                        notificationProps = {
                            titleArguments: {
                                name: this._getDisplayName(invitees[0])
                            },
                            titleKey: 'notify.invitedOneMember'
                        };
                    }

                    if (notificationProps) {
                        dispatch(
                            showNotification(notificationProps, NOTIFICATION_TIMEOUT_TYPE.SHORT));
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
            _appId: appId,
            _dialOutAuthUrl: dialOutAuthUrl,
            _dialOutRegionUrl: dialOutRegionUrl,
            _dialOutEnabled: dialOutEnabled,
            _jwt: jwt,
            _peopleSearchQueryTypes: peopleSearchQueryTypes,
            _peopleSearchUrl: peopleSearchUrl,
            _peopleSearchTokenLocation: peopleSearchTokenLocation,
            _region: region,
            _sipInviteEnabled: sipInviteEnabled
        } = this.props;
        const options = {
            addPeopleEnabled,
            appId,
            dialOutAuthUrl,
            dialOutEnabled,
            dialOutRegionUrl,
            jwt,
            peopleSearchQueryTypes,
            peopleSearchUrl,
            peopleSearchTokenLocation,
            region,
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
export function _mapStateToProps(state: IReduxState) {
    const {
        callFlowsEnabled,
        dialOutAuthUrl,
        dialOutRegionUrl,
        peopleSearchQueryTypes,
        peopleSearchUrl,
        peopleSearchTokenLocation
    } = state['features/base/config'];

    return {
        _addPeopleEnabled: isAddPeopleEnabled(state),
        _appId: state['features/base/jwt']?.tenant ?? '',
        _callFlowsEnabled: callFlowsEnabled ?? false,
        _dialOutAuthUrl: dialOutAuthUrl ?? '',
        _dialOutRegionUrl: dialOutRegionUrl ?? '',
        _dialOutEnabled: isDialOutEnabled(state),
        _jwt: state['features/base/jwt'].jwt ?? '',
        _peopleSearchQueryTypes: peopleSearchQueryTypes ?? [],
        _peopleSearchUrl: peopleSearchUrl ?? '',
        _peopleSearchTokenLocation: peopleSearchTokenLocation ?? '',
        _region: getMeetingRegion(state),
        _sipInviteEnabled: isSipInviteEnabled(state)
    };
}
