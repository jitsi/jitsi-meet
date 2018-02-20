// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { DEFAULT_TRANSFORM } from '../constants';
import type { Transform } from '../constants';

/**
 * The max distance that the border of the transformed
 * view can leave the screen border.
 */
const MAX_OFFSET = 100;

type Props = {

    /**
     * The children of the component.
     */
    children: Object,

    /**
     * Function invoked when a session transform is updated.
     */
    onTransformUpdate: Function,

    /**
     * The style propery of the component.
     */
    style: Object,

    /**
     * A transform to be applied to the component.
     */
    transform: Transform,

    /**
     * Enables or disables any transforms.
     */
    transformEnabled: boolean
};

type State = {

    /**
     * The current (non-transformed) layout of the View.
     */
    layout: ?Object,

    /**
     * The applied transform.
     */
    transform: Transform
};

/**
 * A view that is capable of applying basic transformations to its
 * children, like scale or move.
 */
export default class TransformAwareView extends Component<Props, State> {
    /**
     * Instantiates a {@code TransformAwareView} component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            layout: null,
            transform: props.transform || DEFAULT_TRANSFORM
        };

        this._onLayout = this._onLayout.bind(this);
    }

    /**
     * Implements React Component's componentWillReceiveProps.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(props: Props) {
        this._calculateTransformation(props.transform);
    }

    /**
     * Implements React Component's render method.
     *
     * @inheritdoc
     */
    render() {
        const { children, style } = this.props;

        return (
            <View
                onLayout = { this._onLayout }
                style = { [
                    style,
                    this._getTransformStyle()
                ] }>
                {
                    children
                }
            </View>
        );
    }

    /**
     * Limits the move matrix and then updates the transform object in component
     * state.
     *
     * Note: Points A (top-left) and D (bottom-right) are
     * opposite points of the View rectangle.
     *
     * @private
     * @param {?Transform} transform - The transformation object.
     * @returns {void}
     */
    _calculateTransformation(transform) {
        const { transformEnabled } = this.props;

        if (!transform || !transformEnabled) {
            return;
        }

        const { layout } = this.state;

        if (layout) {
            const oldTransform = this.state.transform;
            const { onTransformUpdate } = this.props;
            const { scale: newScaleUnlimited } = transform;
            let {
                translateX: newTranslateX,
                translateY: newTranslateY } = transform;

            // Scale is only limited to 1 here to detect
            // downscale gesture later.
            const newScale = Math.max(newScaleUnlimited, 1);

            // The A and D points of the original View (before transform).
            const originalLayout = {
                a: {
                    x: layout.x,
                    y: layout.y
                },
                d: {
                    x: layout.x + layout.width,
                    y: layout.y + layout.height
                }
            };

            // The center point (midpoint) of the transformed View.
            const transformedCenterPoint = {
                x: ((layout.x + layout.width) / 2)
                    + (newTranslateX * newScale),
                y: ((layout.y + layout.height) / 2)
                    + (newTranslateY * newScale)
            };

            // The size of the transformed View.
            const transformedSize = {
                width: layout.width * newScale,
                height: layout.height * newScale
            };

            // The A and D points of the transformed View.
            const transformedLayout = {
                a: {
                    x: transformedCenterPoint.x - (transformedSize.width / 2),
                    y: transformedCenterPoint.y - (transformedSize.height / 2)
                },
                d: {
                    x: transformedCenterPoint.x + (transformedSize.width / 2),
                    y: transformedCenterPoint.y + (transformedSize.height / 2)
                }
            };

            let _maxOffset = MAX_OFFSET;

            if (newScaleUnlimited < oldTransform.scale) {
                // this is a negative scale event so we dynamycally reduce the
                // maxOffset to get the screen back to the center on
                // downscaling

                _maxOffset = Math.min(MAX_OFFSET, MAX_OFFSET * (newScale - 1));
            }

            // This is the yet-unlimited transform that is desired
            // by the user. This will be limited in the next step to avoid
            // extreme or unwanted transformations.
            const desiredTransform = {
                scale: newScaleUnlimited,
                translateX: newTranslateX,
                translateY: newTranslateY
            };

            // Correct move matrix if it goes out of the view
            // too much (_maxOffset).
            newTranslateX -= Math.max(
                transformedLayout.a.x - originalLayout.a.x - _maxOffset, 0
            );
            newTranslateX += Math.max(
                originalLayout.d.x - transformedLayout.d.x - _maxOffset, 0
            );
            newTranslateY -= Math.max(
                transformedLayout.a.y - originalLayout.a.y - _maxOffset, 0
            );
            newTranslateY += Math.max(
                originalLayout.d.y - transformedLayout.d.y - _maxOffset, 0
            );

            const newTransform = {
                scale: newScale,
                translateX: Math.round(newTranslateX),
                translateY: Math.round(newTranslateY)
            };

            if (oldTransform.scale !== newTransform.scale
                || oldTransform.translateX !== newTransform.translateX
                || oldTransform.translateY !== newTransform.translateY) {
                // The transform has been changed, need to re-render.
                this.setState({
                    transform: newTransform
                });
            }

            if (desiredTransform.scale !== newTransform.scale
                || desiredTransform.translateX !== newTransform.translateX
                || desiredTransform.translateY !== newTransform.translateY) {
                // The transform has been limited, so we need to send an update.
                if (typeof onTransformUpdate === 'function') {
                    onTransformUpdate(newTransform);
                }
            }
        }
    }

    _getTransformStyle: () => Object

    /**
     * Generates a transform style object to be used on the component.
     *
     * @returns {{string: Array<{string: number}>}}
     */
    _getTransformStyle() {
        const { transformEnabled } = this.props;

        if (!transformEnabled) {
            return null;
        }

        const {
            scale,
            translateX,
            translateY
        } = this.state.transform;

        return {
            transform: [
                { scale },
                { translateX },
                { translateY }
            ]
        };
    }

    _onLayout: Object => void

    /**
     * Callback for the onLayout of the component.
     *
     * @private
     * @param {Object} event - The native props of the onLayout event.
     * @returns {void}
     */
    _onLayout({ nativeEvent: { layout: { x, y, width, height } } }) {
        this.setState({
            layout: {
                x,
                y,
                width,
                height
            }
        });
    }
}
