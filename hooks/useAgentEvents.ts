import type Agent from '@tokenring-ai/agent/Agent';
import {HumanInterfaceRequest, HumanInterfaceResponse} from "@tokenring-ai/agent/HumanInterfaceRequest";
import {useCallback, useEffect, useRef, useState} from 'react';

export type OutputBlock =
  | { type: 'chat'; content: string }
  | { type: 'reasoning'; content: string }
  | { type: 'input'; content: string }
  | { type: 'system'; content: string; level: 'info' | 'warning' | 'error' };

export interface SystemMessage {
  message: string;
  level: 'info' | 'warning' | 'error';
}

export type AppState =
  | { type: 'idle' }
  | { type: 'processing'; inputMessage: string | null }
  | { type: 'busy'; message: string }
  | { type: 'human-request'; request: HumanInterfaceRequest; handleResponse(response: HumanInterfaceResponse): void }
  | { type: 'exited' };

export function useAgentEvents(agent: Agent | null) {
  const [blocks, setBlocks] = useState<OutputBlock[]>([]);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>({ type: 'idle' });
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetOutput = useCallback(() => {
    setBlocks([]);
    setSystemMessages([]);
    setInputMessage(null);
  }, []);

  useEffect(() => {
    if (!agent) return;

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    (async () => {
      for await (const event of agent.events(signal)) {
        switch (event.type) {
          case 'output.chat':
            setBlocks(prev => {
              const last = prev[prev.length - 1];
              if (last?.type === 'chat') {
                return [...prev.slice(0, -1), { type: 'chat', content: last.content + event.data.content }];
              }
              return [...prev, { type: 'chat', content: event.data.content }];
            });
            break;

          case 'output.reasoning':
            setBlocks(prev => {
              const last = prev[prev.length - 1];
              if (last?.type === 'reasoning') {
                return [...prev.slice(0, -1), { type: 'reasoning', content: last.content + event.data.content }];
              }
              return [...prev, { type: 'reasoning', content: event.data.content }];
            });
            break;

          case 'output.system':
            setBlocks(prev => {
              return [...prev, { type: 'system', content: event.data.message, level: event.data.level }];
            });
            break;

          case 'input.received':
            setBlocks(prev => {
              return [...prev, { type: 'input', content: event.data.message }];
            });
            setAppState({ type: 'processing', inputMessage: event.data.message });
            /*resetOutput();
            setInputMessage(`> ${event.data.message}`);
            setAppState({ type: 'processing', inputMessage: event.data.message });*/
            break;

          case 'state.busy':
            setAppState({ type: 'busy', message: event.data.message });
            break;

          case 'state.notBusy':
            setAppState(prev => prev.type === 'busy' ? { type: 'processing', inputMessage: null } : prev);
            break;

          case 'state.idle':
            setAppState({ type: 'idle' });
            break;

          case 'state.exit':
            setAppState({ type: 'exited' });
            break;

          case 'human.request':
            setAppState({
              type: 'human-request',
              request: event.data.request,
              handleResponse(response: HumanInterfaceResponse) {
                agent.sendHumanResponse(event.data.sequence, response);
                setAppState({ type: 'processing', inputMessage: null });
              }
            });
            break;
        }
      }
    })();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [agent, resetOutput]);

  return {
    blocks,
    systemMessages,
    inputMessage,
    appState,
    resetOutput,
  };
}