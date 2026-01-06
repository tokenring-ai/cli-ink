import {
  HumanInterfaceRequestFor,
  HumanInterfaceResponse,
  HumanInterfaceResponseFor
} from "@tokenring-ai/agent/HumanInterfaceRequest";
import AgentManager from '@tokenring-ai/agent/services/AgentManager';
import {AgentEventState} from "@tokenring-ai/agent/state/agentEventState";
import {AgentExecutionState} from "@tokenring-ai/agent/state/agentExecutionState";
import TokenRingApp from "@tokenring-ai/app";
import {useAgentExecutionState} from "@tokenring-ai/chat-frontend/src/hooks/useAgentExecutionState";
import {WebHostService} from "@tokenring-ai/web-host";
import {Box, Text, useApp, useInput} from 'ink';
import React, {useMemo, useState} from 'react';

import {z} from "zod";
import {InkCLIConfigSchema} from "./AgentInkCLI.ts";
import {useAgentStateSlice} from './hooks/useAgentStateSlice.ts';
import AgentChatScreen from './screens/AgentChatScreen.tsx';
import AgentSelectionScreen from './screens/AgentSelectionScreen.tsx';
import AskScreen from "./screens/AskScreen.tsx";
import ConfirmationScreen from './screens/ConfirmationScreen.tsx';
import PasswordScreen from './screens/PasswordScreen.tsx';
import TreeSelectionScreen from './screens/TreeSelectionScreen.tsx';
import WebPageScreen from './screens/WebPageScreen.tsx';


export type Screen =
  | { name: 'selectAgent' }
  | { name: 'chat'; agentId: string }
  | { name: 'askForConfirmation'; request: HumanInterfaceRequestFor<"askForConfirmation">, onResponse: (response: HumanInterfaceResponseFor<'askForConfirmation'>) => void }
  | { name: 'askForPassword'; request: HumanInterfaceRequestFor<"askForPassword">, onResponse: (response: HumanInterfaceResponseFor<'askForPassword'>) => void }
  | { name: 'openWebPage'; request: HumanInterfaceRequestFor<"openWebPage">, onResponse: (response: HumanInterfaceResponseFor<'openWebPage'>) => void }
  | { name: 'askForSingleTreeSelection'; request: HumanInterfaceRequestFor<"askForSingleTreeSelection">, onResponse: (response: HumanInterfaceResponseFor<'askForSingleTreeSelection'>) => void }
  | { name: 'askForMultipleTreeSelection'; request: HumanInterfaceRequestFor<"askForMultipleTreeSelection">, onResponse: (response: HumanInterfaceResponseFor<'askForMultipleTreeSelection'>) => void }
  | { name: 'askForText'; request: HumanInterfaceRequestFor<"askForText">, onResponse: (response: HumanInterfaceResponseFor<'askForText'>) => void };


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
    const { id, request } = agentExecutionState.waitingOn[0];
    const handleResponse = (response: HumanInterfaceResponse) => {
      currentAgent.sendHumanResponse(id, response);
    }
    return (
      <Box flexDirection="column">
        <Box borderStyle="round" paddingX={1}><Text color={bannerColor}>{bannerCompact}</Text></Box>
        {request.type === 'askForConfirmation' && (
          <ConfirmationScreen message={request.message} defaultValue={request.default} timeout={request.timeout} onConfirm={handleResponse} />
        )}
        {request.type === 'askForPassword' && (
          <PasswordScreen request={request} onResponse={handleResponse} />
        )}
        {request.type === 'openWebPage' && (
          <WebPageScreen request={request} onResponse={handleResponse} />
        )}
        {(request.type === 'askForSingleTreeSelection') && (
          <TreeSelectionScreen
            request={request}
            onResponse={handleResponse}
          />
        )}
        {(request.type === 'askForMultipleTreeSelection') && (
          <TreeSelectionScreen
            request={request}
            onResponse={handleResponse}
          />
        )}
        {(request.type === 'askForText') && (
          <AskScreen request={request} onResponse={handleResponse} />
        )}
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