import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { BottomSheet } from '../../../base/dialog';
import { bottomSheetStyles } from '../../../base/dialog/components/native/styles';
import { translate } from '../../../base/i18n';
import {
    getLocalParticipant,
    getParticipantDisplayName
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import ToggleSelfViewButton from '../../../toolbox/components/native/ToggleSelfViewButton';

import ConnectionStatusButton from './ConnectionStatusButton';
import styles from './styles';


/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 24;

type Props = {

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

        this._renderMenuHeader = this._renderMenuHeader.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _participant } = this.props;
        const buttonProps = {
            showLabel: true,
            participantID: _participant.id,
            styles: bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
                renderHeader = { this._renderMenuHeader }
                showSlidingView = { true }>
                <ToggleSelfViewButton { ...buttonProps } />
                <ConnectionStatusButton { ...buttonProps } />
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
        _participant: participant,
        _participantDisplayName: getParticipantDisplayName(state, participant.id)
    };
}

export default translate(connect(_mapStateToProps)(LocalVideoMenu));
