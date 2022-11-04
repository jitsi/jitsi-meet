import React from 'react';
import {Icon, IconBookmark, IconTicket} from "../../../base/icons";
import {
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    SALESFORCE_LINK_NOTIFICATION_ID,
    showNotification
} from "../../../notifications";
import type {AbstractButtonProps} from "../../../base/toolbox/components";
import {getLocalizedDurationFormatter, translate} from "../../../base/i18n";
import {connect} from "../../../base/redux";
import {getConferenceTimestamp} from "../../../base/conference";
import {
    sendTranscriptText,
    toggleRequestingSubtitles
} from "../../../subtitles";
import {
    AbstractCaptions
} from "../../../subtitles/components/AbstractCaptions";
import type {Dispatch} from "redux";
import type {
    AbstractCaptionsProps
} from "../../../subtitles/components/AbstractCaptions";

export type Props = AbstractButtonProps & {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The URL of the conference.
     */
    url: string,

    /**
     * Value of current conference time.
     */
    timerValue: string,
    /**
     * The UTC timestamp representing the time when first participant joined.
     */
    _startTimestamp: ?number,
    /**
     * Whether the subtitles container is lifted above the invite box.
     */
    _isLifted: boolean, /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>, _transcript: $ObjMap,
    _sendTranscriptText: string,

} & AbstractCaptionsProps;

let notify = true;
let tokMarkStartTime = 0;
let tokMarkEndTime = 0;


class TokMarks extends AbstractCaptions<Props> {

    constructor() {
        super();
        this.notifyUser = this.notifyUser.bind(this);
    }

    notifyUser() {
        if (notify) {
            tokMarkStartTime = getLocalizedDurationFormatter(new Date().getTime() - this.props._startTimestamp);
            this.props.dispatch(toggleRequestingSubtitles());
            console.log('ClickTImer22', getLocalizedDurationFormatter(new Date().getTime() - this.props._startTimestamp));
            this.props.dispatch(showNotification({
                titleKey: 'Tok mark has been started',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.NORMAL
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
            notify = false;
        } else {
            tokMarkEndTime = getLocalizedDurationFormatter(new Date().getTime() - this.props._startTimestamp);
            this.props.dispatch(toggleRequestingSubtitles());
            console.log('ClickTImer66', getLocalizedDurationFormatter(new Date().getTime() - this.props._startTimestamp));
            console.log('_transcriptMessages11', this.props._sendTranscriptText);
            this.props.dispatch(showNotification({
                titleKey: 'Tok mark has been ended',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.NORMAL
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
            notify = true;
            this.props.dispatch(sendTranscriptText(''));
        }
    }

    render() {
        return (
            <div className={`invite-more-container${true ? '' : ' elevated'}`}>
                <div>
                    <div style={{
                        borderRadius: '40%',
                        margin: '10px'
                    }}
                         onClick={() => {
                             this.notifyUser()
                         }}>
                        <Icon src={IconBookmark}/>
                    </div>
                </div>
            </div>
        );
    }
}


function _mapStateToProps(state: Object) {
    const {
        _sendTranscriptText
    } = state['features/subtitles'];
    return {
        _startTimestamp: getConferenceTimestamp(state),
        _sendTranscriptText: _sendTranscriptText
    };
}

export default translate(connect(_mapStateToProps)(TokMarks));


