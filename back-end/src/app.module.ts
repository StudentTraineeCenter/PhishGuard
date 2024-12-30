import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OllamaService } from './ollama.service'; // Import OllamaService

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, OllamaService], // Add OllamaService to providers
})
export class AppModule {}
