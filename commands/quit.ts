import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";

import {execute, help as exitHelp, description as exitDescription} from "./exit.ts";

const description = exitDescription.replaceAll("/exit", "/quit");

const help: string = exitHelp.replaceAll("/exit", "/quit");

export default {
  description,
  execute,
  help,
} as TokenRingAgentCommand;