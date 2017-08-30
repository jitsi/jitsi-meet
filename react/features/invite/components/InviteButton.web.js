import React, { Component } from 'react';
import { connect } from 'react-redux';
import Button from '@atlaskit/button';
import ButtonGroup from '@atlaskit/button-group';
import DropdownMenu from '@atlaskit/dropdown-menu';

import { translate } from '../../base/i18n';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../base/participants';

import { openDialog } from '../../base/dialog';
import { AddPeopleDialog, InviteDialog } from '.';
import { DialOutDialog } from '../../dial-out';

declare var interfaceConfig: Object;

const DIAL_OUT_NAME = 'dialout';

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
        _isAddToCallAvailable: React.PropTypes.bool,

        /**
         * Indicates if the "Dial out" feature is available.
         */
        _isDialOutAvailable: React.PropTypes.bool,

        /**
         * The function closing the dialog.
         */
        openDialog: React.PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
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

        return (
            <div className = 'filmstrip__invite'>
                <ButtonGroup>
                    <Button
                        onClick = { this._onInviteClick }>
                        { t('invite.invitePeople') }
                    </Button>
                    <DropdownMenu
                        items = { this.state.inviteOptions }
                        onItemActivated = { this._onInviteOptionSelected }
                        position = 'bottom right'
                        shouldFlip = { true }
                        triggerType = 'button' />
                </ButtonGroup>
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
        this.state.inviteOptions[0].items.map(item => {
            if (item.content === option.item.content) {
                item.action();

                return true;
            }

            return false;
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

        const inviteItems = [
            {
                content: t('invite.shareTheLink'),
                action: () => this.props.openDialog(InviteDialog)
            }
        ];

        if (props._isDialOutAvailable) {
            inviteItems.splice(0, 0, {
                content: t('dialOut.dialOut'),
                action: () => this.props.openDialog(DialOutDialog)
            });
        }

        if (props._isAddToCallAvailable) {
            inviteItems.splice(0, 0, {
                content: interfaceConfig.APP_PEOPLE_APP_NAME,
                action: () => this.props.openDialog(AddPeopleDialog)
            });
        }

        this.state = {
            /**
             * The list of invite options.
             */
            inviteOptions: [
                {
                    items: inviteItems
                }
            ]
        };
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
    const { enableUserRolesBasedOnToken } = state['features/base/config'];

    const { conference } = state['features/base/conference'];

    const isDialOutButtonEnabled
        = interfaceConfig.TOOLBAR_BUTTONS.indexOf(DIAL_OUT_NAME) !== -1
        || interfaceConfig.MAIN_TOOLBAR_BUTTONS.indexOf(DIAL_OUT_NAME) !== -1;

    const { isGuest } = state['features/jwt'];

    return {
        _isAddToCallAvailable: !isGuest,
        _isDialOutAvailable:
            getLocalParticipant(state).role === PARTICIPANT_ROLE.MODERATOR
            && conference && conference.isSIPCallingSupported()
            && isDialOutButtonEnabled
            && (!enableUserRolesBasedOnToken || !isGuest)
    };
}

export default translate(connect(
    _mapStateToProps, { openDialog })(InviteButton));
