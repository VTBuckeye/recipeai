import SuperTokens from 'supertokens-auth-react';
import Passwordless from 'supertokens-auth-react/recipe/passwordless';
import Session from 'supertokens-auth-react/recipe/session';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const websiteDomain = process.env.REACT_APP_SUPERTOKENS_WEBSITE_DOMAIN || 'http://localhost:3000';

export const initSuperTokens = () => {
  SuperTokens.init({
    appInfo: {
      appName: 'RecipeAI',
      apiDomain: apiUrl,
      websiteDomain: websiteDomain,
      apiBasePath: '/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [
      Passwordless.init({
        contactMethod: 'EMAIL',
        signInUpFeature: {
          resendEmailOrSMSGapInSeconds: 60,
        },
      }),
      Session.init(),
    ],
  });
};
