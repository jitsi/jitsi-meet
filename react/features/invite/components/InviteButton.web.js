import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Button from '@atlaskit/button';
import DropdownMenu from '@atlaskit/dropdown-menu';

import { translate } from '../../base/i18n';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../base/participants';

import { openDialog } from '../../base/dialog';
import { AddPeopleDialog, InviteDialog } from '.';
import { DialOutDialog } from '../../dial-out';
import { isInviteOptionEnabled, getInviteOptionPosition } from '../functions';

declare var interfaceConfig: Object;

const SHARE_LINK_OPTION = 'invite';
const DIAL_OUT_OPTION = 'dialout';
const ADD_TO_CALL_OPTION = 'addtocall';

/**
 * The button that provides different invite options.
 */
class InviteButton extends Component {
    /**
     * {@code InviteButton}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Indicates if the "Add to call" feature is available.
         */
        _isAddToCallAvailable: PropTypes.bool,

        /**
         * Indicates if the "Dial out" feature is available.
         */
        _isDialOutAvailable: PropTypes.bool,

        /**
         * The function opening the dialog.
         */
        openDialog: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code InviteButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onInviteClick = this._onInviteClick.bind(this);
        this._onInviteOptionSelected = this._onInviteOptionSelected.bind(this);
        this._updateInviteItems = this._updateInviteItems.bind(this);

        this._updateInviteItems(this.props);
    }

    /**
     * Implements React's {@link Component#componentWillReceiveProps()}.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only props which this Component will
     * receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        if (this.props._isDialOutAvailable !== nextProps._isDialOutAvailable
                || this.props._isAddToCallAvailable
                    !== nextProps._isAddToCallAvailable) {
            this._updateInviteItems(nextProps);
        }
    }

    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        const { VERTICAL_FILMSTRIP } = interfaceConfig;

        return (
            <div className = 'filmstrip__invite'>
                <div className = 'invite-button-group'>
                    <Button
                        onClick = { this._onInviteClick }
                        shouldFitContainer = { true }>
                        { t('invite.invitePeople') }
                    </Button>
                    { this.props._isDialOutAvailable
                        || this.props._isAddToCallAvailable
                        ? <DropdownMenu
                            items = { this.state.inviteOptions }
                            onItemActivated = { this._onInviteOptionSelected }
                            position = { VERTICAL_FILMSTRIP
                                ? 'bottom right'
                                : 'top right' }
                            shouldFlip = { true }
                            triggerType = 'button' />
                        : null }
                </div>
            </div>
        );
    }

    /**
     * Handles the click of the invite button.
     *
     * @private
     * @returns {void}
     */
    _onInviteClick() {
        this.props.openDialog(InviteDialog);
    }

    /**
     * Handles selection of the invite options.
     *
     * @param { Object } option - The invite option that has been selected from
     * the dropdown menu.
     * @private
     * @returns {void}
     */
    _onInviteOptionSelected(option) {
        this.state.inviteOptions[0].items.forEach(item => {
            if (item.content === option.item.content) {
                item.action();
            }
        });
    }

    /**
     * Updates the invite items list depending on the availability of the
     * features.
     *
     * @param {Object} props - The read-only properties of the component.
     * @private
     * @returns {void}
     */
    _updateInviteItems(props) {
        const { t } = this.props;

        const inviteItems = [];

        inviteItems.splice(
            getInviteOptionPosition(SHARE_LINK_OPTION),
            0,
            {
                content: t('toolbar.invite'),
                action: () => this.props.openDialog(InviteDialog)
            }
        );

        if (props._isDialOutAvailable) {
            inviteItems.splice(
                getInviteOptionPosition(DIAL_OUT_OPTION),
                0,
                {
                    content: t('dialOut.dialOut'),
                    action: () => this.props.openDialog(DialOutDialog)
                }
            );
        }

        if (props._isAddToCallAvailable) {
            inviteItems.splice(
                getInviteOptionPosition(ADD_TO_CALL_OPTION),
                0,
                {
                    content: interfaceConfig.ADD_PEOPLE_APP_NAME,
                    action: () => this.props.openDialog(AddPeopleDialog)
                }
            );
        }

        const nextState = {
            /**
             * The list of invite options.
             */
            inviteOptions: [
                {
                    items: inviteItems
                }
            ]
        };

        if (this.state) {
            this.setState(nextState);
        } else {
            // eslint-disable-next-line react/no-direct-mutation-state
            this.state = nextState;
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code InviteButton}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _isAddToCallAvailable: boolean,
 *     _isDialOutAvailable: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { conference } = state['features/base/conference'];
    const { enableUserRolesBasedOnToken } = state['features/base/config'];
    const { isGuest } = state['features/base/jwt'];

    return {
        _isAddToCallAvailable:
            !isGuest && isInviteOptionEnabled(ADD_TO_CALL_OPTION),
        _isDialOutAvailable:
            getLocalParticipant(state).role === PARTICIPANT_ROLE.MODERATOR
                && conference && conference.isSIPCallingSupported()
                && isInviteOptionEnabled(DIAL_OUT_OPTION)
                && (!enableUserRolesBasedOnToken || !isGuest)
    };
}

export default translate(connect(_mapStateToProps, { openDialog })(
    InviteButton));
