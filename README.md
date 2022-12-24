# Sensi Thermostat Websocket

The Sensi Thermostat Websocket project is a wrapper around Emerson's WebSocket API used by the Sensi WiFi thermostat mobile app.

This application allows you to receive thermostat updates for all of the thermostats connected to a Sensi account. You can also perform basic updates such as setting the temperature offset in case you have a remote ambient temperature sensor. Right now, it is also logs the temperatures from the thermostat and a local sensor to Grafana. This will be split later.

## Quick Start

```
make install # or nvm use && npm install
CLIENT_ID=client_id CLIENT_SECRET=client_secret EMAIL=email PASSWORD=password npm run start
```

You will need to pass in your Sensi account email address and password as a command line argument to `npm run start`.
You will also need a client ID and secret for the OAuth process. Please refer to the [Clients](#Clients) table for valid credentials.

### [Clients](#Clients)

| Client ID | Client Secret                    |
| --------- | -------------------------------- |
| android   | XBF?Z9U6;x3bUwe^FugbL=4ksvGjLnCQ |
| ios       | 8m7YoDninTVasvZ42;^nwrA}%FPWuVjH |

### API Documentation
The Emerson Sensi Web Socket API is documented in [api.md](api.md).
