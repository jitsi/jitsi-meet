import React from 'react';
import { WithTranslation } from 'react-i18next';
import {
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import AbstractPage from '../../base/react/components/AbstractPage';
import { openSettings } from '../../mobile/permissions/functions';
import { refreshCalendar } from '../actions.native';

import CalendarListContent from './CalendarListContent.native';
import styles from './styles';

/**
 * The tyoe of the React {@code Component} props of {@link CalendarList}.
 */
interface IProps extends WithTranslation {

    /**
     * The current state of the calendar access permission.
     */
    _authorization?: string;

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean;
}

/**
 * Component to display a list of events from the (mobile) user's calendar.
 */
class CalendarList extends AbstractPage<IProps> {
    /**
     * Initializes a new {@code CalendarList} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._getRenderListEmptyComponent
            = this._getRenderListEmptyComponent.bind(this);
    }

    /**
     * Public API method for {@code Component}s rendered in
     * {@link AbstractPagedList}. When invoked, refreshes the calendar entries
     * in the app.
     *
     * @param {Function} dispatch - The Redux dispatch function.
     * @param {boolean} isInteractive - If true this refresh was caused by
     * direct user interaction, false otherwise.
     * @public
     * @returns {void}
     */
    static refresh(dispatch: IStore['dispatch'], isInteractive: boolean) {
        dispatch(refreshCalendar(false, isInteractive));
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { disabled } = this.props;

        return (
            CalendarListContent
                ? <View
                    style = {
                        (disabled
                            ? styles.calendarSyncDisabled
                            : styles.calendarSync) as ViewStyle }>
                    <CalendarListContent
                        disabled = { disabled }
                        listEmptyComponent
                            = { this._getRenderListEmptyComponent() } />
                </View>
                : null
        );
    }

    /**
     * Returns a list empty component if a custom one has to be rendered instead
     * of the default one in the {@link NavigateSectionList}.
     *
     * @private
     * @returns {?React$Component}
     */
    _getRenderListEmptyComponent() {
        const { _authorization, t } = this.props;

        // If we don't provide a list specific renderListEmptyComponent, then
        // the default empty component of the NavigateSectionList will be
        // rendered, which (atm) is a simple "Pull to refresh" message.
        if (_authorization !== 'denied') {
            return <></>;
        }

        return (
            <View style = { styles.noPermissionMessageView as ViewStyle }>
                <Text style = { styles.noPermissionMessageText as ViewStyle }>
                    { t('calendarSync.permissionMessage') }
                </Text>
                <TouchableOpacity
                    onPress = { openSettings }
                    style = { styles.noPermissionMessageButton as ViewStyle } >
                    <Text style = { styles.noPermissionMessageButtonText as ViewStyle }>
                        { t('calendarSync.permissionButton') }
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *     _authorization: ?string,
 *     _eventList: Array<Object>
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const { authorization } = state['features/calendar-sync'];

    return {
        _authorization: authorization
    };
}

export default translate(connect(_mapStateToProps)(CalendarList));
