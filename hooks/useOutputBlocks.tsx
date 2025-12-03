import {AgentEventState} from "@tokenring-ai/agent/state/agentEventState";
import {useMemo} from "react";

export type OutputBlock =
  | { type: 'chat'; content: string }
  | { type: 'reasoning'; content: string }
  | { type: 'input'; content: string }
  | { type: 'system'; content: string; level: 'info' | 'warning' | 'error' };

export function useOutputBlocks(events: AgentEventState["events"] | null) {
  return useMemo(() => {
    const blocks: OutputBlock[] = [];
    let last: OutputBlock | undefined;

    for (const event of events ?? []) {
      switch (event.type) {
        case 'output.chat':
          if (last?.type === 'chat') {
            last.content += event.data.content;
          } else {
            last = {type: 'chat', content: event.data.content};
            blocks.push(last);
          }
          break;

        case 'output.reasoning':
          if (last?.type === 'reasoning') {
            last.content += event.data.content;
          } else {
            last = {type: 'reasoning', content: event.data.content};
            blocks.push(last);
          }
          break;

        case 'output.system':
          last = {type: 'system', content: event.data.message, level: event.data.level};
          blocks.push(last);
          break;

        case 'input.received':
          last = {type: 'input', content: event.data.message};
          blocks.push(last);
          break;

        case 'input.handled':
          if (event.data.status === 'cancelled') {
            last = {type: 'system', content: event.data.message, level: "error"};
            blocks.push(last);
          } else if (event.data.status === 'error') {
            last = {type: 'system', content: event.data.message, level: "error"};
            blocks.push(last);
          }
          break;
      }
    }

    return blocks;
  }, [events?.length, events ? events[events?.length - 1] : null]);
}