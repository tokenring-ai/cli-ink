import TokenRingApp, {TokenRingPlugin} from "@tokenring-ai/app";
import AgentInkCLI, {InkCLIConfigSchema} from "./AgentInkCLI.ts";

import packageJSON from './package.json' with {type: 'json'};


export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    const config = app.getConfigSlice('inkCLI', InkCLIConfigSchema);
    app.addServices(new AgentInkCLI(app, config));
  },
} satisfies TokenRingPlugin;
