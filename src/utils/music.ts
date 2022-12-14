import { logger } from '#lib/structures';
import { path } from '@ffmpeg-installer/ffmpeg';
import { Presets, SingleBar } from 'cli-progress';
import { blue, blueBright, greenBright, red, underline, yellowBright } from 'colorette';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sanitize from 'sanitize-filename';
import { request } from 'undici';
import ytdl from 'ytdl-core';
import ytsr, { Video } from 'ytsr';
import { getConfig, musicPath } from './config.js';
import { searchSpotify } from './spotify.js';

export async function search(song: string, provider: 'youtube'): Promise<Video[]>;
export async function search(song: string, provider: 'spotify'): Promise<SpotifyTrack.Item[]>;
export async function search(song: string, provider: 'spotify' | 'youtube' = 'youtube') {
	if (provider === 'youtube') {
		const results = await ytsr(song, { limit: 30 });
		results.items.filter((i) => i.type === 'video');

		return results.items.map((r) => r as Video).filter((r) => r.url && r.title && r.duration && r.views);
	}
	return (await searchSpotify(song, 'track', 10)).tracks.items;
}

export function map(videos: Video[] | SpotifyTrack.Item[]) {
	if ((videos[0] as Video).title) {
		return (videos as Video[]).map((video) => ({
			name: video.title.concat(`${video.duration ? ` ${red(underline(video.duration))}` : ''}`),
			value: video.url
		}));
	}
	return (videos as SpotifyTrack.Item[]).map((v) => ({
		name: `${v.name} [${blue(v.artists.map((a) => a.name).join(', '))}] ${red(underline(parseReverse(v.duration_ms)))}`,
		value: v.id
	}));
}

export async function save(song: Video, overrideformat?: 'mp3' | 'flac', metadata?: SpotifyTrack.Item) {
	ffmpeg.setFfmpegPath(path);

	const { bitrate, format } = getConfig(true);
	overrideformat ??= format;

	logger.debug(`Saving in ${underline(overrideformat)} format`);

	const bar = new SingleBar(
		{
			hideCursor: true,
			format: `Downloading | ${blueBright('{bar}')} {percentage}% | ETA: ${greenBright('{eta}')}s | {value}/{total}`
		},
		Presets.shades_classic
	);

	bar.start(parse(song.duration!), 0);
	const start = Date.now();

	const stream = ytdl(song.url, {
		quality: 'highestaudio',
		highWaterMark: 1 << 25
	});

	const coverUrl = metadata?.album.images[0]?.url;
	let tmpImg: string | null = null;

	if (coverUrl) {
		const coverStream = await (await request(coverUrl)).body.arrayBuffer();

		tmpImg = join(tmpdir(), `${(Math.random() + 1).toString(36)}.jpg`);
		await writeFile(tmpImg, Buffer.from(coverStream));
	}

	let date: string | undefined;

	if (metadata?.album.release_date) {
		date = `${new Date(metadata.album.release_date).getUTCFullYear()}`;
	}
	const name = metadata ? filter(metadata.name) : filter(song.title);
	const file = ffmpeg(stream, { logger })
		.audioBitrate(bitrate)
		.on('progress', (p) => {
			bar.update(Math.floor(parse(p.timemark.slice(3))));
		})
		.on('end', () => {
			bar.update(parse(song.duration!));
			bar.stop();
			logger.debug('Download Complete');
			logger.info(`Saved ${yellowBright(underline(name))} in ${(Date.now() - start) / 1000}s`);
		});
	if (metadata) {
		file.outputOptions(`-metadata`, `album=${metadata?.album.name}`)
			.outputOptions(`-metadata`, `title=${filter(metadata?.name)}`)
			.outputOptions(`-metadata`, `track=${metadata.track_number}`)
			.outputOptions(`-metadata`, `TKEY=${metadata.key}`)
			.outputOptions(`-metadata`, `TBPM=${metadata.tempo}`)
			.outputOptions(`-metadata`, `genre=${metadata.genre}`)
			.outputOptions(`-metadata`, `artist=${metadata?.artists.map((r) => r.name).join(', ')}`)
			.outputOptions(`-metadata`, `album_artist=${metadata?.album.artists[0].name}`)
			.outputOptions(`-metadata`, `date=${date}`);
	}

	if (tmpImg) {
		file.input(tmpImg).outputOptions(
			'-map',
			'0:0',
			'-map',
			'1:0',
			'-disposition:v',
			'attached_pic',
			'-metadata:s:v',
			'title="Album cover"',
			'-metadata:s:v',
			'comment="Cover (Front)"'
		);
	}

	file.save(musicPath(sanitize(name), overrideformat));
}

export function parse(t: string) {
	const times = t.split(':');

	if (times.length === 3) {
		return Number(times[0]) * 60 * 60 + Number(times[1]) * 60 + Number(times[2]);
	}
	return Number(times[0]) * 60 + Number(times[1]);
}

export function parseReverse(ms: number) {
	return new Date(ms).toISOString().slice(14, 19);
}

export function filter(s: string) {
	return s?.replaceAll(/\(.*\)|\[.*\]/gm, '')?.trim();
}
