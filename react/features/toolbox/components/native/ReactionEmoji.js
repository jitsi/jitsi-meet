// @flow

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { connect } from '../../../base/redux';
import type { StyleType } from '../../../base/styles';
import { removeReaction } from '../../actions.any';
import { REACTIONS } from '../../constants';
import { type ReactionEmojiProps } from '../../functions.any';

type Props = ReactionEmojiProps & {

    /**
     * Removes reaction from redux state.
     */
    removeReaction: Function,

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

    /**
     * Index of reaction on the queue.
     */
    index: number
};


/**
 * Animated reaction emoji.
 *
 * @returns {ReactElement}
 */
function ReactionEmoji({ reaction, uid, removeReaction: _removeReaction, _styles, index }: Props) {
    const animationVal = useRef(new Animated.Value(0)).current;

    const vh = useState(Dimensions.get('window').height / 100)[0];

    const randomInt = (min, max) => Math.floor((Math.random() * (max - min + 1)) + min);

    const coordinates = useState({
        topX: index % 21 === 0 ? 40 : randomInt(-100, 100),
        topY: index % 21 === 0 ? -70 : randomInt(-65, -75),
        bottomX: index % 21 === 0 ? 140 : randomInt(150, 200),
        bottomY: index % 21 === 0 ? -50 : randomInt(-40, -50)
    })[0];


    useEffect(() => {
        setTimeout(() => _removeReaction(uid), 5000);
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

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _styles: ColorSchemeRegistry.get(state, 'Toolbox')
    };
}

const mapDispatchToProps = {
    removeReaction
};

export default connect(
    _mapStateToProps,
    mapDispatchToProps,
)(ReactionEmoji);
