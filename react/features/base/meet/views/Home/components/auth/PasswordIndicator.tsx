import React from "react";

export default function PasswordStrengthIndicator({
    className = "",
    label,
    strength,
}: {
    className?: string;
    label?: string;
    strength: "error" | "warning" | "success";
}): JSX.Element {
    const pillClassName = "w-10 h-1 rounded-full";

    const inactiveBackground = "bg-gray-10";
    let activeBackground: string;
    let labelColor: string;

    switch (strength) {
        case "error":
            activeBackground = "bg-red";
            labelColor = "text-red";
            break;
        case "warning":
            activeBackground = "bg-orange";
            labelColor = "text-orange";
            break;
        case "success":
            activeBackground = "bg-green";
            labelColor = "text-green";
            break;
    }

    return (
        <div className={`${className}`}>
            <div className="flex space-x-1.5">
                <div className={`${pillClassName} ${activeBackground}`} />
                <div className={`${pillClassName} ${strength !== "error" ? activeBackground : inactiveBackground}`} />
                <div className={`${pillClassName} ${strength === "success" ? activeBackground : inactiveBackground}`} />
            </div>
            <p className={`mt-1 text-sm font-medium ${labelColor}`}>{label}</p>
        </div>
    );
}
