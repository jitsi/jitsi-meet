import React, { Component } from 'react';
import { Immutable } from 'nuclear-js';
import { connect } from 'react-redux';
import Avatar from '@atlaskit/avatar';

import { getInviteURL } from '../../base/connection';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import MultiSelectAutocomplete
    from '../../base/react/components/web/MultiSelectAutocomplete';

import { invitePeople, searchPeople } from '../functions';

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
         * The URL pointing to the service allowing for people invite.
         */
        _inviteServiceUrl: React.PropTypes.string,

        /**
         * The url of the conference to invite people to.
         */
        _inviteUrl: React.PropTypes.string,

        /**
         * The JWT token.
         */
        _jwt: React.PropTypes.string,

        /**
         * The URL pointing to the service allowing for people search.
         */
        _peopleSearchUrl: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new {@code AddPeopleDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
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

        this._multiselect = null;
        this._resourceClient = {
            makeQuery: text => searchPeople(
                this.props._peopleSearchUrl, this.props._jwt, text),
            parseResults: response => response.map(user => {
                const avatar = ( // eslint-disable-line no-extra-parens
                    <Avatar
                        size = 'medium'
                        src = { user.avatar } />
                );

                return {
                    content: user.name,
                    value: user.id,
                    elemBefore: avatar,
                    item: user
                };
            })
        };

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
                { this._getUserInputForm() }
            </Dialog>
        );
    }

    /**
     * Renders the input form.
     *
     * @returns {ReactElement}
     * @private
     */
    _getUserInputForm() {
        const { t } = this.props;

        return (
            <div className = 'add-people-form-wrap'>
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

    /**
     * Indicates if the Add button should be disabled.
     *
     * @returns {boolean} - True to indicate that the Add button should
     * be disabled, false otherwise.
     * @private
     */
    _isAddDisabled() {
        return !this.state.inviteItems.length
            || this.state.addToCallInProgress;
    }

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

            invitePeople(
                this.props._inviteServiceUrl,
                this.props._inviteUrl,
                this.props._jwt,
                this.state.inviteItems)
            .then(() => {
                this.setState({
                    addToCallInProgress: false
                });
            })
            .catch(() => {
                this.setState({
                    addToCallInProgress: false,
                    addToCallError: true
                });
            });
        }
    }

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
 *     _peopleSearchUrl: React.PropTypes.string,
 *     _jwt: React.PropTypes.string
 * }}
 */
function _mapStateToProps(state) {
    const { peopleSearchUrl, inviteServiceUrl } = state['features/base/config'];

    return {
        _jwt: state['features/jwt'].jwt,
        _inviteUrl: getInviteURL(state),
        _inviteServiceUrl: inviteServiceUrl,
        _peopleSearchUrl: peopleSearchUrl
    };
}

export default translate(
    connect(_mapStateToProps)(AddPeopleDialog));
