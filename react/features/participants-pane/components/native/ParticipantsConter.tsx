import React from 'react';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';

import { getParticipantCount } from '../../../base/participants/functions';
import { iAmVisitor } from '../../../visitors/functions';

import styles from './styles';

const ParticipantsCounter = () => {
    // when visitor we want to subtract the local participant which we hide
    const iAmVisitorState = useSelector(iAmVisitor);

    const participantsCount = useSelector(getParticipantCount) - (iAmVisitorState ? 1 : 0);

    return <Text style = { styles.participantsBadge }>{participantsCount}</Text>;
};

export default ParticipantsCounter;
