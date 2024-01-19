import React from 'react';
import { WithTranslation } from 'react-i18next';
import { GestureResponderEvent, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { getDefaultURL } from '../../app/functions.native';
import { IReduxState, IStore } from '../../app/types';
import { openSheet } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import NavigateSectionList from '../../base/react/components/native/NavigateSectionList';
import { Item, Section } from '../../base/react/types';
import styles from '../../welcome/components/styles';
import { isRecentListEnabled, toDisplayableList } from '../functions.native';

import AbstractRecentList from './AbstractRecentList';
import RecentListItemMenu from './RecentListItemMenu.native';

/**
 * The type of the React {@code Component} props of {@link RecentList}.
 */
interface IProps extends WithTranslation {

    /**
     * The default server URL.
     */
    _defaultServerURL: string;

    /**
     * The recent list from the Redux store.
     */
    _recentList: Array<Section>;

    /**
     * Renders the list disabled.
     */
    disabled: boolean;

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Callback to be invoked when pressing the list container.
     */
    onListContainerPress?: (e?: GestureResponderEvent) => void;
}

/**
 * A class that renders the list of the recently joined rooms.
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
            onListContainerPress,
            t,
            _defaultServerURL,
            _recentList
        } = this.props; // @ts-ignore
        const recentList = toDisplayableList(_recentList, t, _defaultServerURL);

        return (
            <TouchableWithoutFeedback
                onPress = { onListContainerPress }>
                <View style = { (disabled ? styles.recentListDisabled : styles.recentList) as ViewStyle }>
                    <NavigateSectionList
                        disabled = { disabled }
                        onLongPress = { this._onLongPress }
                        onPress = { this._onPress }
                        renderListEmptyComponent
                            = { this._getRenderListEmptyComponent() }

                        // @ts-ignore
                        sections = { recentList } />
                </View>
            </TouchableWithoutFeedback>
        );
    }

    /**
     * Handles the list's navigate action.
     *
     * @private
     * @param {Object} item - The item which was long pressed.
     * @returns {void}
     */
    _onLongPress(item: Item) {
        this.props.dispatch(openSheet(RecentListItemMenu, { item }));
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState) {
    return {
        _defaultServerURL: getDefaultURL(state),
        _recentList: state['features/recent-list']
    };
}

// @ts-ignore
export default translate(connect(_mapStateToProps)(RecentList));
