// This file demonstrates how to use tuff-mcp-manager in the Electron main process
// You can expose these functions to the renderer process via IPC if needed

import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import { executeMcpCli, isMcpCliInstalled } from 'mcp-gearbox';
import { installMcpCli } from './install';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
// import { exec } from 'child_process';
// import { promisify } from 'util';

// const execAsync = promisify(exec);

/**
 * Expand tilde (~) to home directory in file paths
 */
function expandTilde(filePath: string): string {
  if (!filePath) return filePath;
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  if (filePath === '~') {
    return os.homedir();
  }
  return filePath;
}

export class ElectronMcpService {
  static setupIpcHandlers() {
    console.log('Setting up MCP IPC handlers...');

    // Check if MCP CLI is installed
    ipcMain.handle('mcp:is-installed', async () => {
      try {
        console.log('Handling mcp:is-installed');
        return await isMcpCliInstalled();
      } catch (error) {
        console.error('Error checking MCP CLI installation:', error);
        return false;
      }
    });

    // Execute custom command
    ipcMain.handle('mcp:execute-command', async (_, args: string[]) => {
      try {
        console.log('Handling mcp:execute-command with args:', args);
        return await executeMcpCli(args, { stdio: 'pipe' });
      } catch (error) {
        console.error('Error executing command:', error);
        throw error;
      }
    });

    // Install tuff-mcp-manager globally
    ipcMain.handle('mcp:install-cli', async () => {
      try {
        console.log('Handling mcp:install-cli');
        console.log('Installing tuff-mcp-manager globally...');
        await installMcpCli();
        // const { stdout, stderr } = await execAsync(
        //   'npm install -g tuff-mcp-manager@latest'
        // );
        // console.log('Installation output:', stdout);
        // if (stderr) {
        //   console.error('Installation stderr:', stderr);
        // }
        return { success: true, stdout: true, stderr: false };
      } catch (error) {
        console.error('Error installing tuff-mcp-manager:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Show open dialog for selecting project location
    ipcMain.handle('mcp:select-project-location', async () => {
      console.log('Handling mcp:select-project-location');
      try {
        // Get the first available window
        const windows = BrowserWindow.getAllWindows();
        if (windows.length === 0) {
          console.error('No windows available for mcp:select-project-location');
          return { success: false, error: 'No windows available' };
        }

        const window = windows[0];
        console.log('Using window:', window.id);

        const result = await dialog.showOpenDialog(window, {
          properties: ['openDirectory'],
          title: 'Select Project Location',
          message: 'Please select the project directory',
        });

        if (result.canceled) {
          console.log('Project location selection canceled');
          return { success: false, path: null };
        }

        console.log('Project location selected:', result.filePaths[0]);
        return { success: true, path: result.filePaths[0] };
      } catch (error) {
        console.error('Error selecting project location:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Read file contents
    ipcMain.handle('mcp:read-file', async (_, filePath: string) => {
      try {
        const expandedPath = expandTilde(filePath);
        console.log('Handling mcp:read-file for:', filePath, '-> expanded:', expandedPath);
        const content = fs.readFileSync(expandedPath, 'utf-8');
        return { success: true, content };
      } catch (error) {
        console.error('Error reading file:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Write file contents
    ipcMain.handle('mcp:write-file', async (_, filePath: string, content: string) => {
      try {
        const expandedPath = expandTilde(filePath);
        console.log('Handling mcp:write-file for:', filePath, '-> expanded:', expandedPath);
        // Ensure directory exists
        const dir = path.dirname(expandedPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(expandedPath, content, 'utf-8');
        return { success: true };
      } catch (error) {
        console.error('Error writing file:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Get app data path for storing custom config
    ipcMain.handle('mcp:get-app-data-path', async () => {
      const appDataPath = path.join(app.getPath('home'), '.tuff-mcp-manager');
      // Ensure directory exists
      if (!fs.existsSync(appDataPath)) {
        fs.mkdirSync(appDataPath, { recursive: true });
      }
      return appDataPath;
    });

    // Show file selection dialog
    ipcMain.handle('mcp:select-file', async (_, options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => {
      console.log('Handling mcp:select-file');
      try {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length === 0) {
          console.error('No windows available for mcp:select-file');
          return { success: false, error: 'No windows available' };
        }

        const window = windows[0];
        const result = await dialog.showOpenDialog(window, {
          properties: ['openFile'],
          title: options?.title || 'Select File',
          filters: options?.filters || [{ name: 'JSON Files', extensions: ['json'] }],
        });

        if (result.canceled) {
          console.log('File selection canceled');
          return { success: false, path: null };
        }

        console.log('File selected:', result.filePaths[0]);
        return { success: true, path: result.filePaths[0] };
      } catch (error) {
        console.error('Error selecting file:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    console.log('MCP IPC handlers setup complete');
  }

  static removeIpcHandlers() {
    console.log('Removing MCP IPC handlers...');
    ipcMain.removeHandler('mcp:is-installed');
    ipcMain.removeHandler('mcp:execute-command');
    ipcMain.removeHandler('mcp:install-cli');
    ipcMain.removeHandler('mcp:select-project-location');
    ipcMain.removeHandler('mcp:read-file');
    ipcMain.removeHandler('mcp:write-file');
    ipcMain.removeHandler('mcp:get-app-data-path');
    ipcMain.removeHandler('mcp:select-file');
    console.log('MCP IPC handlers removed');
  }
}
