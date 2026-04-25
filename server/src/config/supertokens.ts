import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import Passwordless from 'supertokens-node/recipe/passwordless';
import Dashboard from 'supertokens-node/recipe/dashboard';
import { TypeInput } from 'supertokens-node/types';
import { config } from './env';
import User from '../models/User';
import logger from '../utils/logger';

export const initSuperTokens = (): void => {
  const supertokensConfig: TypeInput = {
    framework: 'express',
    supertokens: {
      connectionURI: config.SUPERTOKENS_CONNECTION_URI,
      apiKey: config.SUPERTOKENS_API_KEY,
    },
    appInfo: {
      appName: 'RecipeAI',
      apiDomain: config.CORS_ORIGIN.replace('3000', '5000'), // Backend URL
      websiteDomain: config.CORS_ORIGIN, // Frontend URL
      apiBasePath: '/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [
      Passwordless.init({
        flowType: 'USER_INPUT_CODE',
        contactMethod: 'EMAIL',
        emailDelivery: {
          override: (originalImplementation) => {
            return {
              ...originalImplementation,
              sendEmail: async function (input) {
                try {
                  // For development, log the OTP to console
                  if (config.NODE_ENV === 'development') {
                    logger.info('OTP Email', {
                      email: input.email,
                      userInputCode: input.userInputCode,
                      urlWithLinkCode: input.urlWithLinkCode,
                    });
                    console.log('\n=================================');
                    console.log('OTP CODE:', input.userInputCode);
                    console.log('EMAIL:', input.email);
                    console.log('=================================\n');
                  }
                  // Call original implementation (SuperTokens default email service)
                  return originalImplementation.sendEmail(input);
                } catch (error) {
                  logger.error('Error sending OTP', {
                    email: input.email,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  });
                  throw error;
                }
              },
            };
          },
        },
        override: {
          apis: (originalImplementation) => {
            return {
              ...originalImplementation,
              consumeCodePOST: async function (input) {
                // Call original implementation
                const response = await originalImplementation.consumeCodePOST!(input);

                // If sign up/in was successful, create user in MongoDB
                if (response.status === 'OK') {
                  const { user, createdNewRecipeUser } = response;

                  if (createdNewRecipeUser) {
                    try {
                      // Get user email - it's in the emails array for passwordless
                      const userEmail = user.emails && user.emails.length > 0 ? user.emails[0] : null;

                      if (userEmail) {
                        // Create user in MongoDB
                        const mongoUser = await User.create({
                          email: userEmail,
                          name: userEmail.split('@')[0], // Default name from email
                          supertokensUserId: user.id,
                        });

                        logger.info('New user created in MongoDB', {
                          userId: mongoUser._id,
                          email: userEmail,
                        });
                      }
                    } catch (error) {
                      logger.error('Error creating user in MongoDB:', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                      });
                    }
                  }
                }

                return response;
              },
            };
          },
        },
      }),
      Session.init({
        // Session expires after 30 minutes of inactivity
        sessionExpiredStatusCode: 401,
        cookieSameSite: 'lax',
        cookieSecure: config.NODE_ENV === 'production',
        // Anti-CSRF protection
        antiCsrf: 'VIA_TOKEN',
      }),
      Dashboard.init({
        apiKey: config.SUPERTOKENS_API_KEY,
      }),
    ],
  };

  supertokens.init(supertokensConfig);
  logger.info('SuperTokens initialized successfully');
};
