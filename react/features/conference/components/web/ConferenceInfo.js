// @flow

/* eslint-disable react/no-multi-comp */

import React, { Component } from 'react';

import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { connect } from '../../../base/redux';
import { E2EELabel } from '../../../e2ee';
import { RecordingLabel } from '../../../recording';
import HighlightButton from '../../../recording/components/Recording/web/HighlightButton';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import { TranscribingLabel } from '../../../transcribing';
import { VideoQualityLabel } from '../../../video-quality';
import ConferenceTimer from '../ConferenceTimer';
import { getConferenceInfo } from '../functions';

import ConferenceInfoContainer from './ConferenceInfoContainer';
import InsecureRoomNameLabel from './InsecureRoomNameLabel';
import ParticipantsCount from './ParticipantsCount';
import RaisedHandsCountLabel from './RaisedHandsCountLabel';
import SubjectText from './SubjectText';

/**
 * The type of the React {@code Component} props of {@link Subject}.
 */
type Props = {

    /**
     * The conference info labels to be shown in the conference header.
     */
    _conferenceInfo: Object,

    /**
     * Indicates whether the component should be visible or not.
     */
    _visible: boolean
};

const COMPONENTS = [
    {
        Component: HighlightButton,
        id: 'highlight-moment'
    },
    {
        Component: SubjectText,
        id: 'subject'
    },
    {
        Component: ConferenceTimer,
        id: 'conference-timer'
    },
    {
        Component: ParticipantsCount,
        id: 'participants-count'
    },
    {
        Component: E2EELabel,
        id: 'e2ee'
    },
    {
        Component: () => (
            <>
                <RecordingLabel mode = { JitsiRecordingConstants.mode.FILE } />
                <RecordingLabel mode = { JitsiRecordingConstants.mode.STREAM } />
            </>
        ),
        id: 'recording'
    },
    {
        Component: RaisedHandsCountLabel,
        id: 'raised-hands-count'
    },
    {
        Component: TranscribingLabel,
        id: 'transcribing'
    },
    {
        Component: VideoQualityLabel,
        id: 'video-quality'
    },
    {
        Component: InsecureRoomNameLabel,
        id: 'insecure-room'
    }
];

/**
 * The upper band of the meeing containing the conference name, timer and labels.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$None}
 */
class ConferenceInfo extends Component<Props> {
    /**
     * Initializes a new {@code ConferenceInfo} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._renderAutoHide = this._renderAutoHide.bind(this);
        this._renderAlwaysVisible = this._renderAlwaysVisible.bind(this);
    }

    _renderAutoHide: () => void;

    /**
     * Renders auto-hidden info header labels.
     *
     * @returns {void}
     */
    _renderAutoHide() {
        const { autoHide } = this.props._conferenceInfo;

        if (!autoHide || !autoHide.length) {
            return null;
        }

        return (
            <ConferenceInfoContainer
                id = 'autoHide'
                visible = { this.props._visible }>
                {
                    COMPONENTS
                        .filter(comp => autoHide.includes(comp.id))
                        .map(c =>
                            <c.Component key = { c.id } />
                        )
                }
            </ConferenceInfoContainer>
        );
    }

    _renderAlwaysVisible: () => void;

    /**
     * Renders the always visible info header labels.
     *
     * @returns {void}
     */
    _renderAlwaysVisible() {
        const { alwaysVisible } = this.props._conferenceInfo;

        if (!alwaysVisible || !alwaysVisible.length) {
            return null;
        }

        return (
            <ConferenceInfoContainer
                id = 'alwaysVisible'
                visible = { true } >
                {
                    COMPONENTS
                        .filter(comp => alwaysVisible.includes(comp.id))
                        .map(c =>
                            <c.Component key = { c.id } />
                        )
                }
            </ConferenceInfoContainer>
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
            <div className = 'details-container' >
                { this._renderAlwaysVisible() }
                { this._renderAutoHide() }
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _visible: boolean,
 *     _conferenceInfo: Object
 * }}
 */
function _mapStateToProps(state) {
    return {
        _visible: isToolboxVisible(state),
        _conferenceInfo: getConferenceInfo(state)
    };
}

export default connect(_mapStateToProps)(ConferenceInfo);
