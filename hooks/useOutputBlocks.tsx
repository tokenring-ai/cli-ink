import {AgentEventState} from "@tokenring-ai/agent/state/agentEventState";
import {useMemo, useRef} from "react";

export type OutputBlock =
  | { type: 'chat'; message: string }
  | { type: 'reasoning'; message: string }
  | { type: 'input'; message: string }
  | { type: 'system'; message: string; level: 'info' | 'warning' | 'error' };

interface BlocksCache {
  blocks: OutputBlock[];
  processedCount: number;
}

function processEvent(event: AgentEventState["events"][number], blocks: OutputBlock[]): void {
  const last = blocks[blocks.length - 1];

  switch (event.type) {
    case 'output.chat':
      if (last?.type === 'chat') {
        last.message += event.message;
      } else {
        blocks.push({type: 'chat', message: event.message});
      }
      break;

    case 'output.reasoning':
      if (last?.type === 'reasoning') {
        last.message += event.message;
      } else {
        blocks.push({type: 'reasoning', message: event.message});
      }
      break;
    case 'output.info':
      blocks.push({type: 'system', message: event.message, level: 'info'});
      break;
    case 'output.warning':
      blocks.push({type: 'system', message: event.message, level: 'warning'});
      break;
    case 'output.error':
      blocks.push({type: 'system', message: event.message, level: 'error'});
      break;

    case 'input.received':
      blocks.push({type: 'input', message: event.message});
      break;

    case 'input.handled':
      if (event.status === 'cancelled' || event.status === 'error') {
        blocks.push({type: 'system', message: event.message, level: "error"});
      }
      break;
  }
}

export function useOutputBlocks(events: AgentEventState["events"] | null) {
  const cacheRef = useRef<BlocksCache>({ blocks: [], processedCount: 0 });

  return useMemo(() => {
    const eventList = events ?? [];
    const cache = cacheRef.current;

    // Reset if events were cleared or replaced with a shorter list
    if (eventList.length < cache.processedCount) {
      cache.blocks = [];
      cache.processedCount = 0;
    }

    // Process only new events
    for (let i = cache.processedCount; i < eventList.length; i++) {
      processEvent(eventList[i], cache.blocks);
    }

    cache.processedCount = eventList.length;

    // Return a shallow copy so React detects changes
    return [...cache.blocks];
  }, [events?.length]);
}