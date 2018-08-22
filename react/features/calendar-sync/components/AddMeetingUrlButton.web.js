// @flow

import Button from '@atlaskit/button';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';

import { updateCalendarEvent } from '../actions';

/**
 * The type of the React {@code Component} props of {@link AddMeetingUrlButton}.
 */
type Props = {
    calendarId: string,
    dispatch: Function,
    eventId: string,
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
            <Button
                appearance = 'primary'
                onClick = { this._onClick }
                type = 'button'>
                { this.props.t('calendarSync.addMeetingURL') }
            </Button>
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

