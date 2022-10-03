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
    _visible: boolean
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
                            <div style={{
                                flexDirection: 'row',
                                height: '50px',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginLeft: '16px'

                            }}>
                                <div style={{
                                    marginTop: '3px',
                                    marginBottom: '3px',
                                    height: '34px',
                                    marginLeft: '3px',
                                    marginRight: '3px',
                                    width: '49px',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <img style={{
                                        height: '28px',
                                        width: '40px'
                                    }}
                                         onClick={() => {
                                             if (isMobileBrowser()) {
                                                 if (window.flutter_inappwebview) {
                                                     console.log('beforeArgs');
                                                     const args = `${value.url}`;
                                                     console.log('afterArgs', args);
                                                     window.flutter_inappwebview.callHandler('myHandlerName', args);
                                                     console.log('addsUrl', args);
                                                 } else {
                                                     console.log('InAppWebViewNotLoaded');
                                                 }
                                             } else {
                                                 window.open(value.url);
                                             }

                                         }}
                                         src={value.iconUrl}/>
                                    <p style={{
                                        textAlign: 'center',
                                        fontSize: '14px',
                                        color: 'white'
                                    }}>{value.title}</p>
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

    return {
        _shouldShow: isButtonEnabled('invite', state),
        _toolboxVisible: isToolboxEnabled(state),
        _meetingName: getConferenceName(state),
        _meetingNameEnabled:
            getFeatureFlag(state, MEETING_NAME_ENABLED, true)
        // _visible: isToolboxVisible(state)
    };
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {Props}
 */

export default translate(connect(mapStateToProps)(ConnectButtons));
