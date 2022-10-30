import type { Ariaa, Command } from '#lib/structures';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const root = new URL('../', import.meta.url);
const commandFoldersPath = fileURLToPath(new URL('./commands/', root));

export async function handleRegistry(aria: Ariaa) {
	const commandFolders = readdirSync(commandFoldersPath);

	for (const folder of commandFolders) {
		const commandFiles = readdirSync(fileURLToPath(new URL(`./commands/${folder}`, root))).filter((file) => file.endsWith('.js'));

		for (const file of commandFiles) {
			const path = `../commands/${folder}/${file}`;
			const { default: command } = (await import(path)) as {
				default: Command;
			};
			command.options.name ??= file.split('.')[0];

			aria.addCommand(command.parse());
		}
	}
	return aria;
}
