import { CONFIG_FILE } from '#constants';
import { bitrateQ, questions } from '#lib/prompts';
import { Command, logger } from '#lib/structures';
import { AriaaConfig, getConfig } from '#utils';
import { writeFileSync } from 'fs';
import inquirer from 'inquirer';
import { homedir } from 'node:os';
import path from 'path';

export default new Command({
	flags: [
		{ shortFlags: 'y', description: 'Yes!' },
		{ longFlags: 'show', description: 'See current config' }
	],
	description: 'Setup Ariaa!',
	async run(options) {
		if (options.show) {
			const config = getConfig();
			if (config) console.log(config);
			process.exit(0);
		}

		let answers: AriaaConfig;

		if (options.y) {
			answers = {
				downloadPath: process.cwd(),
				bitrate: 320,
				clientId: '',
				clientSecret: '',
				format: 'mp3'
			};
		} else {
			answers = (await inquirer.prompt(questions)) as AriaaConfig;

			if (answers.format === 'mp3') {
				const bit = await inquirer.prompt(bitrateQ);
				answers.bitrate = bit.bitrate;
			}
		}

		const file = JSON.stringify(answers, null, 2);

		logger.debug('Generating config file');
		writeFileSync(path.join(homedir(), CONFIG_FILE), file);

		logger.info('Setup Completed!');
	}
});
