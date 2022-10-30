import inquirer, { QuestionCollection } from 'inquirer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

inquirer.registerPrompt('directory', require('inquirer-select-directory'));

export const questions: QuestionCollection = [
	{
		name: 'downloadPath',
		message: 'Where should I download songs to?',
		type: 'directory',
		basePath: process.cwd()
	},
	{
		name: 'clientId',
		message: 'Enter Spotify Client ID',
		type: 'input',
		default: ''
	},
	{
		name: 'clientSecret',
		message: 'Enter Spotify Client Secret',
		type: 'password',
		default: ''
	},
	{
		name: 'format',
		message: 'What format should the songs be saved in?',
		type: 'list',
		choices: [
			{
				name: 'mp3',
				value: 'mp3',
				checked: true
			},
			{
				name: 'flac',
				value: 'flac'
			}
		]
	}
];

export const bitrateQ: QuestionCollection = [
	{
		name: 'bitrate',
		message: 'What bitrate should be used in songs?',
		type: 'list',
		choices: [
			{
				name: '320kbps',
				value: 320,
				checked: true
			},
			{
				name: '128kbps',
				value: 128
			}
		]
	}
];
