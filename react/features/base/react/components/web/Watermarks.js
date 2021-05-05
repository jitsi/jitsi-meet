/* @flow */
/* eslint-disable require-jsdoc,max-len*/
import React, { Component } from 'react';

import { translate } from '../../../i18n';
import {
    getParticipantCount
} from '../../../participants';
import { connect } from '../../../redux';
import { getRemoteTracks } from '../../../tracks';
import { shouldShowPreCallMessage } from '../../functions';

import PreCallMessage from './PreCallMessage';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link Watermarks}.
 */
type Props = {

    /**
     * Whether or not the current user is logged in through a JWT.
     */
    _isGuest: boolean,
    conferenceHasStarted: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,
    showPreCallMessage: boolean,
    hasPreCallMessage: boolean,
    isWelcomePage: boolean,
};

/**
 * The type of the React {@code Component} state of {@link Watermarks}.
 */
type State = {

    /**
     * The url to open when clicking the brand watermark.
     */
    brandWatermarkLink: string,

    /**
     * The url to open when clicking the Jitsi watermark.
     */
    jitsiWatermarkLink: string,

    /**
     * Whether or not the brand watermark should be displayed.
     */
    showBrandWatermark: boolean,

    /**
     * Whether or not the Jitsi watermark should be displayed.
     */
    showJitsiWatermark: boolean,

    /**
     * Whether or not the Jitsi watermark should be displayed for users not
     * logged in through a JWT.
     */
    showJitsiWatermarkForGuests: boolean,

    /**
     * Whether or not the show the "powered by Jitsi.org" link.
     */
    showPoweredBy: boolean,
};

/**
 * A Web Component which renders watermarks such as Jits, brand, powered by,
 * etc.
 */
class Watermarks extends Component<Props, State> {
    /**
     * Initializes a new Watermarks instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        let showBrandWatermark;
        let showJitsiWatermark;
        let showJitsiWatermarkForGuests;

        if (interfaceConfig.filmStripOnly) {
            showBrandWatermark = false;
            showJitsiWatermark = false;
            showJitsiWatermarkForGuests = false;
        } else {
            showBrandWatermark = interfaceConfig.SHOW_BRAND_WATERMARK;
            showJitsiWatermark = interfaceConfig.SHOW_JITSI_WATERMARK;
            showJitsiWatermarkForGuests
                = interfaceConfig.SHOW_WATERMARK_FOR_GUESTS;
        }

        this.state = {
            brandWatermarkLink:
                showBrandWatermark ? interfaceConfig.BRAND_WATERMARK_LINK : '',
            jitsiWatermarkLink:
                showJitsiWatermark || showJitsiWatermarkForGuests
                    ? interfaceConfig.JITSI_WATERMARK_LINK : '',
            showBrandWatermark,
            showJitsiWatermark,
            showJitsiWatermarkForGuests,
            showPoweredBy: interfaceConfig.SHOW_POWERED_BY
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div>
                {
                    this._renderWatermark()
                }
            </div>
        );
    }

    /**
     * Renders a watermark if it is enabled.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderWatermark() {
        const { conferenceHasStarted, showPreCallMessage } = this.props;

        return (<div
            className = { `watermark ${conferenceHasStarted || !showPreCallMessage ? '' : 'watermark-with-background'}` }>
            <div
                className = { `leftwatermark ${conferenceHasStarted || !showPreCallMessage ? '' : 'animate-flicker'}` } />
            {
                showPreCallMessage
                && <PreCallMessage />
            }
        </div>);
    }
}

/**
 * Maps parts of Redux store to component prop types.
 *
 * @param {Object} state - Snapshot of Redux store.
 * @param {Object} props - The read-only properties with which the new
 * instance is to be initialized.
 * @returns {{
 *      _isGuest: boolean
 * }}
 */
function _mapStateToProps(state, props) {
    const { isGuest } = state['features/base/jwt'];
    const { isWelcomePage } = props;
    const participantCount = getParticipantCount(state);
    const remoteTracks = getRemoteTracks(state['features/base/tracks']);
    const showPreCallMessage = !isWelcomePage && shouldShowPreCallMessage(state);

    return {
        _isGuest: isGuest,
        conferenceHasStarted: participantCount > 1 && remoteTracks.length > 0,
        showPreCallMessage
    };
}

export default connect(_mapStateToProps)(translate(Watermarks));
