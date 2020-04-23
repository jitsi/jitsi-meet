// @flow

import _ from 'lodash';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { ColorSchemeRegistry } from '../../../../base/color-scheme';
import { AlertDialog, openDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import {
    Icon,
    IconCancelSelection,
    IconCheck,
    IconClose,
    IconPhone,
    IconSearch,
    IconShare
} from '../../../../base/icons';
import { JitsiModal, setActiveModalId } from '../../../../base/modal';
import {
    AvatarListItem,
    type Item
} from '../../../../base/react';
import { connect } from '../../../../base/redux';
import { beginShareRoom } from '../../../../share-room';

import { ADD_PEOPLE_DIALOG_VIEW_ID } from '../../../constants';

import AbstractAddPeopleDialog, {
    type Props as AbstractProps,
    type State as AbstractState,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractAddPeopleDialog';

import styles, {
    AVATAR_SIZE,
    DARK_GREY
} from './styles';

type Props = AbstractProps & {

    /**
     * The color schemed style of the Header.
     */
    _headerStyles: Object,

    /**
     * True if the invite dialog should be open, false otherwise.
     */
    _isVisible: boolean,

    /**
     * Function used to translate i18n labels.
     */
    t: Function
};

type State = AbstractState & {

    /**
     * Boolean to show if an extra padding needs to be added to the bottom bar.
     */
    bottomPadding: boolean,

    /**
     * State variable to keep track of the search field value.
     */
    fieldValue: string,

    /**
     * True if a search is in progress, false otherwise.
     */
    searchInprogress: boolean,

    /**
     * An array of items that are selectable on this dialog. This is usually
     * populated by an async search.
     */
    selectableItems: Array<Object>
};

/**
 * Implements a special dialog to invite people from a directory service.
 */
class AddPeopleDialog extends AbstractAddPeopleDialog<Props, State> {
    /**
     * Default state object to reset the state to when needed.
     */
    defaultState = {
        addToCallError: false,
        addToCallInProgress: false,
        bottomPadding: false,
        fieldValue: '',
        inviteItems: [],
        searchInprogress: false,
        selectableItems: []
    };

    /**
     * Ref of the search field.
     */
    inputFieldRef: ?TextInput;

    /**
     * TimeoutID to delay the search for the time the user is probably typing.
     */
    searchTimeout: TimeoutID;

    /**
     * Contrustor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = this.defaultState;

        this._keyExtractor = this._keyExtractor.bind(this);
        this._renderInvitedItem = this._renderInvitedItem.bind(this);
        this._renderItem = this._renderItem.bind(this);
        this._renderSeparator = this._renderSeparator.bind(this);
        this._onClearField = this._onClearField.bind(this);
        this._onInvite = this._onInvite.bind(this);
        this._onPressItem = this._onPressItem.bind(this);
        this._onShareMeeting = this._onShareMeeting.bind(this);
        this._onTypeQuery = this._onTypeQuery.bind(this);
        this._renderShareMeetingButton = this._renderShareMeetingButton.bind(this);
        this._setFieldRef = this._setFieldRef.bind(this);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        if (prevProps._isVisible !== this.props._isVisible) {
            // Clear state
            this._clearState();
        }
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _addPeopleEnabled,
            _dialOutEnabled
        } = this.props;
        const { inviteItems, selectableItems } = this.state;

        let placeholderKey = 'searchPlaceholder';

        if (!_addPeopleEnabled) {
            placeholderKey = 'searchCallOnlyPlaceholder';
        } else if (!_dialOutEnabled) {
            placeholderKey = 'searchPeopleOnlyPlaceholder';
        }

        return (
            <JitsiModal
                footerComponent = { this._renderShareMeetingButton }
                headerProps = {{
                    forwardDisabled: this._isAddDisabled(),
                    forwardLabelKey: 'inviteDialog.send',
                    headerLabelKey: 'inviteDialog.header',
                    onPressForward: this._onInvite
                }}
                modalId = { ADD_PEOPLE_DIALOG_VIEW_ID }>
                <View
                    style = { styles.searchFieldWrapper }>
                    <View style = { styles.searchIconWrapper }>
                        { this.state.searchInprogress
                            ? <ActivityIndicator
                                color = { DARK_GREY }
                                size = 'small' />
                            : <Icon
                                src = { IconSearch }
                                style = { styles.searchIcon } />}
                    </View>
                    <TextInput
                        autoCorrect = { false }
                        autoFocus = { false }
                        onBlur = { this._onFocused(false) }
                        onChangeText = { this._onTypeQuery }
                        onFocus = { this._onFocused(true) }
                        placeholder = {
                            this.props.t(`inviteDialog.${placeholderKey}`)
                        }
                        ref = { this._setFieldRef }
                        style = { styles.searchField }
                        value = { this.state.fieldValue } />
                    { this._renderClearButton() }
                </View>
                { Boolean(inviteItems.length) && <View style = { styles.invitedList }>
                    <FlatList
                        data = { inviteItems }
                        horizontal = { true }
                        keyExtractor = { this._keyExtractor }
                        keyboardShouldPersistTaps = 'always'
                        renderItem = { this._renderInvitedItem } />
                </View> }
                <View style = { styles.resultList }>
                    <FlatList
                        ItemSeparatorComponent = { this._renderSeparator }
                        data = { selectableItems }
                        extraData = { inviteItems }
                        keyExtractor = { this._keyExtractor }
                        keyboardShouldPersistTaps = 'always'
                        renderItem = { this._renderItem } />
                </View>
            </JitsiModal>
        );
    }

    /**
     * Clears the dialog content.
     *
     * @returns {void}
     */
    _clearState() {
        this.setState(this.defaultState);
    }

    /**
     * Returns an object capable of being rendered by an {@code AvatarListItem}.
     *
     * @param {Object} flatListItem - An item of the data array of the {@code FlatList}.
     * @returns {?Object}
     */
    _getRenderableItem(flatListItem) {
        const { item } = flatListItem;

        switch (item.type) {
        case 'phone':
            return {
                avatar: IconPhone,
                key: item.number,
                title: item.number
            };
        case 'user':
            return {
                avatar: item.avatar,
                key: item.id || item.user_id,
                title: item.name
            };
        default:
            return null;
        }
    }

    _invite: Array<Object> => Promise<Array<Object>>

    _isAddDisabled: () => boolean;

    _keyExtractor: Object => string

    /**
     * Key extractor for the flatlist.
     *
     * @param {Object} item - The flatlist item that we need the key to be
     * generated for.
     * @returns {string}
     */
    _keyExtractor(item) {
        return item.type === 'user' ? item.id || item.user_id : item.number;
    }

    _onClearField: () => void

    /**
     * Callback to clear the text field.
     *
     * @returns {void}
     */
    _onClearField() {
        this.setState({
            fieldValue: ''
        });

        // Clear search results
        this._onTypeQuery('');
    }

    _onFocused: boolean => Function;

    /**
     * Constructs a callback to be used to update the padding of the field if necessary.
     *
     * @param {boolean} focused - True of the field is focused.
     * @returns {Function}
     */
    _onFocused(focused) {
        return () => {
            Platform.OS === 'android' && this.setState({
                bottomPadding: focused
            });
        };
    }

    _onInvite: () => void

    /**
     * Invites the selected entries.
     *
     * @returns {void}
     */
    _onInvite() {
        this._invite(this.state.inviteItems)
            .then(invitesLeftToSend => {
                if (invitesLeftToSend.length) {
                    this.setState({
                        inviteItems: invitesLeftToSend
                    });
                    this._showFailedInviteAlert();
                } else {
                    this.props.dispatch(setActiveModalId());
                }
            });
    }

    _onPressItem: Item => Function

    /**
     * Function to preapre a callback for the onPress event of the touchable.
     *
     * @param {Item} item - The item on which onPress was invoked.
     * @returns {Function}
     */
    _onPressItem(item) {
        return () => {
            const { inviteItems } = this.state;
            const finderKey = item.type === 'phone' ? 'number' : 'user_id';

            if (inviteItems.find(
                    _.matchesProperty(finderKey, item[finderKey]))) {
                // Item is already selected, need to unselect it.
                this.setState({
                    inviteItems: inviteItems.filter(
                        element => item[finderKey] !== element[finderKey])
                });
            } else {
                // Item is not selected yet, need to add to the list.
                const items: Array<Object> = inviteItems.concat(item);

                this.setState({
                    inviteItems: _.sortBy(items, [ 'name', 'number' ])
                });
            }
        };
    }

    _onShareMeeting: () => void

    /**
     * Shows the system share sheet to share the meeting information.
     *
     * @returns {void}
     */
    _onShareMeeting() {
        if (this.state.inviteItems.length > 0) {
            // The use probably intended to invite people.
            this._onInvite();
        } else {
            this.props.dispatch(beginShareRoom());
        }
    }

    _onTypeQuery: string => void

    /**
     * Handles the typing event of the text field on the dialog and performs the
     * search.
     *
     * @param {string} query - The query that is typed in the field.
     * @returns {void}
     */
    _onTypeQuery(query) {
        this.setState({
            fieldValue: query
        });

        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.setState({
                searchInprogress: true
            }, () => {
                this._performSearch(query);
            });
        }, 500);
    }

    /**
     * Performs the actual search.
     *
     * @param {string} query - The query to search for.
     * @returns {void}
     */
    _performSearch(query) {
        this._query(query).then(results => {
            this.setState({
                selectableItems: _.sortBy(results, [ 'name', 'number' ])
            });
        })
        .finally(() => {
            this.setState({
                searchInprogress: false
            }, () => {
                this.inputFieldRef && this.inputFieldRef.focus();
            });
        });
    }

    _query: (string) => Promise<Array<Object>>;

    /**
     * Renders a button to clear the text field.
     *
     * @returns {React#Element<*>}
     */
    _renderClearButton() {
        if (!this.state.fieldValue.length) {
            return null;
        }

        return (
            <TouchableOpacity
                onPress = { this._onClearField }
                style = { styles.clearButton }>
                <View style = { styles.clearIconContainer }>
                    <Icon
                        src = { IconClose }
                        style = { styles.clearIcon } />
                </View>
            </TouchableOpacity>
        );
    }

    _renderInvitedItem: Object => React$Element<any> | null

    /**
     * Renders a single item in the invited {@code FlatList}.
     *
     * @param {Object} flatListItem - An item of the data array of the
     * {@code FlatList}.
     * @param {number} index - The index of the currently rendered item.
     * @returns {?React$Element<any>}
     */
    _renderInvitedItem(flatListItem, index): React$Element<any> | null {
        const { item } = flatListItem;
        const renderableItem = this._getRenderableItem(flatListItem);

        return (
            <TouchableOpacity onPress = { this._onPressItem(item) } >
                <View
                    pointerEvents = 'box-only'
                    style = { styles.itemWrapper }>
                    <AvatarListItem
                        avatarOnly = { true }
                        avatarSize = { AVATAR_SIZE }
                        avatarStatus = { item.status }
                        avatarStyle = { styles.avatar }
                        avatarTextStyle = { styles.avatarText }
                        item = { renderableItem }
                        key = { index }
                        linesStyle = { styles.itemLinesStyle }
                        titleStyle = { styles.itemText } />
                    <Icon
                        src = { IconCancelSelection }
                        style = { styles.unselectIcon } />
                </View>
            </TouchableOpacity>
        );
    }

    _renderItem: Object => React$Element<any> | null

    /**
     * Renders a single item in the search result {@code FlatList}.
     *
     * @param {Object} flatListItem - An item of the data array of the
     * {@code FlatList}.
     * @param {number} index - The index of the currently rendered item.
     * @returns {?React$Element<*>}
     */
    _renderItem(flatListItem, index): React$Element<any> | null {
        const { item } = flatListItem;
        const { inviteItems } = this.state;
        let selected = false;
        const renderableItem = this._getRenderableItem(flatListItem);

        if (!renderableItem) {
            return null;
        }

        switch (item.type) {
        case 'phone':
            selected = inviteItems.find(_.matchesProperty('number', item.number));
            break;
        case 'user':
            selected = item.id
                ? inviteItems.find(_.matchesProperty('id', item.id))
                : inviteItems.find(_.matchesProperty('user_id', item.user_id));
            break;
        default:
            return null;
        }

        return (
            <TouchableOpacity onPress = { this._onPressItem(item) } >
                <View
                    pointerEvents = 'box-only'
                    style = { styles.itemWrapper }>
                    <AvatarListItem
                        avatarSize = { AVATAR_SIZE }
                        avatarStatus = { item.status }
                        avatarStyle = { styles.avatar }
                        avatarTextStyle = { styles.avatarText }
                        item = { renderableItem }
                        key = { index }
                        linesStyle = { styles.itemLinesStyle }
                        titleStyle = { styles.itemText } />
                    { selected && <Icon
                        src = { IconCheck }
                        style = { styles.selectedIcon } /> }
                </View>
            </TouchableOpacity>
        );
    }

    _renderSeparator: () => React$Element<*> | null

    /**
     * Renders the item separator.
     *
     * @returns {?React$Element<*>}
     */
    _renderSeparator() {
        return (
            <View style = { styles.separator } />
        );
    }

    _renderShareMeetingButton: () => React$Element<any>;

    /**
     * Renders a button to share the meeting info.
     *
     * @returns {React#Element<*>}
     */
    _renderShareMeetingButton() {
        const { _headerStyles } = this.props;

        return (
            <SafeAreaView
                style = { [
                    styles.bottomBar,
                    _headerStyles.headerOverlay,
                    this.state.bottomPadding ? styles.extraBarPadding : null
                ] }>
                <TouchableOpacity
                    onPress = { this._onShareMeeting }>
                    <Icon
                        src = { IconShare }
                        style = { [ _headerStyles.headerButtonText, styles.shareIcon ] } />
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    _setFieldRef: ?TextInput => void

    /**
     * Sets a reference to the input field for later use.
     *
     * @param {?TextInput} input - The reference to the input field.
     * @returns {void}
     */
    _setFieldRef(input) {
        this.inputFieldRef = input;
    }

    /**
     * Shows an alert telling the user that some invitees were failed to be
     * invited.
     *
     * NOTE: We're using an Alert here because we're on a modal and it makes
     * using our dialogs a tad more difficult.
     *
     * @returns {void}
     */
    _showFailedInviteAlert() {
        this.props.dispatch(openDialog(AlertDialog, {
            contentKey: {
                key: 'inviteDialog.alertText'
            }
        }));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _isVisible: boolean
 * }}
 */
function _mapStateToProps(state: Object) {
    return {
        ..._abstractMapStateToProps(state),
        _headerStyles: ColorSchemeRegistry.get(state, 'Header'),
        _isVisible: state['features/base/modal'].activeModalId === ADD_PEOPLE_DIALOG_VIEW_ID
    };
}

export default translate(connect(_mapStateToProps)(AddPeopleDialog));
