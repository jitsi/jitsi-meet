// @flow

import Button from '@atlaskit/button';
import React, { Component } from 'react';

import { translate } from '../../../i18n';

type Props = {

    /**
     * Click handler for refreshing the list.
     */
    onRefresh: Function,

    /**
     * The translate function.
     */
    t: Function,
};

/**
 * TODO: I just made something here to get calendar refresh
 * working. Will have to figure out how to make this generic
 * list the native version.
 *
 * @extends Component
 */
class NavigateSectionListEmptyComponent extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <div className = 'navigate-section-list-empty'>
                <div>{ t('calendarSync.noEvents') }</div>
                <Button
                    appearance = 'primary'
                    className = 'calendar-button'
                    id = 'connect_calendar_button'
                    onClick = { this.props.onRefresh }
                    type = 'button'>
                    { t('calendarSync.refresh') }
                </Button>
            </div>
        );
    }
}

export default translate(NavigateSectionListEmptyComponent);
