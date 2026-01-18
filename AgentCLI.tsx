import {type ParsedQuestionRequest, QuestionResponseSchema} from "@tokenring-ai/agent/AgentEvents";
import AgentManager from '@tokenring-ai/agent/services/AgentManager';
import {AgentExecutionState} from "@tokenring-ai/agent/state/agentExecutionState";
import TokenRingApp from "@tokenring-ai/app";
import {WebHostService} from "@tokenring-ai/web-host";
import {Box, Text, useApp, useInput} from 'ink';
import React, {useMemo, useState} from 'react';

import {z} from "zod";
import {InkCLIConfigSchema} from "./AgentInkCLI.ts";
import {useAgentStateSlice} from './hooks/useAgentStateSlice.ts';
import AgentChatScreen from './screens/AgentChatScreen.tsx';
import AgentSelectionScreen from './screens/AgentSelectionScreen.tsx';
import QuestionInputScreen from './screens/QuestionInputScreen.tsx';

export type Screen =
  | { name: 'selectAgent' }
  | { name: 'chat'; agentId: string }
  | { name: 'question'; request: ParsedQuestionRequest, onResponse: (response: any) => void };


interface AgentCLIProps extends z.infer<typeof InkCLIConfigSchema> {
  agentManager: AgentManager;
  app: TokenRingApp;
}

export default function AgentCLI({
  app,
  bannerNarrow,
  bannerWide,
  bannerCompact,
  bannerColor
}: AgentCLIProps) {
  const { exit } = useApp();

  const agentManager = useMemo(() => app.requireService(AgentManager), [app]);
  const webHostService = useMemo(() => app.getService(WebHostService), [app]);
  
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      if (screen.name === 'selectAgent') {
        exit();
      } else {
        setScreen({ name: 'selectAgent' });
      }
    }
  });

  const [screen, setScreen] = useState<Screen>({ name: 'selectAgent' });

  const currentAgent = useMemo(() => screen.name === 'chat' ? agentManager.getAgent(screen.agentId) : null, [screen, agentManager]);
  const agentExecutionState = useAgentStateSlice(AgentExecutionState, currentAgent);

  if (screen.name === 'selectAgent' || currentAgent === null) {
    return (
      <Box flexDirection="column">
        <Text color={bannerColor}>{bannerWide}</Text>
        <AgentSelectionScreen
          app={app}
          setScreen={setScreen}
          onCancel={exit}
        />
      </Box>
    );
  }

  if (agentExecutionState?.waitingOn && agentExecutionState.waitingOn.length > 0) {
    const request = agentExecutionState.waitingOn[0];
    const handleResponse = (response: z.output<typeof QuestionResponseSchema>) => {
      currentAgent.sendQuestionResponse(request.requestId, { result: response });

    }
    return (
      <Box flexDirection="column">
        <Box borderStyle="round" paddingX={1}><Text color={bannerColor}>{bannerCompact}</Text></Box>
        <QuestionInputScreen request={request} onResponse={handleResponse} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" paddingX={1}><Text color={bannerColor}>{bannerCompact}</Text></Box>
      <AgentChatScreen
        currentAgent={currentAgent}
        setScreen={setScreen}
      />
    </Box>
  );
}