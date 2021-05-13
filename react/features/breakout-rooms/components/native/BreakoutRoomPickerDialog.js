// @flow

import React, { Component } from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { hideDialog, BottomSheet } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import {
    Icon, IconMeetingUnlocked
} from '../../../base/icons';
import { connect } from '../../../base/redux';
import { ColorPalette, type StyleType } from '../../../base/styles';
import { moveToRoom } from '../../actions';
import { selectBreakoutRooms, getCurrentRoomId } from '../../functions';

import styles from './styles';


/**
 * {@code BreakoutRoomPickerDialog}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * Style of the bottom sheet feature.
     */
    _bottomSheetStyles: StyleType,

    /**
     * Object describing breakout rooms.
     */
    _breakoutRooms: Array<Object>,

    /**
     * String containing the id of the current room.
     */
    _currentRoomId: string,

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * {@code AudioRoutePickerDialog}'s React {@code Component} state types.
 */
 type State = {};

/**
 * The exported React {@code Component}.
 */
let BreakoutRoomPickerDialog_; // eslint-disable-line prefer-const

/**
 * Implements a React {@code Component} which prompts the user
 * to choose a breakout room.
 */
class BreakoutRoomPickerDialog extends Component<Props, State> {

    /**
     * Initializes a new {@code BreakoutRoomPickerDialog} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
    }

    /**
     * Dispatches a redux action to hide this sheet.
     *
     * @returns {void}
     */
    _hide() {
        this.props.dispatch(hideDialog(BreakoutRoomPickerDialog_));
    }

    _onCancel: () => void;

    /**
     * Cancels the dialog by hiding it.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this._hide();
    }

    _onSelectBreakoutRoomFn: (Object) => Function;

    /**
     * Builds and returns a function which handles the selection of a breakout room
     * on the sheet. The selected breakout room will be joined.
     *
     * @param {Object} breakoutRoom - Object representing the selected breakout room.
     * @private
     * @returns {Function}
     */
    _onSelectBreakoutRoomFn(breakoutRoom: Object) {
        return () => {
            this._hide();
            this.props.dispatch(moveToRoom(breakoutRoom.id));
        };
    }

    /**
     * Renders a single breakout room.
     *
     * @param {Object} breakoutRoom - Object representing a single breakout room.
     * @private
     * @returns {ReactElement}
     */
    _renderBreakoutRoom(breakoutRoom: Object) {
        const { _currentRoomId, _bottomSheetStyles } = this.props;
        const selected = breakoutRoom.id === _currentRoomId;
        const selectedStyle = selected ? styles.selectedText : {};

        return (
            <TouchableHighlight
                key = { breakoutRoom.id }
                onPress = { this._onSelectBreakoutRoomFn(breakoutRoom) }
                underlayColor = { ColorPalette.overflowMenuItemUnderlay } >
                <View style = { styles.breakoutRoomRow } >
                    <Icon
                        src = { IconMeetingUnlocked }
                        style = { [ styles.breakoutRoomIcon, _bottomSheetStyles.buttons.iconStyle, selectedStyle ] } />
                    <Text
                        style = { [
                            styles.breakoutRoomText,
                            _bottomSheetStyles.buttons.labelStyle, selectedStyle
                        ] } >
                        { this.props.t('breakoutRooms.headings.breakoutRoom', { index: breakoutRoom.index,
                            count: 0 }) }
                    </Text>
                </View>
            </TouchableHighlight>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <BottomSheet onCancel = { this._onCancel }>
                { this.props._breakoutRooms.map(this._renderBreakoutRoom, this) }
            </BottomSheet>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object}
 */
function _mapStateToProps(state) {
    return {
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _breakoutRooms: selectBreakoutRooms(state),
        _currentRoomId: getCurrentRoomId(state)
    };
}

export default translate(connect(_mapStateToProps)(BreakoutRoomPickerDialog));
