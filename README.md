# @tokenring-ai/cli-ink

Ink-based Command Line Interface for TokenRing AI agents. This package provides an interactive terminal interface using the Ink framework for managing AI agents, executing commands, and handling human interface requests.

## Overview

The `@tokenring-ai/cli-ink` package serves as the primary CLI entry point for the TokenRing AI system, providing a feature-rich terminal experience with real-time event processing, comprehensive command support, and intuitive user interactions.

## Key Features

- **Interactive Terminal Interface**: Built with Ink framework for responsive terminal applications
- **Agent Management**: Select from running agents, create new ones, or connect to web applications
- **Real-time Event Processing**: Stream agent outputs (chat, reasoning, system messages) with proper formatting
- **Comprehensive Command Support**: Built-in commands like `/switch` for agent switching
- **Human Interface Requests**: Handle confirmations, selections, password prompts, web page opening, and text input
- **Dynamic Screen Management**: Switch between agent selection, chat, and interactive request handling
- **Markdown Rendering**: Full markdown support with syntax highlighting for code blocks
- **Responsive Layout**: Automatically adjusts to terminal window size
- **Workflow Integration**: Support for spawning workflow-based agents
- **Web Application Integration**: Connect to web applications via SPA resources
- **Command History**: Input history with up/down arrow navigation
- **Auto-completion**: Command auto-completion with tab key support

## Installation

This package is part of the TokenRing AI monorepo. To install and use:

```bash
# Install dependencies
bun install

# Run tests
vitest run
```

### Environment Variables

None required for basic functionality.

## Usage

### Basic Usage

```typescript
import TokenRingApp from "@tokenring-ai/app";
import cliInkPlugin from "@tokenring-ai/cli-ink";

// Create and configure the app
const app = new TokenRingApp();
app.install(cliInkPlugin);

// Start the CLI
await app.start();
```

## Plugin Integration

The CLI is designed as a TokenRing plugin that integrates seamlessly with the main application:

```typescript
import TokenRingApp, { TokenRingPlugin } from '@tokenring-ai/app';
import AgentInkCLI, { InkCLIConfigSchema } from './AgentInkCLI.ts';
import { z } from 'zod';

import packageJSON from './package.json' with { type: 'json' };

const packageConfigSchema = z.object({
  inkCLI: InkCLIConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.inkCLI) {
      app.addServices(new AgentInkCLI(app, config.inkCLI));
    }
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Configuration

### CLI Configuration Schema

```typescript
export const InkCLIConfigSchema = z.object({
  bannerNarrow: z.string(),
  bannerWide: z.string(),
  bannerCompact: z.string(),
  bannerColor: z.string().optional().default('cyan'),
});
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `bannerNarrow` | string | Yes | - | Narrow banner displayed in compact mode |
| `bannerWide` | string | Yes | - | Wide banner displayed in full mode |
| `bannerCompact` | string | Yes | - | Compact banner for agent chat screens |
| `bannerColor` | string | No | `'cyan'` | Color for the banner (uses Chalk color names) |

## Core Features

### Agent Selection & Management

- Connect to existing running agents
- Create new agents of various types
- Switch between running agents using `/switch` command
- Exit or detach from agents
- Connect to web applications
- Spawn workflow-based agents

### Keyboard Shortcuts

**Ctrl-C Actions:**
- `Ctrl+C` - Exit the application when in agent selection, return to agent selection when in chat

**Navigation:**
- `Up/Down Arrow` - Navigate lists and command history
- `Tab` - Auto-complete commands
- `Left/Right Arrow` - Expand/collapse tree nodes
- `Space` - Toggle selections (multiple choice)
- `Enter` - Select/submit
- `Esc` or `q` - Cancel/cancel selection

### Human Interface Requests

The CLI handles various types of human interface requests:

| Request Type | Description |
|--------------|-------------|
| `askForText` | Open editor for multi-line responses (Ctrl+D to submit) |
| `askForConfirmation` | Yes/no prompts with timeout support |
| `askForSingleTreeSelection` | Single choice from hierarchical tree structure |
| `askForMultipleTreeSelection` | Multiple selections from hierarchical tree |
| `askForPassword` | Secure input prompts |
| `openWebPage` | Launch URLs in browser |

## API Reference

### AgentInkCLI Service

Main service class implementing the CLI functionality.

```typescript
export default class AgentInkCLI implements TokenRingService {
  name = 'AgentInkCLI';
  description = 'Ink-based CLI for interacting with agents';

  constructor(app: TokenRingApp, config: z.infer<typeof InkCLIConfigSchema>);

  async run(): Promise<void>;
}
```

