import type Agent from '@tokenring-ai/agent/Agent';
import {AgentEventState} from "@tokenring-ai/agent/state/agentEventState";
import {useEffect, useState} from 'react';


export function useAgentEvents(agent: Agent | null) {
  const [appState, setAppState] = useState<{
    version: number;
    agentEventState?: AgentEventState;
  }>({ version: 1 });

  useEffect(() => {
    if (!agent) return;

    const unsubscribe = agent.subscribeState(AgentEventState, (state) => {
      setAppState(prev => ({
        version: prev.version + 1,
        agentEventState: state
      }));
    });

    return () => {
      unsubscribe();
      setAppState({ version: appState.version + 1 });
    };
  }, [agent]);

  return appState.agentEventState ?? null
}