import React from "react";

interface PlanBadgeProps {
    planName: string;
}

const PlanBadge: React.FC<PlanBadgeProps> = ({ planName }) => {
    return (
        <div
            className="inline-block px-1 border rounded-sm bg-transparent"
            style={{
                border: "1px solid #FFB64F",
                color: "#FFB64F",
            }}
        >
            <span className="text-base font-medium">{planName} Plan</span>
        </div>
    );
};

export default PlanBadge;
