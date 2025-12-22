import Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingAgentCommand} from "@tokenring-ai/agent/types";

export const description = "/exit - Exit the application" as const;

export async function execute(_remainder: string, agent: Agent): Promise<void> {
  agent.infoLine("Exiting application...");

  process.exit(0);
}
export const help: string = `# /exit

## Description
Immediately exits the current agent session and terminates the CLI application. This is a non-graceful exit that stops the process immediately.

## Usage

/exit

## Behavior
- Immediately terminates the application (process.exit(0))
- Does not return to any menu
- No cleanup or graceful shutdown is performed
- The application will stop running completely

## Examples

/exit                    # Immediately exit the application

## Note
This command performs a hard exit of the process. Use this when you want to quickly terminate the application.`;

export default {
  description,
  execute,
  help,
} satisfies TokenRingAgentCommand;