import React, { Component } from 'react';
import { Immutable } from 'nuclear-js';
import { connect } from 'react-redux';

import MultiSelectAutocomplete
    from '../../base/react/components/web/MultiSelectAutocomplete';
import { Dialog } from '../../base/dialog';
import { searchPeople } from '../functions';

const FORM_ID = 'add-people-form';

class AddPeopleDialog extends Component {
    /**
     * {@code AddPeopleDialog}'s property types.
     *
     * @static
     */
    static propTypes = {
        _peopleSearchUrl: React.PropTypes.string,
        addToConversationError: React.PropTypes.bool,
        addToConversationInProgress: React.PropTypes.bool,
        hasAccess: React.PropTypes.instanceOf(Immutable.Map),
        preselectedUsers: React.PropTypes.array,
        selectedUsers: React.PropTypes.instanceOf(Immutable.List),
        watching: React.PropTypes.instanceOf(Immutable.Map)
    };

//     ConversationAccessDialog.defaultProps = {
//     watching: emptyListState(),
//     hasAccess: emptyListState(),
//     addToConversationInProgress: false,
//     addToConversationError: false,
//     selectedUsers: new Immutable.List(),
//     preselectedUsers: []
// };

    constructor(props) {
        super(props);
        this.multiselect = null;
        this.resourceClient = {
            makeQuery: text => searchPeople(text, this.props._peopleSearchUrl),
            parseResults: response => response.data.query.map(user => {
                return {
                    content: user.fullName,
                    value: user.id
                };
            })
        };

        this._handleSubmit = this._handleSubmit.bind(this);
        this._onSelectionChange = this._onSelectionChange.bind(this);
        this._isAddDisabled = this._isAddDisabled.bind(this);
    }

    componentDidUpdate(prevProps) {
        /**
         * Clear selected items from the multiselect on successful invite
         */
        if (prevProps.addToConversationInProgress
            && !this.props.addToConversationInProgress
            && !this.props.addToConversationError
            && this.multiselect) {
            this.multiselect.clear();
        }
    }

    _handleSubmit(e) {
        if (!this._isAddDisabled()) {
            e.preventDefault();

            // const invite = new OutgoingConversationInvite({ users: this.props.selectedUsers });
        }
    }

    _onSelectionChange(selectedItems) {
        const userIds = selectedItems.map(item => item.value);
    }

    _isAddDisabled() {
        return false;

        // return !this.props.selectedUsers.size
        //     || this.props.addToConversationInProgress;
    }

    getUserInputForm() {
        return (
            <div className = 'add-people-form-wrap'>
                <form
                    id = { FORM_ID }
                    className = 'add-people-form'
                    onSubmit = { this._handleSubmit }>
                    <div className = 'multi-select-wrap'>
                        <MultiSelectAutocomplete
                            placeholder = { 'Placeholder multiselect' }
                            noMatchesFound = { 'No results' }
                            defaultValue = { this.props.preselectedUsers || [] }
                            onSelectionChange = { this._onSelectionChange }
                            isDisabled = { this.props.addToConversationInProgress || false }
                            resourceClient = { this.resourceClient }
                            shouldFitContainer = { true }
                            shouldFocus = { true }
                            ref = { ref => this.multiselect = ref } />
                    </div>
                </form>
            </div>
        );
    }

    render() {
        return (
            <Dialog
                okDisabled = { this._isAddDisabled() }
                okTitleKey = 'addPeople.add'
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'addPeople.title'
                width = 'small'>
                { this.getUserInputForm() }
            </Dialog>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code DialOutNumbersForm}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _dialOutCodes: React.PropTypes.object
 * }}
 */
function _mapStateToProps(state) {
    const { peopleSearchUrl } = state['features/base/config'];

    return {
        _peopleSearchUrl: peopleSearchUrl
    };
}

export default connect(_mapStateToProps, { searchPeople })(AddPeopleDialog);
