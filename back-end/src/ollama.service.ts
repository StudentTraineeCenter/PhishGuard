// filepath: /home/local/stc/backend/src/ollama.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OllamaService {
  async getModelResponse(prompt: string): Promise<string> {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'qwen2',
      prompt: prompt,
    });
    return response.data;
  }
}