import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../../app/types';
import Avatar from '../../../../base/avatar/components/Avatar';
import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconPhoneRinging } from '../../../../base/icons/svg';
import MultiSelectAutocomplete from '../../../../base/react/components/web/MultiSelectAutocomplete';
import Button from '../../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../../base/ui/constants.any';
import { isVpaasMeeting } from '../../../../jaas/functions';
import { hideAddPeopleDialog } from '../../../actions.web';
import { INVITE_TYPES } from '../../../constants';
import { IInviteSelectItem, IInvitee } from '../../../types';
import AbstractAddPeopleDialog, {
    IProps as AbstractProps,
    IState,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractAddPeopleDialog';

const styles = (theme: Theme) => {
    return {
        formWrap: {
            marginTop: theme.spacing(2)
        },
        inviteButtons: {
            display: 'flex',
            justifyContent: 'end',
            marginTop: theme.spacing(2),
            '& .invite-button': {
                marginLeft: theme.spacing(2)
            }
        }
    };
};


interface IProps extends AbstractProps {

    /**
     * The {@link JitsiMeetConference} which will be used to invite "room" participants.
     */
    _conference?: Object;

    /**
     * Whether the meeting belongs to JaaS user.
     */
    _isVpaas?: boolean;

    /**
     * Css classes.
     */
    classes: any;

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Invoked to obtain translated strings.
     */
    t: Function;
}

/**
 * Form that enables inviting others to the call.
 */
class InviteContactsForm extends AbstractAddPeopleDialog<IProps, IState> {
    _multiselect: MultiSelectAutocomplete | null = null;

    _resourceClient: {
        makeQuery: (query: string) => Promise<Array<any>>;
        parseResults: Function;
    };

    _translations: {
        [key: string]: string;
        _addPeopleEnabled: string;
        _dialOutEnabled: string;
        _sipInviteEnabled: string;
    };

    state = {
        addToCallError: false,
        addToCallInProgress: false,
        inviteItems: [] as IInviteSelectItem[]
    };

    /**
     * Initializes a new {@code AddPeopleDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClearItems = this._onClearItems.bind(this);
        this._onClearItemsKeyPress = this._onClearItemsKeyPress.bind(this);
        this._onItemSelected = this._onItemSelected.bind(this);
        this._onSelectionChange = this._onSelectionChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onSubmitKeyPress = this._onSubmitKeyPress.bind(this);
        this._parseQueryResults = this._parseQueryResults.bind(this);
        this._setMultiSelectElement = this._setMultiSelectElement.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);

        this._resourceClient = {
            makeQuery: this._query,
            parseResults: this._parseQueryResults
        };


        const { t } = props;

        this._translations = {
            _dialOutEnabled: t('addPeople.phoneNumbers'),
            _addPeopleEnabled: t('addPeople.contacts'),
            _sipInviteEnabled: t('addPeople.sipAddresses')
        };

    }

    /**
     * React Component method that executes once component is updated.
     *
     * @param {Props} prevProps - The props object before the update.
     * @param {State} prevState - The state object before the update.
     * @returns {void}
     */
    componentDidUpdate(prevProps: IProps, prevState: IState) {
        /**
         * Clears selected items from the multi select component on successful
         * invite.
         */
        if (prevState.addToCallError
                && !this.state.addToCallInProgress
                && !this.state.addToCallError
                && this._multiselect) {
            this._multiselect.setSelectedItems([]);
        }
    }

    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        const {
            _addPeopleEnabled,
            _dialOutEnabled,
            _isVpaas,
            _sipInviteEnabled,
            t
        } = this.props;
        let isMultiSelectDisabled = this.state.addToCallInProgress;
        const loadingMessage = 'addPeople.searching';
        const noMatches = 'addPeople.noResults';

        const features: { [key: string]: boolean; } = {
            _dialOutEnabled,
            _addPeopleEnabled,
            _sipInviteEnabled
        };

        const computedPlaceholder = Object.keys(features)
            .filter(v => Boolean(features[v]))
            .map(v => this._translations[v])
            .join(', ');

        const placeholder = computedPlaceholder ? `${t('dialog.add')} ${computedPlaceholder}` : t('addPeople.disabled');

        if (!computedPlaceholder) {
            isMultiSelectDisabled = true;
        }

        return (
            <div
                className = { this.props.classes.formWrap }
                onKeyDown = { this._onKeyDown }>
                <MultiSelectAutocomplete
                    id = 'invite-contacts-input'
                    isDisabled = { isMultiSelectDisabled }
                    loadingMessage = { t(loadingMessage) }
                    noMatchesFound = { t(noMatches) }
                    onItemSelected = { this._onItemSelected }
                    onSelectionChange = { this._onSelectionChange }
                    placeholder = { placeholder }
                    ref = { this._setMultiSelectElement }
                    resourceClient = { this._resourceClient }
                    shouldFitContainer = { true }
                    shouldFocus = { true }
                    showSupportLink = { !_isVpaas } />
                { this._renderFormActions() }
            </div>
        );
    }

    _isAddDisabled: () => boolean;

    /**
     * Callback invoked when a selection has been made but before it has been
     * set as selected.
     *
     * @param {IInviteSelectItem} item - The item that has just been selected.
     * @private
     * @returns {Object} The item to display as selected in the input.
     */
    _onItemSelected(item: IInviteSelectItem) {
        if (item.item.type === INVITE_TYPES.PHONE) {
            item.content = item.item.number;
        }

        return item;
    }

    /**
     * Handles a selection change.
     *
     * @param {Array<IInviteSelectItem>} selectedItems - The list of selected items.
     * @private
     * @returns {void}
     */
    _onSelectionChange(selectedItems: IInviteSelectItem[]) {
        this.setState({
            inviteItems: selectedItems
        });
    }


    /**
     * Submits the selection for inviting.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        const { inviteItems } = this.state;
        const invitees = inviteItems.map(({ item }) => item);

        this._invite(invitees)
            .then((invitesLeftToSend: IInvitee[]) => {
                if (invitesLeftToSend.length) {
                    const unsentInviteIDs
                        = invitesLeftToSend.map(invitee =>
                            invitee.id || invitee.user_id || invitee.number);
                    const itemsToSelect = inviteItems.filter(({ item }) =>
                        unsentInviteIDs.includes(item.id || item.user_id || item.number));

                    if (this._multiselect) {
                        this._multiselect.setSelectedItems(itemsToSelect);
                    }
                }
            })
            .finally(() => this.props.dispatch(hideAddPeopleDialog()));
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {KeyboardEvent} e - The key event to handle.
     *
     * @returns {void}
     */
    _onSubmitKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onSubmit();
        }
    }

    /**
     * Handles 'Enter' key in the form to trigger the invite.
     *
     * @param {KeyboardEvent} event - The key event.
     * @returns {void}
     */
    _onKeyDown(event: React.KeyboardEvent) {
        const { inviteItems } = this.state;

        if (event.key === 'Enter') {
            event.preventDefault();
            if (!this._isAddDisabled() && inviteItems.length) {
                this._onSubmit();
            }
        }
    }

    /**
     * Returns the avatar component for a user.
     *
     * @param {any} user - The user.
     * @param {string} className - The CSS class for the avatar component.
     * @private
     * @returns {ReactElement}
     */
    _getAvatar(user: any, className = 'avatar-small') {
        return (
            <Avatar
                className = { className }
                size = { 32 }
                status = { user.status }
                url = { user.avatar } />
        );
    }

    /**
     * Processes results from requesting available numbers and people by munging
     * each result into a format {@code MultiSelectAutocomplete} can use for
     * display.
     *
     * @param {Array} response - The response object from the server for the
     * query.
     * @private
     * @returns {Object[]} Configuration objects for items to display in the
     * search autocomplete.
     */
    _parseQueryResults(response: IInvitee[] = []) {
        const { t, _dialOutEnabled } = this.props;

        const userTypes = [ INVITE_TYPES.USER, INVITE_TYPES.VIDEO_ROOM, INVITE_TYPES.ROOM ];
        const users = response.filter(item => userTypes.includes(item.type));
        const userDisplayItems: any = [];

        for (const user of users) {
            const { name, phone } = user;
            const tagAvatar = this._getAvatar(user, 'avatar-xsmall');
            const elemAvatar = this._getAvatar(user);

            userDisplayItems.push({
                content: name,
                elemBefore: elemAvatar,
                item: user,
                tag: {
                    elemBefore: tagAvatar
                },
                value: user.id || user.user_id
            });

            if (phone && _dialOutEnabled) {
                userDisplayItems.push({
                    filterValues: [ name, phone ],
                    content: `${phone} (${name})`,
                    elemBefore: elemAvatar,
                    item: {
                        type: INVITE_TYPES.PHONE,
                        number: phone
                    },
                    tag: {
                        elemBefore: tagAvatar
                    },
                    value: phone
                });
            }
        }

        const numbers = response.filter(item => item.type === INVITE_TYPES.PHONE);
        const telephoneIcon = this._renderTelephoneIcon();

        const numberDisplayItems = numbers.map(number => {
            const numberNotAllowedMessage
                = number.allowed ? '' : t('addPeople.countryNotSupported');
            const countryCodeReminder = number.showCountryCodeReminder
                ? t('addPeople.countryReminder') : '';
            const description
                = `${numberNotAllowedMessage} ${countryCodeReminder}`.trim();

            return {
                filterValues: [
                    number.originalEntry,
                    number.number
                ],
                content: t('addPeople.telephone', { number: number.number }),
                description,
                isDisabled: !number.allowed,
                elemBefore: telephoneIcon,
                item: number,
                tag: {
                    elemBefore: telephoneIcon
                },
                value: number.number
            };
        });


        const sipAddresses = response.filter(item => item.type === INVITE_TYPES.SIP);

        const sipDisplayItems = sipAddresses.map(sip => {
            return {
                filterValues: [
                    sip.address
                ],
                content: sip.address,
                description: '',
                item: sip,
                value: sip.address
            };
        });

        return [
            ...userDisplayItems,
            ...numberDisplayItems,
            ...sipDisplayItems
        ];
    }

    /**
     * Clears the selected items from state and form.
     *
     * @returns {void}
     */
    _onClearItems() {
        if (this._multiselect) {
            this._multiselect.setSelectedItems([]);
        }
        this.setState({ inviteItems: [] });
    }

    /**
     * Clears the selected items from state and form.
     *
     * @param {KeyboardEvent} e - The key event to handle.
     *
     * @returns {void}
     */
    _onClearItemsKeyPress(e: KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onClearItems();
        }
    }

    /**
     * Renders the add/cancel actions for the form.
     *
     * @returns {ReactElement|null}
     */
    _renderFormActions() {
        const { inviteItems } = this.state;
        const { t, classes } = this.props;

        if (!inviteItems.length) {
            return null;
        }

        return (
            <div className = { classes.inviteButtons }>
                <Button
                    aria-label = { t('dialog.Cancel') }
                    className = 'invite-button'
                    label = { t('dialog.Cancel') }
                    onClick = { this._onClearItems }
                    onKeyPress = { this._onClearItemsKeyPress }
                    role = 'button'
                    type = { BUTTON_TYPES.SECONDARY } />
                <Button
                    aria-label = { t('addPeople.add') }
                    className = 'invite-button'
                    disabled = { this._isAddDisabled() }
                    label = { t('addPeople.add') }
                    onClick = { this._onSubmit }
                    onKeyPress = { this._onSubmitKeyPress }
                    role = 'button' />
            </div>
        );
    }

    /**
     * Renders a telephone icon.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderTelephoneIcon() {
        return (
            <Icon src = { IconPhoneRinging } />
        );
    }

    /**
     * Sets the instance variable for the multi select component
     * element so it can be accessed directly.
     *
     * @param {MultiSelectAutocomplete} element - The DOM element for the component's dialog.
     * @private
     * @returns {void}
     */
    _setMultiSelectElement(element: MultiSelectAutocomplete) {
        this._multiselect = element;
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AddPeopleDialog}'s props.
 *
 * @param {IReduxState} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        ..._abstractMapStateToProps(state),
        _isVpaas: isVpaasMeeting(state)
    };
}

export default translate(connect(_mapStateToProps)(withStyles(styles)(InviteContactsForm)));
