import _ from 'lodash';
import { Socket } from './socket/socket.js';
import { Registration } from './types/types.js';

const timeDeltaFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export class Thermostat {
  readonly icd_id: string;
  state: any;
  registration: Registration;
  socket: Socket = null;
  dateOfLastTempOffsetChange: Date;
  dateSinceOffsetNeedDetected: Date;
  remoteSensorTempLastRead: number;
  remoteSensorTempAtHVACStart: number;

  constructor(socket: Socket, data: any) {
    if (data.icd_id !== undefined) {
      this.icd_id = data.icd_id;
    }
    if (data.state !== undefined) {
      this.state = { ...data.state };
      this.state.demand_status = { ...data.state.demand_status };
    }
    if (data.registration !== undefined) {
      this.registration = { ...data.registration };
    }
    if (socket) this.socket = socket;
  }

  // The temperature read at the thermostat
  get thermostatSensor_temp(): number {
    if (!this.state) return NaN;

    if (this.state.temp_offset === undefined) return NaN;

    const thermostatTemp: number = this.thermostat_temp - this.state.temp_offset;

    return thermostatTemp;
  }

  // The temperature on the display
  get thermostat_temp(): number {
    if (!this.state) return NaN;

    if (!this.state.display_temp) return NaN;

    return this.state.display_temp;
  }

  // is the system cooling
  get is_running_cool(): boolean {
    return this.state?.demand_status?.cool > 1;
  }

  // is the system heating
  get is_running_heat(): boolean {
    return this.state?.demand_status?.heat > 1;
  }

  // is the system using aux heat
  get is_running_auxheat(): boolean {
    return this.state?.demand_status?.aux > 1;
  }

  // is the system running
  get is_running(): boolean {
    const isRunning: boolean = this.is_running_cool || this.is_running_heat;
    return isRunning;
  }

  update(stateUpdates: any) {
    if (stateUpdates.registration) this.registration = stateUpdates.registration;
    if (stateUpdates.state) this.updateState(stateUpdates.state);
  }

  updateState(stateUpdates: any) {
    // determine if the message indicates the HVAC is turning off
    if (this.is_running && (stateUpdates?.demand_status?.cool === 0 || stateUpdates?.demand_status?.heat === 0)) {
      stateUpdates.demand_status.last_end = new Date();
    }
    // determine if the message indicates the HVAC is turning on
    if (!this.is_running && (stateUpdates?.demand_status?.cool >= 0 || stateUpdates?.demand_status?.heat >= 0)) {
      this.remoteSensorTempAtHVACStart = this.remoteSensorTempLastRead;
    }
    const newState = _.merge(this.state, stateUpdates);
    this.state = newState;
  }

  async setThermostatTempToSensorTemp(sensorTemperature: number) {
    // store temp read to use when system turns on
    this.remoteSensorTempLastRead = sensorTemperature;

    // CALCULATE: Determine the offset to apply
    const currentTempAtThermostatSensor = this.thermostatSensor_temp;
    const temperatureDifference = sensorTemperature - currentTempAtThermostatSensor;
    const scale = 1;
    const temperatureDifferenceRounded = Math.round(temperatureDifference * scale) / scale;
    const temperatureDifferenceRoundedMaxMin = Math.min(5, Math.max(-5, temperatureDifferenceRounded));
    const currentTempOffset = this.state.temp_offset;
    const absChangeInTempOffset = Math.abs(temperatureDifferenceRoundedMaxMin - currentTempOffset);

    // DEBUG: Log the information
    // console.log(`Temperature used in thermostat: ${this.state.display_temp}`);
    // console.log(`Temperature at sensor: ${sensorTemperature}`);
    // console.log(`Temperature at thermostat: ${currentTempAtThermostatSensor}`);
    // console.log(`Temperature difference between sensor and thermostat: ${temperatureDifference}`);
    // console.log(`Current offset: ${currentTempOffset}`);
    // console.log(`Proposed offset: ${temperatureDifferenceRounded}`);

    // CHECK: Only change the temp if the difference is big enough
    // and check that we're not just on the rounding point where we can see oscillation due to random noise
    if (absChangeInTempOffset <= 0.5 || Math.abs(temperatureDifference - currentTempOffset) <= (1 / (2 * scale) + 0.1)) {
      this.dateSinceOffsetNeedDetected = null; // if we no longer need the offset, set the offset need detection date to null
      return;
    }

    // CHECK: That the temp at sensor exceeds the change needed
    // This ensurers the sensor has changed at least 1 degree before changing the offset
    if (this.remoteSensorTempAtHVACStart && this.is_running && Math.abs(this.remoteSensorTempAtHVACStart - sensorTemperature) < 1) {
      this.dateSinceOffsetNeedDetected = null; // if we no longer need the offset, set the offset need detection date to null
      console.log(`Offset not changed since HVAC is running and temp diff not greater than 1 (temp at start - ${this.remoteSensorTempAtHVACStart}; temp now - ${sensorTemperature})`);
      return;
    }

    if (!this.dateSinceOffsetNeedDetected) this.dateSinceOffsetNeedDetected = new Date(); // set the offset needed date if one isn't set

    // CHECK: Ensure the temp isn't updated all the time
    // when the last temp offset was less than 15 minutes ago, don't update again
    const currentDate: Date = new Date();
    const assumedDuration = 20 * 60 * 1000;
    const timeFromLastChangeToOffset: number = (currentDate.valueOf() - this.dateOfLastTempOffsetChange?.valueOf()) || assumedDuration;
    if ((timeFromLastChangeToOffset) < 15 * 60 * 1000) {
      console.log(`Offset not changed since it was updated recently (offset set ${timeDeltaFormatter.format(timeFromLastChangeToOffset / 1000 / 60)} min ago at ${this.dateOfLastTempOffsetChange})`);
      return;
    }

    // CHECK: Ensure the offset isn't changed just after the hvac starts to prevent short cycling
    // Currently set to 10 minutes from start
    const lastStartTime: Date = new Date(this.state.demand_status?.last_start * 1000) || null;
    const timeSinceHVACLastStarted: number = (currentDate.valueOf() - lastStartTime?.valueOf()) || assumedDuration;
    if ((timeSinceHVACLastStarted) < 15 * 60 * 1000) {
      console.log(`Offset not changed since HVAC started recently (HVAC started ${timeDeltaFormatter.format(timeSinceHVACLastStarted / 1000 / 60)} min ago at ${lastStartTime})`);
      return;
    }

    // CHECK: Ensure the offset isn't changed just after the hvac stops to prevent short cycling
    // Currently set to 10 minutes from the end time
    const lastEndTime: Date = this.state.demand_status?.last_end || null;
    const timeSinceHVACLastEnded: number = (currentDate.valueOf() - lastEndTime?.valueOf()) || assumedDuration;
    if ((timeSinceHVACLastEnded) < 10 * 60 * 1000) {
      console.log(`Offset not changed since HVAC ended recently (HVAC stopped ${timeDeltaFormatter.format(timeSinceHVACLastEnded / 1000 / 60)} min ago at ${lastEndTime})`);
      return;
    }

    // CHECK: Ensure we've needed the offset for at last x minutes; this prevents changing this right before we get a new tempature reading from the thermostat
    // Currently set to 2 minutes
    const durationOfOffsetNeedDetected: number = (currentDate.valueOf() - this.dateSinceOffsetNeedDetected?.valueOf()) || 0;
    if ((durationOfOffsetNeedDetected) < 2 * 60 * 1000 + 2000) {
      console.log(`Offset not changed since the need was recently detected (need detected ${timeDeltaFormatter.format(durationOfOffsetNeedDetected / 1000 / 60)} min ago at ${this.dateSinceOffsetNeedDetected})`);
      return;
    }

    console.log(`Changed offset to ${temperatureDifferenceRoundedMaxMin}; temp at sensor - ${sensorTemperature}, temp at the thermostat - ${currentTempAtThermostatSensor}.`);
    await this.setThermostatOffset(temperatureDifferenceRoundedMaxMin);
    this.dateSinceOffsetNeedDetected = null; // reset the need date after setting temp
  }

  async setThermostatOffset(offset: number) {
    console.log('setting offset');
    const offsetMinMax = Math.min(5, Math.max(-5, offset));
    await this.socket.emit('set_temp_offset', {
      icd_id: this.icd_id,
      value: offsetMinMax,
    });
    // eslint-disable-next-line max-len
    // update the internal state just in case we don't get a response back before attempting the next update
    // TODO - really do state management and check for failures
    this.dateOfLastTempOffsetChange = new Date();
    this.state.display_temp = this.thermostatSensor_temp + offsetMinMax;
    this.state.temp_offset = offsetMinMax;
  }

  get circulatingFanOn(): boolean {
    return this.state?.circulating_fan?.enabled === 'on';
  }

  set circulatingFanOn(onOff: boolean) {
    const enabledValue = onOff ? 'on' : 'off';
    const perOn = this.circulatingFanPer ? this.circulatingFanPer : 50;
    this.socket.emit('set_circulating_fan', {
      icd_id: this.icd_id,
      value:
      {
        duty_cycle: perOn,
        enabled: enabledValue
      }
    });
  }

  get circulatingFanPer(): number {
    return this.state?.duty_cycle;
  }
}
