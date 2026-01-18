import {TitledBox} from "@mishieck/ink-titled-box";
import {type ParsedQuestionRequest} from "@tokenring-ai/agent/AgentEvents";
import type {TreeLeaf} from '@tokenring-ai/agent/question';
import AgentManager from '@tokenring-ai/agent/services/AgentManager';
import TokenRingApp from "@tokenring-ai/app";
import {WebHostService} from "@tokenring-ai/web-host";
import SPAResource from "@tokenring-ai/web-host/SPAResource";
import WorkflowService from "@tokenring-ai/workflow/WorkflowService";
import {Box, Text} from "ink";
import open from 'open';
import React, {useCallback, useMemo} from 'react';
import {Screen} from "../AgentCLI.tsx";
import QuestionInputScreen from './QuestionInputScreen.tsx';

interface AgentSelectionScreenProps {
  app: TokenRingApp;
  setScreen: (screen: Screen) => void;
  onCancel: () => void;
}

export default function AgentSelectionScreen({
  app,
  setScreen,
  onCancel,
}: AgentSelectionScreenProps) {
  const agentManager = app.requireService(AgentManager);
  const webHostService = app.getService(WebHostService);

  const [err, setError] = React.useState<Error | null>(null);
  const tree: TreeLeaf[] = useMemo(() => {
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

    // Add workflows category
    const workflows = app.getService(WorkflowService);
    if (workflows) {
      const workflowList = workflows.listWorkflows();
      if (workflowList.length > 0) {
        categories['Workflows'] = workflowList.map(({key, workflow}) => ({
          name: `${workflow.name} (${key})`,
          value: `workflow:${key}`,
        }));
      }
    }

    return Object.entries(categories)
      .filter(([_, agents]) => agents.length > 0)
      .map(([category, agents]) => ({
        name: category,
        value: category,
        children: agents.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [agentManager, webHostService, app]);

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
        await open(`${url}${remainder}`);
      }
    } else if (action === 'workflow') {
      try {
       const workflowService = app.requireService(WorkflowService);
        const agent = await workflowService.spawnWorkflow(remainder, { headless: false });

        setScreen({ name: 'chat', agentId: agent.id });
      } catch (e) {
        setError(e as Error);
      }
    }
  }, [agentManager, webHostService, setScreen, onCancel, app]);

  const request: ParsedQuestionRequest = {
    type: "question.request",
    immediate: true,
    timestamp: Date.now(),
    requestId: "agent-selection",
    message: "Select an agent to connect to or spawn:",
    question: {
      type: "treeSelect",
      label: "Agent Selection",
      minimumSelections: 1,
      maximumSelections: 1,
      defaultValue: [],
      allowFreeform: false,
      tree
    },
    autoSubmitAfter: 0
  };

  return (
    <Box flexDirection="column">
      <QuestionInputScreen
        request={request}
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