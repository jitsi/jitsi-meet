// @flow

import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, isDialogOpen } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import {
    getLocalParticipant,
    getParticipantDisplayName
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import ToggleSelfViewButton from '../../../toolbox/components/native/ToggleSelfViewButton';
import { hideLocalVideoMenu } from '../../actions.native';

import ConnectionStatusButton from './ConnectionStatusButton';
import styles from './styles';


/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 24;

type Props = {

    /**
     * The color-schemed stylesheet of the BottomSheet.
     */
    _bottomSheetStyles: StyleType,

    /**
     * True if the menu is currently open, false otherwise.
     */
    _isOpen: boolean,

    /**
     * The local participant.
     */
    _participant: Object,

    /**
     * Display name of the participant retrieved from Redux.
     */
    _participantDisplayName: string,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Translation function.
     */
    t: Function
}

// eslint-disable-next-line prefer-const
let LocalVideoMenu_;

/**
 * Class to implement a popup menu that opens upon long pressing a thumbnail.
 */
class LocalVideoMenu extends PureComponent<Props> {
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
        const { _participant, _bottomSheetStyles } = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            participantID: _participant.id,
            styles: _bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                renderHeader = { this._renderMenuHeader }
                showSlidingView = { true }>
                <ToggleSelfViewButton { ...buttonProps } />
                <ConnectionStatusButton { ...buttonProps } />
            </BottomSheet>
        );
    }

    _onCancel: () => boolean;

    /**
     * Callback to hide the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        if (this.props._isOpen) {
            this.props.dispatch(hideLocalVideoMenu());

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
        const { _bottomSheetStyles, _participant } = this.props;

        return (
            <View
                style = { [
                    _bottomSheetStyles.sheet,
                    styles.participantNameContainer ] }>
                <Avatar
                    participantId = { _participant.id }
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
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const participant = getLocalParticipant(state);

    return {
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _isOpen: isDialogOpen(state, LocalVideoMenu_),
        _participant: participant,
        _participantDisplayName: getParticipantDisplayName(state, participant.id)
    };
}

LocalVideoMenu_ = translate(connect(_mapStateToProps)(LocalVideoMenu));

export default LocalVideoMenu_;