### AgentCLI Component

Main component that manages screen state and rendering.

```typescript
interface AgentCLIProps extends z.infer<typeof InkCLIConfigSchema> {
  agentManager: AgentManager;
  app: TokenRingApp;
}

export default function AgentCLI(props: AgentCLIProps);
```

### Screen Types

```typescript
type Screen =
  | { name: 'selectAgent' }
  | { name: 'chat'; agentId: string }
  | { name: 'askForConfirmation'; request: HumanInterfaceRequestFor<"askForConfirmation">, onResponse: (response: HumanInterfaceResponseFor<'askForConfirmation'>) => void }
  | { name: 'askForPassword'; request: HumanInterfaceRequestFor<"askForPassword">, onResponse: (response: HumanInterfaceResponseFor<'askForPassword'>) => void }
  | { name: 'openWebPage'; request: HumanInterfaceRequestFor<"openWebPage">, onResponse: (response: HumanInterfaceResponseFor<'openWebPage'>) => void }
  | { name: 'askForSingleTreeSelection'; request: HumanInterfaceRequestFor<"askForSingleTreeSelection">, onResponse: (response: HumanInterfaceResponseFor<'askForSingleTreeSelection'>) => void }
  | { name: 'askForMultipleTreeSelection'; request: HumanInterfaceRequestFor<"askForMultipleTreeSelection">, onResponse: (response: HumanInterfaceResponseFor<'askForMultipleTreeSelection'>) => void }
  | { name: 'askForText'; request: HumanInterfaceRequestFor<"askForText">, onResponse: (response: HumanInterfaceResponseFor<'askForText'>) => void };
```

## Package Structure

```
pkg/cli-ink/
├── index.ts                    # Main entry point and exports
├── plugin.ts                   # Plugin definition for TokenRing app integration
├── AgentInkCLI.ts              # Main service class
├── AgentCLI.tsx                # Core component managing screen state
├── components/                 # Reusable components
│   ├── CommandInput.tsx        # Command input with history and auto-completion
│   ├── SelectInput.tsx         # Selection input component
│   └── Markdown.tsx            # Markdown rendering with syntax highlighting
├── hooks/                      # Custom hooks
│   ├── useAgentEvents.ts       # Agent event state management
│   ├── useOutputBlocks.ts      # Output block processing
│   └── useScreenSize.ts        # Terminal size management
├── screens/                    # Screen components
│   ├── AgentChatScreen.tsx     # Agent chat interface
│   ├── AgentSelectionScreen.tsx # Agent selection interface
│   ├── AskScreen.tsx           # Text input screen
│   ├── ConfirmationScreen.tsx  # Confirmation prompt screen
│   ├── PasswordScreen.tsx      # Password input screen
│   ├── TreeSelectionScreen.tsx # Tree-based selection
│   └── WebPageScreen.tsx       # Web page opening screen
├── markdown.sample.md          # Markdown rendering sample
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Event Handling

The CLI processes various agent events in real-time:

| Event Type | Color | Description |
|------------|-------|-------------|
| `output.chat` | Green | Chat messages from the agent |
| `output.reasoning` | Yellow | Agent reasoning process |
| `output.info` | Blue | Informational system messages |
| `output.warning` | Yellow | Warning system messages |
| `output.error` | Red | Error system messages |
| `input.received` | Yellow | User input echo |
| `human.request` | - | Interactive prompt handling |

## Examples

### Basic Agent Interaction

```text
# Start the CLI
> bun start

# Select or create an agent
# CLI will show agent selection menu with categories and options

# Chat with the agent
# Type your questions and press Enter

# Use commands
/help          # Show available commands
/switch        # Return to agent selection
```

### Command History and Auto-completion

```text
# The CLI maintains command history
# Use up/down arrows to navigate through previous commands

# Tab completion for commands
> /swi<tab>  # Completes to "/switch"
```

### Web Application Integration

```text
# The CLI automatically detects web applications
# and provides options to connect to them
```

### Workflow Agent Spawning

```text
# Workflows are listed in the agent selection screen
# and can be spawned as agents
```

## Development

### Building

```bash
bun run build
```

### Testing

```bash
vitest run
vitest run:watch
vitest run:coverage
```

### Adding New Screens

1. Create a new file in `screens/` directory
2. Implement the screen component following the existing patterns
3. Add support in `AgentCLI.tsx` for handling the new screen type

### Adding Custom Input Components

1. Create a new file in `components/` directory
2. Implement the component with proper TypeScript types
3. Use Ink components for consistent styling

## License

MIT License - see [LICENSE](./LICENSE) file for details.
