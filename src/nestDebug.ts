import { nestThermostatListener } from './nestThermostatLister.js';

const main = () => {
  nestThermostatListener('nest-device-access-345321', 'nestPull', null, null);
}

main();