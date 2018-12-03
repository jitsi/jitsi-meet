/* @flow */

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

/**
 * The type of the React {@code Component} props of {@link NoRoomError}.
 */
type Props = {

    /**
     * Additional CSS classnames to append to the root of the component.
     */
    className: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Displays an error message stating no room name was specified to fetch dial-in
 * numbers for.
 *
 * @extends Component
 */
class NoRoomError extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <div className = { this.props.className } >
                <div>{ t('info.noNumbers') }</div>
                <div>{ t('info.noRoom') }</div>
            </div>
        );
    }
}

export default translate(NoRoomError);
