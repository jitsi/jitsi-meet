// @flow

import React from 'react';
import {
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import { translate } from '../../base/i18n';
import { AbstractPage } from '../../base/react';
import { connect } from '../../base/redux';
import { openSettings } from '../../mobile/permissions';
import { refreshCalendar } from '../actions';

import CalendarListContent from './CalendarListContent';
import styles from './styles';

/**
 * The tyoe of the React {@code Component} props of {@link CalendarList}.
 */
type Props = {

    /**
     * The current state of the calendar access permission.
     */
    _authorization: ?string,

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean,

    /**
     * Callback to be invoked when pressing the list container.
     */
    onListContainerPress?: boolean,

    /**
     * The translate function.
     */
    t: Function
};

/**
 * Component to display a list of events from the (mobile) user's calendar.
 */
class CalendarList extends AbstractPage<Props> {
    /**
     * Initializes a new {@code CalendarList} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
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
    static refresh(dispatch, isInteractive) {
        dispatch(refreshCalendar(false, isInteractive));
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { disabled, onListContainerPress } = this.props;

        return (
            CalendarListContent
                ? <TouchableWithoutFeedback
                    onPress = { onListContainerPress }>
                    <View
                        style = {
                            disabled
                                ? styles.calendarSyncDisabled
                                : styles.calendarSync }>
                        <CalendarListContent
                            disabled = { disabled }
                            listEmptyComponent
                                = { this._getRenderListEmptyComponent() } />
                    </View>
                </TouchableWithoutFeedback>
                : null
        );
    }

    _getRenderListEmptyComponent: () => Object;

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
            return undefined;
        }

        return (
            <View style = { styles.noPermissionMessageView }>
                <Text style = { styles.noPermissionMessageText }>
                    { t('calendarSync.permissionMessage') }
                </Text>
                <TouchableOpacity
                    onPress = { openSettings }
                    style = { styles.noPermissionMessageButton } >
                    <Text style = { styles.noPermissionMessageButtonText }>
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
function _mapStateToProps(state: Object) {
    const { authorization } = state['features/calendar-sync'];

    return {
        _authorization: authorization
    };
}

export default translate(connect(_mapStateToProps)(CalendarList));
