import React, {useEffect, useState} from 'react';
import {FlatList, Linking, Text, TouchableOpacity, View} from 'react-native';
import styles from './styles';
import API from '../services';
import {connect} from '../../../base/redux';
import {getFeatureFlag, MEETING_NAME_ENABLED} from '../../../base/flags';
import {isToolboxVisible} from '../../../toolbox/functions.native';
import {getConferenceName} from '../../../base/conference/functions';
import {SvgUri} from 'react-native-svg';


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
const listOfAds = [];

const ConnectingButtons = (props: Props) => {
    const [adsList, setAdsList] = useState([]);
    const [time, setTime] = useState(false);
    const [loading, setLoading] = useState(false);


    const meetingName = props._meetingName.trim()

    useEffect(() => {
        let cancel = false;
        (async () => {
            setLoading(true);
            let res = {
                roomName: meetingName
            }
            let adsData = await API.request('GET', 'iconAds', res);
            if (cancel) return;
            if (adsData.status === 1) {
                for (let i = 0; i < adsData.data.length; i++) {
                    listOfAds.push(adsData.data[i]);
                }
                setAdsList(listOfAds)
                setLoading(false)
            }
        })()
        return () => {
            cancel = true;
        }
    }, [])

    useEffect(() => {
     const timer = setTimeout(() => {
            setTime(time + 2 > adsList.length - 1 ? 0 : time + 2)
        }, 10000)
        return ()=> {
         clearTimeout(timer);
        }
    }, [time])
    return (
        <View style={styles.ScreenButtons}>
            <FlatList
                data={adsList}
                keyExtractor={(item, index) => index.toString()}
                horizontal={true}
                renderItem={({item, index}) => {
                    return (
                        <View>
                            {time == index || time + 1 == index ?
                                <View>
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(item.url)}><View>
                                        <View>
                                            <SvgUri width='40' height='40'
                                                    uri={item.iconUrl}/>
                                            <Text
                                                style={styles.urlText}>{item.title}</Text>
                                        </View>
                                    </View>
                                    </TouchableOpacity>
                                </View>
                                : null}
                        </View>
                    )
                }}
            />
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