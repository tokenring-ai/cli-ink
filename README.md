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
- `Left/Right Arrow` - Expand/collapse tree nodes (for tree selection screens)
- `Space` - Toggle selections (multiple choice)
- `Enter` - Select/submit
- `Esc` or `q` - Cancel/cancel selection

### Human Interface Requests

The CLI handles various types of human interface requests:

| Request Type | Description |
|--------------|-------------|
| `askForConfirmation` | Yes/no prompts with timeout support (ConfirmationScreen) |
| `askForPassword` | Secure input prompts (implemented via text input with masking) |
| `askForText` | Open editor for multi-line responses (AskScreen/QuestionInputScreen) |
| `askForSingleTreeSelection` | Single choice from hierarchical tree structure (QuestionInputScreen) |
| `askForMultipleTreeSelection` | Multiple selections from hierarchical tree (QuestionInputScreen) |
| `openWebPage` | Launch URLs in browser (via QuestionInputScreen with 'open:' prefix) |

## Package Structure

```
pkg/cli-ink/
├── index.ts                    # Main entry point and exports
├── plugin.ts                   # Plugin definition for TokenRing app integration
├── AgentInkCLI.ts              # Main service class
├── AgentCLI.tsx                # Core component managing screen state
├── components/                 # Reusable components
│   ├── CommandInput.tsx        # Command input with history and auto-completion
│   ├── Markdown.tsx            # Markdown rendering with syntax highlighting
│   └── SelectInput.tsx         # Selection input component
├── hooks/                      # Custom hooks
│   ├── useAgentStateSlice.ts   # Agent event state management
│   ├── useOutputBlocks.tsx     # Output block processing
│   └── useScreenSize.ts        # Terminal size management
├── screens/                    # Screen components
│   ├── AgentChatScreen.tsx     # Agent chat interface
│   ├── AgentSelectionScreen.tsx # Agent selection interface
│   ├── AskScreen.tsx           # Text input screen
│   ├── ConfirmationScreen.tsx  # Confirmation prompt screen
│   └── QuestionInputScreen.tsx # Generic question input (handles text, treeSelect, fileSelect)
├── markdown.sample.md          # Markdown rendering sample
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Component: AgentChatScreen

Main chat interface displaying agent responses, reasoning, and system messages.

**Features:**
- Displays chat messages, reasoning process, and system notifications
- Shows agent execution status with spinner
- Supports markdown rendering with syntax highlighting
- Command input with history and auto-completion
- `/switch` command to return to agent selection

### Component: AgentSelectionScreen

Menu for selecting agents to connect to or spawn.

**Categories:**
- Agent types grouped by category
- Web Applications (connect to SPA resources)
- Current Agents (running agents)
- Workflows (spawning workflow-based agents)

### Component: QuestionInputScreen

Generic screen for handling various question types from agents.

**Supported Question Types:**
- Text input (multi-line)
- Tree selection (single or multiple)
- File selection (placeholder - not fully implemented)

### Component: ConfirmationScreen

Confirmation prompt with timeout support.

**Features:**
- Yes/No toggle with left/right arrow keys
- Visual feedback for selection
- Countdown timer for timeout

### Component: AskScreen

Multi-line text input screen for agent questions.

**Features:**
- Multi-line text editing
- Ctrl+D to submit
- Esc or q to cancel
- Cursor position indicator

### Component: CommandInput

Enhanced command input component with history and auto-completion.

**Features:**
- Command history navigation with up/down arrows
- Auto-completion with tab key
- Ctrl+C handling
- Escape key support

### Component: Markdown

Markdown renderer with syntax highlighting.

**Supported Features:**
- Text formatting (bold, italic, strikethrough)
- Code blocks with syntax highlighting
- Tables
- Lists (ordered, unordered, checkboxes)
- Blockquotes
- Headers
- Links and images
- Horizontal rules

### Hook: useAgentStateSlice

Subscribe to agent state slices for real-time updates.

**Parameters:**
- `ClassType`: AgentStateSlice class to subscribe to
- `agent`: Agent instance or null

**Returns:**
- State slice data or null

### Hook: useOutputBlocks

Process agent event state into display blocks.

**Output Types:**
- `chat`: Chat messages from agent
- `reasoning`: Agent reasoning process
- `input`: User input echo
- `system`: System messages (info, warning, error)

**Note:** This hook is available in the codebase but not currently used in the component implementation.

### Hook: useScreenSize

Track terminal window size.

**Returns:**
- Object with `rows` and `columns` dimensions

## Screens

### Screen Types

```typescript
type Screen =
  | { name: 'selectAgent' }
  | { name: 'chat'; agentId: string }
  | { name: 'question'; request: ParsedQuestionRequest, onResponse: (response: any) => void };
```

### Screen Flow

1. **selectAgent**: Initial screen showing agent selection menu
2. **chat**: Active chat interface with selected agent
3. **question**: Interactive request from agent (confirmation, text input, selections)

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

### Handling Agent Questions

When an agent requires human input, the CLI automatically shows the appropriate screen:

- **Confirmation**: Toggle Yes/No with arrow keys, Enter to confirm
- **Text Input**: Type multi-line response, Ctrl+D to submit
- **Tree Selection**: Navigate tree with arrows, Enter to select
- **Web Page**: Click link to open in browser

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
