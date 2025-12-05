import {Agent, AgentCommandService} from '@tokenring-ai/agent';
import {AgentEventState} from "@tokenring-ai/agent/state/agentEventState";
import {CommandHistoryState} from '@tokenring-ai/agent/state/commandHistoryState';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import React, {useCallback, useMemo} from 'react';

import {Screen} from "../AgentCLI.tsx"
import {CommandInput} from '../components/CommandInput.tsx';
import Markdown from "../components/Markdown.tsx";
import {useOutputBlocks} from "../hooks/useOutputBlocks.tsx";

interface AgentChatScreenProps {
  agentEventState: AgentEventState | null;
  currentAgent: Agent;
  setScreen: (screen: Screen) => void;
}

export default function AgentChatScreen({
  agentEventState,
  currentAgent,
  setScreen,
}: AgentChatScreenProps) {
  const blocks = useOutputBlocks(agentEventState?.events ?? null);

  const availableCommands = useMemo(() => {
    if (!currentAgent) return [];
    const commandService = currentAgent.requireServiceByType(AgentCommandService);
    return [...commandService.getCommandNames().map(cmd => `/${cmd}`), '/switch'];
  }, [currentAgent]);

  const commandHistory = useMemo(() => {
    if (!currentAgent) return [];
    return currentAgent.getState(CommandHistoryState).commands;
  }, [currentAgent]);

  const handleCommandSubmit = useCallback((value: string) => {
    if (!currentAgent) return;

    if (value === '/switch') {
      setScreen({ name: 'selectAgent' });
      return;
    }

    currentAgent.handleInput({ message: value });
  }, [currentAgent, setScreen]);

  const handleSwitchToAgentSelect = useCallback(() => {
    setScreen({ name: 'selectAgent' });
  }, [setScreen]);

  return (
    <Box flexDirection="column" width={120}>
      {blocks.slice(-100).map((block, idx) =>
        block.type === 'reasoning' ?
          <Box key={idx} flexDirection="column" marginTop={1} marginBottom={1}>
            <Box flexDirection="row">
              <Box width={2} borderStyle="single" borderLeft={false} borderRight={false} borderBottom={false} />
              <Text>  Thinking  </Text>
              <Box flexGrow={1} borderStyle="single" borderLeft={false} borderRight={false} borderBottom={false} />
            </Box>
            <Text color="yellow">{block.content}</Text>
          </Box>
        : block.type === 'input' ?
          <Box key={idx} marginTop={1}>
            <Text color="yellowBright">user &gt; </Text><Text>{block.content}</Text>
          </Box>
        : block.type === 'system' ?
          <Box key={idx}>
            <Text color={ block.level === 'info' ? 'blueBright' : block.level === 'warning' ? 'yellow' : 'red' }>{ block.content }</Text>
          </Box>
        :
          <Box key={idx} flexDirection="column"  marginTop={1} marginBottom={1}>
            <Box flexDirection="row">
              <Box width={2} borderStyle="single" borderLeft={false} borderRight={false} borderBottom={false} />
              <Text>  Response  </Text>
              <Box flexGrow={1} borderStyle="single" borderLeft={false} borderRight={false} borderBottom={false} />
            </Box>
            <Markdown key={idx}>{block.content}</Markdown>
          </Box>
      )}
      <Box marginTop={1} />
      {agentEventState?.busyWith && (
        <Box>
          <Text color="cyan">
            <Spinner type="dots" /> {agentEventState.busyWith}
          </Text>
        </Box>
      )}
      {agentEventState?.idle && (
        <CommandInput
          prompt="user >"
          history={commandHistory}
          autoCompletion={availableCommands}
          onSubmit={handleCommandSubmit}
          onCancel={() => currentAgent?.systemMessage('[Input cancelled]', 'warning')}
          onCtrlC={handleSwitchToAgentSelect}
        />
      )}
    </Box>
  );
}
