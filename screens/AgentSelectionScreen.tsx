import {TitledBox} from "@mishieck/ink-titled-box";
import type AgentManager from '@tokenring-ai/agent/services/AgentManager';
import {WebHostService} from "@tokenring-ai/web-host";
import SPAResource from "@tokenring-ai/web-host/SPAResource";
import {Box, Text} from "ink";
import React, {useCallback, useMemo} from 'react';
import {Screen} from "../AgentCLI.tsx";
import type {TreeLeaf} from './TreeSelectionScreen.tsx';
import TreeSelectionScreen from './TreeSelectionScreen.tsx';
import open from 'open';

interface AgentSelectionScreenProps {
  webHostService?: WebHostService;
  agentManager: AgentManager;
  setScreen: (screen: Screen) => void;
  onCancel: () => void;
}

export default function AgentSelectionScreen({
  webHostService,
  agentManager,
  setScreen,
  onCancel,
}: AgentSelectionScreenProps) {
  const [err, setError] = React.useState<Error | null>(null);
  const tree: TreeLeaf = useMemo(() => {
    const configs = Object.entries(agentManager.getAgentConfigs());
    
    const categories: Record<string, TreeLeaf[]> = {};

    if (webHostService) {
      const webResources = webHostService.getResources();
      for (const resourceName in webResources) {
        const resource = webResources[resourceName];
        if (resource instanceof SPAResource) {
          const webApps = categories['Web Application'] ??= [];
          webApps.push(
            {
              name: `Connect to ${resourceName}`,
              value: `open:${resource.config.prefix.substring(1)}`,
            }
          );
        }
      }
    }

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

    const [action, remainder] = agentType.split(':');
    if (action === 'spawn') {
      try {
        const agent = await agentManager.spawnAgent({ agentType: remainder, headless: false });
        if (agent) setScreen({ name: 'chat', agentId: agent.id});
      } catch (e) {
        setError(e as Error);
      }
    } else if (action === 'connect') {
      setScreen({ name: 'chat', agentId: remainder });
    } else if (action === 'open') {
      const url = webHostService?.getURL()?.toString() ?? undefined
      if (!url) {
        setError(new Error('The web host service does not appear to be bound to a valid host/port.'));
      } else {
        open(`${url}${remainder}`);
      }
    }
  }, [agentManager, webHostService, setScreen, onCancel]);

  return (
    <Box flexDirection="column">
      <TreeSelectionScreen
        request={{ type: 'askForSingleTreeSelection', tree }}
        onResponse={handleSelect}
      />
      { err &&
        <TitledBox titles={["Error while creating agent"]} borderStyle="round" paddingX={1} borderColor="red">
          <Text color="red">{err.message}</Text>
        </TitledBox>
      }
    </Box>
  );
}
