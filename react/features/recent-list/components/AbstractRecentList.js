// @flow

import { Component } from 'react';

import { appNavigate } from '../../app';

/**
 * The type of the React {@code Component} props of {@link AbstractRecentList}
 */
type Props = {
    _defaultURL: string,

    _recentList: Array<Object>,

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: Dispatch<*>,

    /**
     * Whether {@code AbstractRecentList} is enabled.
     */
    enabled: boolean
};

/**
 * Implements a React {@link Component} which represents the list of conferences
 * recently joined, similar to how a list of last dialed numbers list would do
 * on a mobile device.
 *
 * @extends Component
 */
export default class AbstractRecentList extends Component<Props> {

    /**
     * Joins the selected room.
     *
     * @param {string} room - The selected room.
     * @protected
     * @returns {void}
     */
    _onJoin(room) {
        const { dispatch, enabled } = this.props;

        enabled && room && dispatch(appNavigate(room));
    }

    /**
     * Creates a bound onPress action for the list item.
     *
     * @param {string} room - The selected room.
     * @protected
     * @returns {Function}
     */
    _onSelect(room) {
        return this._onJoin.bind(this, room);
    }
}

/**
 * Maps (parts of) the redux state into {@code AbstractRecentList}'s React
 * {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *     _defaultURL: string,
 *     _recentList: Array
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _defaultURL: state['features/app'].app._getDefaultURL(),
        _recentList: state['features/recent-list']
    };
}
