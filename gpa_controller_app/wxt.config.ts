import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'BYU Grade Hub',
    permissions: ['storage', 'alarms', 'notifications', 'tabs'],
    host_permissions: ['*://*.instructure.com/*', '*://learningsuite.byu.edu/*'],
  },
});
