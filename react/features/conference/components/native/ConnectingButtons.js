import React, { useState, useEffect } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, Pressable, View, LogBox, Linking } from 'react-native';
import styles from './styles';
import { Icon, IconAdd, IconBookmark, IconDollar, IconCart, IconDollarGreen, IconCyclone, IconEightStreek, IconBeer, IconGem } from '../../../base/icons';
import API from '../services'

const url1 = 'https://www.google.com/';
const url2 = 'https://www.linkedin.com/';
const url3 = 'https://www.climatekk.com/';
const url4 = 'https://github.com/';

const ConnectingButtons = () => {
  const [Button1, setButton1] = useState(false);
  const [Button2, setButton2] = useState(false);
  const [Button3, setButton3] = useState(false);
  const [Button4, setButton4] = useState(false);
  const [Button5, setButton5] = useState(false);
  const [time, setTime] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setTime(!time)
    }, 10000)
  }, [time])
  return (
    <View style={styles.ScreenButtons}>
      {time ? <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={styles.links}
          onPress={() => Linking.openURL(url1)}
        >
          <Icon
            size={28}
            src={IconBeer}
            style={styles.ConnectingButtons} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL(url2)}
        >
          <Icon
            size={28}
            src={IconGem}
            style={styles.ConnectingButtons} />
        </TouchableOpacity>
      </View> :
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => Linking.openURL(url3)}>
            <Icon
              size={28}
              src={IconEightStreek}
              style={styles.ConnectingButtons} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(url4)}>
            <Icon
              size={28}
              src={IconCyclone}
              style={styles.ConnectingButtons} />
          </TouchableOpacity>
        </View>}
    </View>
  );
}
export default ConnectingButtons;