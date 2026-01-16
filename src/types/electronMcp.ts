// Types for Electron IPC MCP service
export interface McpIpcApi {
  isInstalled: () => Promise<boolean>;
  executeCommand: (
    args: string[]
  ) => Promise<{ code: number; stdout: string; stderr: string }>;
  installCli: () => Promise<{
    success: boolean;
    stdout?: string;
    stderr?: string;
    error?: string;
  }>;
  selectProjectLocation: () => Promise<{
    success: boolean;
    path?: string;
    error?: string;
  }>;
  readFile: (filePath: string) => Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }>;
  writeFile: (filePath: string, content: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  getAppDataPath: () => Promise<string>;
  selectFile: (options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<{
    success: boolean;
    path?: string;
    error?: string;
  }>;
}

declare global {
  interface Window {
    mcpApi?: McpIpcApi;
  }
}
