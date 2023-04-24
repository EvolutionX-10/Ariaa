import inquirer, { type QuestionCollection } from 'inquirer';
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
		message: 'Enter Spotify Client ID [optional]',
		type: 'input',
		default: ''
	},
	{
		name: 'clientSecret',
		message: 'Enter Spotify Client Secret [optional]',
		type: 'password',
		default: ''
	},
	{
		name: 'preference',
		message: 'What song provider would you like to prefer?',
		type: 'list',
		choices: [
			{
				name: 'YouTube',
				value: 'youtube',
				checked: true
			},
			{
				name: 'Spotify [Needs Client Credentials]',
				value: 'spotify'
			}
		]
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
	},
	{
		name: 'bitrate',
		message: 'What bitrate should be used in songs? [for mp3]',
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
