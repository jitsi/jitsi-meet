import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import MeetingsList from '../../base/react/components/web/MeetingsList';
import { deleteRecentListEntry } from '../actions';
import { isRecentListEnabled, toDisplayableList } from '../functions.web';

import AbstractRecentList from './AbstractRecentList';

/**
 * The type of the React {@code Component} props of {@link RecentList}.
 */
interface IProps extends WithTranslation {

    /**
     * The recent list from the Redux store.
     */
    _recentList: Array<any>;

    /**
     * Renders the list disabled.
     */
    disabled?: boolean;

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];
}

/**
 * The cross platform container rendering the list of the recently joined rooms.
 *
 */
class RecentList extends AbstractRecentList<IProps> {
    /**
     * Initializes a new {@code RecentList} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._getRenderListEmptyComponent
            = this._getRenderListEmptyComponent.bind(this);
        this._onPress = this._onPress.bind(this);
        this._onItemDelete = this._onItemDelete.bind(this);
    }

    /**
     * Deletes a recent entry.
     *
     * @param {Object} entry - The entry to be deleted.
     * @inheritdoc
     */
    _onItemDelete(entry: Object) {
        this.props.dispatch(deleteRecentListEntry(entry));
    }

    /**
     * Implements the React Components's render method.
     *
     * @inheritdoc
     */
    override render() {
        if (!isRecentListEnabled()) {
            return null;
        }
        const {
            disabled,
            _recentList
        } = this.props;
        const recentList = toDisplayableList(_recentList);

        return (
            <MeetingsList
                disabled = { Boolean(disabled) }
                hideURL = { true }
                listEmptyComponent = { this._getRenderListEmptyComponent() }
                meetings = { recentList }
                onItemDelete = { this._onItemDelete }
                onPress = { this._onPress } />
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
export function _mapStateToProps(state: IReduxState) {
    return {
        _recentList: state['features/recent-list']
    };
}

export default translate(connect(_mapStateToProps)(RecentList));
