import {
  describe, test, beforeEach, afterEach, expect, vi
} from 'vitest';
import { Socket } from '../src/socket/socket.js';
import { Authorization } from '../src/authorization.js';
import { Thermostat } from '../src/Thermostat.js';

vi.mock('../src/socket/socket.js');
vi.mock('../src/authorization.js');

const auth = new Authorization(
  '', '', '', ''
);
const socket = new Socket(auth);

const standardStartMessage = {
  icd_id: '0a-50-30-62-eb-18-ff-ff',
  registration: {
    name: 'Test', postal_code: '10010', country: 'US', contractor_id: null, timezone: 'America/New_York', address1: '501 Avenue of Americas', address2: null, city: 'New York', state: 'Ny', fleet_enabled: false, fleet_enabled_date: null, product_type: 'Sensi Classic with HomeKit'
  },
  state: {
    status: 'online',
    current_cool_temp: 75,
    current_heat_temp: 68,
    display_temp: 75.5,
    current_operating_mode: 'cool',
    humidity: 37,
    battery_voltage: 3.135,
    power_status: 'c_wire',
    wifi_connection_quality: 48,
    periodicity: 0,
    comfort_alert: null,
    other_error_bitfield: {
      bad_temperature_sensor: 'off', bad_humidity_sensor: 'off', stuck_key: 'off', high_voltage: 'off', e5_alert: 'off', error_32: 'off', error_64: 'off'
    },
    current_humidification_percent: 5,
    current_dehumidification_percent: 40,
    relay_status: {
      w: 'off', w2: 'off', g: 'off', y: 'off', y2: 'off', o_b: 'on'
    },
    demand_status: {
      humidification: 0, dehumidification: 0, overcooling: 'no', cool_stage: null, heat_stage: null, aux_stage: null, heat: 0, fan: 0, cool: 0, aux: 0, last: 'cool', last_start: null
    },
    hashedSchedule: 'abcdefef',
    display_scale: 'f',
    heat_max_temp: 99,
    cool_min_temp: 45,
    hold_mode: 'off',
    operating_mode: 'cool',
    scheduling: 'on',
    fan_mode: 'auto',
    display_humidity: 'on',
    continuous_backlight: 'off',
    compressor_lockout: 'on',
    early_start: 'off',
    keypad_lockout: 'off',
    temp_offset: 0,
    humidity_offset: 0,
    aux_cycle_rate: 'medium',
    cool_cycle_rate: 'medium',
    heat_cycle_rate: 'medium',
    aux_boost: 'on',
    heat_boost: 'on',
    cool_boost: 'on',
    dst_offset: 60,
    dst_observed: 'yes',
    tz_offset: -300,
    hold_end: null,
    deadband: 2,
    display_time: 'on',
    partial_keypad_lockout: {
      setpoint: 'on', system_mode: 'on', fan_mode: 'on', schedule_mode: 'on', settings_menu: 'on'
    },
    lcd_sleep_mode: null,
    night_light: null,
    outdoor_weather_display: 'ff:00:00:ff:ff:ff:00:00:ff:00:00:ff:00:00:ff:00:00:ff:00',
    circulating_fan: { enabled: 'off', duty_cycle: 30 },
    humidity_control: { humidification: { target_percent: 5, enabled: 'off', mode: 'humidifier' }, dehumidification: { target_percent: 40, enabled: 'off', mode: 'overcooling' }, status: 'none' },
    geofencing: null,
    remote_sensor_status: '00',
    control: {
      mode: 'scheduling', devices: null, geo_state: null, device_data: null
    }
  }
};

