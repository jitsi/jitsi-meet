// @flow

import React from 'react';
import type { Dispatch } from 'redux';

import { getDefaultURL } from '../../app';
import { translate } from '../../base/i18n';
import { setActiveModalId } from '../../base/modal';
import { NavigateSectionList, type Section } from '../../base/react';
import { connect } from '../../base/redux';
import { ColorPalette } from '../../base/styles';
import { DIAL_IN_SUMMARY_VIEW_ID } from '../../invite/constants';
import { deleteRecentListEntry } from '../actions';
import { isRecentListEnabled, toDisplayableList } from '../functions';

import AbstractRecentList from './AbstractRecentList';

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

        this._onDelete = this._onDelete.bind(this);
        this._onShowDialInInfo = this._onShowDialInInfo.bind(this);
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
        const slideActions = [ {
            backgroundColor: ColorPalette.blue,
            onPress: this._onShowDialInInfo,
            text: t('welcomepage.info')
        }, {
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

    _onShowDialInInfo: Object => void

    /**
     * Callback for the dial-in info action of the list.
     *
     * @param {Object} itemId - The ID of the entry for which we'd like to show the dial in numbers.
     * @returns {void}
     */
    _onShowDialInInfo(itemId) {
        this.props.dispatch(setActiveModalId(DIAL_IN_SUMMARY_VIEW_ID, { summaryUrl: itemId.url }));
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
