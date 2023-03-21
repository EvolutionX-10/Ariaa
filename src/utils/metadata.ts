import type { Video } from 'youtube-sr';
import { getGenre } from './genre.js';
import { getArtist, getAudioFeatures, searchSpotify } from './spotify.js';

export async function getMetadata(song: string, songObj: Video): Promise<SpotifyTrack.Item> {
	const data = await searchSpotify(song, 'track', 5);
	const track = findClosestTrack(data.tracks.items, songObj);
	const features = await getAudioFeatures(track.id);

	track.genre = getGenre((await getArtist(track.artists[0].id)).genres) ?? 'Unknown';
	track.key = assignKey(features.key);
	track.tempo = Math.round(features.tempo);
	return track;
}

export function findClosestTrack(songs: SpotifyTrack.Item[], songObj: Video) {
	const time = songObj.duration;
	const times = songs.map((s) => s.duration_ms);

	const closest = times.reduce((prev, curr) => (Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev));

	const song = songs.find((s) => s.duration_ms === closest)!;
	return song;
}

export function assignKey(key: number) {
	return ['C', 'C# | Db', 'D', 'D# | Eb', 'E', 'F', 'F# | Gb', 'G', 'G# | Ab', 'A', 'A# | Bb', 'B'][key];
}
