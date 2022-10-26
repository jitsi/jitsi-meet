// @flow

import React, { useEffect, useState } from 'react';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import {
    isButtonEnabled,
    isToolboxEnabled
} from '../../../toolbox/functions.web';
import { getFeatureFlag, MEETING_NAME_ENABLED } from '../../../base/flags';
import { getConferenceName } from '../../../base/conference/functions';
import API from '../services';
import { isMobileBrowser } from '../../../base/environment/utils';
import './Connect.css';

declare var interfaceConfig: Object;

export type Props = {

    /**
     * Whether to show the option to invite more people.
     */
    _shouldShow: boolean,

    /**
     * Whether the toolbox is visible.
     */
    _toolboxVisible: boolean,

    /**
     * Handler to open the invite dialog.
     */
    onClick: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,
    dispatch: Function,
    /**
     * Name of the meeting we're currently in.
     */
    _meetingName: string,
    /**
     * Whether displaying the current meeting name is enabled or not.
     */
    _meetingNameEnabled: boolean,
    /**
     * True if the navigation bar should be visible.
     */
    _visible: boolean,
    /**
     * Display  translated strings..
     */
    _sendTranscriptBite: string
}

/**
 * Represents a replacement for the subject, prompting the
 * sole participant to invite more participants.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element<any>}
 */

const listOfAds = [];

const ConnectButtons = (props: Props) => {

    const [ timer, setTimer ] = useState(0);
    const [ adsList, setAdsList ] = useState([]);
    const [ loading, setLoading ] = useState(false);

    const meetingName = props._meetingName.trim();

    useEffect(() => {
        let cancel = false;
        (async () => {
            setLoading(true);
            const res = {
                roomName: meetingName
            };
            let webAdsData = await API.request('GET', 'iconAds', res);
            if (cancel) {
                return;
            }
            if (webAdsData.status === 1) {
                for (let i = 0; i < webAdsData.data.length; i++) {
                    listOfAds.push(webAdsData.data[i]);
                }
                setAdsList(listOfAds);
                setLoading(false);
            }
        })();
        return () => {
            cancel = true;
        };
    }, [ adsList ]);


    setTimeout(() => {
        setTimer(timer + 2 > adsList.length - 1 ? 0 : timer + 2);
    }, 10000);
    return (
        <div style={{ display: 'flex' }}
             className={`invite-more-container${true ? '' : ' elevated'}`}>
            {adsList.map((value, index) => {
                return (
                    <div key={index}>
                        {timer === index || timer + 1 === index ?
                            <div className="urlHeader">
                                <div className="alignment">
                                    <img className="showImg"
                                         onClick={() => {
                                             if (isMobileBrowser()) {
                                                 if (window.flutter_inappwebview) {
                                                     console.log('beforeArgs');
                                                     const args = 'http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/114';
                                                     console.log('afterArgs', args);
                                                     window.flutter_inappwebview.callHandler('myHandlerName', args);
                                                     console.log('addsUrl', args);
                                                 } else {
                                                     console.log('InAppWebViewNotLoaded');
                                                 }
                                             } else {
                                                 window.open('http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/114');
                                             }

                                         }}
                                         src={value.iconUrl}/>
                                    {/* <p className='urlP'>{value.title}</p> */}
                                    <p style={{
                                        textAlign: 'start',
                                        fontSize: '14px',
                                        color: 'white',
                                        paddingLeft: '10%'
                                    }}>{props._sendTranscriptBite}</p>
                                </div>
                            </div> : null}
                    </div>
                );
            })}
        </div>
    );
};


/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    // const participantCount = getParticipantCount(state);
    // const isAlone = participantCount === 1;
    // const hide = interfaceConfig.HIDE_INVITE_MORE_HEADER;
    const { _sendTranscriptBite } = state['features/subtitles'];

    return {
        _shouldShow: isButtonEnabled('invite', state),
        _toolboxVisible: isToolboxEnabled(state),
        _meetingName: getConferenceName(state),
        _meetingNameEnabled:
            getFeatureFlag(state, MEETING_NAME_ENABLED, true),
        // _visible: isToolboxVisible(state)
        _sendTranscriptBite: _sendTranscriptBite
    };
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {Props}
 */

export default translate(connect(mapStateToProps)(ConnectButtons));
