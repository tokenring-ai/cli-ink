import {
  HumanInterfaceRequestFor,
  HumanInterfaceResponse,
  HumanInterfaceResponseFor
} from "@tokenring-ai/agent/HumanInterfaceRequest";
import type AgentManager from '@tokenring-ai/agent/services/AgentManager';
import {Box, Text, useApp, useInput} from 'ink';
import React, {useEffect, useMemo, useState} from 'react';

import {z} from "zod";
import {InkCLIConfigSchema} from "./AgentInkCLI.ts";
import {useAgentEvents} from './hooks/useAgentEvents.ts';
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
}

export default function AgentCLI({
  agentManager,
  bannerNarrow,
  bannerWide,
  bannerCompact,
  bannerColor
}: AgentCLIProps) {
  const { exit } = useApp();
  
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
  const agentEventState = useAgentEvents(currentAgent);

  if (screen.name === 'selectAgent' || currentAgent === null) {
    return (
      <Box flexDirection="column">
        <Text color={bannerColor}>{bannerWide}</Text>
        <AgentSelectionScreen
          agentManager={agentManager}
          setScreen={setScreen}
          onCancel={exit}
        />
      </Box>
    );
  }

  if (agentEventState?.waitingOn) {
    const { id, request } = agentEventState.waitingOn.data;
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
        agentEventState={agentEventState}
        currentAgent={currentAgent}
        setScreen={setScreen}
      />
    </Box>
  );
};