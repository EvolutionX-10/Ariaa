import spotifyApi from 'spotify-web-api-node';
import type { Video } from 'ytsr';
import { getConfig } from './config.js';
import { getGenre } from './genre.js';
import { parse } from './music.js';

export async function getMetadata(song: string, songObj: Video): Promise<SpotifySong> {
	const { clientId, clientSecret } = getConfig(true);

	const spotify = new spotifyApi({ clientId, clientSecret });

	const {
		body: { access_token }
	} = await spotify.clientCredentialsGrant();

	spotify.setAccessToken(access_token);

	const data = await spotify.search(song, ['track'], { limit: 5 });
	const track = await findClosestTrack(data.body.tracks.items, songObj, spotify);
	track.genre = getGenre((await spotify.getArtist(track.artists[0].id)).body.genres);
	return track;
}

async function findClosestTrack(songs: SpotifySong[], songObj: Video, spotify: spotifyApi) {
	const time = parse(songObj.duration!) * 1000;
	const times = songs.map((s) => s.duration_ms);

	const closest = times.reduce((prev, curr) => (Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev));

	const song = songs.find((s) => s.duration_ms === closest)!;
	const data = (await spotify.getAudioFeaturesForTrack(song.id)).body;

	song.key = assignKey(data.key);
	song.tempo = Math.round(data.tempo);
	return song;
}

function assignKey(key: number) {
	return ['C', 'C# | Db', 'D', 'D# | Eb', 'E', 'F', 'F# | Gb', 'G', 'G# | Ab', 'A', 'A# | Bb', 'B'][key];
}

export interface SpotifySong {
	album: SpotifyAlbum;
	duration_ms: number;
	disc_number: number;
	explicit: boolean;
	external_urls: { spotify: string };
	genre: string;
	href: string;
	id: string;
	is_local: boolean;
	key: string;
	name: string;
	popularity: number;
	preview_url: string;
	tempo: number;
	track_number: number;
	type: string;
	uri: string;
	available_markets: string[];
	artists: SpotifyArtist[];
}

interface SpotifyArtist {
	external_urls: unknown;
	href: string;
	id: string;
	name: string;
	type: 'artist';
	uri: string;
}

interface SpotifyAlbum {
	album_type: string;
	artists: SpotifyArtist[];
	external_urls: { spotify: string };
	href: string;
	id: string;
	images: Image[];
	name: string;
	release_date: string;
	total_tracks: number;
	uri: string;
	type: 'album' | 'single';
}

interface Image {
	url: string;
	height: number;
	width: number;
}
