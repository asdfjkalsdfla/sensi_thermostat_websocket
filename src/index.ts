/* eslint-disable no-await-in-loop */
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import https from 'https';
import aht20 from 'aht20-sensor';
import * as client from 'prom-client';
// import { Authorization } from './authorization.js';
// import { Socket } from './socket/socket.js';
// import { Thermostats } from './Thermostats.js';
// import * as config from './config.js';
import { nestThermostatListener } from './nestThermostatLister.js';
import { OutsideAirTempFetcher } from './OutsideAirTempFetcher.js';
import { TEMP_NUMBER_FORMATTER } from './Util.js'

export const { REMOTE_TEMP_ADDRESS, DOMAIN } = process.env;

const sleep = (duration) => new Promise((resolve) => {
  setTimeout(resolve, duration);
});

const average = (array) => array.reduce((a, b) => a + b) / array.length;

const isWorkingTime = () => {
  const d = new Date();
  return (d.getHours() < 19 && d.getHours() >= 9) && (d.getDay() > 0 && d.getDay() < 6);
};

let globalSensor = null;

// SETUP - Prometheus Endpoint
const register = new client.Registry();
const gaugeTemp = new client.Gauge({ name: 'temp_ambient_f', help: 'the ambient temperature', labelNames: ['room'] });
register.registerMetric(gaugeTemp);
const gaugeHumidity = new client.Gauge({ name: 'humidity', help: 'the humidity', labelNames: ['room'] });
register.registerMetric(gaugeHumidity);
const gaugeHVACRunning = new client.Gauge({ name: 'hvac_running', help: 'indicates if the hvac is running', labelNames: ['level', 'mode'] });
register.registerMetric(gaugeHVACRunning);

// // SETUP - Sensi Listener
// const authorization = new Authorization(
//   config.CLIENT_ID,
//   config.CLIENT_SECRET,
//   config.EMAIL,
//   config.PASSWORD
// );

// const sensiSocket = new Socket(authorization);
// // eslint-disable-next-line max-len
// const thermostats = new Thermostats(sensiSocket); // mixes the business logic and data access layer but ...

// console.log('Starting socket connection with Sensi');
// sensiSocket.startSocketConnection().catch((err) => {
//   console.error('could not setup socket connection', err);
//   process.exit(1);
// });

// sensiSocket.on('state', (data: any) => {
//   thermostats.updateThermostats(data);
//   thermostats.forEach((thermostat) => {
//     gaugeTemp.set({ room: 'basemenet' }, thermostat.thermostatSensor_temp);
//     gaugeHumidity.set({ room: 'basemenet' }, thermostat.humidity);
//     gaugeHVACRunning.set({ level: 'basemenet', mode: 'system' }, +thermostat.is_running);
//     gaugeHVACRunning.set({ level: 'basemenet', mode: 'heat' }, +thermostat.is_running_heat);
//     gaugeHVACRunning.set({ level: 'basemenet', mode: 'auxheat' }, +thermostat.is_running_auxheat);
//     gaugeHVACRunning.set({ level: 'basemenet', mode: 'cool' }, +thermostat.is_running_cool);
//   });
// });

const readTemperatureSensorData = async (sensor) => {
  const { humidity, temperature: temperatureC } = await sensor.readData();
  const temperatureF = temperatureC * 1.8 + 32;
  return { temperatureC, temperatureF, humidity };
};

