// @flow
/* eslint-disable react/jsx-no-bind */
import interact from 'interactjs';
import React, { useState } from 'react';

import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { VIRTUAL_BACKGROUND_TYPE } from '../constants';

/**
 * Renders resized and positioned element on virtual desktop share background.
 *
 * @returns {Function}
 */
function SizeAndPosition({ dialogCallback, _selectedThumbnail, t }) {
    const [ areaHeight, setAreaHeight ] = useState(100);
    const [ areaWidth, setAreaWidth ] = useState(100);
    const [ areaLeft, setAreaLeft ] = useState(350);
    const [ areaTop, setAreaTop ] = useState(136);

    if (areaHeight) {
        interact('.outputCanvas')
            .resizable({
                // resize from all edges and corners
                edges: { left: true,
                    right: true,
                    bottom: true,
                    top: true },

                listeners: {
                    move(event) {
                        const target = event.target;
                        let x = parseFloat(target.getAttribute('data-x')) || areaLeft;
                        let y = parseFloat(target.getAttribute('data-y')) || areaTop;

                        // update the element's style
                        target.style.width = `${event.rect.width}px`;
                        target.style.height = `${event.rect.height}px`;

                        // translate when resizing from top or left edges
                        x += event.deltaRect.left;
                        y += event.deltaRect.top;

                        target.style.transform = `translate(${x}px,${y}px)`;

                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);

                        setAreaHeight(Math.round(event.rect.height) * 2);
                        setAreaWidth(Math.round(event.rect.width) * 2);
                    },
                    end(event) {
                        dragMoveListener(event);
                    }
                },
                modifiers: [

                    // keep the edges inside the parent
                    interact.modifiers.restrictEdges({
                        outer: 'parent'
                    }),

                    // minimum size
                    interact.modifiers.restrictSize({
                        min: { width: 200,
                            height: 100 }
                    })
                ],

                // keep aspectratio
                preserveAspectRatio: true,
                inertia: true
            })
            .draggable({
                listeners: { move: dragMoveListener },
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: false
                    })
                ]
            });
    }

    /**
     * Renders resized and positioned element on virtual desktop share background.
     *
     * @param {Object} event - Event that give us the target element where we want to extract changes.
     * @returns {Function}
     */
    function dragMoveListener(event) {
        const target = event.target;

        // keep the dragged position in the data-x/data-y attributes
        const x = (parseFloat(target.getAttribute('data-x')) || areaLeft) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || areaTop) + event.dy;

        // translate the element
        target.style.webkitTransform = target.style.transform = `translate(${x}px, ${y}px)`;
        setAreaLeft(x * 2.5);
        setAreaTop(y * 3);

        // update the posiion attributes
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
        setAreaHeight(Math.round(event.rect.height) * 2);
        setAreaWidth(Math.round(event.rect.width) * 2);
    }

    return (
        <>
            {_selectedThumbnail === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE && (
                <div
                    className = 'outputCanvas'
                    onMouseUp = { () => dialogCallback(areaWidth, areaHeight, areaLeft, areaTop) }>
                    {t('virtualBackground.dragAndResize')}
                </div>
            )}
        </>
    );
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code SizeAndPosition} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{Props}}
 */
function _mapStateToProps(state): Object {
    return {
        _selectedThumbnail: state['features/virtual-background'].selectedThumbnail
    };
}

export default translate(connect(_mapStateToProps)(SizeAndPosition));