describe('state updates', () => {
  let thermostat;
  const startState = {
    demand_status: { last_start: 1649628642, cool: 100, cool_stage: 1 }, relay_status: { y: 'on' }, wifi_connection_quality: 44, control: {}, humidity_control: { status: 'none' }
  };
  beforeEach(() => {
    thermostat = new Thermostat(socket, {});
    thermostat.updateState(startState);
  });
  afterEach(() => {
    vi.resetAllMocks();
  });
  test('single update with no existing values', () => {
    expect(thermostat.state).toEqual(startState);
    expect(thermostat.state.demand_status.cool).toEqual(100);
    expect(thermostat.state.relay_status.y).toEqual('on');
  });
  test('test fan turning on with ac already running', () => {
    const statusUpdate = {
      demand_status: { fan: 100 }, relay_status: { g: 'on' }, control: {}, humidity_control: { status: 'none' }
    };
    thermostat.updateState(statusUpdate);
    expect(thermostat.state.demand_status.cool).toEqual(100);
    expect(thermostat.state.relay_status.y).toEqual('on');
    expect(thermostat.state.relay_status.g).toEqual('on');
  });
  test('test ac turns off', () => {
    const statusUpdateFan = {
      demand_status: { fan: 100 }, relay_status: { g: 'on' }, control: {}, humidity_control: { status: 'none' }
    };
    thermostat.updateState(statusUpdateFan);
    const statusUpdateOff = {
      demand_status: {
        last_start: null, cool: 0, fan: 0, cool_stage: null
      },
      relay_status: { y: 'off', g: 'off' }
    };
    thermostat.updateState(statusUpdateOff);
    expect(thermostat.state.demand_status.cool).toEqual(0);
    expect(thermostat.state.relay_status.y).toEqual('off');
    expect(thermostat.state.relay_status.g).toEqual('off');
  });
});

describe('indicator of running state', () => {
  let thermostat;
  beforeEach(() => {
    thermostat = new Thermostat(socket, standardStartMessage);
  });
  afterEach(() => {
    vi.resetAllMocks();
  });
  test('nothing running', () => {
    expect(thermostat.is_running_cool).toEqual(false);
    expect(thermostat.is_running_heat).toEqual(false);
    expect(thermostat.is_running_auxheat).toEqual(false);
    expect(thermostat.is_running).toEqual(false);
  });
  test('ac running', () => {
    const startState = {
      demand_status: { last_start: 1649628642, cool: 100, cool_stage: 1 }, relay_status: { y: 'on' }, wifi_connection_quality: 44, control: {}, humidity_control: { status: 'none' }
    };
    thermostat.updateState(startState);
    expect(thermostat.is_running_cool).toEqual(true);
    expect(thermostat.is_running_heat).toEqual(false);
    expect(thermostat.is_running_auxheat).toEqual(false);
    expect(thermostat.is_running).toEqual(true);
  });
  test('heat running', () => {
    const startState = {
      demand_status: {
        last_start: 1649628642, cool: 0, heat: 100, cool_stage: 1
      },
      relay_status: { y: 'on' },
      wifi_connection_quality: 44,
      control: {},
      humidity_control: { status: 'none' }
    };
    thermostat.updateState(startState);
    expect(thermostat.is_running_cool).toEqual(false);
    expect(thermostat.is_running_heat).toEqual(true);
    expect(thermostat.is_running_auxheat).toEqual(false);
    expect(thermostat.is_running).toEqual(true);
  });
  test('aux heat running', () => {
    const startState = {
      demand_status: {
        last_start: 1649628642, cool: 0, heat: 100, aux: 100, cool_stage: 1
      },
      relay_status: { y: 'on' },
      wifi_connection_quality: 44,
      control: {},
      humidity_control: { status: 'none' }
    };
    thermostat.updateState(startState);
    expect(thermostat.is_running_cool).toEqual(false);
    expect(thermostat.is_running_heat).toEqual(true);
    expect(thermostat.is_running_auxheat).toEqual(true);
    expect(thermostat.is_running).toEqual(true);
  });
});

