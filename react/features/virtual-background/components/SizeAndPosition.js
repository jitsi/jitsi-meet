import React from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';

const Rectangle = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef();
  const trRef = React.useRef();
// const outputCanvas = document.getElementsByClassName('outputCanvas')[0];
// const distanceToTop = outputCanvas.getBoundingClientRect().top;
// const distanceToLeft = outputCanvas.getBoundingClientRect().left
  React.useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Rect
            //  scaleX={-1}
            //  scaleY={1}
            //  x={250}
            //  y={570}
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          // we will reset it back
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            // set minimal value
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        rotateEnabled = {false}
        keepRatio = {true}
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

const initialRectangles = [
  {
    x: 355,
    y: 145,
    width: 200,
    height: 100,
    stroke: 'blue',
    id: 'rect1',
  },
];

const SizeAndPosition = ({dialogCallback}) => {
  const [rectangles, setRectangles] = React.useState(initialRectangles);
  const [selectedId, selectShape] = React.useState(null);

  const checkDeselect = (e) => {
    console.log(e, 'event')
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  return (
    <Stage
       width={570}
       height={250}
    //    scaleX={-1}
    //    scaleY={1}
    //    x={250}
    //    y={570}
    className = 'outputCanvas'
      onMouseDown={checkDeselect}
      onTouchStart={checkDeselect}
    >
      <Layer>
        {rectangles.map((rect, i) => {
          return (
            <Rectangle
              key={i}
              shapeProps={rect}
              isSelected={true}
              onSelect={() => {
                selectShape(rect.id);
              }}
              onChange={(newAttrs) => {
                const rects = rectangles.slice();
                rects[i] = newAttrs;
                setRectangles(rects);
                console.log(newAttrs)
//                 const outputCanvas = document.getElementsByClassName('preview-area')[0];
// const distanceToTop = outputCanvas.getBoundingClientRect().top;
// const distanceToLeft = outputCanvas.getBoundingClientRect().left
                dialogCallback(parseInt(newAttrs.width), parseInt(newAttrs.height), parseInt(newAttrs.x), parseInt(newAttrs.y))
              }}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};


// /**
//  * Maps (parts of) the redux state to the associated props for the
//  * {@code SizeAndPosition} component.
//  *
//  * @param {Object} state - The Redux state.
//  * @private
//  * @returns {{Props}}
//  */
// function _mapStateToProps(state): Object {
//     return {
//         _selectedThumbnail: state['features/virtual-background'].selectedThumbnail
//     };
// }

// export default translate(connect(_mapStateToProps)(SizeAndPosition));
export default SizeAndPosition;