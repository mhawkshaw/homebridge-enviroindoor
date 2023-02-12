import { Service, PlatformAccessory } from 'homebridge';

import { EnviroIndoorPlatform } from './platform';

import { Client, connect } from 'mqtt';

interface EnviroIndoorReadingsJson {
  pressure: number;
  temperature: number;
  voltage: number;
  color_temperature: number;
  gas_resistance: number;
  aqi: number;
  humidity: number;
  luminance: number;
}

interface EnviroIndoorJson {
  readings: EnviroIndoorReadingsJson;
  nickname: string;
  model: string;
  uid: string;
  timestamp: string;
}

/**
 * Enviro Indoor Accessory
 * An instance of this class is created for each accessory registered (in this case only one)
 * The Enviro Indoor accessory exposes the services of temperature, air quality and humidity
 */
export class EnviroIndoorSensor {
  private humidityService: Service;
  private temperatureService: Service;
  private lightSensorService: Service;

  private serialNumber = '';

  // Use to store the sensor data for quick retrieval
  private sensorData = {
    temperature: -270,
    humidity: 0,
    lux: 0.0001,
  };

  private mqttClient: Client;

  /**
   * Maps the JSON data received from the MQTT broker originating from the Enviro sensor to the internal structure we need
   * @param jsonData the JSON data received from the MQTT broker
   */
  mapJsonData(jsonData: EnviroIndoorJson): void {
    this.sensorData.humidity = jsonData.readings.humidity;
    this.sensorData.temperature = jsonData.readings.temperature;
    this.sensorData.lux = jsonData.readings.luminance;
    if (jsonData.readings.luminance <= 0) {
      this.sensorData.lux = 0.0001;
    }
    this.serialNumber = jsonData.uid;
  }

  setAccessoryInfo(serialNumber: string): void {
    // Only set the accessory info if the serial number has changed
    if (this.serialNumber !== serialNumber) {
      const accessoryInfo: Service | undefined = this.accessory.getService(this.platform.Service.AccessoryInformation);

      if (accessoryInfo !== undefined) {
        accessoryInfo.setCharacteristic(this.platform.Characteristic.Manufacturer, 'Pimoroni')
          .setCharacteristic(this.platform.Characteristic.Model, 'EnviroIndoor')
          .setCharacteristic(this.platform.Characteristic.SerialNumber, serialNumber);
      }
    }
  }

  shutdown() {
    this.platform.log.debug('Shutdown called. Unsubscribing from MQTT broker.');
    this.mqttClient.unsubscribe(this.platform.config.topic);
    this.mqttClient.end();
  }

  constructor(
    private readonly platform: EnviroIndoorPlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.setAccessoryInfo(accessory.UUID);

    this.temperatureService = this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor);
    this.humidityService = this.accessory.getService(this.platform.Service.HumiditySensor) ||
      this.accessory.addService(this.platform.Service.HumiditySensor);
    this.lightSensorService = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor);

    // set the service name, this is what is displayed as the default name on the Home app
    this.temperatureService.setCharacteristic(this.platform.Characteristic.Name, 'Temperature');
    this.humidityService.setCharacteristic(this.platform.Characteristic.Name, 'Humidity');
    this.lightSensorService.setCharacteristic(this.platform.Characteristic.Name, 'Light Level');

    // register handlers
    this.temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleTemperatureGet.bind(this));
    this.humidityService.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(this.handleHumidityGet.bind(this));
    this.lightSensorService.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
      .onGet(this.handleLightSensorGet.bind(this));

    // Connect to MQTT broker
    const options = {
      username: this.platform.config.username,
      password: this.platform.config.password,
    };

    let brokerUrl = this.platform.config.mqttbroker;

    // URL needs to include mqtt:// prefix
    if (brokerUrl && !brokerUrl.includes('://')) {
      brokerUrl = 'mqtt://' + brokerUrl;
    }

    this.platform.log.info('Connecting to MQTT broker...');
    this.mqttClient = connect(brokerUrl, options);

    this.mqttClient.on('message', (topic, message) => {
      this.platform.log.debug(message.toString('utf-8'));
      const enviroIndoorData: EnviroIndoorJson = JSON.parse(message.toString('utf-8'));
      this.mapJsonData(enviroIndoorData);
      this.setAccessoryInfo(enviroIndoorData.uid);
    });

    this.mqttClient.on('connect', () => {
      this.platform.log.info('Connected to MQTT broker');

      this.mqttClient.subscribe(this.platform.config.topic, { qos: 0 }, (error, granted) => {
        if (error) {
          this.platform.log.error('Unable to connect to the MQTT broker: ' + error.name + ' ' + error.message);
        } else {
          // If we're re-connecting then the existing topic subscription should still be persisted.
          if (granted.length > 0) {
            this.platform.log.debug(granted[0].topic + ' was subscribed');
          }
        }
      });
    });

    this.mqttClient.on('disconnect', () => {
      this.platform.log.warn('Disconnected from MQTT broker');
    });

    this.mqttClient.on('error', (error) => {
      this.platform.log.error('Problem with MQTT broker: ' + error.message);
    });
  }

  /**
   * Handle the "GET" requests from HomeKit
   * Here we use the locally stored data for performance reasons and also to avoid sending too many requests to the Enviro+ server
   */
  async handleTemperatureGet(): Promise<number> {
    this.platform.log.debug('Temperature ->', this.sensorData.temperature);

    return this.sensorData.temperature;
  }

  async handleHumidityGet(): Promise<number> {
    this.platform.log.debug('Humidity ->', this.sensorData.humidity);

    return this.sensorData.humidity;
  }

  async handleLightSensorGet(): Promise<number> {
    this.platform.log.debug('Light ->', this.sensorData.lux);

    return this.sensorData.lux;
  }
}
