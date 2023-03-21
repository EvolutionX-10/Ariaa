import { assignKey, getGenre } from '#utils';
import { fetch, request } from 'undici';
import { YouTube, Video } from 'youtube-sr';
import { getConfig } from './config.js';
const BASE = `https://api.spotify.com/v1`;

export async function authorize(): Promise<string> {
	const { clientId, clientSecret } = getConfig(true);

	const res = await request(`https://accounts.spotify.com/api/token`, {
		headers: {
			Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: 'grant_type=client_credentials',
		// json: true,
		method: 'POST'
	});

	return (await res.body.json()).access_token;
}

export async function headers() {
	return {
		Authorization: `Bearer ${await authorize()}`,
		'Content-Type': 'application/json'
	};
}

export async function searchSpotify(query: string, type?: 'track', limit?: number): Promise<SpotifyTrack.RootObject>;
export async function searchSpotify(query: string, type: 'album', limit?: number): Promise<SpotifyAlbum.RootObject>;
export async function searchSpotify(query: string, type: 'artist', limit?: number): Promise<SpotifyArtist.RootObject>;
export async function searchSpotify(query: string, type: 'track' | 'album' | 'artist' = 'track', limit = 3) {
	const res = await fetch(`${BASE}/search?q=${encodeURI(query)}&type=${type}&limit=${limit}`, { headers: await headers() });

	if (type === 'track') {
		const tracks = (await res.json()) as SpotifyTrack.RootObject;
		for (const song of tracks.tracks.items) {
			const features = await getAudioFeatures(song.id);
			song.genre = getGenre((await getArtist(song.artists[0].id)).genres) ?? 'Unknown';
			song.key = assignKey(features.key);
			song.tempo = Math.round(features.tempo);
		}
		return tracks;
	}
	return res.json();
}

export async function getAudioFeatures(id: string) {
	const res = await fetch(`${BASE}/audio-features/${id}`, { headers: await headers() });

	return res.json() as Promise<SpotifyAudioFeatures.RootObject>;
}

export async function getArtist(id: string) {
	const res = await fetch(`${BASE}/artists/${id}`, { headers: await headers() });

	return res.json() as Promise<SpotifyArtist.Item>;
}

export async function getAlbum(id: string) {
	const res = await fetch(`${BASE}/albums/${id}`, { headers: await headers() });

	return res.json() as Promise<Album.RootObject>;
}

export async function getClosestYoutubeTrack(song: SpotifyTrack.Item): Promise<Video> {
	const results = await YouTube.search(`${song.name} ${song.artists[0].name} lyrics`, { limit: 20, type: 'video' });

	const videos = results.filter(
		(s) => s.duration && s.title && song.name.toLowerCase().includes('remix') === s.title!.toLowerCase().includes('remix')
	);
	const times = videos.map((r) => r.duration);
	const closest = times.reduce((prev, curr) => (Math.abs(curr - song.duration_ms) < Math.abs(prev - song.duration_ms) ? curr : prev));
	const result = videos.find((s) => s.duration === closest);
	if (result) return result;
	throw new Error('No similar videos found');
}
