// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { appNavigate, getDefaultURL } from '../../app';
import { translate } from '../../base/i18n';
import type { Section } from '../../base/react/Types';
import { NavigateSectionList } from '../../base/react';

import { toDisplayableList } from '../functions';

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

        this._onPress = this._onPress.bind(this);
    }

    /**
     * Implements the React Components's render method.
     *
     * @inheritdoc
     */
    render() {
        const { disabled, t, _defaultServerURL, _recentList } = this.props;
        const recentList = toDisplayableList(_recentList, t, _defaultServerURL);

        return (
            <NavigateSectionList
                disabled = { disabled }
                onPress = { this._onPress }
                sections = { recentList } />
        );
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
