// import fetch from 'node-fetch';
// let fetch = () => { return { ok: false } };

// import('node-fetch').then((module) => { fetch = module.default; });

export const { OPEN_WEATHER_MAP_KEY, LAT, LON } = process.env;

const sleep = (duration) => new Promise((resolve) => {
  setTimeout(resolve, duration);
});

export class OutsideAirTempFetcher {
  temp: number;
  humidity: number;
  #onListeners: any = [];

  updateTempExternal = async () => {
    try {
      const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OPEN_WEATHER_MAP_KEY}&units=imperial`);
      if (!weatherResponse.ok) {
        return;
      }
      const allWeatherData: any = await weatherResponse.json();
      // console.log(allWeatherData);
      const { temp, humidity } = allWeatherData.main;
      // only update when things have changed
      if (!this.temp || Math.abs(temp - this.temp) > 0.1) {
        this.temp = temp;
        const listenersToUpdate = this.#onListeners.filter((listener) => listener.on === 'tempChange');
        listenersToUpdate.forEach((listener) => listener.fn(temp));
        // console.log(`updated temp to ${this.temp}`);
      }

      // only update when things have changed
      if (!this.humidity || Math.abs(humidity - this.humidity) > 0.1) {
        this.humidity = humidity;
        const listenersToUpdate = this.#onListeners.filter((listener) => listener.on === 'humidityChange');
        listenersToUpdate.forEach((listener) => listener.fn(humidity));
      }

      // eslint-disable-next-line consistent-return
      return this.temp;
    } catch (err) {
      console.error(err);
    }
  };

  start = async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      this.updateTempExternal();
      // eslint-disable-next-line no-await-in-loop
      await sleep(2 * 60 * 1000);
    }
  };

  async on(listener, fn) {
    this.#onListeners.push({ on: listener, fn });
  }
}
