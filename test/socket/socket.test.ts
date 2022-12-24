import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest';

import faker from 'faker';

// authorization mock
import { Authorization } from '../../src/authorization.js';

const accessToken = faker.datatype.uuid();
const mockAuthorizationImplementation = {
  accessToken,
  login: vi.fn().mockResolvedValue(null),
  refreshAccessToken: vi.fn().mockResolvedValue(null),
  isRefreshTokenAvailable: vi.fn()
};

vi.mock('../../src/authorization.js', () => {
  return {
    Authorization: vi.fn().mockImplementation(() => {
      return {
        ...mockAuthorizationImplementation
      }
    })
  }
})

// config mock
// let mockEndpoint = faker.internet.url();
const mockConfig = {
  SOCKET_ENDPOINT: faker.internet.url()
};
vi.mock('../../src/config.js', () => mockConfig);

// socket-io client mock
const mockSocketIOObject = {
  connected: false,
  close: vi.fn(),
  on: vi.fn()
};
const mockSocketIO = vi.fn(() => {
  return mockSocketIOObject;
});
vi.mock('socket.io-client', () => ({ default: mockSocketIO }));

// socket helper mock
import { SocketHelper } from "../../src/socket/socket_helper.js"
vi.mock('../../src/socket/socket_helper.js');
SocketHelper.stateHandler = vi.fn().mockReturnValue('worked');
SocketHelper.disconnectHandler = vi.fn().mockReturnValue('worked');

import { Socket } from '../../src/socket/socket.js';

describe('socket', () => {
  console.error = vi.fn();
  let authorization;

  beforeEach(() => {
    authorization = new Authorization(
      'testClientID', 'testClientSecret', 'testEmail', 'testPass'
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('return socket connection if the socket is connected', async () => {
    const connection = {
      connected: true,
      on: vi.fn()
    };
    const socketObject = new Socket(authorization);
    socketObject.socketConnection = connection;

    const socketConnection = await socketObject.startSocketConnection();

    expect(socketConnection).toBe(connection);
    expect(mockSocketIO).not.toHaveBeenCalled();
  });

  test('login if refresh token is not available', () => {
    authorization.isRefreshTokenAvailable.mockReturnValue(false);
    const socket = new Socket(authorization);
    socket.startSocketConnection();
    expect(authorization.login).toHaveBeenCalled();
    expect(authorization.refreshAccessToken).not.toHaveBeenCalled();
    // expect(authorization.login).toHaveBeenCalledBefore(mockSocket);
  });

  test('get new access token if a refresh token is available', () => {
    authorization.isRefreshTokenAvailable.mockReturnValue(true);
    const socket = new Socket(authorization);
    socket.startSocketConnection();
    expect(authorization.refreshAccessToken).toHaveBeenCalled();
    expect(authorization.login).not.toHaveBeenCalled();
    // expect(authorization.refreshAccessToken).toHaveBeenCalledBefore(mockSocket);
  });

  test('creates socket connection and returns it', async () => {
    const socketObject = new Socket(authorization);
    await socketObject.startSocketConnection();

    const mockArgs: Array<2> = mockSocketIO.mock.calls[0];
    expect(mockArgs[0]).toBe(mockConfig.SOCKET_ENDPOINT);
    expect(mockArgs[1]).toEqual({
      transports: ['websocket'],
      path: '/thermostat',
      extraHeaders: { Authorization: `Bearer ${authorization.accessToken}` }
    });
  });

  test('sets up socket helper and connect, disconnect, and error handlers', async () => {
    const socketObject = new Socket(authorization);

    const connection = await socketObject.startSocketConnection();

    expect(connection.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(connection.on).toHaveBeenCalledWith('disconnect', SocketHelper.disconnectHandler);
    expect(connection.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  describe('state event handler', () => {
    test('listens for state messages after connecting', async () => {
      const socketObject = new Socket(authorization);

      const connection = await socketObject.startSocketConnection();
      const handler = connection.on.mock.calls.find((x) => x[0] === 'connect')[1];
      await handler();
      const stateHandler = connection.on.mock.calls.find((x) => x[0] === 'state')[1];
      await stateHandler('data');

      expect(SocketHelper.stateHandler).toHaveBeenCalledWith('data');
    });
  });

  test('reestablish socket connection if jwt expired error comes through', async () => {
    const socketObject = new Socket(authorization);
    const error = {
      message: 'jwt expired',
      code: 'invalid_token',
      type: 'UnauthorizedError'
    };

    const connection = await socketObject.startSocketConnection();
    const handler = connection.on.mock.calls.find((x) => x[0] === 'error')[1];
    mockSocketIO.mockClear();
    mockSocketIOObject.close.mockClear();
    await handler(error);

    const mockArgs: Array<2> = mockSocketIO.mock.calls[0];
    expect(mockSocketIOObject.close).toHaveBeenCalledOnce();
    expect(mockArgs[0]).toBe(mockConfig.SOCKET_ENDPOINT);
    expect(mockArgs[1]).toEqual({
      transports: ['websocket'],
      path: '/thermostat',
      extraHeaders: { Authorization: `Bearer ${authorization.accessToken}` }
    });
  });
});
