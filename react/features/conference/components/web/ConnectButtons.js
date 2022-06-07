// @flow

import React, { useState, useEffect } from 'react';
import { translate } from '../../../base/i18n';
import { Icon, IconAdd, IconGem, IconBeer, IconEightStreek, IconCyclone, IconDollarGreen } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { isButtonEnabled, isToolboxVisible } from '../../../toolbox/functions.web';
// import { Modal, Button } from "react-bootstrap";
import { openDialog, toggleDialog } from '../../../base/dialog';
import { getFeatureFlag, MEETING_NAME_ENABLED } from '../../../base/flags';
import { getConferenceName } from '../../../base/conference/functions';
import { isToolboxEnabled } from '../../../toolbox/functions.web';
import API from '../services';

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

  const [timer, setTimer] = useState(false);
  const [adsList, setAdsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const meetingName = props._meetingName.trim()

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = {
        roomName: meetingName
      }
      let adsData = await API.request('GET', 'iconAds', res);
      if (adsData.status == 1) {
        for (let i = 0; i < adsData.data.length; i++) {
          listOfAds.push(adsData.data[i]);
        }
        setAdsList(listOfAds)
        setLoading(false);
      }
    })()
  }, [adsList])
  useEffect
  useEffect(() => {
    setTimeout(() => {
      setTimer(timer + 2 > adsList.length - 1 ? 0 : timer + 2)
    }, 10000)
  }, [timer])
  return (
    true
      ? <div style={{ display: 'flex' }} className={`invite-more-container${true ? '' : ' elevated'}`}>
        {adsList.map((value, index) => {
          return (
            <div>
              {timer == index || timer + 1 == index ?
                <div>
                  <div style={{ borderRadius: '40%', margin: '10px' }}
                    className='invite-more-button'
                    onClick={() => { window.open(value.url) }}>
                    <img src={value.iconUrl} />
                  </div>
                  <div>
                    <p style={{ textAlign: 'center', fontWeight: 'bold' }}>{value.title}</p>
                  </div>
                </div> : null}
            </div>
          )
        })}
      </div> : null
  );
}


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
      getFeatureFlag(state, MEETING_NAME_ENABLED, true),
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
