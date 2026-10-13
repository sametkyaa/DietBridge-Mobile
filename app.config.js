const fs = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  const absolutePath = path.resolve(__dirname, googleServicesFile);
  if (!fs.existsSync(absolutePath)) {
    if (process.env.EAS_BUILD_PLATFORM === 'android') {
      throw new Error('Android push build requires the GOOGLE_SERVICES_JSON EAS file variable.');
    }
    return config;
  }
  let services;
  try { services = JSON.parse(fs.readFileSync(absolutePath, 'utf8')); } catch {
    throw new Error('Firebase Android configuration is not valid JSON.');
  }
  if (services.type === 'service_account' || services.private_key || !services.project_info?.project_id
    || !services.client?.some(client => client.client_info?.android_client_info?.package_name === config.android?.package)) {
    throw new Error('Firebase Android configuration must match the application package and contain no private key.');
  }
  return { ...config, android: { ...config.android, googleServicesFile } };
};
