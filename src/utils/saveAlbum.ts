import { logger } from '#lib/structures';
import { path } from '@ffmpeg-installer/ffmpeg';
import { MultiBar, Presets } from 'cli-progress';
import { blueBright, cyanBright, greenBright, underline } from 'colorette';
import ffmpeg from 'fluent-ffmpeg';
import { rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import sanitize from 'sanitize-filename';
import { request } from 'undici';
import ytdl from 'ytdl-core';
import type { Video } from 'youtube-sr';
import { getConfig, musicPath } from './config.js';
import { wait } from './functions.js';
import { getGenre } from './genre.js';
import { filter, parse, saveTmpAudio } from './music.js';
import { getArtist } from './spotify.js';

export async function saveAlbum(videos: Video[], album: Album.RootObject, overrideformat?: 'mp3' | 'flac') {
	ffmpeg.setFfmpegPath(path);
	const bars = new MultiBar(
		{
			hideCursor: true,
			stopOnComplete: true,
			clearOnComplete: true,
			format: `Downloading | ${blueBright('{bar}')} {percentage}% | ETA: ${greenBright('{eta}')}s`
		},
		Presets.shades_classic
	);

	const { format, bitrate } = getConfig(true);
	const coverUrl = album.images[0].url;
	overrideformat ??= format;
	logger.debug(`Saving in ${underline(overrideformat)} format`);

	const coverStream = await request(coverUrl).then((res) => res.body.arrayBuffer());

	const tmpImg = join(tmpdir(), `${(Math.random() + 1).toString(36)}.jpg`);
	await writeFile(tmpImg, Buffer.from(coverStream));
	const date = `${new Date(album.release_date).getUTCFullYear()}`;
	const genre = getGenre((await getArtist(album.artists[0].id)).genres);
	// let index = 1;
	const promises = [];
	for (const [i, vid] of videos.entries()) {
		const promise = download(vid, bars, overrideformat, album, bitrate, i, tmpImg, genre, date);
		promises.push(promise);
	}
	await Promise.all(promises);
	logger.info(`Successfully saved ${underline(album.name)}`);
	if (tmpImg) await rm(tmpImg);
}

async function download(
	vid: Video,
	bars: MultiBar,
	overrideformat: 'mp3' | 'flac',
	album: Album.RootObject,
	bitrate: 128 | 320,
	i: number,
	tmpImg: string,
	genre: string | undefined,
	date: string
) {
	const metadata = album.tracks.items[i];
	const bar = bars.create((vid.duration * 2) / 1000, 0);
	const stream = ytdl(vid.url, { quality: 'highestaudio', highWaterMark: 1 << 25 });

	const tmpAudio = join(tmpdir(), `${(Math.random() + 1).toString(36)}.${overrideformat}`);
	await saveTmpAudio(stream, tmpAudio, bar, bitrate);

	return new Promise<void>((resolve, reject) => {
		try {
			const file = ffmpeg(tmpAudio)
				.outputOptions('-acodec', 'libmp3lame', '-b:a', `${bitrate}k`, '-id3v2_version', '3')
				.on('progress', (p) => {
					bar.update(Math.floor(parse(p.timemark.slice(3))) + vid.duration / 1000);
				})
				.on('end', async () => {
					bar.update((vid.duration * 2) / 1000);
					bar.stop();
					await rm(tmpAudio);
					await wait(1000);
					resolve();
				})
				.outputOptions(`-metadata`, `album=${album.name}`)
				.outputOptions(`-metadata`, `title=${filter(metadata?.name)}`)
				.outputOptions(`-metadata`, `track=${metadata.track_number}`)
				.outputOptions(`-metadata`, `genre=${genre}`)
				.outputOptions(`-metadata`, `artist=${metadata?.artists.map((r) => r.name).join(', ')}`)
				.outputOptions(`-metadata`, `album_artist=${album.artists[0].name}`)
				.outputOptions(`-metadata`, `date=${date}`);
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
			file.saveToFile(musicPath(sanitize(metadata.name), overrideformat, album.name));
			// file.on('error', reject);
		} catch (error) {
			reject(error);
		}
	});
}
