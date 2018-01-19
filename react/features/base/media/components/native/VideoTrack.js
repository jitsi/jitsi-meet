import React from 'react';
import { Animated, View } from 'react-native';
import { connect } from 'react-redux';

import AbstractVideoTrack from '../AbstractVideoTrack';
import styles from './styles';

/**
 * Component that renders video element for a specified video track.
 *
 * @extends AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack {
    /**
     * VideoTrack component's property types.
     *
     * @static
     */
    static propTypes = AbstractVideoTrack.propTypes

    /**
     * Initializes a new VideoTrack instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * Reference to currently running animation if any.
         *
         * @private
         */
        this._animation = null;

        /**
         * Extend Component's state with additional animation-related vars.
         *
         * @type {Object}
         */
        this.state = {
            ...this.state,
            fade: new Animated.Value(0)
        };
    }

    /**
     * Renders video element with animation.
     *
     * @override
     * @returns {ReactElement}
     */
    render() {
        const animatedStyles
            = [ styles.videoCover, this._getAnimationStyles() ];

        return (
            <View style = { styles.video } >
                { super.render() }
                <Animated.View style = { animatedStyles } />
            </View>
        );
    }

    /**
     * Animates setting a new video track to be rendered by this instance.
     *
     * @param {Track} oldValue - The old video track rendered by this instance.
     * @param {Track} newValue - The new video track to be rendered by this
     * instance.
     * @private
     * @returns {Promise}
     */
    _animateSetVideoTrack(oldValue, newValue) {
        // If we're in the middle of an animation and a new animation is about
        // to start, stop the previous one first.
        if (this._animation) {
            this._animation.stop();
            this._animation = null;
            this.state.fade.setValue(0);
        }

        return this._animateVideoTrack(1)
            .then(() => {
                super._setVideoTrack(newValue);

                return this._animateVideoTrack(0);
            })
            .catch(() => console.log('Animation was stopped'));
    }

    /**
     * Animates the display of the state videoTrack.
     *
     * @param {number} toValue - The value to which the specified animatedValue
     * is to be animated.
     * @private
     * @returns {Promise}
     */
    _animateVideoTrack(toValue) {
        return new Promise((resolve, reject) => {
            this._animation
                = Animated.timing(this.state.fade, { toValue });
            this._animation.start(result => {
                this._animation = null;
                result.finished ? resolve() : reject();
            });
        });
    }

    /**
     * Returns animation styles for Animated.View.
     *
     * @private
     * @returns {Object}
     */
    _getAnimationStyles() {
        return {
            opacity: this.state.fade
        };
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Animate the setting of the video track to be rendered by this instance.
     *
     * @inheritdoc
     * @protected
     */
    _setVideoTrack(videoTrack) {
        // If JitsiTrack instance didn't change, that means some other track's
        // props were changed and we don't need to animate.
        const oldValue = this.state.videoTrack;
        const oldJitsiTrack = oldValue ? oldValue.jitsiTrack : null;
        const newValue = videoTrack;
        const newJitsiTrack = newValue ? newValue.jitsiTrack : null;

        if (oldJitsiTrack === newJitsiTrack) {
            super._setVideoTrack(newValue);
        } else {
            this._animateSetVideoTrack(oldValue, newValue);
        }
    }
}

export default connect()(VideoTrack);
