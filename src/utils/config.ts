import { CONFIG_FILE } from '#constants';
import { logger } from '#lib/structures';
import { magenta, underline } from 'colorette';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export function getConfig(json: true): AriaaConfig;
export function getConfig(json?: false): string;
export function getConfig(json = false): AriaaConfig | string {
	try {
		const config = readFileSync(path.join(homedir(), CONFIG_FILE), {
			encoding: 'utf-8'
		});

		return json ? JSON.parse(config) : config;
	} catch {
		throw new Error(`Config Not found! Please run ${underline(magenta(`ariaa setup`))}`);
	}
}

export function musicPath(title: string, format: string) {
	const { downloadPath } = getConfig(true);
	if (!existsSync(downloadPath)) throw new Error('Download path does not exist!');

	const music = path.join(downloadPath, 'Music');
	if (!existsSync(music)) {
		logger.debug('Music folder does not exist, making one...');
		mkdirSync(music);
	}
	return path.join(music, `${title}.${format}`);
}

export interface AriaaConfig {
	downloadPath: string;
	clientId: string;
	clientSecret: string;
	bitrate: 128 | 320;
	format: 'mp3' | 'flac';
	preference: 'spotify' | 'youtube';
}
