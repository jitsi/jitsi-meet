// @flow
import React, { Component } from 'react';
import { TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

import {
    createRecentClickedEvent,
    createRecentSelectedEvent,
    sendAnalytics
} from '../../analytics';
import { appNavigate, getDefaultURL } from '../../app';
import { translate } from '../../base/i18n';
import { openDialog } from '../../base/dialog';
import { Container, NavigateSectionList, Text } from '../../base/react';
import type { Section } from '../../base/react';

import { isRecentListEnabled, toDisplayableList } from '../functions';

import ClearRecentListDialog from './ClearRecentListDialog';
import ListEntryMenuDialog from './ListEntryMenuDialog';
import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link RecentList}
 */
type Props = {

    /**
     * Renders the list disabled.
     */
    disabled: boolean,

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: Dispatch<*>,

    /**
     * The translate function.
     */
    t: Function,

    /**
     * The default server URL.
     */
    _defaultServerURL: string,

    /**
     * The recent list from the Redux store.
     */
    _recentList: Array<Section>
};

/**
 * The cross platform container rendering the list of the recently joined rooms.
 *
 */
class RecentList extends Component<Props> {
    /**
     * Initializes a new {@code RecentList} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onClearList = this._onClearList.bind(this);
        this._onDeleteItem = this._onDeleteItem.bind(this);
        this._onPress = this._onPress.bind(this);
        this._renderListFooterComponent
            = this._renderListFooterComponent.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        sendAnalytics(createRecentSelectedEvent());
    }

    /**
     * Implements the React Components's render method.
     *
     * @inheritdoc
     */
    render() {
        if (!isRecentListEnabled()) {
            return null;
        }
        const { disabled, t, _defaultServerURL, _recentList } = this.props;
        const recentList = toDisplayableList(_recentList, t, _defaultServerURL);

        return (
            <NavigateSectionList
                ListFooterComponent = { this._renderListFooterComponent }
                disabled = { disabled }
                onPress = { this._onPress }
                onSecondaryAction = { this._onDeleteItem }
                renderListEmptyComponent
                    = { this._getRenderListEmptyComponent() }
                secondaryActionType = { 'long' }
                sections = { recentList } />
        );
    }

    _getRenderListEmptyComponent: () => Object;

    /**
     * Returns a list empty component if a custom one has to be rendered instead
     * of the default one in the {@link NavigateSectionList}.
     *
     * @private
     * @returns {React$Component}
     */
    _getRenderListEmptyComponent() {
        const { t } = this.props;

        return (
            <Container
                className = 'navigate-section-list-empty'
                style = { styles.emptyListContainer }>
                <Text
                    className = 'header-text-description'
                    style = { styles.emptyListText }>
                    { t('welcomepage.recentListEmpty') }
                </Text>
            </Container>
        );
    }

    _onClearList: () => void

    /**
     * Pops up a confirmation to clear the recent list.
     *
     * @returns {void}
     */
    _onClearList() {
        this.props.dispatch(openDialog(ClearRecentListDialog));
    }

    _onDeleteItem: string => void

    /**
     * Callback for the secondary action of the {@code NavigateSectionList},
     * that deletes an entry from the list.
     *
     * @param {string} id - The id of the entry to be deleted.
     * @returns {void}
     */
    _onDeleteItem(id) {
        this.props.dispatch(openDialog(ListEntryMenuDialog, {
            itemId: id
        }));
    }

    _onPress: string => Function;

    /**
     * Handles the list's navigate action.
     *
     * @private
     * @param {string} url - The url string to navigate to.
     * @returns {void}
     */
    _onPress(url) {
        const { dispatch } = this.props;

        sendAnalytics(createRecentClickedEvent('recent.meeting.tile'));

        dispatch(appNavigate(url));
    }

    _renderListFooterComponent: () => Object;

    /**
     * Returns the clear button in the lost footer..
     *
     * @private
     * @returns {React$Component}
     */
    _renderListFooterComponent() {
        const { _recentList } = this.props;

        if (!_recentList || !_recentList.length) {
            return null;
        }

        return (
            <TouchableOpacity
                onPress = { this._onClearList }
                style = { styles.clearButton }>
                <Text style = { styles.clearButtonText }>
                    { this.props.t('recentList.clear') }
                </Text>
            </TouchableOpacity>
        );
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *     _defaultServerURL: string,
 *     _recentList: Array
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _defaultServerURL: getDefaultURL(state),
        _recentList: state['features/recent-list']
    };
}

export default translate(connect(_mapStateToProps)(RecentList));
