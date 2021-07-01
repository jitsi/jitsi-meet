// @flow

import Slider from '@react-native-community/slider';
import _ from 'lodash';
import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { withTheme } from 'react-native-paper';

import { translate } from '../../../base/i18n';
import { Icon, IconVolumeEmpty } from '../../../base/icons';
import {
    getLocalParticipant,
    getParticipantById
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { setVolume } from '../../../participants-pane/actions.native';
import { VOLUME_SLIDER_SCALE } from '../../constants';

/**
 * The type of the React {@code Component} props of {@link VolumeSlider}.
 */
type Props = {

    /**
     * Whether the participant enters the conference silent.
     */
    _startSilent: boolean,

    /**
     * The volume level for the participant.
     */
    _volume: number,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * Participant reference
     */
    participant: Object,

    /**
     * Theme used for styles.
     */
    theme: Object
};

/**
 * The type of the React {@code Component} state of {@link VolumeSlider}.
 */
type State = {

    /**
     * The volume of the participant's audio element. The value will
     * be represented by a slider.
     */
    volumeLevel: number
};

/**
 * Component that renders the volume slider.
 *
 * @returns {React$Element<any>}
 */
class VolumeSlider extends PureComponent<Props, State> {
    _onVolumeChange: Function;
    _originalVolumeChange: Function;

    /**
     * Initializes a new {@code VolumeSlider} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            volumeLevel: props._volume || 0
        };

        this._originalVolumeChange = this._onVolumeChange;

        this._onVolumeChange = _.throttle(
            volumeLevel => this._originalVolumeChange(volumeLevel), 500
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _startSilent, theme } = this.props;
        const { volumeLevel } = this.state;
        const { palette } = theme;
        const onVolumeChange = _startSilent ? undefined : this._onVolumeChange;

        return (
            <View>
                <Icon
                    size = { 24 }
                    src = { IconVolumeEmpty } />
                <Slider
                    maximumTrackTintColor = { palette.field02 }
                    maximumValue = { VOLUME_SLIDER_SCALE }
                    minimumTrackTintColor = { palette.action01 }
                    minimumValue = { 0 }
                    onValueChange = { onVolumeChange }
                    thumbTintColor = { palette.field02 }
                    value = { volumeLevel } />
            </View>

        );
    }

    /**
     * Sets the internal state of the volume level for the volume slider.
     * Invokes the prop onVolumeChange to notify of volume changes.
     *
     * @param {number} volumeLevel - Selected volume on slider.
     * @private
     * @returns {void}
     */
    _onVolumeChange(volumeLevel) {
        const { dispatch, participant } = this.props;
        const { id } = participant;

        dispatch(setVolume(id, volumeLevel));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code VolumeSlider} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @returns {Props}
 */
function mapStateToProps(state, ownProps): Object {
    const { participant } = ownProps;
    const { startSilent } = state['features/base/config'];
    const { participantsVolume } = state['features/participants-pane'];
    const getParticipant = participant.id
        ? getParticipantById(state, participant.id) : getLocalParticipant(state);
    const { id } = getParticipant;

    return {
        _startSilent: Boolean(startSilent),
        _volume: participant.local ? undefined : participantsVolume[id]
    };
}

export default translate(connect(mapStateToProps)(withTheme(VolumeSlider)));

