// @flow

import React from 'react';
import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import { MeetingsList } from '../../base/react';
import { connect } from '../../base/redux';

import AbstractRecentList from './AbstractRecentList';
import { isRecentListEnabled, toDisplayableList } from '../functions';

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
    dispatch: Dispatch<any>,

    /**
     * The translate function.
     */
    t: Function,

    /**
     * The recent list from the Redux store.
     */
    _recentList: Array<Object>
};

/**
 * The cross platform container rendering the list of the recently joined rooms.
 *
 */
class RecentList extends AbstractRecentList<Props> {
    _getRenderListEmptyComponent: () => React$Node;
    _onPress: string => {};

    /**
     * Initializes a new {@code RecentList} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._getRenderListEmptyComponent
            = this._getRenderListEmptyComponent.bind(this);
        this._onPress = this._onPress.bind(this);
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
        const {
            disabled,
            _recentList
        } = this.props;
        const recentList = toDisplayableList(_recentList);

        return (
            <MeetingsList
                disabled = { disabled }
                hideURL = { true }
                listEmptyComponent = { this._getRenderListEmptyComponent() }
                meetings = { recentList }
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
export function _mapStateToProps(state: Object) {
    return {
        _recentList: state['features/recent-list']
    };
}

export default translate(connect(_mapStateToProps)(RecentList));
