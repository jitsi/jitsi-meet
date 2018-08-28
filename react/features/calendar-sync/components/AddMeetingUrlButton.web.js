// @flow

import Button from '@atlaskit/button';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Tooltip from '@atlaskit/tooltip';

import { translate } from '../../base/i18n';

import { updateCalendarEvent } from '../actions';

/**
 * The type of the React {@code Component} props of {@link AddMeetingUrlButton}.
 */
type Props = {

    /**
     * The calendar ID associated with the calendar event.
     */
    calendarId: string,

    /**
     * Invoked to add a meeting URL to a calendar event.
     */
    dispatch: Dispatch<*>,

    /**
     * The ID of the calendar event that will have a meeting URL added on click.
     */
    eventId: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * A React Component for adding a meeting URL to an existing calendar event.
 *
 * @extends Component
 */
class AddMeetingUrlButton extends Component<Props> {
    /**
     * Initializes a new {@code AddMeetingUrlButton} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Tooltip content = { this.props.t('calendarSync.addMeetingURL') }>
                <Button
                    appearance = 'primary'
                    onClick = { this._onClick }
                    type = 'button'>
                    <i className = { 'icon-add' } />
                </Button>
            </Tooltip>
        );
    }

    _onClick: () => void;

    /**
     * Dispatches an action to adding a meeting URL to a calendar event.
     *
     * @returns {void}
     */
    _onClick() {
        const { calendarId, dispatch, eventId } = this.props;

        dispatch(updateCalendarEvent(eventId, calendarId));
    }
}

export default translate(connect()(AddMeetingUrlButton));

