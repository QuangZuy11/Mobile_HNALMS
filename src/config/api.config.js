// API Configuration
// Backend server: Xem cấu hình trong env.js
// Thay đổi địa chỉ IP trong file env.js

import { ENV } from './env';

export const API_CONFIG = {
    BASE_URL: ENV.API_URL,
    TIMEOUT: ENV.API_TIMEOUT,

    // API Endpoints
    ENDPOINTS: {
        // Authentication
        AUTH: {
            LOGIN: '/auth/login',
            LOGOUT: '/auth/logout',
            FORGOT_PASSWORD: '/auth/forgot-password',
            RESET_PASSWORD: '/auth/reset-password',
            ME: '/auth/me',
        },

        // Profile
        PROFILE: {
            GET: '/auth/me',
            UPDATE: '/auth/profile',
            CHANGE_PASSWORD: '/auth/change-password',
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
            TENANT_LIST: '/invoices/tenant',
            PERIODIC_DETAIL: '/invoices/periodic/my',  // GET /invoices/periodic/my/:id
            INCURRED_DETAIL: '/invoices/incurred/my',  // GET /invoices/incurred/my/:id
            DETAIL: '/invoices/:id',
            PAY: '/invoices/pay',
            PAYMENT_INITIATE: '/invoices/payment/:id/initiate',  // POST with body { type: "periodic" | "incurred" }
            PAYMENT_STATUS: '/invoices/payment/status',
            PAYMENT_CANCEL: '/invoices/payment/cancel',
        },

        // Service
        SERVICE: {
            LIST: '/services',
            LIST_FOR_TENANT: '/services/list',
            BOOK: '/services/book',           // POST /services/book
            CANCEL_BOOK: '/services/book',    // PATCH /services/book/:serviceId/cancel
            MY_SERVICES: '/services/my-services',
        },

        // Request
        REQUEST: {
            LIST: '/requests',
            DETAIL: '/requests/:id',
            CREATE_MOVING_ROOM: '/requests/moving-room',
            CREATE_COMPLAINT: '/requests/complaints',
            MY_COMPLAINTS: '/requests/complaints',
            UPDATE_COMPLAINT: '/requests/complaints',
            DELETE_COMPLAINT: '/requests/complaints',
            CREATE_REPAIR: '/requests/repair',
            UPDATE_REPAIR: '/requests/repair',
            MY_REPAIRS: '/requests/repair/my-requests',
            CREATE_MAINTENANCE: '/requests/maintenance',
            UPDATE: '/requests/:id/update',
            DELETE: '/requests/:id/delete',
            TRANSFER_AVAILABLE_ROOMS: '/requests/transfer/available-rooms',
            TRANSFER_CREATE: '/requests/transfer',
            TRANSFER_MY_REQUESTS: '/requests/transfer/my-requests',
            TRANSFER_CANCEL: '/requests/transfer/:id/cancel',
            TRANSFER_UPDATE: '/requests/transfer',
            TRANSFER_DELETE: '/requests/transfer',
        },

        // Device
        DEVICE: {
            LIST: '/devices',
            BY_ROOM_TYPE: '/roomdevices',
            MY_ROOM_DEVICES: '/roomdevices/my-room',
        },

        // Notification
        NOTIFICATION: {
            LIST: '/notifications',
            MY_NOTIFICATIONS: '/notifications/my-notifications', // Get all notifications including renew type
            DETAIL: '/notifications/:id',
            MARK_READ: '/notifications/:id/read',
            MARK_ALL_READ: '/notifications/mark-all-read',
            UNREAD_COUNT: '/notifications/unread-count',
        },

        // Move-Out / Move-Out Request
        MOVE_OUT: {
            CONTRACT_INFO: '/move-outs/contract/:contractId/info',
            CREATE: '/move-outs',
            MY_REQUEST: '/move-outs/my/:contractId',
            LIST: '/move-outs/list',
            DETAIL: '/move-outs/:moveOutRequestId',
            APPROVE: '/move-outs/:moveOutRequestId/approve',
            COMPLETE: '/move-outs/:moveOutRequestId/complete',
            CANCEL: '/move-outs/:moveOutRequestId',
        },
    },
};
