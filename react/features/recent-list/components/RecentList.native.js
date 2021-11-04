// @flow

import React from 'react';
import type { Dispatch } from 'redux';

import { getDefaultURL } from '../../app/functions';
import { openDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n';
import { NavigateSectionList, type Section } from '../../base/react';
import { connect } from '../../base/redux';
import { isRecentListEnabled, toDisplayableList } from '../functions';

import AbstractRecentList from './AbstractRecentList';
import RecentListItemMenu from './RecentListItemMenu.native';

/**
 * The type of the React {@code Component} props of {@link RecentList}.
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
     * The default server URL.
     */
    _defaultServerURL: string,

    /**
     * The recent list from the Redux store.
     */
    _recentList: Array<Section>
};

/**
 * A class that renders the list of the recently joined rooms.
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

        // Bind event handlers so they are only bound once per instance.
        this._onLongPress = this._onLongPress.bind(this);
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
            t,
            _defaultServerURL,
            _recentList
        } = this.props;
        const recentList = toDisplayableList(_recentList, t, _defaultServerURL);

        return (
            <NavigateSectionList
                disabled = { disabled }
                onLongPress = { this._onLongPress }
                onPress = { this._onPress }
                renderListEmptyComponent
                    = { this._getRenderListEmptyComponent() }
                sections = { recentList } />
        );
    }

    _onLongPress: (Object) => void;

    /**
     * Handles the list's navigate action.
     *
     * @private
     * @param {Object} item - The item which was long pressed.
     * @returns {void}
     */
    _onLongPress(item) {
        this.props.dispatch(openDialog(RecentListItemMenu, { item }));
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object) {
    return {
        _defaultServerURL: getDefaultURL(state),
        _recentList: state['features/recent-list']
    };
}

export default translate(connect(_mapStateToProps)(RecentList));
