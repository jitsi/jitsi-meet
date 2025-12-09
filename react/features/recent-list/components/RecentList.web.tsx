import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import { IDeeplinkingConfig } from '../../base/config/configType';
import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconDownload } from '../../base/icons/svg';
import MeetingsList from '../../base/react/components/web/MeetingsList';
import { buildDesktopDeepLinkFromUrl } from '../../deep-linking/openDesktopApp.web';
import { deleteRecentListEntry } from '../actions';
import { isRecentListEnabled, toDisplayableList } from '../functions.web';

import AbstractRecentList from './AbstractRecentList';

/**
 * The type of the React {@code Component} props of {@link RecentList}.
 */
interface IProps extends WithTranslation {

    /**
     * The deeplinking config.
     */
    _deeplinkingCfg: IDeeplinkingConfig;

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

        // Bind shared handlers (optional if using class fields)
        this._onDesktopLinkClick = this._onDesktopLinkClick.bind(this);
        this._onDesktopLinkKeyDown = this._onDesktopLinkKeyDown.bind(this);
    }

    /**
     * Handles clicking on the desktop app button for a meeting.
     *
     * Reads the deep link from the `data-deeplink` attribute of the event target.
     *
     * @param {React.MouseEvent} e - The click event.
     * @private
     * @returns {void}
     */
    _onDesktopLinkClick(e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation();
        const deepLink = (e.currentTarget as HTMLButtonElement).dataset.deeplink;

        if (deepLink) {
            window.location.href = deepLink;
        }
    }

    /**
     * Handles keyboard events on the desktop app button for a meeting.
     *
     * Reads the deep link from the `data-deeplink` attribute of the event target.
     *
     * @param {React.KeyboardEvent} e - The keyboard event.
     * @private
     * @returns {void}
     */
    _onDesktopLinkKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
        const key = e.key;

        if (key === 'Enter' || key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            const deepLink = (e.currentTarget as HTMLButtonElement).dataset.deeplink;

            if (deepLink) {
                window.location.href = deepLink;
            }
        }
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
            _recentList,
            _deeplinkingCfg,
            t
        } = this.props;
        const desktopCfg = _deeplinkingCfg?.desktop;
        const recentList = toDisplayableList(_recentList);

        // Add desktop deep link to each meeting if enabled
        const meetings = desktopCfg?.enabled && desktopCfg.appScheme
            ? recentList.map(meeting => {
                const deepLink = buildDesktopDeepLinkFromUrl(meeting.url, desktopCfg.appScheme);

                return {
                    ...meeting,
                    elementAfter: (
                        <button
                            aria-label = { t('welcomepage.openInDesktopApp') }
                            className = 'meetings-list-desktop-link'
                            data-deeplink = { deepLink }
                            onClick = { this._onDesktopLinkClick }
                            onKeyDown = { this._onDesktopLinkKeyDown }
                            tabIndex = { 0 }
                            type = 'button'>
                            <Icon src = { IconDownload } />
                        </button>
                    )
                };
            })
            : recentList;

        return (
            <MeetingsList
                disabled = { Boolean(disabled) }
                hideURL = { true }
                listEmptyComponent = { this._getRenderListEmptyComponent() }
                meetings = { meetings }
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
        _deeplinkingCfg: state['features/base/config'].deeplinking || {},
        _recentList: state['features/recent-list']
    };
}

export default translate(connect(_mapStateToProps)(RecentList));
