import React, { PureComponent } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { Divider } from 'react-native-paper';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { hideSheet } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import { bottomSheetStyles } from '../../../base/dialog/components/native/styles';
import {
    getParticipantById,
    getParticipantDisplayName
} from '../../../base/participants/functions';
import SharedVideoButton from '../../../shared-video/components/native/SharedVideoButton';

import styles from './styles';

/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 24;

interface IProps {

    /**
     * True if the menu is currently open, false otherwise.
     */
    _isOpen: boolean;

    /**
     * Whether the participant is present in the room or not.
     */
    _isParticipantAvailable?: boolean;

    /**
     * Display name of the participant retrieved from Redux.
     */
    _participantDisplayName: string;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The ID of the participant for which this menu opened for.
     */
    participantId: string;
}

/**
 * Class to implement a popup menu that opens upon long pressing a fake participant thumbnail.
 */
class SharedVideoMenu extends PureComponent<IProps> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._renderMenuHeader = this._renderMenuHeader.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _isParticipantAvailable,
            participantId
        } = this.props;

        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            participantID: participantId,
            styles: bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
                renderHeader = { this._renderMenuHeader }
                showSlidingView = { _isParticipantAvailable }>
                {/* @ts-ignore */}
                <Divider style = { styles.divider as ViewStyle } />
                <SharedVideoButton { ...buttonProps } />
            </BottomSheet>
        );
    }

    /**
     * Callback to hide the {@code SharedVideoMenu}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        this.props.dispatch(hideSheet());
    }

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { participantId } = this.props;

        return (
            <View
                style = { [
                    bottomSheetStyles.sheet,
                    styles.participantNameContainer ] as ViewStyle[] }>
                <Avatar
                    participantId = { participantId }
                    size = { AVATAR_SIZE } />
                <Text style = { styles.participantNameLabel as TextStyle }>
                    { this.props._participantDisplayName }
                </Text>
            </View>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantId } = ownProps;
    const isParticipantAvailable = getParticipantById(state, participantId);

    return {
        _isParticipantAvailable: Boolean(isParticipantAvailable),
        _participantDisplayName: getParticipantDisplayName(state, participantId)
    };
}

export default connect(_mapStateToProps)(SharedVideoMenu);
