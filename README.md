
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>


# Pimoroni Enviro Indoor Homebridge Plug-in

This Homebridge plug-in allows you to make the data available from the [Pimoroni Enviro Indoor](https://learn.pimoroni.com/article/getting-started-with-enviro) device.

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

## Setup MQTT broker

This Homebridge plug-in reads the data from an MQTT broker providing the JSON information, for example:

* {"readings": {"pressure": 1007.95, "temperature": 28.31, "voltage": 4.979, "color_temperature": 0, "gas_resistance": 20605, "aqi": 11.4, "humidity": 37.7, "luminance": 0}, "nickname": "my-air-quality", "model": "indoor", "uid": "xxxxxxxxxxxxxx", "timestamp": "2022-09-20T19:45:02Z"}

You can view the entries on your computer using an MQTT viewer, for example [MQTT Explorer](http://mqtt-explorer.com/)

You need to install an [MQTT broker](http://mosquitto.org/) on your machine, this can be any machine in your network, including the machine running Homebridge. Here are some instructions for popular distributions:

### Raspberry Pi / Ubuntu

In short, you just need to do the following:

    sudo apt-get update
    sudo apt-get install -y mosquitto mosquitto-clients
    sudo systemctl enable mosquitto.service

### macOS

Use [Homebrew](https://brew.sh/)

    brew install mosquitto

### Windows

Go to the (Mosquitto Download Page)[https://mosquitto.org/download/] and choose the right installer for your system.

### Enable authentication

A quick search online will provide you with information on how to secure your installation. To help you, I've found the following links for the 
[Raspberry Pi](https://randomnerdtutorials.com/how-to-install-mosquitto-broker-on-raspberry-pi/) and [Ubuntu](https://www.vultr.com/docs/install-mosquitto-mqtt-broker-on-ubuntu-20-04-server/)

## Plug-in Installation

Follow the [homebridge installation instructions](https://www.npmjs.com/package/homebridge) if you haven't already.

Install this plugin globally:

    npm install -g homebridge-enviroindoor

Add platform to `config.json`, for configuration see below.

## Plug-in Configuration

The plug-in needs to know where to find the MQTT broker providing the JSON data (e.g. mqtt://127.0.0.1:1883) along with the serial number of the device to uniquely identify it (you can also use your Raspberry Pi Pico identifier).

```json
{
  "platforms": [
    {
      "platform": "EnviroIndoorAirQuality",
      "name": "EnviroIndoor",
      "mqttbroker": "mqtt://127.0.0.1:1883",
      "username": "",
      "password": "",
      "devices": [
        {
          "displayName": "My Enviro Indoor Sensor",
          "serial": "1234567890",
          "topic": "enviro/my-air-quality"
        }
      ]
    }
  ]
}

```

The following settings are optional:

- `username`: the MQTT broker username
- `password`: the MQTT broker password

If you have multiple Enviro Indoor devices, then you can list them all in the config giving each one a unique name, MQTT topic and serial number.
