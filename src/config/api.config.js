// API Configuration
// Backend server: http://192.168.0.110:9999
// Thay đổi địa chỉ IP theo máy của bạn (chạy 'ipconfig' để tìm)

export const API_CONFIG = {
    BASE_URL: 'http://192.168.0.110:9999/api',

    // API Endpoints
    ENDPOINTS: {
        // Authentication
        AUTH: {
            LOGIN: '/auth/login',
            LOGOUT: '/auth/logout',
            FORGOT_PASSWORD: '/auth/forgot-password',
            RESET_PASSWORD: '/auth/reset-password',
        },

        // Profile
        PROFILE: {
            GET: '/profile',
            UPDATE: '/profile/update',
            CHANGE_PASSWORD: '/profile/change-password',
            MY_ROOM: '/profile/my-room',
        },

        // Contract
        CONTRACT: {
            LIST: '/contracts',
            DETAIL: '/contracts/:id',
            RENEW: '/contracts/renew',
            TERMINATE: '/contracts/terminate',
        },

        // Invoice
        INVOICE: {
            LIST: '/invoices',
            DETAIL: '/invoices/:id',
            PAY: '/invoices/pay',
        },

        // Service
        SERVICE: {
            LIST: '/services',
            BOOK: '/services/book',
            CANCEL: '/services/cancel',
        },

        // Request
        REQUEST: {
            LIST: '/requests',
            DETAIL: '/requests/:id',
            CREATE_MOVING_ROOM: '/requests/moving-room',
            CREATE_COMPLAINT: '/requests/complaint',
            CREATE_REPAIR: '/requests/repair',
            CREATE_MAINTENANCE: '/requests/maintenance',
            UPDATE: '/requests/:id/update',
            DELETE: '/requests/:id/delete',
        },

        // Notification
        NOTIFICATION: {
            LIST: '/notifications',
            DETAIL: '/notifications/:id',
            MARK_READ: '/notifications/:id/read',
        },
    },
};
