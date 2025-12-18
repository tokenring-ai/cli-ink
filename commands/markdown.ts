import {Agent} from "@tokenring-ai/agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";

// @ts-ignore
import markdownSample from '../markdown.sample.md' with {type: 'text'};

const description = "/markdown - Outputs a sample of markdown" as const;

async function execute(remainder: string | undefined, agent: Agent): Promise<void> {
  agent.chatOutput(markdownSample);
}

const help = `# /markdown

Outputs a sample of markdown to test the console output.
`;

export default {
  description,
  execute,
  help,
} satisfies TokenRingAgentCommand;
