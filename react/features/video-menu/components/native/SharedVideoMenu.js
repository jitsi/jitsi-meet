// @flow

import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';
import { Divider } from 'react-native-paper';

import { Avatar } from '../../../base/avatar';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, isDialogOpen } from '../../../base/dialog';
import {
    getParticipantById,
    getParticipantDisplayName
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { SharedVideoButton } from '../../../shared-video/components';
import { hideSharedVideoMenu } from '../../actions.native';

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
     * The color-schemed stylesheet of the BottomSheet.
     */
    _bottomSheetStyles: StyleType,

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

// eslint-disable-next-line prefer-const
let SharedVideoMenu_;

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
            styles: this.props._bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                renderHeader = { this._renderMenuHeader }
                showSlidingView = { _isParticipantAvailable }>
                <Divider style = { styles.divider } />
                <SharedVideoButton { ...buttonProps } />
            </BottomSheet>
        );
    }

    _onCancel: () => boolean;

    /**
     * Callback to hide the {@code SharedVideoMenu}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        if (this.props._isOpen) {
            this.props.dispatch(hideSharedVideoMenu());

            return true;
        }

        return false;
    }

    _renderMenuHeader: () => React$Element<any>;

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { _bottomSheetStyles, participantId } = this.props;

        return (
            <View
                style = { [
                    _bottomSheetStyles.sheet,
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
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _isOpen: isDialogOpen(state, SharedVideoMenu_),
        _isParticipantAvailable: Boolean(isParticipantAvailable),
        _participantDisplayName: getParticipantDisplayName(state, participantId)
    };
}

SharedVideoMenu_ = connect(_mapStateToProps)(SharedVideoMenu);

export default SharedVideoMenu_;
