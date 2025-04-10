import { useState, useEffect } from 'react';

/**
 * Custom hook that detects the current aspect ratio of the window
 * and determines if it's wider than 16:9
 *
 * @returns An object containing:
 * - aspectRatio: current window aspect ratio
 * - isWiderThan16by9: boolean indicating if the current ratio is wider than 16:9
 * - containerStyle: style object to apply to maintain 16:9 ratio
 */
export const useAspectRatio = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const aspectRatio = windowSize.width / windowSize.height;


  const standard16by9 = 16 / 9;

  const isWiderThan16by9 = aspectRatio > standard16by9;


  const containerStyle = isWiderThan16by9
    ? {
        maxWidth: `${windowSize.height * standard16by9}px`,
        margin: '0 auto'
      }
    : {};

  return {
    aspectRatio,
    isWiderThan16by9,
    containerStyle
  };
};