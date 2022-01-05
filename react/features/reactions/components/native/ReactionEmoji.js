// @flow

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { removeReaction } from '../../actions.any';
import { REACTIONS, type ReactionEmojiProps } from '../../constants';


type Props = ReactionEmojiProps & {

    /**
     * Index of reaction on the queue.
     * Used to differentiate between first and other animations.
     */
    index: number
};


/**
 * Animated reaction emoji.
 *
 * @returns {ReactElement}
 */
function ReactionEmoji({ reaction, uid, index }: Props) {
    const _styles = useSelector(state => ColorSchemeRegistry.get(state, 'Toolbox'));
    const _height = useSelector(state => state['features/base/responsive-ui'].clientHeight);
    const dispatch = useDispatch();

    const animationVal = useRef(new Animated.Value(0)).current;

    const vh = useState(_height / 100)[0];

    const randomInt = (min, max) => Math.floor((Math.random() * (max - min + 1)) + min);

    const animationIndex = useMemo(() => index % 21, [ index ]);

    const coordinates = useState({
        topX: animationIndex === 0 ? 40 : randomInt(-100, 100),
        topY: animationIndex === 0 ? -70 : randomInt(-65, -75),
        bottomX: animationIndex === 0 ? 140 : randomInt(150, 200),
        bottomY: animationIndex === 0 ? -50 : randomInt(-40, -50)
    })[0];


    useEffect(() => {
        setTimeout(() => dispatch(removeReaction(uid)), 5000);
    }, []);

    useEffect(() => {
        Animated.timing(
            animationVal,
            {
                toValue: 1,
                duration: 5000,
                useNativeDriver: true
            }
        ).start();
    }, [ animationVal ]);


    return (
        <Animated.Text
            style = {{
                ..._styles.emojiAnimation,
                transform: [
                    { translateY: animationVal.interpolate({
                        inputRange: [ 0, 0.70, 0.75, 1 ],
                        outputRange: [ 0, coordinates.topY * vh, coordinates.topY * vh, coordinates.bottomY * vh ]
                    })
                    }, {
                        translateX: animationVal.interpolate({
                            inputRange: [ 0, 0.70, 0.75, 1 ],
                            outputRange: [ 0, coordinates.topX, coordinates.topX,
                                coordinates.topX < 0 ? -coordinates.bottomX : coordinates.bottomX ]
                        })
                    }, {
                        scale: animationVal.interpolate({
                            inputRange: [ 0, 0.70, 0.75, 1 ],
                            outputRange: [ 0.6, 1.5, 1.5, 1 ]
                        })
                    }
                ],
                opacity: animationVal.interpolate({
                    inputRange: [ 0, 0.7, 0.75, 1 ],
                    outputRange: [ 1, 1, 1, 0 ]
                })
            }}>
            {REACTIONS[reaction].emoji}
        </Animated.Text>
    );
}

export default ReactionEmoji;
