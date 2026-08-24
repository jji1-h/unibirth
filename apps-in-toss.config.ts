import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'unibirth',

  brand: {
    displayName: 'Unibirth',
    primaryColor: '#b0c4ff',
    icon: 'https://static.toss.im/appsintoss/82487/9f5e1237-d1ea-4c9e-9161-7a4cccbe5cc1.png',
  },

  permissions: [],
  webBundleDir: 'dist'
});
