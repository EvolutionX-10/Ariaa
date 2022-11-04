import { Command } from '#lib/structures';
import { getAudioFeatures, searchSpotify } from '#utils';

export default new Command({
	async run() {
		const e = await searchSpotify('colors halsey');
		console.log(await getAudioFeatures(e.tracks.items[0].id));
	}
});
