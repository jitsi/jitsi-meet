// @flow

import Avatar from '@atlaskit/avatar';
import InlineMessage from '@atlaskit/inline-message';
import React from 'react';
import { connect } from 'react-redux';

import { createInviteDialogEvent, sendAnalytics } from '../../../../analytics';
import { Dialog, hideDialog } from '../../../../base/dialog';
import { translate, translateToHTML } from '../../../../base/i18n';
import { getLocalParticipant } from '../../../../base/participants';
import { MultiSelectAutocomplete } from '../../../../base/react';

import AbstractAddPeopleDialog, {
    type Props as AbstractProps,
    type State,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractAddPeopleDialog';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link AddPeopleDialog}.
 */
type Props = AbstractProps & {

    /**
     * The {@link JitsiMeetConference} which will be used to invite "room"
     * participants through the SIP Jibri (Video SIP gateway).
     */
    _conference: Object,

    /**
     * Whether to show a footer text after the search results as a last element.
     */
    _footerTextEnabled: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<*>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,
};

/**
 * The dialog that allows to invite people to the call.
 */
class AddPeopleDialog extends AbstractAddPeopleDialog<Props, State> {
    _multiselect = null;

    _resourceClient: Object;

    state = {
        addToCallError: false,
        addToCallInProgress: false,
        inviteItems: []
    };

    /**
     * Initializes a new {@code AddPeopleDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onItemSelected = this._onItemSelected.bind(this);
        this._onSelectionChange = this._onSelectionChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._parseQueryResults = this._parseQueryResults.bind(this);
        this._setMultiSelectElement = this._setMultiSelectElement.bind(this);

        this._resourceClient = {
            makeQuery: this._query,
            parseResults: this._parseQueryResults
        };
    }

    /**
     * Sends an analytics event to record the dialog has been shown.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        sendAnalytics(createInviteDialogEvent(
            'invite.dialog.opened', 'dialog'));
    }

    /**
     * React Component method that executes once component is updated.
     *
     * @param {Object} prevProps - The state object before the update.
     * @param {Object} prevState - The state object before the update.
     * @returns {void}
     */
    componentDidUpdate(prevProps, prevState) {
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
     * Sends an analytics event to record the dialog has been closed.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        sendAnalytics(createInviteDialogEvent(
            'invite.dialog.closed', 'dialog'));
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
            _footerTextEnabled,
            t
        } = this.props;
        let isMultiSelectDisabled = this.state.addToCallInProgress || false;
        let placeholder;
        let loadingMessage;
        let noMatches;
        let footerText;

        if (_addPeopleEnabled && _dialOutEnabled) {
            loadingMessage = 'addPeople.loading';
            noMatches = 'addPeople.noResults';
            placeholder = 'addPeople.searchPeopleAndNumbers';
        } else if (_addPeopleEnabled) {
            loadingMessage = 'addPeople.loadingPeople';
            noMatches = 'addPeople.noResults';
            placeholder = 'addPeople.searchPeople';
        } else if (_dialOutEnabled) {
            loadingMessage = 'addPeople.loadingNumber';
            noMatches = 'addPeople.noValidNumbers';
            placeholder = 'addPeople.searchNumbers';
        } else {
            isMultiSelectDisabled = true;
            noMatches = 'addPeople.noResults';
            placeholder = 'addPeople.disabled';
        }

        if (_footerTextEnabled) {
            footerText = {
                content: <div className = 'footer-text-wrap'>
                    <div>
                        <span className = 'footer-telephone-icon'>
                            <i className = 'icon-telephone' />
                        </span>
                    </div>
                    { translateToHTML(t, 'addPeople.footerText') }
                </div>
            };
        }

        return (
            <Dialog
                okDisabled = { this._isAddDisabled() }
                okKey = 'addPeople.add'
                onSubmit = { this._onSubmit }
                titleKey = 'addPeople.title'
                width = 'medium'>
                <div className = 'add-people-form-wrap'>
                    { this._renderErrorMessage() }
                    <MultiSelectAutocomplete
                        footer = { footerText }
                        isDisabled = { isMultiSelectDisabled }
                        loadingMessage = { t(loadingMessage) }
                        noMatchesFound = { t(noMatches) }
                        onItemSelected = { this._onItemSelected }
                        onSelectionChange = { this._onSelectionChange }
                        placeholder = { t(placeholder) }
                        ref = { this._setMultiSelectElement }
                        resourceClient = { this._resourceClient }
                        shouldFitContainer = { true }
                        shouldFocus = { true } />
                </div>
            </Dialog>
        );
    }

    _invite: Array<Object> => Promise<*>

    _isAddDisabled: () => boolean;

    _onItemSelected: (Object) => Object;

    /**
     * Callback invoked when a selection has been made but before it has been
     * set as selected.
     *
     * @param {Object} item - The item that has just been selected.
     * @private
     * @returns {Object} The item to display as selected in the input.
     */
    _onItemSelected(item) {
        if (item.item.type === 'phone') {
            item.content = item.item.number;
        }

        return item;
    }

    _onSelectionChange: (Map<*, *>) => void;

    /**
     * Handles a selection change.
     *
     * @param {Map} selectedItems - The list of selected items.
     * @private
     * @returns {void}
     */
    _onSelectionChange(selectedItems) {
        this.setState({
            inviteItems: selectedItems
        });
    }

    _onSubmit: () => void;

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
            .then(invitesLeftToSend => {
                if (invitesLeftToSend.length) {
                    const unsentInviteIDs
                        = invitesLeftToSend.map(invitee =>
                            invitee.id || invitee.number);
                    const itemsToSelect
                        = inviteItems.filter(({ item }) =>
                            unsentInviteIDs.includes(item.id || item.number));

                    if (this._multiselect) {
                        this._multiselect.setSelectedItems(itemsToSelect);
                    }
                } else {
                    this.props.dispatch(hideDialog());
                }
            });
    }

    _parseQueryResults: (Array<Object>, string) => Array<Object>;

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
    _parseQueryResults(response = []) {
        const { t } = this.props;
        const users = response.filter(item => item.type !== 'phone');
        const userDisplayItems = users.map(user => {
            return {
                content: user.name,
                elemBefore: <Avatar
                    size = 'small'
                    src = { user.avatar } />,
                item: user,
                tag: {
                    elemBefore: <Avatar
                        size = 'xsmall'
                        src = { user.avatar } />
                },
                value: user.id
            };
        });

        const numbers = response.filter(item => item.type === 'phone');
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

        return [
            ...userDisplayItems,
            ...numberDisplayItems
        ];
    }

    _query: (string) => Promise<Array<Object>>;

    /**
     * Renders the error message if the add doesn't succeed.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderErrorMessage() {
        if (!this.state.addToCallError) {
            return null;
        }

        const { t } = this.props;
        const supportString = t('inlineDialogFailure.supportMsg');
        const supportLink = interfaceConfig.SUPPORT_URL;
        const supportLinkContent
            = (
                <span>
                    <span>
                        { supportString.padEnd(supportString.length + 1) }
                    </span>
                    <span>
                        <a
                            href = { supportLink }
                            rel = 'noopener noreferrer'
                            target = '_blank'>
                            { t('inlineDialogFailure.support') }
                        </a>
                    </span>
                    <span>.</span>
                </span>
            );

        return (
            <div className = 'modal-dialog-form-error'>
                <InlineMessage
                    title = { t('addPeople.failedToAdd') }
                    type = 'error'>
                    { supportLinkContent }
                </InlineMessage>
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
            <span className = 'add-telephone-icon'>
                <i className = 'icon-telephone' />
            </span>
        );
    }

    _setMultiSelectElement: (React$ElementRef<*> | null) => mixed;

    /**
     * Sets the instance variable for the multi select component
     * element so it can be accessed directly.
     *
     * @param {Object} element - The DOM element for the component's dialog.
     * @private
     * @returns {void}
     */
    _setMultiSelectElement(element) {
        this._multiselect = element;
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AddPeopleDialog}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _dialOutAuthUrl: string,
 *     _jwt: string,
 *     _peopleSearchQueryTypes: Array<string>,
 *     _peopleSearchUrl: string
 * }}
 */
function _mapStateToProps(state) {
    const {
        enableFeaturesBasedOnToken
    } = state['features/base/config'];
    let footerTextEnabled = false;

    if (enableFeaturesBasedOnToken) {
        const { features = {} } = getLocalParticipant(state);

        if (String(features['outbound-call']) !== 'true') {
            footerTextEnabled = true;
        }
    }

    return {
        ..._abstractMapStateToProps(state),
        _footerTextEnabled: footerTextEnabled
    };
}

export default translate(connect(_mapStateToProps)(AddPeopleDialog));
