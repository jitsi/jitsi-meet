import { PaperPlaneRightIcon } from "@phosphor-icons/react";
import React, { KeyboardEvent, useCallback, useRef, useState } from "react";

interface ModernChatInputProps {
    onSend: (message: string) => void;
    placeholder?: string;
}

export const ModernChatInput: React.FC<ModernChatInputProps> = ({ onSend, placeholder }) => {
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = useCallback(() => {
        const trimmed = message.trim();
        if (trimmed) {
            onSend(trimmed);
            setMessage("");
        }
    }, [message, onSend]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        const textarea = e.target;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }, []);

    return (
        <div className="p-4 bg-black">
            <div className="flex items-end gap-2 bg-[#1C1C1C80] rounded-lg px-4 py-2 border border-[#8C8C8C]">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm outline-none border-none resize-none overflow-y-auto"
                    style={{
                        caretColor: "white",
                        minHeight: "24px",
                        maxHeight: "200px",
                        height: "24px",
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className={`flex items-center justify-center transition-colors flex-shrink-0 self-stretch border-l border-[#8C8C8C] pl-3
                        ${message.trim() ? "text-white cursor-pointer" : "cursor-not-allowed"}
                    `}
                    aria-label="Send message"
                >
                    <PaperPlaneRightIcon size={20} weight="regular" />
                </button>
            </div>
        </div>
    );
};
