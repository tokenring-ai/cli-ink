import AgentManager from '@tokenring-ai/agent/services/AgentManager';
import type TokenRingApp from '@tokenring-ai/app';
import type {TokenRingService} from '@tokenring-ai/app/types';
import {render} from "ink";
import React from 'react';
import {z} from 'zod';
import AgentCLI from "./AgentCLI.tsx";

export const InkCLIConfigSchema = z.object({
  bannerNarrow: z.string(),
  bannerWide: z.string(),
  bannerCompact: z.string(),
  bannerColor: z.string().optional().default('cyan'),
});

export default class AgentInkCLI implements TokenRingService {
  name = 'AgentInkCLI';
  description = 'Ink-based CLI for interacting with agents';

  private readonly app: TokenRingApp;
  private readonly config: z.infer<typeof InkCLIConfigSchema>;

  constructor(app: TokenRingApp, config: z.infer<typeof InkCLIConfigSchema>) {
    this.app = app;
    this.config = config;
  }

  async start(): Promise<void> {
    const { waitUntilExit } = render(
      React.createElement(AgentCLI, {
        agentManager: this.app.requireService(AgentManager),
        ...this.config
      }),
      { exitOnCtrlC: false, incrementalRendering: true, tallMode: true, maxFps: 120},
    );

    await waitUntilExit();
  }
}