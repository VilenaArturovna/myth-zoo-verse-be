const telegramWebhookRoot = 'telegram/webhook';
const codeWordsRoot = '/code-words';
const reportsRoot = '/reports';
const reportById = `${reportsRoot}/:id`;
const usersRoot = '/users';
const userById = `${usersRoot}/:id`;

export const routes = {
  auth: {
    telegramStart: '/auth/telegram/start',
    telegramComplete: '/auth/telegram/complete',
    register: '/auth/register',
    verifyEmail: '/auth/verify-email',
    resend: '/auth/resend-verification',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    csrf: '/auth/csrf',
  },
  user: {
    profile: {
      me: 'me',
      byId: userById,
    },
  },
  telegram: {
    webhook: telegramWebhookRoot,
    updates: `${telegramWebhookRoot}/updates`,
  },
  codeWords: {
    disable: `${codeWordsRoot}/disable`,
  },
  reports: {
    root: reportsRoot,
    my: `${reportsRoot}/my`,
    next: `${reportsRoot}/next`,
    byId: reportById,
    addStartPhoto: `${reportById}/add-start-photo`,
    sendToReview: `${reportById}/send-to-review`,
    review: `${reportById}/review`,
    approve: `${reportById}/approve`,
    reject: `${reportById}/reject`,
    skip: `${reportById}/skip`,
  },
};
