import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pl.appity.zozoapp',
  appName: 'ZozoApp',
    webDir: '.next',
    server: {
        url: 'https://app.zozoapp.pl',
        cleartext: true
    }
};

export default config;
