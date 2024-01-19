import React from 'react';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';

import { getParticipantCount } from '../../../base/participants/functions';

import styles from './styles';

const ParticipantsCounter = () => {
    const participantsCount = useSelector(getParticipantCount);

    return <Text style = { styles.participantsBadge }>{participantsCount}</Text>;
};

export default ParticipantsCounter;
