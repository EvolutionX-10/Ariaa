import { CONFIG_FILE } from '#constants';
import { questions } from '#lib/prompts';
import { Command, logger } from '#lib/structures';
import { AriaaConfig, getConfig } from '#utils';
import { writeFileSync } from 'fs';
import inquirer from 'inquirer';
import { homedir } from 'node:os';
import path from 'path';

export default new Command({
	flags: [
		{ shortFlags: 'y', description: 'Yes!' },
		{ longFlags: 'show', description: 'See current config' },
		{ longFlags: 'update', description: 'Update current config' }
	],
	description: 'Setup Ariaa!',
	async run(options) {
		if (options.show) {
			console.log(getConfig(true));
			process.exit(0);
		}

		let answers: AriaaConfig;

		if (options.y) {
			answers = {
				downloadPath: homedir(),
				clientId: '',
				clientSecret: '',
				preference: 'youtube',
				format: 'mp3',
				bitrate: 320
			};
		} else {
			answers = (await inquirer.prompt(questions, options.update ? getConfig(true) : undefined)) as AriaaConfig;
		}

		const file = JSON.stringify(answers, null, 2);

		logger.debug('Generating config file');
		writeFileSync(path.join(homedir(), CONFIG_FILE), file);

		logger.info('Setup Completed!');
	}
});
