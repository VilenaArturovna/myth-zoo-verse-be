const telegramWebhookRoot = 'telegram/webhook';

export const routes = {
  auth: {
    loginViaTg: 'user/login-via-tg',
  },
  user: {
    profile: {
      me: 'user/me',
      update: 'user/update',
      byId: 'user/:id',
    },
  },
  telegram: {
    webhook: telegramWebhookRoot,
    updates: `${telegramWebhookRoot}/updates`,
  },
};
