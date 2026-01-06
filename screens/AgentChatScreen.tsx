import {Agent, AgentCommandService} from '@tokenring-ai/agent';
import {AgentEventState} from "@tokenring-ai/agent/state/agentEventState";
import {AgentExecutionState} from "@tokenring-ai/agent/state/agentExecutionState";
import {CommandHistoryState} from '@tokenring-ai/agent/state/commandHistoryState';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import React, {useCallback, useMemo} from 'react';

import {Screen} from "../AgentCLI.tsx"
import {CommandInput} from '../components/CommandInput.tsx';
import Markdown from "../components/Markdown.tsx";
import {useAgentStateSlice} from "../hooks/useAgentStateSlice.ts";
import {useOutputBlocks} from "../hooks/useOutputBlocks.tsx";

interface AgentChatScreenProps {
  currentAgent: Agent;
  setScreen: (screen: Screen) => void;
}

export default function AgentChatScreen({
  currentAgent,
  setScreen,
}: AgentChatScreenProps) {
  const agentEventState = useAgentStateSlice(AgentEventState, currentAgent);
  const agentExecutionState = useAgentStateSlice(AgentExecutionState, currentAgent);
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
            <Text color="yellow">{block.message}</Text>
          </Box>
        : block.type === 'input' ?
          <Box key={idx} marginTop={1}>
            <Text color="yellowBright">user &gt; </Text><Text>{block.message}</Text>
          </Box>
        : block.type === 'system' ?
          <Box key={idx}>
            <Text color={ block.level === 'info' ? 'blueBright' : block.level === 'warning' ? 'yellow' : 'red' }>{ block.message }</Text>
          </Box>
        :
          <Box key={idx} flexDirection="column"  marginTop={1} marginBottom={1}>
            <Box flexDirection="row">
              <Box width={2} borderStyle="single" borderLeft={false} borderRight={false} borderBottom={false} />
              <Text>  Response  </Text>
              <Box flexGrow={1} borderStyle="single" borderLeft={false} borderRight={false} borderBottom={false} />
            </Box>
            <Markdown key={idx}>{block.message}</Markdown>
          </Box>
      )}
      <Box marginTop={1} />
      {agentExecutionState?.busyWith && (
        <Box>
          <Text color="cyan">
            <Spinner type="dots" /> {agentExecutionState.busyWith}
          </Text>
        </Box>
      )}
      {agentExecutionState?.idle && (
        <CommandInput
          prompt="user >"
          history={commandHistory}
          autoCompletion={availableCommands}
          onSubmit={handleCommandSubmit}
          onCancel={() => currentAgent?.systemMessage('[Input cancelled]', 'warning')}
          onCtrlC={handleSwitchToAgentSelect}
        />
      )}
      {agentExecutionState?.statusLine && (
        <Box marginTop={1} borderStyle="single" borderLeft={false} borderRight={false} borderTop={false}>
          <Text color="green">●</Text> <Text color="green">{agentExecutionState.statusLine}</Text>
        </Box>
      )}
    </Box>
  );
}
