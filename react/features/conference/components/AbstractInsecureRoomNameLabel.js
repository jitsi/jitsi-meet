// @flow

import { PureComponent } from 'react';

import isInsecureRoomName from '../../base/util/isInsecureRoomName';

type Props = {

    /**
     * True of the label should be visible.
     */
    _visible: boolean;

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
}

/**
 * Abstrsact class for the {@Code InsecureRoomNameLabel} component.
 */
export default class AbstractInsecureRoomNameLabel extends PureComponent<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._visible) {
            return null;
        }

        return this._render();
    }

    /**
     * Renders the platform dependant content.
     *
     * @returns {ReactElement}
     */
    _render: () => Object;
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object): $Shape<Props> {
    const { locked, room } = state['features/base/conference'];
    const { lobbyEnabled } = state['features/lobby'];
    const { enableInsecureRoomNameWarning = false } = state['features/base/config'];

    return {
        _visible: enableInsecureRoomNameWarning
            && room && isInsecureRoomName(room)
            && !(lobbyEnabled || Boolean(locked))
    };
}
