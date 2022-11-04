import type { Video } from 'ytsr';
import { getGenre } from './genre.js';
import { parse } from './music.js';
import { getArtist, getAudioFeatures, searchSpotify } from './spotify.js';

export async function getMetadata(song: string, songObj: Video): Promise<SpotifyTrack.Item> {
	const data = await searchSpotify(song, 'track', 5);
	const track = await findClosestTrack(data.tracks.items, songObj);
	track.genre = getGenre((await getArtist(track.artists[0].id)).genres);
	return track;
}

async function findClosestTrack(songs: SpotifyTrack.Item[], songObj: Video) {
	const time = parse(songObj.duration!) * 1000;
	const times = songs.map((s) => s.duration_ms);

	const closest = times.reduce((prev, curr) => (Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev));

	const song = songs.find((s) => s.duration_ms === closest)!;
	const data = await getAudioFeatures(song.id);

	song.key = assignKey(data.key);
	song.tempo = Math.round(data.tempo);
	return song;
}

function assignKey(key: number) {
	return ['C', 'C# | Db', 'D', 'D# | Eb', 'E', 'F', 'F# | Gb', 'G', 'G# | Ab', 'A', 'A# | Bb', 'B'][key];
}
