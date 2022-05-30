import React, {useState} from 'react';
import { Text, TouchableOpacity, View,Modal, Linking } from 'react-native';
import styles from './styles';
import { Icon, IconTicket, IconBookmark } from '../../../base/icons';
import Toast from 'react-native-simple-toast';

const SideButtons = () => {
    const [Bookmark, setBookmark] = useState(false);
    const [Ticket, setTicket] = useState(false);

  return (
    <View>
        <View style={styles.SideButtons}>
            <View>
                <TouchableOpacity
                onPress={() => {
                    Toast.showWithGravity('Tok Bite Saved.', Toast.SHORT, Toast.TOP);
                }}>
                    <Icon 
                        size = { 26 }
                        src = { IconBookmark }
                        style = { styles.ConnectingButtons } />
                </TouchableOpacity>
            </View>
            <View>
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={Ticket}
                    onRequestClose={() => {
                        setTicket(!Ticket);
                    }}>
                    <View style={styles.SideButtoncenteredView}>
                        <View style={styles.SideButtonmodalView}>
                        <Text style={styles.modalText}>I agree if i am selected for a golden ticket. I'll behave appropriately as defined in the <Text style={{textDecorationLine:"underline"}} onPress={() => Linking.openURL('http://google.com')}>terms of service.</Text></Text>
                            <TouchableOpacity
                                style={[ styles.buttonClose]}
                                onPress={() => setTicket(!Ticket)}>
                                <Text style={styles.textStyle}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
                <TouchableOpacity
                onPress={() => setTicket(true)}>
                    <Icon 
                        size = { 26 }
                        src = { IconTicket }
                        style = { styles.ConnectingButtons } />
                </TouchableOpacity>
            </View>
        </View>
    </View>
  );
}

export default SideButtons;