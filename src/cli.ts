import { CommandFactory } from 'nest-commander';
import { CommandsModule } from './app/user/commands/commands.module';

async function bootstrap() {
  await CommandFactory.run(CommandsModule, ['warn', 'error']);
}

bootstrap();
