import { fetch, request } from 'undici';
import type { HttpMethod } from 'undici/types/dispatcher.js';
import { getConfig } from './config.js';
const BASE = `https://api.spotify.com/v1`;

export async function authorize(): Promise<string> {
	const { clientId, clientSecret } = getConfig(true);

	const options = {
		headers: {
			Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: 'grant_type=client_credentials',
		json: true,
		method: 'POST' as HttpMethod
	};

	const res = await request(`https://accounts.spotify.com/api/token`, options);

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
