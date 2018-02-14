/* global interfaceConfig */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Button from '@atlaskit/button';
import DropdownMenu from '@atlaskit/dropdown-menu';

import { translate } from '../../base/i18n';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../base/participants';

import { openDialog } from '../../base/dialog';
import { AddPeopleDialog } from '.';
import { DialOutDialog } from '../../dial-out';
import { isInviteOptionEnabled } from '../functions';

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
        // HACK ALERT: Normally children should not be controlling their own
        // visibility; parents should control that. However, this component is
        // in a transitionary state while the Invite Dialog is being redone.
        // This hack will go away when the Invite Dialog is back.
        if (!this.state.buttonOption) {
            return null;
        }

        const { VERTICAL_FILMSTRIP } = interfaceConfig;

        return (
            <div className = 'filmstrip__invite'>
                <div className = 'invite-button-group'>
                    <Button
                        // eslint-disable-next-line react/jsx-handler-names
                        onClick = { this.state.buttonOption.action }
                        shouldFitContainer = { true }>
                        { this.state.buttonOption.content }
                    </Button>
                    { this.state.inviteOptions[0].items.length
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
        const { INVITE_OPTIONS = [] } = interfaceConfig;
        const validOptions = INVITE_OPTIONS.filter(option =>
            (option === DIAL_OUT_OPTION && props._isDialOutAvailable)
            || (option === ADD_TO_CALL_OPTION && props._isAddToCallAvailable));

        /* eslint-disable array-callback-return */

        const inviteItems = validOptions.map(option => {
            switch (option) {
            case DIAL_OUT_OPTION:
                return {
                    content: this.props.t('dialOut.dialOut'),
                    action: () => this.props.openDialog(DialOutDialog)
                };
            case ADD_TO_CALL_OPTION:
                return {
                    content: interfaceConfig.ADD_PEOPLE_APP_NAME,
                    action: () => this.props.openDialog(AddPeopleDialog)
                };
            }
        });

        /* eslint-enable array-callback-return */

        const buttonOption = inviteItems[0];
        const dropdownOptions = inviteItems.splice(1, inviteItems.length);

        const nextState = {
            /**
             * The configuration for how the invite button should display and
             * behave on click.
             */
            buttonOption,

            /**
             * The list of invite options in the dropdown.
             */
            inviteOptions: [
                {
                    items: dropdownOptions
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
