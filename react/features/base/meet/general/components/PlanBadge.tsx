import React from "react";

const PlanBadge = ({ planName }) => {
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