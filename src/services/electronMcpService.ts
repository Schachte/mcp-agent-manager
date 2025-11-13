// This file demonstrates how to use mcp-gearbox in the Electron main process
// You can expose these functions to the renderer process via IPC if needed

import { ipcMain, dialog, BrowserWindow } from 'electron';
import { executeMcpCli, isMcpCliInstalled } from 'mcp-gearbox';
import { installMcpCli } from './install';
// import { exec } from 'child_process';
// import { promisify } from 'util';

// const execAsync = promisify(exec);

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

    // Install mcp-gearbox globally
    ipcMain.handle('mcp:install-cli', async () => {
      try {
        console.log('Handling mcp:install-cli');
        console.log('Installing mcp-gearbox globally...');
        await installMcpCli();
        // const { stdout, stderr } = await execAsync(
        //   'npm install -g mcp-gearbox@latest'
        // );
        // console.log('Installation output:', stdout);
        // if (stderr) {
        //   console.error('Installation stderr:', stderr);
        // }
        return { success: true, stdout: true, stderr: false };
      } catch (error) {
        console.error('Error installing mcp-gearbox:', error);
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

    console.log('MCP IPC handlers setup complete');
  }

  static removeIpcHandlers() {
    console.log('Removing MCP IPC handlers...');
    ipcMain.removeHandler('mcp:is-installed');
    ipcMain.removeHandler('mcp:execute-command');
    ipcMain.removeHandler('mcp:install-cli');
    ipcMain.removeHandler('mcp:select-project-location');
    console.log('MCP IPC handlers removed');
  }
}
