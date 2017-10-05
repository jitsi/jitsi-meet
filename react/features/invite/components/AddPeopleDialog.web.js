// @flow

import Avatar from '@atlaskit/avatar';
import InlineMessage from '@atlaskit/inline-message';
import { Immutable } from 'nuclear-js';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getInviteURL } from '../../base/connection';
import { Dialog, hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { MultiSelectAutocomplete } from '../../base/react';

import { invitePeople, inviteRooms, searchPeople } from '../functions';

declare var interfaceConfig: Object;

/**
 * The dialog that allows to invite people to the call.
 */
class AddPeopleDialog extends Component {
    /**
     * {@code AddPeopleDialog}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The {@link JitsiMeetConference} which will be used to invite "room"
         * participants through the SIP Jibri (Video SIP gateway).
         */
        _conference: PropTypes.object,

        /**
         * The URL pointing to the service allowing for people invite.
         */
        _inviteServiceUrl: PropTypes.string,

        /**
         * The url of the conference to invite people to.
         */
        _inviteUrl: PropTypes.string,

        /**
         * The JWT token.
         */
        _jwt: PropTypes.string,

        /**
         * The query types used when searching people.
         */
        _peopleSearchQueryTypes: PropTypes.arrayOf(PropTypes.string),

        /**
         * The URL pointing to the service allowing for people search.
         */
        _peopleSearchUrl: PropTypes.string,

        /**
         * The function closing the dialog.
         */
        hideDialog: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    _multiselect = null;

    _resourceClient = {
        makeQuery: text => {
            const {
                _jwt,
                _peopleSearchQueryTypes,
                _peopleSearchUrl
            } = this.props; // eslint-disable-line no-invalid-this

            return (
                searchPeople(
                    _peopleSearchUrl,
                    _jwt,
                    text,
                    _peopleSearchQueryTypes));
        },

        parseResults: response => response.map(user => {
            return {
                content: user.name,
                elemBefore: <Avatar
                    size = 'medium'
                    src = { user.avatar } />,
                item: user,
                value: user.id
            };
        })
    };

    state = {
        /**
         * Indicating that an error occurred when adding people to the call.
         */
        addToCallError: false,

        /**
         * Indicating that we're currently adding the new people to the
         * call.
         */
        addToCallInProgress: false,

        /**
         * The list of invite items.
         */
        inviteItems: new Immutable.List()
    };

    /**
     * Initializes a new {@code AddPeopleDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._isAddDisabled = this._isAddDisabled.bind(this);
        this._onSelectionChange = this._onSelectionChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._setMultiSelectElement = this._setMultiSelectElement.bind(this);
    }

    /**
     * React Component method that executes once component is updated.
     *
     * @param {Object} prevState - The state object before the update.
     * @returns {void}
     */
    componentDidUpdate(prevState) {
        /**
         * Clears selected items from the multi select component on successful
         * invite.
         */
        if (prevState.addToCallError
                && !this.state.addToCallInProgress
                && !this.state.addToCallError
                && this._multiselect) {
            this._multiselect.clear();
        }
    }

    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okDisabled = { this._isAddDisabled() }
                okTitleKey = 'addPeople.add'
                onSubmit = { this._onSubmit }
                titleKey = 'addPeople.title'
                width = 'small'>
                { this._renderUserInputForm() }
            </Dialog>
        );
    }

    _isAddDisabled: () => boolean;

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

    _onSelectionChange: (Map<*, *>) => void;

    /**
     * Handles a selection change.
     *
     * @param {Map} selectedItems - The list of selected items.
     * @private
     * @returns {void}
     */
    _onSelectionChange(selectedItems) {
        const selectedIds = selectedItems.map(o => o.item);

        this.setState({
            inviteItems: selectedIds
        });
    }

    _onSubmit: () => void;

    /**
     * Handles the submit button action.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        if (!this._isAddDisabled()) {
            this.setState({
                addToCallInProgress: true
            });

            this.props._conference
                && inviteRooms(
                    this.props._conference,
                    this.state.inviteItems.filter(
                        i => i.type === 'videosipgw'));

            invitePeople(
                this.props._inviteServiceUrl,
                this.props._inviteUrl,
                this.props._jwt,
                this.state.inviteItems.filter(i => i.type === 'user'))
            .then(
                /* onFulfilled */ () => {
                    this.setState({
                        addToCallInProgress: false
                    });

                    this.props.hideDialog();
                },
                /* onRejected */ () => {
                    this.setState({
                        addToCallInProgress: false,
                        addToCallError: true
                    });
                });
        }
    }

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
            = ( // eslint-disable-line no-extra-parens
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
     * Renders the input form.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderUserInputForm() {
        const { t } = this.props;

        return (
            <div className = 'add-people-form-wrap'>
                { this._renderErrorMessage() }
                <MultiSelectAutocomplete
                    isDisabled
                        = { this.state.addToCallInProgress || false }
                    noMatchesFound = { t('addPeople.noResults') }
                    onSelectionChange = { this._onSelectionChange }
                    placeholder = { t('addPeople.searchPlaceholder') }
                    ref = { this._setMultiSelectElement }
                    resourceClient = { this._resourceClient }
                    shouldFitContainer = { true }
                    shouldFocus = { true } />
            </div>
        );
    }

    _setMultiSelectElement: (Object) => void;

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
 *     _jwt: string,
 *     _peopleSearchUrl: string
 * }}
 */
function _mapStateToProps(state) {
    const { conference } = state['features/base/conference'];
    const {
        inviteServiceUrl,
        peopleSearchQueryTypes,
        peopleSearchUrl
    } = state['features/base/config'];

    return {
        _conference: conference,
        _inviteServiceUrl: inviteServiceUrl,
        _inviteUrl: getInviteURL(state),
        _jwt: state['features/base/jwt'].jwt,
        _peopleSearchQueryTypes: peopleSearchQueryTypes,
        _peopleSearchUrl: peopleSearchUrl
    };
}

export default translate(connect(_mapStateToProps, { hideDialog })(
    AddPeopleDialog));
