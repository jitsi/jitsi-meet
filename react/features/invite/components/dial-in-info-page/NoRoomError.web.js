import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

/**
 * Displays an error message stating no room name was specified to fetch dial-in
 * numbers for.
 *
 * @extends Component
 */
class NoRoomError extends Component {
    /**
     * {@code NoRoomError} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Additional CSS classnames to append to the root of the component.
         */
        className: PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

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
