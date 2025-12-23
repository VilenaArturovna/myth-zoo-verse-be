const adminAuthRoot = 'admin/auth';
const adminUsersRoot = 'admin/users';
const adminClientsRoot = 'admin/clients';
const adminSpecialistRoot = 'admin/specialists';
const adminPostsRoot = 'admin/posts';
const adminReviewRoot = 'admin/reviews';
const userSpecialistRoot = 'user/specialists';
const userSpecialistById = `${userSpecialistRoot}/:id`;
const adminSpecialistRegistrationRequestRoot =
  'admin/specialist-registration-requests';
const userSessionRoot = 'user/sessions';
const userPostRoot = 'user/posts';
const specialistSessionRoot = 'specialist/sessions';
const telegramWebhookRoot = 'telegram/webhook';
const cloudPaymentsWebhookRoot = 'cloud-payments/webhook';

export const routes = {
  admin: {
    auth: {
      signIn: `${adminAuthRoot}/sign-in`,
    },
    user: {
      toggleBlock: `${adminUsersRoot}/:id/toggle-block`,
      byId: `${adminUsersRoot}/:id`,
    },
    client: {
      root: adminClientsRoot,
    },
    specialist: {
      root: adminSpecialistRoot,
      byId: `${adminSpecialistRoot}/:id`,
      trial: `${adminSpecialistRoot}/:id/trial`,
    },
    specialistRegistrationRequest: {
      root: adminSpecialistRegistrationRequestRoot,
      byId: `${adminSpecialistRegistrationRequestRoot}/:id`,
      reject: `${adminSpecialistRegistrationRequestRoot}/:id/reject`,
      accept: `${adminSpecialistRegistrationRequestRoot}/:id/accept`,
    },
    post: {
      root: adminPostsRoot,
      byId: `${adminPostsRoot}/:id`,
    },
    article: {
      root: `admin/articles`,
      byId: `admin/articles/:id`,
    },
    poll: {
      root: `admin/polls`,
      byId: `admin/polls/:id`,
    },
    video: {
      root: `admin/videos`,
      byId: `admin/videos/:id`,
    },
    review: {
      root: adminReviewRoot,
      byId: `${adminReviewRoot}/:id`,
    },
    diploma: {
      root: 'admin/diplomas',
      byId: 'admin/diplomas/:id',
    },
  },
  user: {
    auth: {
      logIn: 'user/log-in',
    },
    profile: {
      me: 'user/me',
      update: 'user/update',
    },
    questionnaire: 'user/questionnaire',
    specialist: {
      root: userSpecialistRoot,
      public: `${userSpecialistRoot}/public`,
      byId: userSpecialistById,
      bySlug: `${userSpecialistRoot}/by-slug/:slug`,
      bySlugPublic: `${userSpecialistRoot}/by-slug/:slug/public`,
      byIdPublic: `${userSpecialistById}/public`,
      slots: `${userSpecialistById}/slots`,
      posts: `${userSpecialistById}/posts`,
      articles: `${userSpecialistById}/articles`,
      videos: `${userSpecialistById}/videos`,
      reviews: `${userSpecialistById}/reviews`,
      diplomas: `${userSpecialistById}/diplomas`,
      favorite: 'user/favorite-specialists',
      last: 'user/last-specialists',
      byQuestionnaire: `user/specialists-by-questionnaire`,
      whoDoNotMatchQuestionnaire: `user/specialists-who-do-not-match-questionnaire`,
    },
    session: {
      root: userSessionRoot,
      byId: `${userSessionRoot}/:id`,
    },
    post: {
      root: userPostRoot,
      byId: `${userPostRoot}/:id`,
      commend: `${userPostRoot}/:id/commend`,
    },
    poll: {
      vote: 'user/poll/:id/vote',
    },
  },
  specialist: {
    slots: {
      booked: 'specialist/booked-slots',
      free: 'specialist/free-slots',
    },
    session: {
      root: specialistSessionRoot,
      byId: `${specialistSessionRoot}/:id`,
    },
    paymentPlan: {
      root: 'specialist/payment-plans',
    },
    paymentSubscription: {
      root: 'specialist/payment-subscriptions',
      mySubscription: 'specialist/my-payment-subscription',
    },
    mentor: 'specialist/my-mentor',
    infoForBanners: 'specialist/info-for-banners',
    google: {
      login: 'specialist/google/login',
      redirect: 'specialist/google/redirect',
    },
  },
  tag: {
    root: 'tags',
  },
  problem: 'problems',
  module: 'modules',
  feature: 'features',
  service: 'services',
  priceRange: 'price-ranges',
  telegram: {
    webhook: telegramWebhookRoot,
    updates: `${telegramWebhookRoot}/updates`,
  },
  payment: {
    webhook: {
      recurrent: `${cloudPaymentsWebhookRoot}/recurrent`,
      pay: `${cloudPaymentsWebhookRoot}/pay`,
    },
  },
  storage: {
    getPublicSignedUrl: `file/get-public-signed-url`,
    getPrivateSignedUrl: `file/get-private-signed-url`,
  },
};
