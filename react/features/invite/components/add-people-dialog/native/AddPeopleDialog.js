// @flow

import _ from 'lodash';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { Icon } from '../../../../base/font-icons';
import { translate } from '../../../../base/i18n';
import {
    AvatarListItem,
    HeaderWithNavigation,
    Modal,
    type Item
} from '../../../../base/react';
import { connect } from '../../../../base/redux';

import { setAddPeopleDialogVisible } from '../../../actions';

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
        this._renderItem = this._renderItem.bind(this);
        this._renderSeparator = this._renderSeparator.bind(this);
        this._onClearField = this._onClearField.bind(this);
        this._onCloseAddPeopleDialog = this._onCloseAddPeopleDialog.bind(this);
        this._onInvite = this._onInvite.bind(this);
        this._onPressItem = this._onPressItem.bind(this);
        this._onTypeQuery = this._onTypeQuery.bind(this);
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
        const { inviteItems } = this.state;

        let placeholderKey = 'searchPlaceholder';

        if (!_addPeopleEnabled) {
            placeholderKey = 'searchCallOnlyPlaceholder';
        } else if (!_dialOutEnabled) {
            placeholderKey = 'searchPeopleOnlyPlaceholder';
        }

        return (
            <Modal
                onRequestClose = { this._onCloseAddPeopleDialog }
                visible = { this.props._isVisible }>
                <HeaderWithNavigation
                    forwardDisabled = { this._isAddDisabled() }
                    forwardLabelKey = 'inviteDialog.send'
                    headerLabelKey = 'inviteDialog.header'
                    onPressBack = { this._onCloseAddPeopleDialog }
                    onPressForward = { this._onInvite } />
                <KeyboardAvoidingView
                    behavior = 'padding'
                    style = { styles.avoidingView }>
                    <SafeAreaView style = { styles.dialogWrapper }>
                        <View
                            style = { styles.searchFieldWrapper }>
                            <View style = { styles.searchIconWrapper }>
                                { this.state.searchInprogress
                                    ? <ActivityIndicator
                                        color = { DARK_GREY }
                                        size = 'small' />
                                    : <Icon
                                        name = { 'search' }
                                        style = { styles.searchIcon } />}
                            </View>
                            <TextInput
                                autoCorrect = { false }
                                autoFocus = { true }
                                clearButtonMode = 'always' // iOS only
                                onChangeText = { this._onTypeQuery }
                                placeholder = {
                                    this.props.t(`inviteDialog.${placeholderKey}`)
                                }
                                ref = { this._setFieldRef }
                                style = { styles.searchField }
                                value = { this.state.fieldValue } />
                            { this._renderAndroidClearButton() }
                        </View>
                        <FlatList
                            ItemSeparatorComponent = { this._renderSeparator }
                            data = { this.state.selectableItems }
                            extraData = { inviteItems }
                            keyExtractor = { this._keyExtractor }
                            keyboardShouldPersistTaps = 'always'
                            renderItem = { this._renderItem }
                            style = { styles.resultList } />
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>
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

    _onCloseAddPeopleDialog: () => void

    /**
     * Closes the dialog.
     *
     * @returns {void}
     */
    _onCloseAddPeopleDialog() {
        this.props.dispatch(setAddPeopleDialogVisible(false));
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
                    this._onCloseAddPeopleDialog();
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
                const items: Array<*> = inviteItems.concat(item);

                this.setState({
                    inviteItems: _.sortBy(items, [ 'name', 'number' ])
                });
            }
        };
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
            const { inviteItems } = this.state;

            let selectableItems = results.filter(result => {
                switch (result.type) {
                case 'phone':
                    return result.allowed && result.number
                        && !inviteItems.find(
                            _.matchesProperty('number', result.number));
                case 'user':
                    return !inviteItems.find(
                        (result.user_id && _.matchesProperty('id', result.id))
                        || (result.user_id && _.matchesProperty('user_id', result.user_id)));
                default:
                    return false;
                }
            });

            selectableItems = _.sortBy(selectableItems, [ 'name', 'number' ]);

            this.setState({
                selectableItems: this.state.inviteItems.concat(selectableItems)
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

    _renderItem: Object => ?React$Element<*>

    /**
     * Renders a button to clear the text field on Android.
     *
     * NOTE: For the best platform experience we use the native solution on iOS.
     *
     * @returns {React#Element<*>}
     */
    _renderAndroidClearButton() {
        if (Platform.OS !== 'android' || !this.state.fieldValue.length) {
            return null;
        }

        return (
            <TouchableOpacity
                onPress = { this._onClearField }
                style = { styles.clearButton }>
                <View style = { styles.clearIconContainer }>
                    <Icon
                        name = 'close'
                        style = { styles.clearIcon } />
                </View>
            </TouchableOpacity>
        );
    }

    /**
     * Renders a single item in the {@code FlatList}.
     *
     * @param {Object} flatListItem - An item of the data array of the
     * {@code FlatList}.
     * @param {number} index - The index of the currently rendered item.
     * @returns {?React$Element<*>}
     */
    _renderItem(flatListItem, index) {
        const { item } = flatListItem;
        const { inviteItems } = this.state;
        let selected = false;
        let renderableItem;

        switch (item.type) {
        case 'phone':
            selected
                = inviteItems.find(_.matchesProperty('number', item.number));
            renderableItem = {
                avatar: 'icon://phone',
                key: item.number,
                title: item.number
            };
            break;
        case 'user':
            selected
                = item.id
                    ? inviteItems.find(_.matchesProperty('id', item.id))
                    : inviteItems.find(_.matchesProperty('user_id', item.user_id));
            renderableItem = {
                avatar: item.avatar,
                key: item.id || item.user_id,
                title: item.name
            };
            break;
        default:
            return null;
        }

        return (
            <TouchableOpacity onPress = { this._onPressItem(item) } >
                <View
                    pointerEvents = 'box-only'
                    style = { styles.itemWrapper }>
                    <Icon
                        name = { selected
                            ? 'radio_button_checked'
                            : 'radio_button_unchecked' }
                        style = { styles.radioButton } />
                    <AvatarListItem
                        avatarSize = { AVATAR_SIZE }
                        avatarStyle = { styles.avatar }
                        avatarTextStyle = { styles.avatarText }
                        item = { renderableItem }
                        key = { index }
                        linesStyle = { styles.itemLinesStyle }
                        titleStyle = { styles.itemText } />
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
        const { t } = this.props;

        Alert.alert(
            t('inviteDialog.alertTitle'),
            t('inviteDialog.alertText'),
            [
                {
                    text: t('inviteDialog.alertOk')
                }
            ]
        );
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
        _isVisible: state['features/invite'].inviteDialogVisible
    };
}

export default translate(connect(_mapStateToProps)(AddPeopleDialog));
