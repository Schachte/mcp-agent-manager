import { useState, useEffect } from 'react';
import Claude from './AgentSVG/Claude';
import Continue from './AgentSVG/Continue';
import Kiro from './AgentSVG/Kiro';
import Copilot from './AgentSVG/Copilot';
import CopilotCLI from './AgentSVG/CopilotCLI';
import Opencode from './AgentSVG/Opencode';
import type { Agent } from '@/store/slices/agentSlice';

// Import icons as modules to ensure they're handled by Vite
import geminiIcon from '/icons/gemini.png';
import antigravityIcon from '/icons/antigravity.png';
import cursorIcon from '/icons/cursor.png';
import qoderIcon from '/icons/qoder.png';
import lmstudioIcon from '/icons/lmstudio.webp';

/**
 * Extract domain from a URL and return a favicon service URL
 */
function getFaviconUrl(url: string): string | null {
  try {
    // Handle URLs with or without protocol
    let urlToParse = url.trim();
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse;
    }

    const parsedUrl = new URL(urlToParse);
    const domain = parsedUrl.hostname;

    // Use Google's favicon service - returns high quality favicons
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

interface AgentIconProps {
  agent: Agent | null;
  className?: string;
}

export default function AgentIcon({ agent, className }: AgentIconProps) {
  const sizeClass = className || 'h-4 w-4';
  const containerClass = `${sizeClass} flex items-center justify-center shrink-0`;
  const [faviconError, setFaviconError] = useState(false);

  // Reset error state when iconUrl changes
  useEffect(() => {
    setFaviconError(false);
  }, [agent?.iconUrl]);

  // Handle null case
  if (!agent) {
    return <span className={containerClass}>🤖</span>;
  }

  // Check for custom iconUrl first - fetch favicon from the website
  if (agent.iconUrl && !faviconError) {
    const faviconUrl = getFaviconUrl(agent.iconUrl);
    if (faviconUrl) {
      return (
        <img
          src={faviconUrl}
          alt={agent.name}
          className={`${sizeClass} object-contain shrink-0 rounded-sm`}
          onError={() => setFaviconError(true)}
        />
      );
    }
  }

  switch (agent.agent) {
    case 'claude':
      return <div className={containerClass}><Claude /></div>;
    case 'continue':
      return <div className={containerClass}><Continue /></div>;
    case 'kiro':
      return <div className={containerClass}><Kiro /></div>;
    case 'copilot-cli':
      return <div className={containerClass}><CopilotCLI /></div>;
    case 'copilot':
      return <div className={containerClass}><Copilot /></div>;
    case 'antigravity':
      return <img src={antigravityIcon} alt={agent.name} className={`${sizeClass} object-contain shrink-0`} />;
    case 'gemini':
      return <img src={geminiIcon} alt={agent.name} className={`${sizeClass} object-contain shrink-0`} />;
    case 'cursor':
      return <img src={cursorIcon} alt={agent.name} className={`${sizeClass} object-contain shrink-0`} />;
    case 'qoder':
      return <img src={qoderIcon} alt={agent.name} className={`${sizeClass} object-contain shrink-0`} />;
    case 'lmstudio':
      return <img src={lmstudioIcon} alt={agent.name} className={`${sizeClass} object-contain shrink-0`} />;
    case 'opencode':
      return <div className={containerClass}><Opencode /></div>;
    default:
      return <span className={containerClass}>🤖</span>;
  }
}
