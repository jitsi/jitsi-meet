import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';

import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import { IMessage, IMessageAnchor } from '../../types';

import ChatMessage from './ChatMessage';
import styles from './styles';

interface IProps {
    anchor: IMessageAnchor;
    message: IMessage;
    onLift?: (height: number) => void;
    origin: { x: number; y: number; };
    sheetTop: number;
    showAvatar?: boolean;
    showDisplayName: boolean;
    showTimestamp: boolean;
}

/**
 * The copy of a long-pressed message, drawn above the menu backdrop at the row's place.
 * When the sheet would cover the row, the list lifts its rows (onLift) and the copy moves up with them.
 *
 * @returns {JSX.Element}
 */
const MessagePreview = ({ anchor, message, onLift, origin, sheetTop, ...rowProps }: IProps) => {
    const { marginHorizontal, marginVertical } = styles.messageWrapper;
    const top = anchor.y - origin.y - marginVertical;
    const bottom = top + anchor.height + (2 * marginVertical);

    // Never lifts the row's top off screen.
    const lift = Math.max(0, Math.min(bottom + BaseTheme.spacing[2] - sheetTop, top));

    useEffect(() => {
        onLift?.(lift);
    }, [ lift, onLift ]);

    const style: ViewStyle = {
        left: anchor.x - origin.x - marginHorizontal,
        position: 'absolute',
        top: top - lift,
        width: anchor.width + (2 * marginHorizontal)
    };

    return (
        <View style = { style }>
            <ChatMessage
                isPreview = { true }
                message = { message }
                { ...rowProps } />
        </View>
    );
};

export default MessagePreview;
