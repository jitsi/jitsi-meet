import React from "react";

const StaticImageWrapper = () => {
    return (
        <div
            style={{
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: -1,
            }}
        >
            <img
                src={"images/custom-background/bg1.png"}
                width={"100%"}
                height={"100%"}
                style={{ objectFit: "cover" }}
            />
        </div>
    );
};

export default StaticImageWrapper;
