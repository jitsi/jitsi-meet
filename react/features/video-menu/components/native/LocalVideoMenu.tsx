import React, { PureComponent } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { hideSheet } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import { bottomSheetStyles } from '../../../base/dialog/components/native/styles';
import { translate } from '../../../base/i18n/functions';
import {
    getLocalParticipant,
    getParticipantCount,
    getParticipantDisplayName
} from '../../../base/participants/functions';
import { ILocalParticipant } from '../../../base/participants/types';
import ToggleSelfViewButton from '../../../toolbox/components/native/ToggleSelfViewButton';

import ConnectionStatusButton from './ConnectionStatusButton';
import DemoteToVisitorButton from './DemoteToVisitorButton';
import styles from './styles';

/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 24;

interface IProps {

    /**
     * The local participant.
     */
    _participant?: ILocalParticipant;

    /**
     * Display name of the participant retrieved from Redux.
     */
    _participantDisplayName: string;

    /**
     * Shows/hides the local switch to visitor button.
     */
    _showDemote: boolean;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Translation function.
     */
    t: Function;
}

/**
 * Class to implement a popup menu that opens upon long pressing a thumbnail.
 */
class LocalVideoMenu extends PureComponent<IProps> {
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
    override render() {
        const { _participant, _showDemote } = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            participantID: _participant?.id ?? '',
            styles: bottomSheetStyles.buttons
        };

        const connectionStatusButtonProps = {
            ...buttonProps,
            afterClick: undefined
        };

        return (
            <BottomSheet
                renderHeader = { this._renderMenuHeader }
                showSlidingView = { true }>
                <ToggleSelfViewButton { ...buttonProps } />
                { _showDemote && <DemoteToVisitorButton { ...buttonProps } /> }
                <ConnectionStatusButton { ...connectionStatusButtonProps } />
            </BottomSheet>
        );
    }

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { _participant } = this.props;

        return (
            <View
                style = { [
                    bottomSheetStyles.sheet,
                    styles.participantNameContainer ] as ViewStyle[] }>
                <Avatar
                    participantId = { _participant?.id }
                    size = { AVATAR_SIZE } />
                <Text style = { styles.participantNameLabel as TextStyle }>
                    { this.props._participantDisplayName }
                </Text>
            </View>
        );
    }

    /**
     * Callback to hide the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        this.props.dispatch(hideSheet());
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { disableSelfDemote } = state['features/base/config'];
    const participant = getLocalParticipant(state);

    return {
        _participant: participant,
        _participantDisplayName: getParticipantDisplayName(state, participant?.id ?? ''),
        _showDemote: !disableSelfDemote && getParticipantCount(state) > 1
    };
}

export default translate(connect(_mapStateToProps)(LocalVideoMenu));
