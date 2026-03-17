const ENV = {
  dev: {
    // Use your Mac's LAN IP so simulators/devices can reach the server.
    // localhost on a simulator/device refers to the device itself, not your Mac.
    API_BASE_URL: 'http://192.168.4.221:5001/api',
  },
  prod: {
    API_BASE_URL: 'https://your-railway-app.up.railway.app/api',
  },
};

const getEnv = () => (__DEV__ ? ENV.dev : ENV.prod);

export const { API_BASE_URL } = getEnv();
