import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, Pressable, View } from 'react-native';
import styles from './styles';
import { Icon, IconAdd, IconBookmark, IconDollar, IconCart, IconDollarGreen,IconCyclone,IconEightStreek,IconBeer,IconGem } from '../../../base/icons';
//import Toast from 'react-native-simple-toast';


const ConnectingButtons = () => {
  const [Button1, setButton1] = useState(false);
  const [Button2, setButton2] = useState(false);
  const [Button3, setButton3] = useState(false);
  const [Button4, setButton4] = useState(false);
  const [Button5, setButton5] = useState(false);
  return (
    <View>
        <View style={styles.ScreenButtons}>                  
          <View>
            <Modal
              animationType="fade"
              transparent={true}
              visible={Button1}
              onRequestClose={() => {
                setButton1(!Button1);
              }}>
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.Textview}>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconDollar }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Buy this Now</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconCart }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Add to Cart</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconBookmark }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Save as TokShop</Text></View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[ styles.buttonClose]}
                      onPress={() => setButton1(!Button1)}>
                      <Text style={styles.textStyle}>Cancel</Text>
                    </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <TouchableOpacity
              onPress={() => setButton1(true)}
            >
               <Icon 
                    size = { 28 }
                    src = { IconBeer }
                    style = { styles.ConnectingButtons } />
            </TouchableOpacity>
          </View>
          <View>
            <Modal
              animationType="fade"
              transparent={true}
              visible={Button2}
              onRequestClose={() => {
                setButton2(!Button2);
              }}>
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.Textview}>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconDollar }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Buy this Now</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconCart }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Add to Cart</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconBookmark }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Save as TokShop</Text></View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[ styles.buttonClose]}
                      onPress={() => setButton2(!Button2)}>
                      <Text style={styles.textStyle}>Cancel</Text>
                    </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <TouchableOpacity
              onPress={() => setButton2(true)}
            >
               <Icon 
                    size = { 28 }
                    src = { IconGem }
                    style = { styles.ConnectingButtons } />
            </TouchableOpacity>
          </View>
          <View>
            <Modal
              animationType="fade"
              transparent={true}
              visible={Button3}
              onRequestClose={() => {
                setButton3(!Button3);
              }}>
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.Textview}>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconDollar }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Buy this Now</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconCart }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Add to Cart</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconBookmark }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Save as TokShop</Text></View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[ styles.buttonClose]}
                      onPress={() => setButton3(!Button3)}>
                      <Text style={styles.textStyle}>Cancel</Text>
                    </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <TouchableOpacity
              onPress={() => setButton3(true)}
            >
               <Icon 
                    size = { 28 }
                    src = { IconEightStreek }
                    style = { styles.ConnectingButtons } />
            </TouchableOpacity>
          </View>
          <View >
            <Modal
              animationType="fade"
              transparent={true}
              visible={Button4}
              onRequestClose={() => {
                setButton4(!Button4);
              }}>
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.Textview}>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconDollar }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Buy this Now</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconCart }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Add to Cart</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconBookmark }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Save as TokShop</Text></View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[ styles.buttonClose]}
                      onPress={() => setButton4(!Button4)}>
                      <Text style={styles.textStyle}>Cancel</Text>
                    </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <TouchableOpacity
              onPress={() => setButton4(true)}
            >
               <Icon 
                    size = { 28 }
                    src = { IconCyclone }
                    style = { styles.ConnectingButtons } />
            </TouchableOpacity>
          </View>
          <View>
            <Modal
              animationType="fade"
              transparent={true}
              visible={Button5}
              onRequestClose={() => {
                setButton5(!Button5);
              }}>
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                     <View style={styles.Textview}>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconDollar }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Buy this Now</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconCart }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Add to Cart</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity><View style={styles.IconText}><Icon 
                          size = { 20 }
                          src = { IconBookmark }
                          style = { styles.Icons}/><Text style={styles.TextFields}>Save as TokShop</Text></View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[ styles.buttonClose]}
                      onPress={() => setButton5(!Button5)}>
                      <Text style={styles.textStyle}>Cancel</Text>
                    </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <TouchableOpacity
              onPress={() => setButton5(true)}
            >
               <Icon 
                    size = { 28 }
                    src = { IconDollarGreen }
                    style = { styles.ConnectingButtons } />
            </TouchableOpacity>
          </View>
      </View>
    </View>
  );
}
export default ConnectingButtons;