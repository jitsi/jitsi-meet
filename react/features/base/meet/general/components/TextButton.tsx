import { Icon } from "@phosphor-icons/react";
import React from "react";

interface TextButtonProps {
    text: string;
    icon?: Icon;
    onClick: () => void;
    iconSize?: number;
    className?: string;
}

const TextButton: React.FC<TextButtonProps> = ({ text, icon: Icon, onClick, iconSize = 24, className = "" }) => {
    return (
        <button
            className={`flex items-center space-x-1 px-4 py-3 bg-transparent hover:bg-gray-700/50 transition-colors duration-200 rounded-lg group ${className}`}
            onClick={onClick}
        >
            <span className="text-primary text-base font-medium">{text}</span>
            {Icon && (
                <Icon
                    size={iconSize}
                    className="text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
                />
            )}
        </button>
    );
};

export default TextButton;
