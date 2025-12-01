import {HumanInterfaceRequestFor, HumanInterfaceResponseFor} from "@tokenring-ai/agent/HumanInterfaceRequest";
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
  | { type: 'selectAgent' }
  | { type: 'chat'; agentId: string }
  | { type: 'askForConfirmation'; request: HumanInterfaceRequestFor<"askForConfirmation">, onResponse: (response: HumanInterfaceResponseFor<'askForConfirmation'>) => void }
  | { type: 'askForPassword'; request: HumanInterfaceRequestFor<"askForPassword">, onResponse: (response: HumanInterfaceResponseFor<'askForPassword'>) => void }
  | { type: 'openWebPage'; request: HumanInterfaceRequestFor<"openWebPage">, onResponse: (response: HumanInterfaceResponseFor<'openWebPage'>) => void }
  | { type: 'askForSingleTreeSelection'; request: HumanInterfaceRequestFor<"askForSingleTreeSelection">, onResponse: (response: HumanInterfaceResponseFor<'askForSingleTreeSelection'>) => void }
  | { type: 'askForMultipleTreeSelection'; request: HumanInterfaceRequestFor<"askForMultipleTreeSelection">, onResponse: (response: HumanInterfaceResponseFor<'askForMultipleTreeSelection'>) => void }
  | { type: 'askForText'; request: HumanInterfaceRequestFor<"askForText">, onResponse: (response: HumanInterfaceResponseFor<'askForText'>) => void };


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
      if (screen.type === 'selectAgent') {
        exit();
      } else {
        setScreen({ type: 'selectAgent' });
      }
    }
  });

  const [screen, setScreen] = useState<Screen>({ type: 'selectAgent' });

  const currentAgent = useMemo(() => screen.type === 'chat' ? agentManager.getAgent(screen.agentId) : null, [screen, agentManager]);
  const { appState } = useAgentEvents(currentAgent);

  if (screen.type === 'selectAgent' || currentAgent === null) {
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

  if (appState.type === 'human-request') {
    const { request, handleResponse } = appState;
    return (
      <Box flexDirection="column">
        <Box borderStyle="round" paddingX={1}><Text color={bannerColor}>{bannerCompact}</Text></Box>
        {request.type === 'askForConfirmation' && (
          <ConfirmationScreen message={request.message} defaultValue={request.default} onConfirm={handleResponse} />
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
        agentManager={agentManager}
        setScreen={setScreen}
      />
    </Box>
  );
};