describe('temperature updates', () => {
  let thermostat;
  beforeEach(() => {
    thermostat = new Thermostat(socket, standardStartMessage);
  });
  afterEach(() => {
    vi.resetAllMocks();
  });
  test('standard state', () => {
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
  });
  test('test temp with offset', () => {
    const updateStateWithOffset = {
      icd_id: '0a-50-30-62-eb-18-ff-ff',
      registration: {
        name: 'Test', postal_code: '10010', country: 'US', contractor_id: null, timezone: 'America/New_York', address1: '501 Avenue of Americas', address2: null, city: 'New York', state: 'Ny', fleet_enabled: false, fleet_enabled_date: null, product_type: 'Sensi Classic with HomeKit'
      },
      state: {
        display_temp: 74, temp_offset: 2, display_scale: 'f', control: {}
      }
    };
    thermostat.update(updateStateWithOffset);
    expect(thermostat.thermostatSensor_temp).toEqual(72);
    expect(thermostat.thermostat_temp).toEqual(74);
  });
});

describe('temp setting offset', () => {
  let thermostat;
  beforeEach(() => {
    thermostat = new Thermostat(socket, standardStartMessage);
  });
  afterEach(() => {
    vi.resetAllMocks();
  });
  test('test temp after adding offset', async () => {
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    await thermostat.setThermostatOffset(-2);
    expect(thermostat.state.temp_offset).toEqual(-2);
    // sensor hasn't changed but display temp has
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.display_temp).toEqual(73.5);
    expect(thermostat.thermostat_temp).toEqual(73.5);
    expect(socket.emit).toHaveBeenCalled();
  });

  test('test temp after adding offset and receiving an update', async () => {
    // start condition
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);

    // send update
    await thermostat.setThermostatOffset(-3.0);
    expect(socket.emit).toHaveBeenCalled();

    // state after emit
    expect(thermostat.state.display_temp).toEqual(72.5);
    expect(thermostat.thermostat_temp).toEqual(72.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);

    // response form server with update
    const updateStateWithOffset = {
      icd_id: '0a-50-30-62-eb-18-ff-ff',
      state: { status: 'online', temp_offset: -3.0, control: {} },
      capabilities: {
        min_heat_setpoint: 45,
        min_cool_setpoint: 45,
        max_heat_setpoint: 99,
        max_cool_setpoint: 99,
        lowest_heat_setpoint_ceiling: 60,
        highest_cool_setpoint_floor: 85
      }
    };
    thermostat.update(updateStateWithOffset);

    // check state is good
    expect(thermostat.state.display_temp).toEqual(72.5);
    expect(thermostat.thermostat_temp).toEqual(72.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
  });

  test('set offset less than min value', async () => {
    // start condition
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);

    // send update
    await thermostat.setThermostatOffset(-7.0);
    expect(socket.emit).toHaveBeenCalled();

    // state after emit
    expect(thermostat.state.display_temp).toEqual(70.5);
    expect(thermostat.thermostat_temp).toEqual(70.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-5);
  });

  test('set offset less than max value', async () => {
    // start condition
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);

    // send update
    await thermostat.setThermostatOffset(9.0);
    expect(socket.emit).toHaveBeenCalled();

    // state after emit
    expect(thermostat.state.display_temp).toEqual(80.5);
    expect(thermostat.thermostat_temp).toEqual(80.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(5);
  });
});

