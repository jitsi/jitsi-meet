import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconExclamationTriangle } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import { COLORS } from '../../../base/label/constants';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import getUnsafeRoomText from '../../../base/util/getUnsafeRoomText.web';
import AbstractInsecureRoomNameLabel, {
    IProps as AbstractProps,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractInsecureRoomNameLabel';

interface IProps extends AbstractProps {

    /**
     * Function for getting the unsafe room text.
     */
    getUnsafeRoomTextFn: Function;
}

/**
 * Renders a label indicating that we are in a room with an insecure name.
 */
class InsecureRoomNameLabel extends AbstractInsecureRoomNameLabel<IProps> {
    /**
     * Renders the platform dependent content.
     *
     * @inheritdoc
     */
    override _render() {
        return (
            <Tooltip
                content = { this.props.getUnsafeRoomTextFn(this.props.t) }
                position = 'bottom'>
                <Label
                    color = { COLORS.red }
                    icon = { IconExclamationTriangle } />
            </Tooltip>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState) {
    return {
        ..._abstractMapStateToProps(state),
        getUnsafeRoomTextFn: (t: Function) => getUnsafeRoomText(state, t, 'meeting')
    };
}

export default translate(connect(_mapStateToProps)(InsecureRoomNameLabel));
