import React, { Component } from 'react';
import { connect } from 'react-redux';

import AudioOnlyLabel from './AudioOnlyLabel';

/**
 * Component responsible for displaying a label that indicates some state of the
 * current conference. The AudioOnlyLabel component will be displayed when the
 * conference is in audio only mode.
 */
export class StatusLabel extends Component {
    /**
     * StatusLabel component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The redux store representation of the current conference.
         */
        _conference: React.PropTypes.object
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        if (!this.props._conference.audioOnly) {
            return null;
        }

        return (
            <div className = 'moveToCorner'>
                <AudioOnlyLabel />
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated StatusLabel's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _conference: Object,
 * }}
 */
function _mapStateToProps(state) {
    return {
        _conference: state['features/base/conference']
    };
}

export default connect(_mapStateToProps)(StatusLabel);
