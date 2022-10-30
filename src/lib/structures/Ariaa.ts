import { handleRegistry } from '#core';
import { version } from '#utils';
import { redBright } from 'colorette';
import { Command } from 'commander';
import { logger } from './Logger.js';

export class Ariaa extends Command {
	public constructor() {
		super('ariaa');
		this.alias('aria')
			.description('CLI for the music lovers')
			.version(version, '-v, --version')
			.exitOverride(() => process.exit(0));
	}

	public async run() {
		process.on('unhandledRejection', (err) => {
			const verbose = process.argv.includes('--verbose');
			if (!(err instanceof Error)) return;
			if (!verbose) return logger.error(err.message);
			logger.error(`${err.message}${err.cause ? ` | Reason: ${err.cause as string}` : ''}`);
			console.log(redBright(err.stack?.replace(`Error: ${err.message}`, '') ?? ''));
			process.exit(1);
		});

		await (await handleRegistry(this)).parseAsync();
	}
}
