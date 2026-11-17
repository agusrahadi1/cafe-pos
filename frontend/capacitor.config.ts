import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.web.abstech.cafe',
  appName: 'Cafe POS',
  webDir: 'public',
  server: {
    url: 'https://cafe.abstech.web.id/pos',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
