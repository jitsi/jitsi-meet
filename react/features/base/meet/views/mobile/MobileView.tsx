import React from "react";
import { useTranslation } from "react-i18next";

const MobileView: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4 sm:p-6 text-center text-white relative overflow-y-auto"
            style={{
                backgroundImage: "url('/images/mobile-background.png')",
            }}
        >
            <div className="w-full max-w-sm flex flex-col items-center justify-center py-4 landscape:py-2">
                <div className="w-70 landscape:w-48 landscape:mb-4 mb-10 relative overflow-hidden rounded-lg">
                    <img
                        src="/images/pc-meet.png"
                        alt={t("meet.mobile.imageAlt")}
                        className="w-full h-auto rounded-lg"
                        width={280}
                    />
                </div>

                <h1 className="text-3xl landscape:text-2xl font-semibold mb-4 landscape:mb-2 leading-tight max-w-70 landscape:max-w-none text-white px-2">
                    {t("meet.mobile.title")}
                </h1>

                <div className="space-y-2 landscape:space-y-1 px-4 landscape:px-2">
                    <p className="text-base landscape:text-sm font-normal leading-relaxed opacity-90">
                        {t("meet.mobile.description.first")}
                    </p>
                    <p className="text-base landscape:text-sm font-normal leading-relaxed opacity-90">
                        {t("meet.mobile.description.second")}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MobileView;
