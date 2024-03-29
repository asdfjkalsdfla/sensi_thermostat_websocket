# Sensi Thermostats by Emerson API Documentation
##
APIs
- [set temperature](#settemperature)
- [set_operating_mode](#setoperatingmode)
- [set_fan_mode](#setfanmode)
- [set_temp_offset](#settempoffset)
- [get_weather](#getweather)
- [get_schedule_projection](#getscheduleprojection)
- [get_schedules_with_limits](#getscheduleswithlimits)
- [update_schedule](#updateschedule)
- [set_early_start](#setearlystart)
- [set_display_scale](#setdisplayscale)
- [set_display_time](#setdisplaytime)
- [set_display_humidity](#setdisplayhumidity)
- [set_continuous_backlight](#setcontinuousbacklight)
- [set_keypad_lockout](#setkeypadlockout)
- [set_cool_cycle_rate](#setcoolcyclerate)
- [set_heat_cycle_rate](#setheatcyclerate)
- [set_heat_boost](#setheatboost)
- [set_cool_boost](#setcoolboost)
- [set_compressor_lockout](#setcompressorlockout)
- [get_info](#getinfo)
- [state](#state)


## Emit/Publish

### set_temperature

sets the target temperature for a mode. This does not adjust the mode (i.e. it won't change from heat to cool)

#### Request

#### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "mode": "cool",
  "target_temp": 79,
  "scale": "f"
}
```

##### Fields

| Field       | Data Type                                    | Description                      |
| ----------- | -------------------------------------------- | -------------------------------- |
| icd_id      | string                                       | identifier of the thermostat     |
| mode        | enum<br>values: auto, heat,cool              | operating mode of the thermostat |
| target_temp | int                                          | temperature for thermostat       |
| scale       | enum <br>values: f = fahrenheit, c = celsius | temperature scale                |

### set_operating_mode

changes the thermostat operating mode to heat, cool, or off

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "heat"
}
```

### set_fan_mode

used to set the fan to runnin

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "auto"
}
```

##### Fields

| Field  | Data Type              | Description                                |
| ------ | ---------------------- | ------------------------------------------ |
| icd_id | string                 | identifier of the thermostat               |
| value  | enum<br>values:auto,on | fan turns on automatically or is always on |

### set_temp_offset

Used to adjust the temperature used by the thermostat from what's read. This is useful when trying to create a remote temperature sensor.

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": 0
}
```

#### Fields

| Field  | Data Type | Description                                          |
| ------ | --------- | ---------------------------------------------------- |
| icd_id | string    | identifier of the thermostat                         |
| value  | int       | adjustment to the temperature read at the thermostat |

### get_weather

Provides the current weather and forecast for a postal code.

#### Request

##### Example body

```json
{
  "postal_code": "10042",
  "scale": "f"
}
```

#### Fields

| Field       | Data Type                                    | Description                                      |
| ----------- | -------------------------------------------- | ------------------------------------------------ |
| postal_code | string                                       | postal code - to figure out internationalization |
| scale       | enum <br>values: f = fahrenheit, c = celsius | temperature scale                                |

#### Response

##### Example body

```json
{
  "city": "New York",
  "state": "Ny",
  "high_temp": 59.81,
  "low_temp": 43.28,
  "current_temp": 58.05,
  "weather": "Clear",
  "icon": "https://s3.amazonaws.com/sensi-weather-icons/clear-day.png"
}
```

#### Fields

| Field        | Data Type | Description                                              |
| ------------ | --------- | -------------------------------------------------------- |
| city         | string    | city                                                     |
| state        | string    | state                                                    |
| high_temp    | decimal   | forecasted high temperature; always for the current date |
| low_temp     | decimal   | forecasted low temperature; always for the current date  |
| current_temp | decimal   | current temperature for the location                     |
| weather      | string    | description of current condition                         |
| icon         | url       | S3 location for the image                                |

### get_schedule_projection

Find the upcoming changes to the target temperature.

#### Request

##### Example body

```json
{
  "scale": "f",
  "icd_id": "0a-50-30-62-eb-18-ff-ff"
}
```

#### Fields

| Field  | Data Type                                    | Description                  |
| ------ | -------------------------------------------- | ---------------------------- |
| icd_id | string                                       | identifier of the thermostat |
| scale  | enum <br>values: f = fahrenheit, c = celsius | temperature scale            |

### get_schedules_with_limits

Gets the schedule for a thermostat.

#### Request

##### Example body

```json
{
  "scale": "f",
  "icd_id": "0a-50-30-62-eb-18-ff-ff"
}
```

#### Fields

| Field  | Data Type                                    | Description                  |
| ------ | -------------------------------------------- | ---------------------------- |
| icd_id | string                                       | identifier of the thermostat |
| scale  | enum <br>values: f = fahrenheit, c = celsius | temperature scale            |

#### Response

##### Example body

```json
{
  "auto": [
    {
      "id": 12345670,
      "name": "Auto",
      "mode": "auto",
      "schedule": {
        "fri": {
          "06:00": { "cool": 75, "heat": 70 },
          "08:00": { "cool": 83, "heat": 62 },
          "17:00": { "cool": 75, "heat": 70 },
          "22:00": { "cool": 78, "heat": 62 }
        },
        "mon": {
          "06:00": { "cool": 75, "heat": 70 },
          "08:00": { "cool": 83, "heat": 62 },
          "17:00": { "cool": 75, "heat": 70 },
          "22:00": { "cool": 78, "heat": 62 }
        },
        "sat": {
          "06:00": { "cool": 75, "heat": 70 },
          "08:00": { "cool": 83, "heat": 62 },
          "17:00": { "cool": 75, "heat": 70 },
          "22:00": { "cool": 78, "heat": 62 }
        },
        "sun": {
          "06:00": { "cool": 75, "heat": 70 },
          "08:00": { "cool": 83, "heat": 62 },
          "17:00": { "cool": 75, "heat": 70 },
          "22:00": { "cool": 78, "heat": 62 }
        },
        "thu": {
          "06:00": { "cool": 75, "heat": 70 },
          "08:00": { "cool": 83, "heat": 62 },
          "17:00": { "cool": 75, "heat": 70 },
          "22:00": { "cool": 78, "heat": 62 }
        },
        "tue": {
          "06:00": { "cool": 75, "heat": 70 },
          "08:00": { "cool": 83, "heat": 62 },
          "17:00": { "cool": 75, "heat": 70 },
          "22:00": { "cool": 78, "heat": 62 }
        },
        "wed": {
          "06:00": { "cool": 75, "heat": 70 },
          "08:00": { "cool": 83, "heat": 62 },
          "17:00": { "cool": 75, "heat": 70 },
          "22:00": { "cool": 78, "heat": 62 }
        }
      },
      "is_active": true
    }
  ],
  "heat": [
    {
      "id": 12345671,
      "name": "Heat",
      "mode": "heat",
      "schedule": {
        "fri": { "06:15": { "heat": 70 }, "21:00": { "heat": 65 } },
        "mon": { "06:15": { "heat": 70 }, "21:00": { "heat": 65 } },
        "sat": { "06:15": { "heat": 70 }, "21:00": { "heat": 65 } },
        "sun": { "06:15": { "heat": 70 }, "21:00": { "heat": 65 } },
        "thu": { "06:15": { "heat": 70 }, "21:00": { "heat": 65 } },
        "tue": { "06:15": { "heat": 70 }, "21:00": { "heat": 65 } },
        "wed": { "06:15": { "heat": 70 }, "21:00": { "heat": 65 } }
      },
      "is_active": true
    }
  ],
  "cool": [
    {
      "id": 12345672,
      "name": "Cool",
      "mode": "cool",
      "schedule": {
        "fri": { "06:00": { "cool": 75 }, "22:00": { "cool": 78 } },
        "mon": { "06:00": { "cool": 75 }, "22:00": { "cool": 78 } },
        "sat": { "06:00": { "cool": 75 }, "22:00": { "cool": 78 } },
        "sun": { "06:00": { "cool": 75 }, "22:00": { "cool": 78 } },
        "thu": { "06:00": { "cool": 75 }, "22:00": { "cool": 78 } },
        "tue": { "06:00": { "cool": 75 }, "22:00": { "cool": 78 } },
        "wed": { "06:00": { "cool": 75 }, "22:00": { "cool": 78 } }
      },
      "is_active": true
    }
  ],
  "icd_id": "0a-50-30-62-eb-18-ff-ff"
}
```

#### Fields

##### Core Response

| Field     | Data Type            | Description                                                                |
| --------- | -------------------- | -------------------------------------------------------------------------- |
| icd_id    | string               | identifier of the thermostat                                               |
| auto      | array of <schedules> | schedules available when the thermostat is in auto mode                    |
| heat      | array of <schedules> | schedules available when the thermostat is in heat mode                    |
| cool      | array of <schedules> | schedules available when the thermostat is in cool mode                    |
| is_active | boolean              | indicates if the schedule is used for the operating mode                   |
| schedule  | strut                | details on the schedule dictionary based on day of week and 24 hour format |

##### Schedule

| Field | Data Type                       | Description                                |
| ----- | ------------------------------- | ------------------------------------------ |
| id    | int                             | identifier of the schedule                 |
| name  | string                          | display name for the schedule              |
| mode  | enum<br>values: auto, heat,cool | thermostat operating mode for the schedule |

### update_schedule

Update a schedule

#### Request

```json
{
  "name": "Heat",
  "schedule": {
    "fri": { "21:00": { "heat": 65 }, "06:15": { "heat": 70 } },
    "wed": { "21:00": { "heat": 65 }, "06:15": { "heat": 70 } },
    "thu": { "21:00": { "heat": 65 }, "06:15": { "heat": 70 } },
    "sat": {
      "06:15": { "heat": 70 },
      "08:00": { "heat": 65 },
      "17:00": { "heat": 68 },
      "22:00": { "heat": 65 }
    },
    "tue": { "21:00": { "heat": 65 }, "06:15": { "heat": 70 } },
    "mon": { "06:15": { "heat": 70 }, "21:00": { "heat": 65 } },
    "sun": {
      "14:00": { "heat": 70 },
      "08:00": { "heat": 65 },
      "17:00": { "heat": 65 },
      "06:00": { "heat": 70 }
    }
  },
  "id": 12345671,
  "scale": "f",
  "icd_id": "0a-50-30-62-eb-18-ff-ff"
}
```

## set_user_schedule_active

Sets the active schedule for a thermostat.

#### Request

##### Example body

```json
{
  "icd_ids": ["0a-50-30-62-eb-18-ff-ff"],
  "id": 12345671
}
```

#### Fields

| Field   | Data Type            | Description                                     |
| ------- | -------------------- | ----------------------------------------------- |
| icd_ids | array of thermostats | set of thermostat where the schedule is applied |
| id      | number               | id of the schedule to activate                  |

### set_early_start

When early start is turned on, the thermostat will attempt to reach the teampture by the scheduled time vs. start operating at the scheduled time.

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "off"
}
```

#### Fields

| Field  | Data Type                | Description                   |
| ------ | ------------------------ | ----------------------------- |
| icd_id | string                   | identifier of the thermostat  |
| value  | enum <br>values: on, off | sets if early start is on/off |

### set_display_scale

What temperature scale will be shown in the app and on the thermostat.

#### Request

##### Example body

```json
{
  "value": "f",
  "icd_id": "0a-50-30-62-eb-18-ff-ff"
}
```

#### Fields

| Field  | Data Type             | Description                  |
| ------ | --------------------- | ---------------------------- |
| icd_id | string                | identifier of the thermostat |
| value  | enum <br>values: f, c | celsius or fahrenheit        |

### set_display_time

Sets if the current time is shown on the thermostat

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "off"
}
```

#### Fields

| Field  | Data Type                | Description                        |
| ------ | ------------------------ | ---------------------------------- |
| icd_id | string                   | identifier of the thermostat       |
| value  | enum <br>values: on, off | display the time on the thermostat |

### set_display_humidity

Sets if the current humidity is shown on the thermostat

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "off"
}
```

#### Fields

| Field  | Data Type                | Description                            |
| ------ | ------------------------ | -------------------------------------- |
| icd_id | string                   | identifier of the thermostat           |
| value  | enum <br>values: on, off | display the humidity on the thermostat |

### set_continuous_backlight

Sets if the backlight should be continuously on

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "off"
}
```

#### Fields

| Field  | Data Type                | Description                               |
| ------ | ------------------------ | ----------------------------------------- |
| icd_id | string                   | identifier of the thermostat              |
| value  | enum <br>values: on, off | sets if the backlight should always be on |

### set_keypad_lockout

Sets if the keypad on the thermostat can be used.

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "off"
}
```

#### Fields

| Field  | Data Type                | Description                               |
| ------ | ------------------------ | ----------------------------------------- |
| icd_id | string                   | identifier of the thermostat              |
| value  | enum <br>values: on, off | sets if the backlight should always be on |

### set_cool_cycle_rate

Sets how tight the cooling tempature range is for the thermostat. The `cool_cycle_rate` on the capbilities object determines if this can be adjusted and `cool_cycle_rate_steps` specifies what the valid values are.

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "fast"
}
```

#### Fields

| Field  | Data Type                           | Description                                                                    |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------ |
| icd_id | string                              | identifier of the thermostat                                                   |
| value  | enum <br>values: fast, medium, slow | sets the cycle rate (valid values found in capabilietes.cool_cycle_rate_steps) |

### set_heat_cycle_rate

Sets how tight the heating tempature range is for the thermostat. The `heat_cycle_rate` on the capbilities object determines if this can be adjusted and `heat_cycle_rate_steps` specifies what the valid values are.

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "fast"
}
```

#### Fields

| Field  | Data Type                           | Description                                                                    |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------ |
| icd_id | string                              | identifier of the thermostat                                                   |
| value  | enum <br>values: fast, medium, slow | sets the cycle rate (valid values found in capabilietes.heat_cycle_rate_steps) |

### set_heat_boost

Determines if heating boost is used.

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "off"
}
```

#### Fields

| Field  | Data Type                | Description                  |
| ------ | ------------------------ | ---------------------------- |
| icd_id | string                   | identifier of the thermostat |
| value  | enum <br>values: on, off | sets if heat boost is on     |

### set_cool_boost

Determines if cool boosts is used.

#### Request

##### Example body

```json
{
  "icd_id": "0a-50-30-62-eb-18-ff-ff",
  "value": "off"
}
```

#### Fields

| Field  | Data Type                | Description                  |
| ------ | ------------------------ | ---------------------------- |
| icd_id | string                   | identifier of the thermostat |
| value  | enum <br>values: on, off | sets if cool boost is on     |

### set_compressor_lockout

The compressor lockout prevents rapidly cycling on and off the compressor to prevent damage to the the AC compressor.

#### Request

##### Example body

```json
{
  "value": "on",
  "icd_id": "0a-50-30-62-eb-18-ff-ff"
}
```

#### Fields

| Field  | Data Type                | Description                         |
| ------ | ------------------------ | ----------------------------------- |
| icd_id | string                   | identifier of the thermostat        |
| value  | enum <br>values: on, off | is the compressor lockout on or off |

### get_info

Gets device details

#### Request

##### Example body

```json
{
  "test_date": "1/1/2020",
  "build_date": "1/1/2020",
  "serial_number": "123AB12A12345",
  "unique_hardware_id": 1,
  "model_number": "1A12A-12AB",
  "images": {
    "bootloader_version": "1234567890",
    "firmware_version": "2345678901",
    "wifi_version": "3456789012"
  },
  "wifi_mac_address": "0A503062EB18",
  "last_changed_timestamp": 1649622983,
  "icd_id": "0a-50-30-62-eb-18-ff-ff"
}
```

## Events/Topics

### state

#### message format

```json
[
  {
    "icd_id": "0a-50-30-62-eb-18-ff-ff",
    "registration": {
      "city": "New York",
      "name": "Upstairs",
      "state": "Ny",
      "country": "US",
      "address1": "Who Knows",
      "address2": null,
      "timezone": "America/New_York",
      "postal_code": "10045",
      "product_type": "Sensi Classic with HomeKit",
      "contractor_id": null,
      "fleet_enabled": false,
      "fleet_enabled_date": null
    },
    "state": {
      "status": "online",
      "current_cool_temp": 75,
      "current_heat_temp": 70,
      "display_temp": 71,
      "current_operating_mode": "heat",
      "humidity": 32,
      "battery_voltage": 3.131,
      "power_status": "c_wire",
      "wifi_connection_quality": 56,
      "periodicity": 0,
      "comfort_alert": null,
      "other_error_bitfield": {
        "bad_temperature_sensor": "off",
        "bad_humidity_sensor": "off",
        "stuck_key": "off",
        "high_voltage": "off",
        "e5_alert": "off",
        "error_32": "off",
        "error_64": "off"
      },
      "current_humidification_percent": 5,
      "current_dehumidification_percent": 40,
      "relay_status": {
        "w": "off",
        "w2": "off",
        "g": "off",
        "y": "off",
        "y2": "off",
        "o_b": "off"
      },
      "demand_status": {
        "humidification": 0,
        "dehumidification": 0,
        "overcooling": "no",
        "cool_stage": null,
        "heat_stage": null,
        "aux_stage": null,
        "heat": 0,
        "fan": 0,
        "cool": 0,
        "aux": 0,
        "last": "heat",
        "last_start": null
      },
      "hashedSchedule": "150b8aeaef611ecb9090242ac120002",
      "display_scale": "f",
      "heat_max_temp": 99,
      "cool_min_temp": 45,
      "hold_mode": "off",
      "operating_mode": "heat",
      "scheduling": "on",
      "fan_mode": "auto",
      "display_humidity": "on",
      "continuous_backlight": "off",
      "compressor_lockout": "off",
      "early_start": "off",
      "keypad_lockout": "off",
      "temp_offset": 0,
      "humidity_offset": 0,
      "aux_cycle_rate": "medium",
      "cool_cycle_rate": "medium",
      "heat_cycle_rate": "medium",
      "aux_boost": "on",
      "heat_boost": "on",
      "cool_boost": "on",
      "dst_offset": 60,
      "dst_observed": "yes",
      "tz_offset": -300,
      "hold_end": null,
      "deadband": 2,
      "display_time": "on",
      "partial_keypad_lockout": {
        "setpoint": "on",
        "system_mode": "on",
        "fan_mode": "on",
        "schedule_mode": "on",
        "settings_menu": "on"
      },
      "lcd_sleep_mode": null,
      "night_light": null,
      "outdoor_weather_display": "ff:00:00:ff:ff:ff:00:00:ff:00:00:ff:00:00:ff:00:00:ff:00",
      "circulating_fan": { "enabled": "off", "duty_cycle": 30 },
      "humidity_control": {
        "humidification": {
          "target_percent": 5,
          "enabled": "off",
          "mode": "humidifier"
        },
        "dehumidification": {
          "target_percent": 40,
          "enabled": "off",
          "mode": "overcooling"
        },
        "status": "none"
      },
      "geofencing": null,
      "remote_sensor_status": "00",
      "control": {
        "mode": "scheduling",
        "devices": null,
        "geo_state": null,
        "device_data": null
      }
    }
  }
]
```

#### fields

| Field  | Description                  |
| ------ | ---------------------------- |
| icd_id | identifier of the thermostat |
