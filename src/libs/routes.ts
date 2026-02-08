const telegramWebhookRoot = 'telegram/webhook';
const codeWordsRoot = '/code-words';
const reportsRoot = '/reports';
const reportById = `${reportsRoot}/:id`;
const usersRoot = '/users';
const userById = `${usersRoot}/:id`;

export const routes = {
  auth: {
    loginViaTg: 'user/login-via-tg',
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
