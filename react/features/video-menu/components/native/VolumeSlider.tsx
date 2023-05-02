import Slider from '@react-native-community/slider';
import _ from 'lodash';
import React, { PureComponent } from 'react';
import { View, ViewStyle } from 'react-native';
import { withTheme } from 'react-native-paper';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconVolumeUp } from '../../../base/icons/svg';
import { setVolume } from '../../../participants-pane/actions.native';
import { VOLUME_SLIDER_SCALE } from '../../constants';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link VolumeSlider}.
 */
interface IProps {

    /**
     * Whether the participant enters the conference silent.
     */
    _startSilent: boolean;

    /**
     * The volume level for the participant.
     */
    _volume: number;

    /**
     * The redux dispatch function.
     */
    dispatch: Function;

    /**
     * The ID of the participant.
     */
    participantID: string;

    /**
     * Theme used for styles.
     */
    theme: any;
}

/**
 * The type of the React {@code Component} state of {@link VolumeSlider}.
 */
interface IState {

    /**
     * The volume of the participant's audio element. The value will
     * be represented by a slider.
     */
    volumeLevel: number;
}

/**
 * Component that renders the volume slider.
 *
 * @returns {React$Element<any>}
 */
class VolumeSlider extends PureComponent<IProps, IState> {
    _originalVolumeChange: Function;

    /**
     * Initializes a new {@code VolumeSlider} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
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
            <View style = { styles.volumeSliderContainer as ViewStyle } >
                <Icon
                    size = { 24 }
                    src = { IconVolumeUp } />
                <Slider
                    maximumTrackTintColor = { palette.ui10 }
                    maximumValue = { VOLUME_SLIDER_SCALE }
                    minimumTrackTintColor = { palette.action01 }
                    minimumValue = { 0 }
                    onValueChange = { onVolumeChange }
                    style = { styles.sliderContainer as ViewStyle }
                    thumbTintColor = { palette.ui10 }
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
    _onVolumeChange(volumeLevel: number) {
        const { dispatch, participantID } = this.props;

        dispatch(setVolume(participantID, volumeLevel));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code VolumeSlider} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantID } = ownProps;
    const { participantsVolume } = state['features/participants-pane'];
    const { startSilent } = state['features/base/config'];

    return {
        _startSilent: Boolean(startSilent),
        _volume: participantID && participantsVolume[participantID]
    };
}

export default connect(mapStateToProps)(withTheme(VolumeSlider));

