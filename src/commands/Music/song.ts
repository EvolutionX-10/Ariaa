import { Command, logger } from '#lib/structures';
import { getClosestYoutubeTrack, getConfig, getMetadata, map, save, search } from '#utils';
import { blueBright, greenBright, redBright, underline } from 'colorette';
import inquirer from 'inquirer';
import ora from 'ora';
import type { Video } from 'youtube-sr';

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
		},
		{
			longFlags: 'spotify',
			description: 'Use Spotify to search'
		},
		{
			longFlags: 'yt',
			description: 'Use YouTube to search'
		}
	],
	args: [{ name: 'song', description: 'Search query (OPTIONAL)' }],

	async run(args, flags) {
		const { clientId, clientSecret, preference } = getConfig(true);

		const format = flags.mp3 ? 'mp3' : flags.flac ? 'flac' : undefined;
		const provider = flags.yt ? 'youtube' : flags.spotify ? 'spotify' : preference;

		logger.debug(`Using ${provider === 'spotify' ? greenBright('Spotify') : redBright('YouTube')} as the provider`);

		let songName: string;
		if (args) songName = args;
		else {
			logger.debug('Song name was not provided!');
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

		const spinner = ora('Searching...').start();

		let ytSearch: Video[] | undefined;
		let spotifySearch: SpotifyTrack.Item[] | undefined;
		if (provider === 'youtube') {
			ytSearch = await search(songName, provider);
		} else spotifySearch = await search(songName, provider);

		const searches = (ytSearch ?? spotifySearch)!;
		logger.debug(`Found ${searches.length} songs!`);
		spinner.stop();

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

		let metadata = spotifySearch?.find((r) => r.id === url);
		const ytsong = ytSearch?.find((r) => r.url === url) ?? (await getClosestYoutubeTrack(metadata!));
		logger.debug(`Found ${underline(blueBright(ytsong.title!))}`);
		if (clientId.length && clientSecret.length && !flags.raw && provider === 'youtube') {
			logger.debug('Fetching Spotify details');
			metadata = await getMetadata(songName, ytsong!);
		}
		logger.debug('Proceeding to download...');

		await save(ytsong, format, metadata);
	}
});
