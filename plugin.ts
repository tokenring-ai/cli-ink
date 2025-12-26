import {TokenRingPlugin} from "@tokenring-ai/app";
import {z} from "zod";
import AgentInkCLI, {InkCLIConfigSchema} from "./AgentInkCLI.ts";

import packageJSON from './package.json' with {type: 'json'};

const packageConfigSchema = z.object({
  inkCLI: InkCLIConfigSchema,
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    // const config = app.getConfigSlice('inkCLI', InkCLIConfigSchema);
    app.addServices(new AgentInkCLI(app, config.inkCLI));
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
