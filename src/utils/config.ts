import { CONFIG_FILE } from '#constants';
import { magenta, underline } from 'colorette';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export function getConfig<T extends boolean = false>(json?: T): If<T, AriaaConfig, string> {
	try {
		const config = readFileSync(path.join(homedir(), CONFIG_FILE), {
			encoding: 'utf-8'
		});

		return json ? JSON.parse(config) : (config as If<T, AriaaConfig, string>);
	} catch {
		throw new Error(`Config Not found! Please run ${underline(magenta(`ariaa setup`))}`);
	}
}

export function musicPath(title: string, format: string) {
	const { downloadPath } = getConfig(true);
	if (!existsSync(downloadPath)) throw new Error('Download path does not exist!');

	const music = path.join(downloadPath, 'Music');
	if (!existsSync(music)) {
		console.log('Music folder does not exist, making one...');
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
}

type If<T extends boolean, A, B> = T extends true ? A : T extends false ? B : A | B;
