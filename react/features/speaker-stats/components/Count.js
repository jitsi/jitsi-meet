import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * React component for displaying a count. For example a number of poops.
 *
 * @extends Component
 */
class Count extends Component {
    /**
     * TimeElapsed component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Count
         */
        count: PropTypes.number
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { count } = this.props;

        return (
            <div>
                { count }
            </div>
        );
    }
}

export default Count;

