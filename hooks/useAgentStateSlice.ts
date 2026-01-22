import type Agent from '@tokenring-ai/agent/Agent';
import {AgentStateSlice} from "@tokenring-ai/agent/types";
import {useEffect, useState} from 'react';

export function useAgentStateSlice<T extends AgentStateSlice<any>>(
  ClassType: new (...args: any[]) => T, agent: Agent | null) {
  const [agentEventState, setagentEventState] = useState<T | null>(null);

  useEffect(() => {
    if (!agent) return;

    const unsubscribe = agent.subscribeState(ClassType, setagentEventState);

    return () => {
      unsubscribe();
    };
  }, [agent]);

  return agentEventState;
}