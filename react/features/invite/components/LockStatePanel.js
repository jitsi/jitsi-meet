import React, { Component } from 'react';

import { translate } from '../../base/i18n';

/**
 * A React Component for displaying the conference lock state.
 */
class LockStatePanel extends Component {
    /**
     * {@code LockStatePanel}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the conference is currently locked.
         */
        locked: React.PropTypes.bool,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        let iconClass;
        let stateClass;
        let textKey;

        if (this.props.locked) {
            iconClass = 'icon-security-locked';
            stateClass = 'is-locked';
            textKey = 'invite.locked';
        } else {
            iconClass = 'icon-security';
            stateClass = 'is-unlocked';
            textKey = 'invite.unlocked';
        }

        return (
            <div className = { `lock-state ${stateClass}` }>
                <span className = { iconClass } />
                <span>
                    { this.props.t(textKey) }
                </span>
            </div>
        );
    }
}

export default translate(LockStatePanel);
