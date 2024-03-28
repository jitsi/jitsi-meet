export interface Environment {
    APP_NAME: string;
    API_URL: string;
    DEBUG_MODE: boolean;
    WELCOME_PAGE_MESSAGE: string[],
    LANGUAGE: string
}

export const env: Environment = {
    APP_NAME: "C-Meet",
    API_URL: "https://meet.cmcati.vn/",
    DEBUG_MODE: false,
    WELCOME_PAGE_MESSAGE: [
        "C-Meet phần mềm họp online xin chào !",
        "Hệ thống an toàn và bảo mật",
        "Trải nghiệm tốc độ và chính xác",
        "Mang đến tiện lợi và thân thiện",
    ],
    LANGUAGE: "vi"
    // UPDATE : LANGUAGE load file in i18next.ts (main-vi.json - main.json)
};