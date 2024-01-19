import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import ExpandedLabel, { IProps as AbstractProps } from '../../../base/label/components/native/ExpandedLabel';
import getUnsafeRoomText from '../../../base/util/getUnsafeRoomText.native';

import { INSECURE_ROOM_NAME_LABEL_COLOR } from './styles';

interface IProps extends AbstractProps, WithTranslation {
    getUnsafeRoomTextFn: Function;
}

/**
 * A react {@code Component} that implements an expanded label as tooltip-like
 * component to explain the meaning of the {@code InsecureRoomNameExpandedLabel}.
 */
class InsecureRoomNameExpandedLabel extends ExpandedLabel<IProps> {
    /**
     * Returns the color this expanded label should be rendered with.
     *
     * @returns {string}
     */
    _getColor() {
        return INSECURE_ROOM_NAME_LABEL_COLOR;
    }

    /**
     * Returns the label specific text of this {@code ExpandedLabel}.
     *
     * @returns {string}
     */
    _getLabel() {
        return this.props.getUnsafeRoomTextFn(this.props.t);
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        getUnsafeRoomTextFn: (t: Function) => getUnsafeRoomText(state, t, 'meeting')
    };
}

export default translate(connect(_mapStateToProps)(InsecureRoomNameExpandedLabel));
