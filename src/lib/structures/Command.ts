import { createArgument, createCommand, createOption } from 'commander';

export class Command<T extends string = '', K extends string = '', A extends string = ''> {
	public constructor(public options: CommandOptions<T, K, A>) {}

	public parse() {
		const parsedOptions = this.parseOptions();

		const command = createCommand(this.options.name)
			.description(this.options.description ?? '')
			.action((...args) => this.options.run(...(args as RunType<T, K, A>)));

		if (this.options.args) {
			for (const { name, description, default: def } of this.options.args) {
				const arg = createArgument(name, description).default(def).argOptional();
				command.addArgument(arg);
			}
		}
		if (parsedOptions) {
			for (const [flag, description, defaultValue] of parsedOptions) {
				const option = createOption(flag, description).default(defaultValue);
				command.addOption(option);
			}
		}
		command.option('--verbose', 'Verbose');
		if (this.options.alias) command.alias(this.options.alias);
		return command;
	}

	private parseOptions() {
		let flags = '';
		const parsedOptions: [string, string | undefined, string | undefined][] = [];
		if (!this.options.flags) return;
		for (const option of this.options.flags) {
			const { shortFlags, longFlags, rawFlags, description, default: def } = option;
			if (shortFlags) {
				flags += `-${shortFlags}, `;
			}
			if (longFlags) {
				flags += `--${longFlags}`;
			}
			if (rawFlags) flags = rawFlags;

			flags = flags.trim();
			flags = flags.endsWith(',') ? flags.slice(0, -1) : flags;
			parsedOptions.push([flags, description, def]);
			flags = '';
		}
		return parsedOptions;
	}
}

interface CommandOptions<T extends string, K extends string, A extends string> {
	name?: string;
	alias?: string;
	description?: string;
	args?: Argument<A>[];
	flags?: FlagData<T, K>[];
	run: (...args: RunType<T, K, A>) => void | Promise<void>;
}

interface BaseFlagData<T, K> {
	/** Raw Overwrites parsed! */
	rawFlags?: string;
	shortFlags?: T;
	/** Always use this if this is present! */
	longFlags?: K;
	description?: string;
	default?: string;
}

interface Argument<T> {
	name: T;
	description: string;
	default?: string;
}

type FlagData<T, K> = BaseFlagData<T, K> & ({ shortFlags: unknown } | { longFlags: unknown } | { rawFlags: unknown });

type RunType<S extends string, L extends string, A extends string> = A extends ''
	? [Record<S | L | 'verbose', boolean>]
	: [string, Record<S | L | 'verbose', boolean>];
