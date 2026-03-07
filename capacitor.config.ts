import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alexrandall.secondsole',
  appName: 'Second Sole',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#e43928',
      sound: 'beep.wav'
    }
  }
};

export default config;
