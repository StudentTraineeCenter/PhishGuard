import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { spawn } from 'child_process';
import * as path from 'path';

@Controller()
export class AppController {
  private readonly scriptPath: string;
  private readonly scriptDir: string;

  constructor(private readonly appService: AppService) {
    this.scriptPath = path.resolve(__dirname, '../../AI/llama.cpp/__test/script.py');
    this.scriptDir = path.dirname(this.scriptPath);
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('email')
  async getPrompt(
    @Query('name') name: string,
    @Query('hobby') hobby: string,
  ): Promise<string> {
    const prompt = `Can you write a selling email in English to promote a product to the following person: Name: ${name}, Hobby: ${hobby}. Ensure the email is fully completed without any missing or temporary parts. The company name is onlineShop.com, and the sender's name is Urban Haven. Make sure the email appears trustworthy and does not look like phishing.`;

    try {
      return await new Promise<string>((resolve, reject) => {
        const pythonProcess = spawn('python3', [this.scriptPath, prompt], {
          cwd: this.scriptDir,
          env: process.env
        });

        let output = '';
        pythonProcess.stdout.on('data', (data) => output += data.toString());
        pythonProcess.stderr.on('data', (data) => console.error(`Python stderr: ${data}`));
        pythonProcess.on('error', (error) => reject(`Failed to start Python process: ${error.message}`));
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(`Python process exited with code ${code}`);
            return;
          }
          resolve(output);
        });
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      throw error;
    }
  }
}
