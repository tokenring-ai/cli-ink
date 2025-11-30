import type AgentManager from '@tokenring-ai/agent/services/AgentManager';
import React, {useCallback, useMemo} from 'react';
import {Screen} from "../AgentCLI.tsx";
import type {TreeLeaf} from './TreeSelectionScreen.tsx';
import TreeSelectionScreen from './TreeSelectionScreen.tsx';

interface AgentSelectionScreenProps {
  agentManager: AgentManager;
  setScreen: (screen: Screen) => void;
  onCancel: () => void;
}

export default function AgentSelectionScreen({
  agentManager,
  setScreen,
  onCancel,
}: AgentSelectionScreenProps) {
  const tree: TreeLeaf = useMemo(() => {
    const configs = Object.entries(agentManager.getAgentConfigs());
    
    const categories: Record<string, TreeLeaf[]> = {};

    configs.forEach(([type, config]) => {
      const leaf: TreeLeaf = {
        name: `${config.name} (${type})`,
        value: `spawn:${type}`,
      };

      const category = config.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(leaf);
    });

    const currentAgents = agentManager.getAgents();
    if (currentAgents.length > 0) {
      categories['Current Agents'] = currentAgents.map(agent => ({
        name: agent.name,
        value: `connect:${agent.id}`,
      }));
    }

    return {
      name: 'Select Agent',
      children: Object.entries(categories)
        .filter(([_, agents]) => agents.length > 0)
        .map(([category, agents]) => ({
          name: category,
          value: category,
          children: agents.sort((a, b) => a.name.localeCompare(b.name)),
        })),
    };
  }, [agentManager]);

  const handleSelect = useCallback(async (agentType: string | null) => {
    if (!agentType) {
      onCancel();
      return;
    }

    const [action, id] = agentType.split(':');
    if (action === 'spawn') {
      const agent = await agentManager.spawnAgent(id);
      if (agent) setScreen({ type: 'chat', agentId: agent.id });
    } else if (action === 'connect') {
      setScreen({ type: 'chat', agentId: id });
    }
  }, [agentManager, setScreen, onCancel]);

  return (
    <TreeSelectionScreen
      request={{ type: 'askForSingleTreeSelection', tree }}
      onResponse={handleSelect}
    />
  );
}
