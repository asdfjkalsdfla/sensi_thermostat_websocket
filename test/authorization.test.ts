import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { MockAgent, setGlobalDispatcher } from 'undici';
import type { Interceptable, MockInterceptor } from 'undici/types/mock-interceptor';
// import { rest } from 'msw';
// import { setupServer } from 'msw/node';

const tokenEndpoint = 'https://test.georgiavotesvisual.com';
const email = faker.internet.userName();
const password = faker.internet.password();
const clientId = faker.datatype.uuid();
const clientSecret = faker.datatype.uuid();

vi.mock('../src/config.js', () => ({
  TOKEN_ENDPOINT: tokenEndpoint
}));

import { Authorization } from '../src/authorization.js';

const responseOptions: MockInterceptor.MockResponseOptions = {
  headers: {
    'content-type': 'application/json',
  },
};

let mockAgent: MockAgent;
let mockPool: Interceptable;

describe('authorization', () => {
  let authorization;

  describe('login', () => {
    beforeEach(() => {
      mockAgent = new MockAgent();
      mockAgent.disableNetConnect(); // prevent actual requests to Discord
      setGlobalDispatcher(mockAgent); // enabled the mock client to intercept requests
      mockPool = mockAgent.get('https://test.georgiavotesvisual.com');
      authorization = new Authorization(
        clientId, clientSecret, email, password
      );
    });
    afterEach(async () => {
      await mockAgent.close();
    });

    test('call endpoint and return token', async () => {
      const accessToken = faker.datatype.uuid();
      const refreshToken = faker.datatype.uuid();
      mockPool
        .intercept({
          path: `${tokenEndpoint}/token`,
          method: 'POST',
        })
        .reply(() => ({
          data: { access_token: accessToken, refresh_token: refreshToken },
          statusCode: 200,
          responseOptions,
        }));
      // const server = setupServer(
      //   rest.post(`${tokenEndpoint}/token`, (req, res, ctx) => {
      //     return res(ctx.json({ access_token: accessToken, refresh_token: refreshToken }))
      //   }),
      // )
      // server.listen({
      //   onUnhandledRequest(req) {
      //     console.error('Found an unhandled %s request to %s', req.method, req.url.href,)
      //   },
      // });
      await authorization.login();

      expect(authorization.accessToken).toBe(accessToken);
      expect(authorization.refreshToken).toBe(refreshToken);
    });

    test('rejects with error if request fails', async () => {
      const error = faker.lorem.word();
      mockPool
        .intercept({
          path: `${tokenEndpoint}/token`,
          method: 'POST',
        })
        .reply(() => ({
          data: { error },
          statusCode: 400,
          responseOptions,
        }));

      try {
        await authorization.login();
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err).toEqual({ error });
      }
    });

    [
      {
        property: 'clientId',
        auth: new Authorization(
          undefined, clientSecret, email, password
        )
      },
      {
        property: 'clientSecret',
        auth: new Authorization(
          clientId, undefined, email, password
        )
      },
      {
        property: 'email',
        auth: new Authorization(
          clientId, clientSecret, undefined, password
        )
      },
      {
        property: 'password',
        auth: new Authorization(
          clientId, clientSecret, email, undefined
        )
      }
    ].forEach((testCase: { property: string, auth: Authorization }) => {
      test(`does not call login endpoint if ${testCase.property} is not set in the config`, async () => {
        mockPool
          .intercept({
            path: `${tokenEndpoint}/token`,
            method: 'POST',
          })
          .reply(() => ({
            data: {},
            statusCode: 400,
            responseOptions,
          }));

        try {
          await testCase.auth.login();
          expect(true).toBeFalsy();
        } catch (err) {
          expect(err).toEqual(new Error('Missing one or more of the required environment variables: CLIENT_ID, CLIENT_SECRET, EMAIL, PASSWORD.'));
        }
      });
    });
  });

  describe('refreshAccessToken', () => {
    const accessToken = faker.datatype.uuid();
    const refreshToken = faker.datatype.uuid();
    const response = { access_token: accessToken, refresh_token: refreshToken };

    beforeEach(async () => {
      mockAgent = new MockAgent();
      mockAgent.disableNetConnect(); // prevent actual requests to Discord
      setGlobalDispatcher(mockAgent); // enabled the mock client to intercept requests
      mockPool = mockAgent.get('https://test.georgiavotesvisual.com');
      mockPool
        .intercept({
          path: `${tokenEndpoint}/token`,
          method: 'POST',
        })
        .reply(() => ({
          data: response,
          statusCode: 200,
          responseOptions,
        }));

      authorization = new Authorization(
        clientId, clientSecret, email, password
      );
      await authorization.login();
    });

    test('refresh access token', async () => {
      const newAccessToken = faker.datatype.uuid();
      mockPool
        .intercept({
          path: `${tokenEndpoint}/token`,
          method: 'POST',
        })
        .reply(() => ({
          data: { access_token: newAccessToken },
          statusCode: 200,
          responseOptions,
        }));

      await authorization.refreshAccessToken();

      expect(authorization.accessToken).toBe(newAccessToken);
      expect(authorization.refreshToken).toBe(refreshToken);
    });

    test('rejects with error if statusCode is a 400', async () => {
      const error = faker.lorem.word();
      mockPool
        .intercept({
          path: `${tokenEndpoint}/token`,
          method: 'POST',
        })
        .reply(() => ({
          data: { error },
          statusCode: 400,
          responseOptions,
        }));
        
      try {
        await authorization.refreshAccessToken();
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err).toEqual({ error });
      }
    });
  });
});