describe('remote sensor matching - ensure in safer periods', () => {
  let thermostat;
  beforeEach(() => {
    vi.useFakeTimers();
    const dateStart = new Date(
      2022, 10, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(dateStart);
    thermostat = new Thermostat(socket, standardStartMessage);
  });
  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });
  test('basic offset', async () => {
    // initial need detected
    let date = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(date);
    let sensorTemp = 73.5;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // need detected again - should update
    date = new Date(
      2022, 11, 1, 13, 3, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(73.5);
    expect(thermostat.thermostat_temp).toEqual(73.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-2);

    // new need detected - not updated since it's a new need
    date = new Date(
      2022, 11, 1, 13, 6, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    sensorTemp = 71.5;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(73.5);
    expect(thermostat.thermostat_temp).toEqual(73.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-2);
  });
  test('basic offset with reading too soon', async () => {
    // detect initial read
    let date = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(date);
    const sensorTemp = 73.5;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // Try again but too soon - not enough past the need detection date
    date = new Date(
      2022, 11, 1, 13, 2, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // final read sets the change
    date = new Date(
      2022, 11, 1, 13, 3, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(73.5);
    expect(thermostat.thermostat_temp).toEqual(73.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-2);
  });
  test('rounding for 1/2 degree offset', async () => {
    const dateStart = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(dateStart);
    const sensorTemp = 73.0;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);
    const dateNextRead = new Date(
      2022, 11, 1, 13, 3, 0, 0
    );
    vi.setSystemTime(dateNextRead);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(73.5);
    expect(thermostat.thermostat_temp).toEqual(73.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-2);
  });
  test('rounding for 1/2 degree offset', async () => {
    const dateStart = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(dateStart);
    const sensorTemp = 72.9;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);
    const dateNextRead = new Date(
      2022, 11, 1, 13, 3, 0, 0
    );
    vi.setSystemTime(dateNextRead);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(72.5);
    expect(thermostat.thermostat_temp).toEqual(72.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-3);
  });
  test('need then no need', async () => {
    // Read with a need
    let date = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(date);
    let sensorTemp = 72.9;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // Update to no need
    date = new Date(
      2022, 11, 1, 13, 3, 0, 0
    );
    vi.setSystemTime(date);
    sensorTemp = 75.5;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // Update to need again
    // should not update since the need is too new
    date = new Date(
      2022, 11, 1, 13, 6, 0, 0
    );
    vi.setSystemTime(date);
    sensorTemp = 72.9;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // reads again and the offset is sent
    date = new Date(
      2022, 11, 1, 13, 9, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(72.5);
    expect(thermostat.thermostat_temp).toEqual(72.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-3);
  });
  test('over max offset', async () => {
    // initial call
    let date = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(date);
    const sensorTemp = 55;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // call after a few minutes
    date = new Date(
      2022, 11, 1, 13, 3, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(70.5);
    expect(thermostat.thermostat_temp).toEqual(70.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-5);

    // call again and expect no need time
    vi.resetAllMocks(); // reset mock to clear previous spy call
    date = new Date(
      2022, 11, 1, 13, 7, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.dateSinceOffsetNeedDetected).toBeNull();
    expect(thermostat.state.display_temp).toEqual(70.5);
    expect(thermostat.thermostat_temp).toEqual(70.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-5);
  });
  test('HVAC offset need detected quickly after HVAC starts', async () => {
    // hvac starts and begins cooling the house down
    let date = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(date);
    const hvacLastStartTime = date.valueOf() / 1000 + 1 * 60;
    const startState = {
      demand_status: { last_start: hvacLastStartTime, cool: 100, cool_stage: 1 }, relay_status: { y: 'on' }, wifi_connection_quality: 44, control: {}, humidity_control: { status: 'none' }
    };
    thermostat.updateState(startState);

    // temp at sensor drops by 1 degree
    // no need detected because min need duration
    date = new Date(
      2022, 11, 1, 13, 2, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    const sensorTemp = 74.0;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // same temp at sensor but still too soon after starting HVAC
    date = new Date(
      2022, 11, 1, 13, 6, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);
  });
  test('HVAC offset need detected quickly after HVAC stops', async () => {
    // HVAC is on
    // Only used for the test
    let date = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(date);
    const hvacLastStartTime = date.valueOf() / 1000;
    const startState = {
      demand_status: { last_start: hvacLastStartTime, cool: 100, cool_stage: 1 }, relay_status: { y: 'on' }, wifi_connection_quality: 44, control: {}, humidity_control: { status: 'none' }
    };
    thermostat.updateState(startState);

    // HVAC then turns off
    date = new Date(
      2022, 11, 1, 13, 1, 0, 0
    );
    vi.setSystemTime(date);
    const statusUpdateOff = {
      demand_status: {
        last_start: null, cool: 0, fan: 0, cool_stage: null
      },
      relay_status: { y: 'off', g: 'off' }
    };
    thermostat.updateState(statusUpdateOff);

    // temp at sensor drops by 1 degree
    // no need detected because min need duration
    date = new Date(
      2022, 11, 1, 13, 2, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    const sensorTemp = 77.0;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // same temp at sensor but still too soon after starting HVAC
    date = new Date(
      2022, 11, 1, 13, 5, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);
  });
  test('HVAC offset not at min of 1 degree change from start', async () => {
    // initial reading producing no change
    let date = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(date);
    let sensorTemp = 75.6;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // hvac starts and begins cooling the house down
    date = new Date(
      2022, 11, 1, 13, 1, 0, 0
    );
    vi.setSystemTime(date);
    const hvacLastStartTime = date.valueOf() / 1000 + 1 * 60;
    const startState = {
      demand_status: { last_start: hvacLastStartTime, cool: 100, cool_stage: 1 }, relay_status: { y: 'on' }, wifi_connection_quality: 44, control: {}, humidity_control: { status: 'none' }
    };
    thermostat.updateState(startState);

    // temp changes but not at minimum change from start to trigger offset
    date = new Date(
      2022, 11, 1, 13, 22, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    sensorTemp = 74.8;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // temp changes but not at minimum change from start to trigger offset
    date = new Date(
      2022, 11, 1, 13, 30, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);
  });
  test('need too soon after last set', async () => {
    // initial need detected
    let date = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(date);
    let sensorTemp = 73.5;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // need detected again - should update
    date = new Date(
      2022, 11, 1, 13, 3, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(73.5);
    expect(thermostat.thermostat_temp).toEqual(73.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-2);

    // new need detected - not updated since it's a new need
    date = new Date(
      2022, 11, 1, 13, 4, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    sensorTemp = 71.5;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(73.5);
    expect(thermostat.thermostat_temp).toEqual(73.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-2);

    // Past the need window but not past the min offset change period
    date = new Date(
      2022, 11, 1, 13, 17, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(73.5);
    expect(thermostat.thermostat_temp).toEqual(73.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-2);

    // Finally updates since past the no touch offset period
    date = new Date(
      2022, 11, 1, 13, 25, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(71.5);
    expect(thermostat.thermostat_temp).toEqual(71.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(-4);
  });
  test('real life scenario - hvac running/stopping due to changes', async () => {
    // initial need detected
    // thermostat is at 75.5
    // remote sensor is at 76.5
    let date = new Date(
      2022, 11, 1, 13, 0, 0, 0
    );
    vi.setSystemTime(date);
    let sensorTemp = 76.5;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75.5);
    expect(thermostat.thermostat_temp).toEqual(75.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(0);

    // need still detected so thermostat offset updates
    date = new Date(
      2022, 11, 1, 13, 5, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(sensorTemp);
    expect(thermostat.thermostat_temp).toEqual(sensorTemp);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(sensorTemp - 75.5);

    // hvac starts and begins cooling the house down
    date = new Date(
      2022, 11, 1, 13, 6, 0, 0
    );
    vi.setSystemTime(date);
    const hvacLastStartTime = date.valueOf() / 1000 + 1 * 60;
    const startState = {
      demand_status: { last_start: hvacLastStartTime, cool: 100, cool_stage: 1 }, relay_status: { y: 'on' }, wifi_connection_quality: 44, control: {}, humidity_control: { status: 'none' }
    };
    thermostat.updateState(startState);

    // temp at sensor cools down by 0.5 degree; without this check, rounding kills ya!
    // no need detected because the difference from start is less than 1
    date = new Date(
      2022, 11, 1, 13, 22, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    sensorTemp = 75.8;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(76.5);
    expect(thermostat.thermostat_temp).toEqual(76.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(1);

    // temp at sensor cools down by 1 degree
    // but initial need detected so not updated
    date = new Date(
      2022, 11, 1, 13, 23, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    sensorTemp = 75.5;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(76.5);
    expect(thermostat.thermostat_temp).toEqual(76.5);
    expect(thermostat.thermostatSensor_temp).toEqual(75.5);
    expect(thermostat.state.temp_offset).toEqual(1);

    // temp at thermostat updates by 0.5 degrees
    // we no long have a need to update the offset
    date = new Date(
      2022, 11, 1, 13, 24, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    const updateStateWithOffset = {
      icd_id: '0a-50-30-62-eb-18-ff-ff',
      registration: {
        name: 'Test', postal_code: '10010', country: 'US', contractor_id: null, timezone: 'America/New_York', address1: '501 Avenue of Americas', address2: null, city: 'New York', state: 'Ny', fleet_enabled: false, fleet_enabled_date: null, product_type: 'Sensi Classic with HomeKit'
      },
      state: {
        display_temp: 76.0, temp_offset: 1, display_scale: 'f', control: {}
      }
    };
    thermostat.update(updateStateWithOffset);
    expect(thermostat.state.display_temp).toEqual(76);
    expect(thermostat.thermostatSensor_temp).toEqual(75);
    expect(thermostat.thermostat_temp).toEqual(76);
    expect(thermostat.state.temp_offset).toEqual(1);

    // senor reads just slightly lower temp at 0.1 drop
    // still no need detected as we're close to the active temp in thermostat (only 0.6 difference)
    date = new Date(
      2022, 11, 1, 13, 25, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    sensorTemp = 75.4;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(76);
    expect(thermostat.thermostatSensor_temp).toEqual(75);
    expect(thermostat.thermostat_temp).toEqual(76);
    expect(thermostat.state.temp_offset).toEqual(1);

    // temp at sensor cools down by 0.5 degree; 1.6 degrees from start
    // no change - initial need for offset detected
    date = new Date(
      2022, 11, 1, 13, 26, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    sensorTemp = 74.9;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(76);
    expect(thermostat.thermostatSensor_temp).toEqual(75);
    expect(thermostat.thermostat_temp).toEqual(76);
    expect(thermostat.state.temp_offset).toEqual(1);

    // temp at sensor same but need continues
    // offset sent since min need time and past the HVAC min run time
    date = new Date(
      2022, 11, 1, 13, 30, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75);
    expect(thermostat.thermostat_temp).toEqual(75);
    expect(thermostat.thermostatSensor_temp).toEqual(75);
    expect(thermostat.state.temp_offset).toEqual(-0);

    // temp at sensor cools down by 1 degree
    // no change - initial need for offset detected
    // start need right before HVAC stops
    date = new Date(
      2022, 11, 1, 13, 31, 0, 0
    );
    vi.setSystemTime(date);
    vi.resetAllMocks(); // reset mock to clear previous spy call
    sensorTemp = 73.9;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75);
    expect(thermostat.thermostat_temp).toEqual(75);
    expect(thermostat.thermostatSensor_temp).toEqual(75);
    expect(thermostat.state.temp_offset).toEqual(-0);

    // HVAC turns off
    date = new Date(
      2022, 11, 1, 13, 32, 0, 0
    );
    vi.setSystemTime(date);
    const statusUpdateOff = {
      demand_status: {
        last_start: null, cool: 0, fan: 0, cool_stage: null
      },
      relay_status: { y: 'off', g: 'off' }
    };
    thermostat.updateState(statusUpdateOff);

    // extreme warming right after the HVAC stops
    // second need but HVAC has just stopped
    date = new Date(
      2022, 11, 1, 13, 34, 0, 0
    );
    vi.setSystemTime(date);
    sensorTemp = 78.9;
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(75);
    expect(thermostat.thermostat_temp).toEqual(75);
    expect(thermostat.thermostatSensor_temp).toEqual(75);
    expect(thermostat.state.temp_offset).toEqual(-0);

    // finally updates because  HVAC has been stopped a while
    date = new Date(
      2022, 11, 1, 13, 48, 0, 0
    );
    vi.setSystemTime(date);
    await thermostat.setThermostatTempToSensorTemp(sensorTemp);
    expect(socket.emit).toHaveBeenCalled();
    expect(thermostat.state.display_temp).toEqual(79);
    expect(thermostat.thermostat_temp).toEqual(79);
    expect(thermostat.thermostatSensor_temp).toEqual(75);
    expect(thermostat.state.temp_offset).toEqual(4);
  });
});
