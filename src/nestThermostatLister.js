// Imports the Google Cloud client library
import { PubSub } from '@google-cloud/pubsub';
import { TEMP_NUMBER_FORMATTER } from './Util.js'

const { NEST_DEVICEID_1, NEST_DEVICEID_2, NEST_DEVICEID_3 } = process.env;

const updatePrometheusWithNestStatusUpdate = ( message, gaugeTemp, gaugeHumidity, gaugeHVACRunning )  => {
  // Bad way to do this, but hey...
  let thermostatRoom;
  const id = message?.name.split('/')[3]; // find 
  switch (id) {
    case NEST_DEVICEID_1:
      thermostatRoom = 'basement'; 
      break;
    case NEST_DEVICEID_2:
      thermostatRoom = 'upstairs'; 
      break;
    case NEST_DEVICEID_3:
      thermostatRoom = 'main'; 
      break;
    default:
      thermostatRoom = 'unknown'; 
      console.log(`Not found.`);
  }
  const tempC = message?.traits['sdm.devices.traits.Temperature']?.ambientTemperatureCelsius;
  if (tempC) {
    const tempF = tempC * 1.8 + 32;
    // console.log(`Temp: ${tempF} at ${timeStamp.toLocaleString()}`);
    if(gaugeTemp) gaugeTemp.set({ room: thermostatRoom }, TEMP_NUMBER_FORMATTER.format(tempF));
  }

  const humidity = message?.traits['sdm.devices.traits.Humidity']?.ambientHumidityPercent;
  if (humidity) {
    if(gaugeHumidity) gaugeHumidity.set({ room: thermostatRoom }, TEMP_NUMBER_FORMATTER.format(humidity));
  }

  const hvacRunningInfo = message?.traits['sdm.devices.traits.ThermostatHvac']?.status;

  if (hvacRunningInfo) {
    const isRunningHeat = hvacRunningInfo === 'HEATING';
    const isRunningAuxHeat = false;
    const isRunningCool = hvacRunningInfo === 'COOLING';
    const isRunning = isRunningHeat || isRunningAuxHeat || isRunningCool;
    // console.log(hvacRunningInfo);
    // console.log(`HVAC Heat Run: ${is_running_heat} at ${timeStamp.toLocaleString()}`);
    // console.log(`HVAC Cool Run: ${is_running_cool}`);
    // console.log(`HVAC Run: ${is_running}`);

    if(gaugeHVACRunning) {
      gaugeHVACRunning.set({ level: thermostatRoom, mode: 'heat' }, +isRunningHeat);
      gaugeHVACRunning.set({ level: thermostatRoom, mode: 'auxheat' }, +isRunningAuxHeat);
      gaugeHVACRunning.set({ level: thermostatRoom, mode: 'cool' }, +isRunningCool);
      gaugeHVACRunning.set({ level: thermostatRoom, mode: 'system' }, +isRunning);
    }
  }
}

const fetchStatus = async (gaugeTemp, gaugeHumidity, gaugeHVACRunning)  => {
    const refresh_token = process.env.NEST_REFRESH_TOKEN;
    const oauth_client_id = process.env.NEST_OAUTH_CLIENT_ID;
    const oauth_client_secret = process.env.NEST_OAUTH_CLIENT_SECRET
    const authTokenRequest = await fetch(
      `https://www.googleapis.com/oauth2/v4/token?client_id=${oauth_client_id}&client_secret=${oauth_client_secret}&refresh_token=${refresh_token}&grant_type=refresh_token`,
      { method: "POST" }
    );
    const authTokenBody = await authTokenRequest.json();
    const authToken = authTokenBody.access_token;
    const household = process.env.NEST_HOUSEHOLD;
    const { NEST_DEVICEID_1, NEST_DEVICEID_2, NEST_DEVICEID_3 } = process.env;
    const deviceIDs = [ NEST_DEVICEID_1, NEST_DEVICEID_2, NEST_DEVICEID_3 ];
    deviceIDs.forEach ( async (deviceID) => {
      const deviceInfoRequest = await fetch(
        `https://smartdevicemanagement.googleapis.com/v1/enterprises/${household}/devices/${deviceID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const deviceInfoBody = await deviceInfoRequest.json();
      updatePrometheusWithNestStatusUpdate( deviceInfoBody, gaugeTemp, gaugeHumidity, gaugeHVACRunning );
    });
}

export const nestThermostatListener = async (
  projectId = 'your-project-id', // Your Google Cloud Platform project ID
  subscriptionName = 'my-sub', // Name for the new subscription to create
  gaugeTempInput = null,
  gaugeHVACRunningInput = null,
  gaugeHumidityInput = null
) => {
  const gaugeTemp = gaugeTempInput;
  const gaugeHumidity = gaugeHumidityInput;
  const gaugeHVACRunning = gaugeHVACRunningInput;
  // Instantiates a client
  const pubsub = new PubSub({ projectId });

  // Listen to a subscription
  const subscription = pubsub.subscription(subscriptionName);

  // Create an event handler to handle messages
  const messageHandler = (message) => {
    if (!message.data) return; // make sure we have a message
    const messageDataJSON = message.data.toString();
    const messageData = JSON.parse(messageDataJSON);

     // const timeStamp = new Date(messageData.timestamp);
    console.debug(JSON.stringify(messageData.resourceUpdate));

    if(messageData.resourceUpdate) updatePrometheusWithNestStatusUpdate(messageData.resourceUpdate, gaugeTemp, gaugeHumidity, gaugeHVACRunning)
    
    // "Ack" (acknowledge receipt of) the message
    // console.log('ACK');
    message.ack();
  };

  // Listen for new messages until timeout is hit
  subscription.on('message', messageHandler);

  // Receive callbacks for errors on the subscription
  subscription.on('error', (error) => {
    console.error('Received error:', error);
    process.exit(1);
  });

  fetchStatus(gaugeTemp, gaugeHumidity, gaugeHVACRunning);
};
