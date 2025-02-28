import React from "react";
import { IDisplayProps } from "./ConferenceTimer";

/**
 * Returns web element to be rendered.
 *
 * @returns {ReactElement}
 */
export default function ConferenceTimerDisplay({ timerValue, textStyle: _textStyle }: IDisplayProps) {
    return <span className="">{timerValue}</span>;
}
