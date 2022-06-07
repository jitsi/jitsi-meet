import React, { useState, useEffect } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, Pressable, View, LogBox, Linking } from 'react-native';
import styles from './styles';
import { Icon, IconAdd, IconBookmark, IconDollar, IconCart, IconDollarGreen, IconCyclone, IconEightStreek, IconBeer, IconGem } from '../../../base/icons';
import API from '../services';
import { connect } from '../../../base/redux';
import { getFeatureFlag, MEETING_NAME_ENABLED } from '../../../base/flags';
import { isToolboxVisible } from '../../../toolbox/functions.native';
import { getConferenceName } from '../../../base/conference/functions';
import { SvgUri } from 'react-native-svg';


export type Props = {
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
const ConnectingButtons = (props: Props) => {
  const [adsList, setAdsList] = useState([]);
  const [time, setTime] = useState(0);
  const [loading, setLoading] = useState(false);

  const listOfAds = [];
  const meetingName = props._meetingName.trim()

  useEffect(() => {
    (async () => {
      setLoading(true);
      let res = {
        roomName: meetingName
      }
      let adsData = await API.request('GET', 'iconAds', res);
      if (adsData.status == 1) {
        for (let i = 0; i < adsData.data.length; i++) {
          listOfAds.push(adsData.data[i])
        }
        setAdsList(listOfAds)
        setLoading(false)
      }
    })()
  }, [adsList])
  useEffect(() => {
    setTimeout(() => {
      setTime(time + 2 > adsList.length - 1 ? 0 : time + 2)
    }, 10000)
  }, [time])
  return (
    <View style={styles.ScreenButtons}>
      {adsList.map((value, index) => {
        return (
          <View>
            {time == index || time + 1 == index ?
              <View>
                <TouchableOpacity onPress={() => Linking.openURL(value.url)}><View>
                  <SvgUri width='40' height='40' uri={value.iconUrl} />
                  <Text style={styles.urlText}>{value.title}</Text>
                </View>
                </TouchableOpacity>
              </View>
              : null}
          </View>
        )
      })}
    </View>
  );
}
function _mapStateToProps(state) {
  return {
    _meetingName: getConferenceName(state),
    _meetingNameEnabled:
      getFeatureFlag(state, MEETING_NAME_ENABLED, true),
    _visible: isToolboxVisible(state)
  };
}
export default connect(_mapStateToProps)(ConnectingButtons);