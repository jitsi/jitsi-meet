// @flow

import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { connect } from 'react-redux';

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

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the participant for which this menu opened for.
     */
    participantId: string,

    /**
     * True if the menu is currently open, false otherwise.
     */
    _isOpen: boolean,

    /**
     * Whether the participant is present in the room or not.
     */
    _isParticipantAvailable?: boolean,

    /**
     * Display name of the participant retrieved from Redux.
     */
    _participantDisplayName: string,
}

/**
 * Class to implement a popup menu that opens upon long pressing a fake participant thumbnail.
 */
class SharedVideoMenu extends PureComponent<Props> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
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
                <Divider style = { styles.divider } />
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
                    styles.participantNameContainer ] }>
                <Avatar
                    participantId = { participantId }
                    size = { AVATAR_SIZE } />
                <Text style = { styles.participantNameLabel }>
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
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const { participantId } = ownProps;
    const isParticipantAvailable = getParticipantById(state, participantId);

    return {
        _isParticipantAvailable: Boolean(isParticipantAvailable),
        _participantDisplayName: getParticipantDisplayName(state, participantId)
    };
}

export default connect(_mapStateToProps)(SharedVideoMenu);
