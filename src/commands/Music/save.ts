import { Command, logger } from '#lib/structures';
import { getConfig, getMetadata, map, save, search, SpotifySong } from '#utils';
import inquirer from 'inquirer';

export default new Command({
	description: 'Save songs',
	flags: [
		{
			longFlags: 'mp3',
			description: 'save in .mp3 file'
		},
		{
			longFlags: 'flac',
			description: 'save in .flac file'
		},
		{
			longFlags: 'raw',
			description: 'Do not add metadata in the song'
		}
	],
	args: [{ name: 'song', description: 'Search query (OPTIONAL)' }],

	async run(args, flags) {
		const format = flags.mp3 ? 'mp3' : flags.flac ? 'flac' : undefined;

		let songName: string;
		if (args) songName = args;
		else {
			logger.debug('Song name was not provided');
			songName = (
				await inquirer.prompt([
					{
						message: 'Please enter name of the song to save:',
						name: 'songName',
						type: 'input'
					}
				])
			).songName;
		}

		if (!songName.length) throw new Error('Song Name is mandatory');

		const searches = await search(songName);
		logger.debug(`Found ${searches.length} songs!`);

		if (!searches.length) throw new Error(`No results found, please input better search term!`);

		const { url }: { url: string } = await inquirer.prompt([
			{
				type: 'list',
				loop: true,
				message: 'Results found',
				name: 'url',
				choices: map(searches)
			}
		]);

		const song = searches.find((v) => v.url === url)!;

		let metadata: SpotifySong | undefined;

		const { clientId, clientSecret } = getConfig(true);
		if (clientId.length && clientSecret.length && !flags.raw) {
			logger.debug('Fetching Spotify details');
			metadata = await getMetadata(songName, song);
		}
		logger.debug('Proceeding to download...');
		const { verbose } = flags;
		await save(song, format, metadata);
	}
});
