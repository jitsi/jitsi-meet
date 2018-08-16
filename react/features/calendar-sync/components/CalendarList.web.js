// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import Button from '@atlaskit/button';

import { translate } from '../../base/i18n';
import { openSettingsDialog, SETTINGS_TABS } from '../../settings';

import { isCalendarEnabled } from '../functions';

import AbstractCalendarList from './AbstractCalendarList';

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
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The translate function.
     */
    t: Function
};

/**
 * Component to display a list of events from the user's calendar.
 */
class CalendarList extends Component<Props> {
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
        this._onOpenSettings = this._onOpenSettings.bind(this);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { disabled } = this.props;

        return (
            AbstractCalendarList
                ? <AbstractCalendarList
                    disabled = { disabled }
                    renderListEmptyComponent
                        = { this._getRenderListEmptyComponent } />
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
        const { t } = this.props;

        return (
            <div>
                <p className = 'header-text-description'>
                    { t('welcomepage.connectCalendarText') }
                </p>
                <Button
                    appearance = 'primary'
                    className = 'calendar-button'
                    id = 'connect_calendar_button'
                    onClick = { this._onOpenSettings }
                    type = 'button'>
                    { t('welcomepage.connectCalendarButton') }
                </Button>
            </div>
        );
    }

    _onOpenSettings: () => void;

    /**
     * Opens {@code SettingsDialog}.
     *
     * @private
     * @returns {void}
     */
    _onOpenSettings() {
        this.props.dispatch(openSettingsDialog(SETTINGS_TABS.CALENDAR));
    }
}

export default isCalendarEnabled()
    ? translate(connect()(CalendarList))
    : undefined;
