// @flow
import React from 'react';
import { connect } from 'react-redux';

import {
    createRecentClickedEvent,
    createRecentSelectedEvent,
    sendAnalytics
} from '../../analytics';
import { appNavigate, getDefaultURL } from '../../app';
import { translate } from '../../base/i18n';
import {
    AbstractPage,
    Container,
    NavigateSectionList,
    Text
} from '../../base/react';
import type { Section } from '../../base/react';

import { deleteRecentListEntry } from '../actions';
import { isRecentListEnabled, toDisplayableList } from '../functions';

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
class RecentList extends AbstractPage<Props> {
    /**
     * Initializes a new {@code RecentList} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onDelete = this._onDelete.bind(this);
        this._onPress = this._onPress.bind(this);
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
        const slideActions = [ {
            backgroundColor: 'red',
            onPress: this._onDelete,
            text: t('welcomepage.recentListDelete')
        } ];

        return (
            <NavigateSectionList
                disabled = { disabled }
                onPress = { this._onPress }
                renderListEmptyComponent
                    = { this._getRenderListEmptyComponent() }
                sections = { recentList }
                slideActions = { slideActions } />
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

    _onDelete: Object => void

    /**
     * Callback for the delete action of the list.
     *
     * @param {Object} itemId - The ID of the entry thats deletion is
     * requested.
     * @returns {void}
     */
    _onDelete(itemId) {
        this.props.dispatch(deleteRecentListEntry(itemId));
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
