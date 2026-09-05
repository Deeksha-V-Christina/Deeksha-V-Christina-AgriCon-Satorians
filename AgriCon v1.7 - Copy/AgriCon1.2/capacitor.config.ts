import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Wraps the existing AgriCon1.2 web app (built by `npm run build` into
 * dist/) in a native Android/iOS shell. It is the SAME app, not a rewrite —
 * Capacitor just gives the built site a native window, an installable icon,
 * and access to native APIs if we add them later (camera, GPS, etc.).
 *
 * The backend (backend/app.py) is not bundled into the app: it keeps running
 * on a PC on the farm LAN, same as in the browser today. The app just needs
 * to be told that PC's address once — see src/services/apiConfig.ts and the
 * "Backend address" field shown in the diagnosis screens when it can't be
 * reached. There is no dev-server proxy inside the packaged app, so that
 * runtime setting (not vite.config.ts's /api proxy) is what resolves API
 * calls on a phone.
 */
const config: CapacitorConfig = {
  appId: 'com.agricon.app',
  appName: 'AgriCon',
  webDir: 'dist',
};

export default config;
