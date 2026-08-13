import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'BYU Grade Hub',
    permissions: ['storage', 'alarms', 'notifications', 'tabs'],
    host_permissions: [
      '*://*.instructure.com/*',
      '*://learningsuite.byu.edu/*'
    ],
  },
});
