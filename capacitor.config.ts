import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rememberfi.app",
  appName: "RememberFi",
  webDir: "dist",
  server: {
    // Loads the live published site so future updates ship instantly without
    // re-submitting to the stores. Comment out to ship a fully bundled build.
    url: "https://rememberfi.lovable.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0F172A",
  },
  android: {
    backgroundColor: "#0F172A",
  },
};

export default config;
