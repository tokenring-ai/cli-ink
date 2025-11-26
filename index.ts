import {AgentCommandService} from "@tokenring-ai/agent";
import TokenRingApp, {TokenRingPlugin} from "@tokenring-ai/app";
import AgentInkCLI, {InkCLIConfigSchema} from "./AgentInkCLI.ts";

import chatCommands from "./chatCommands.ts";
import packageJSON from './package.json' with {type: 'json'};

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );
    const config = app.getConfigSlice('inkCLI', InkCLIConfigSchema);
    app.addServices(new AgentInkCLI(app, config));
  },
} as TokenRingPlugin;

export {default as AgentInkCLI, InkCLIConfigSchema} from "./AgentInkCLI.ts";
