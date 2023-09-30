import { Command, logger } from '#lib/structures';
import { getAlbum, getClosestYoutubeTrack, getConfig, saveAlbum, searchSpotify } from '#utils';
import { blue, blueBright, greenBright, redBright } from 'colorette';
import inquirer from 'inquirer';
import ora from 'ora';

export default new Command({
	description: 'Save albums with ease! [Needs Spotify Credentials]',
	args: [{ name: 'name', description: 'Name of album' }],
	flags: [
		{
			longFlags: 'mp3',
			description: 'save in .mp3 file'
		},
		{
			longFlags: 'flac',
			description: 'save in .flac file'
		}
	],
	async run(args, flags) {
		const { clientId, clientSecret } = getConfig(true);
		if (!clientId.length || !clientSecret.length)
			throw new Error(`${greenBright('Spotify')} credentials are ${redBright('required')} for this command!`);

		const format = flags.mp3 ? 'mp3' : flags.flac ? 'flac' : undefined;

		let albumName: string;
		if (args) albumName = args;
		else {
			logger.debug('Album name was not provided!');
			albumName = (
				await inquirer.prompt([
					{
						message: 'Please enter name of the song to save:',
						name: 'albumName',
						type: 'input'
					}
				])
			).albumName;
		}

		if (!albumName.length) throw new Error('Album Name is mandatory');

		const spinner = ora('Searching...').start();
		const searches = await searchSpotify(albumName, 'album', 5);
		spinner.stop();
		logger.debug(`Found ${blueBright(searches.albums.items.length)} results`);

		if (!searches.albums.items.length) throw new Error(`No albums found!`);

		const { id }: { id: string } = await inquirer.prompt([
			{
				name: 'id',
				message: 'Results found',
				type: 'list',
				loop: true,
				choices: searches.albums.items.map((a) => ({
					name: `${a.name} [${blue(a.artists.map((at) => at.name).join(', '))}] (${greenBright(`${a.total_tracks} tracks`)})`,
					value: a.id
				}))
			}
		]);

		const album = await getAlbum(id);
		const ytTracks = album.tracks.items.map((r) => getClosestYoutubeTrack(r as SpotifyTrack.Item));

		await saveAlbum(await Promise.all(ytTracks), album, format);
	}
});
