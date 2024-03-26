export interface Environment {
     APP_NAME: string;
     API_URL: string;
     DEBUG_MODE: boolean;
     WELCOME_PAGE_MESSAGE: string[]
 }
 
 export const env: Environment = {
     APP_NAME: "C-Meet",
     API_URL: "https://meet.cmcati.vn/",
     DEBUG_MODE: false,
     WELCOME_PAGE_MESSAGE : [
        "C-Meet xin chào ... !",
        "An toàn và bảo mật ... ",
        "Tốc độ cao và chính xác ... ",
        "Thân thiện và tiện lợi ...",
     ]
 };