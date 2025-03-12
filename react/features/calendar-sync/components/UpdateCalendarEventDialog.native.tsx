import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IStore } from '../../app/types';
import ConfirmDialog from '../../base/dialog/components/native/ConfirmDialog';
import { translate } from '../../base/i18n/functions';
import { updateCalendarEvent } from '../actions';

interface IProps extends WithTranslation {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The ID of the event to be updated.
     */
    eventId: string;
}

/**
 * Component for the add Jitsi link confirm dialog.
 */
class UpdateCalendarEventDialog extends Component<IProps> {
    /**
     * Initializes a new {@code UpdateCalendarEventDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        return (
            <ConfirmDialog
                descriptionKey = 'calendarSync.confirmAddLink'
                onSubmit = { this._onSubmit } />
        );
    }

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        this.props.dispatch(updateCalendarEvent(this.props.eventId));

        return true;
    }
}

export default translate(connect()(UpdateCalendarEventDialog));
