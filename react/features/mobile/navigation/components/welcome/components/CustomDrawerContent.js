// @flow

import { DrawerItemList } from '@react-navigation/drawer';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../../../../base/avatar';
import {
    getLocalParticipant, getParticipantDisplayName
} from '../../../../../base/participants';
import { connect } from '../../../../../base/redux';
import styles, { DRAWER_AVATAR_SIZE } from '../../../../../welcome/components/styles';

type Props = {

    /**
     * Local participant name to be displayed.
     */
    displayName: string,

    /**
     * The ID of the local participant.
     */
    localParticipantId: string
};

const CustomDrawerContent = (props: Props) => (
    <ScrollView bounces = { false }>
        <View style = { styles.drawerHeader }>
            <Avatar
                participantId = { props.localParticipantId }
                size = { DRAWER_AVATAR_SIZE } />
            <Text style = { styles.displayName }>
                { props.displayName }
            </Text>
        </View>
        <SafeAreaView
            edges = { [
                'left',
                'right'
            ] }>
            <DrawerItemList { ...props } />
        </SafeAreaView>
    </ScrollView>
);

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {Props}
 */
function mapStateToProps(state: Object) {
    const localParticipant = getLocalParticipant(state);
    const localParticipantId = localParticipant?.id;
    const displayName = localParticipant && getParticipantDisplayName(state, localParticipantId);

    return {
        displayName,
        localParticipantId
    };
}

export default connect(mapStateToProps)(CustomDrawerContent);