const readTemperatureSensorDataContinuously = async (sensor) => {
  let tempReadings = [];
  let humidityReadings = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(30 * 1000);
    const remoteSensorData = await readTemperatureSensorData(sensor);
    // console.log(remoteSensorData.temperatureF);
    // basic check for outlier data
    // eslint-disable-next-line max-len
    if ((remoteSensorData.temperatureF < 110) && (remoteSensorData.temperatureF > 10)) tempReadings.push(remoteSensorData.temperatureF);
    humidityReadings.push(remoteSensorData.humidity);

    // after 4 temp readings, take the average and then perform the offset
    if (tempReadings.length > 4) {
      const avgTemps = average(tempReadings);
      const avgHumidity = average(humidityReadings);
      // console.log(`In average temp with value of ${avgTemps}`);
      gaugeTemp.set({ room: 'office' }, TEMP_NUMBER_FORMATTER.format(avgTemps));
      gaugeHumidity.set({ room: 'office' }, TEMP_NUMBER_FORMATTER.format(avgHumidity));
      if (isWorkingTime()) {
        thermostats.forEach((thermostat) => {
          let a = 1;
          // thermostat.setThermostatTempToSensorTemp(avgTemps);
        });
      }
      tempReadings = [];
      humidityReadings = []
    }
  }
};

// const setToRemoteThermostatTempContinuously = async () => {
//   while (true) {
//     await sleep(2.5 * 60 * 1000);
//     await setToRemoteThermostatTemp();
//   }
// };

// const setToRemoteThermostatTemp = async () => {
//   if (isWorkingTime()) return; // don't use this during working hours
//   try {
//     const tempResponse = await globalThis.fetch(REMOTE_TEMP_ADDRESS);
//     if (!tempResponse.ok) {
//       return;
//     }
//     const data: any = await tempResponse.json();
//     thermostats.forEach((thermostat) => {
//       thermostat.setThermostatTempToSensorTemp(data.temperatureF);
//     });
//   } catch (ex) {
//     console.log(ex);
//   }
// };

// const manageCirculatingFanSchedule = async () => {
//   while (true) {
//     const d = new Date();
//     thermostats.forEach((thermostat) => {
//       const fanShouldBeOn = !!(((d.getHours() < 19 && d.getHours() >= 12) && (d.getDay() > 0 && d.getDay() < 6) && thermostat.thermostat_temp > 70));
//       if (fanShouldBeOn !== thermostat.circulatingFanOn) {
//         thermostat.circulatingFanOn = fanShouldBeOn;
//         console.log('Changed Circulating Fan Status');
//       }
//     });
//     await sleep(5 * 60 * 1000);
//   }
// };

// SETUP - Express Endpoints

const app = express();

app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.get('/temp', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(await readTemperatureSensorData(globalSensor)));
});

const readCertsSync = (certDir) => {
  return {
    key: fs.readFileSync(`${certDir}/privkey.pem`),
    cert: fs.readFileSync(`${certDir}/fullchain.pem`)
  }
}

const main = async () => {
  const certDir = `/etc/letsencrypt/live/${DOMAIN}`;
  const options = readCertsSync(certDir);

  const httpd = https.createServer(options, app).listen(9091, () => console.log('Server is running on http://localhost:9091, metrics are exposed on http://localhost:9091/metrics'));

  // Auto update cert
  let waitForCertAndFullChainToGetUpdatedTooTimeout;
  fs.watch(certDir, () => {
    clearTimeout(waitForCertAndFullChainToGetUpdatedTooTimeout);
    waitForCertAndFullChainToGetUpdatedTooTimeout = setTimeout(() => {
      httpd.setSecureContext(readCertsSync(certDir));
    }, 5000);
  });

  const sensor = await aht20.open();
  globalSensor = sensor;
  readTemperatureSensorDataContinuously(sensor);
  nestThermostatListener(
    'nest-device-access-345321', 'nestPull', gaugeTemp, gaugeHVACRunning, gaugeHumidity
  );
  const tempFetcher = new OutsideAirTempFetcher();
  tempFetcher.start();
  tempFetcher.on('tempChange', (temp) => { gaugeTemp.set({ room: 'outside' }, TEMP_NUMBER_FORMATTER.format(temp)); });
  tempFetcher.on('humidityChange', (humidity) => { gaugeHumidity.set({ room: 'outside' }, TEMP_NUMBER_FORMATTER.format(humidity)); });

  // manageCirculatingFanSchedule();
  // setToRemoteThermostatTempContinuously();
};

main();
