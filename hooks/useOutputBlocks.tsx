import {AgentEventState} from "@tokenring-ai/agent/state/agentEventState";
import {useRef, useMemo} from "react";

export type OutputBlock =
  | { type: 'chat'; content: string }
  | { type: 'reasoning'; content: string }
  | { type: 'input'; content: string }
  | { type: 'system'; content: string; level: 'info' | 'warning' | 'error' };

interface BlocksCache {
  blocks: OutputBlock[];
  processedCount: number;
}

function processEvent(event: AgentEventState["events"][number], blocks: OutputBlock[]): void {
  const last = blocks[blocks.length - 1];

  switch (event.type) {
    case 'output.chat':
      if (last?.type === 'chat') {
        last.content += event.data.content;
      } else {
        blocks.push({type: 'chat', content: event.data.content});
      }
      break;

    case 'output.reasoning':
      if (last?.type === 'reasoning') {
        last.content += event.data.content;
      } else {
        blocks.push({type: 'reasoning', content: event.data.content});
      }
      break;

    case 'output.system':
      blocks.push({type: 'system', content: event.data.message, level: event.data.level});
      break;

    case 'input.received':
      blocks.push({type: 'input', content: event.data.message});
      break;

    case 'input.handled':
      if (event.data.status === 'cancelled' || event.data.status === 'error') {
        blocks.push({type: 'system', content: event.data.message, level: "error"});
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