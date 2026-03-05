import { defineConfig } from "@openclaw/core";

export default defineConfig({
  gateway: {
    channels: {
      web: {
        transport: "ws",
      },
    },
  },
});
