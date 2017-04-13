import React, { Component } from 'react';

import { translate } from '../../base/i18n';

/**
 * A React Component for displaying the conference lock state.
 */
class LockStatePanel extends Component {
    /**
     * LockStatePanel component's property types.
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
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const [ lockStateClass, lockIconClass, lockTextKey ] = this.props.locked
            ? [ 'is-locked', 'icon-security-locked', 'invite.locked' ]
            : [ 'is-unlocked', 'icon-security', 'invite.unlocked' ];

        return (
            <div className = { `lock-state ${lockStateClass}` }>
                <span className = { lockIconClass } />
                <span>
                    { this.props.t(lockTextKey) }
                </span>
            </div>
        );
    }
}

export default translate(LockStatePanel);
