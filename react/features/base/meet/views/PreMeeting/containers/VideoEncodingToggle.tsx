import { useEffect, useState } from "react";
import { useLocalStorage } from "../../../LocalStorageManager";
import React from "react";
import { Button } from "@internxt/ui";

const ENCODING_KEY = "videoEncodingEnabled";

const VideoEncodingToggle = () => {
    const localStorage = useLocalStorage();

    const [isEncodingEnabled, setIsEncodingEnabled] = useState(false);

    useEffect(() => {
        const savedState = localStorage.get<boolean | string>(ENCODING_KEY, false);
        setIsEncodingEnabled(savedState === true || savedState === "true");
    }, []);

    const toggleEncoding = () => {
        const newState = !isEncodingEnabled;
        setIsEncodingEnabled(newState);
        localStorage.set(ENCODING_KEY, newState);
    };

    return (
        <div className="flex flex-col items-center p-6 bg-primary/20 dark:bg-gray-5 rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100 text-gray-5">Video Encoding</h2>

            <div className="bg-white p-4 rounded-lg shadow-sm w-full mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-black">Current status:</span>
                    <span className={`font-medium ${isEncodingEnabled ? "text-green" : "text-red"}`}>
                        {isEncodingEnabled ? "Enabled" : "Disabled"}
                    </span>
                </div>
            </div>

            <Button
                onClick={toggleEncoding}
            
            >
                {isEncodingEnabled ? "Disable Encoding" : "Enable Encoding"}
            </Button>
        </div>
    );
};

export const useVideoEncoding = () => {
    const localStorage = useLocalStorage();
    const [isEncodingEnabled, setIsEncodingEnabled] = useState(false);

    useEffect(() => {
        const savedState = localStorage.get<boolean | string>(ENCODING_KEY, false);
        setIsEncodingEnabled(savedState === true || savedState === "true");
    }, []);
  
    const toggleEncoding = () => {
        const newState = !isEncodingEnabled;
        setIsEncodingEnabled(newState);
        localStorage.set(ENCODING_KEY, newState);
    };
  
    return { isEncodingEnabled, toggleEncoding };
  };

export default VideoEncodingToggle;
