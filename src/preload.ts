// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { McpIpcApi } from './types/electronMcp';

const mcpApi: McpIpcApi = {
  isInstalled: () => ipcRenderer.invoke('mcp:is-installed'),
  executeCommand: (args: string[]) =>
    ipcRenderer.invoke('mcp:execute-command', args),
  installCli: () => ipcRenderer.invoke('mcp:install-cli'),
  selectProjectLocation: () =>
    ipcRenderer.invoke('mcp:select-project-location'),
  readFile: (filePath: string) =>
    ipcRenderer.invoke('mcp:read-file', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('mcp:write-file', filePath, content),
  getAppDataPath: () => ipcRenderer.invoke('mcp:get-app-data-path'),
  selectFile: (options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('mcp:select-file', options),
};

contextBridge.exposeInMainWorld('mcpApi', mcpApi);
