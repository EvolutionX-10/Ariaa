import { bgBlueBright, bgMagentaBright, bgRedBright, bgYellowBright, blueBright, type Color, cyan, whiteBright } from 'colorette';

class Logger {
	private level: LogLevel = LogLevel.Info;
	public setLevel(level: LogLevel) {
		this.level = level;
		return this;
	}

	public getLevel(): LogLevel {
		return this.level;
	}

	public info(message: string, ...args: unknown[]): void {
		this.log(LogLevel.Info, 'info', bgBlueBright, message, ...args);
	}

	public warn(message: string, ...args: unknown[]): void {
		this.log(LogLevel.Warn, 'warn', bgYellowBright, message, ...args);
	}

	public error(message: string, ...args: unknown[]): void {
		this.log(LogLevel.Error, 'error', bgRedBright, message, ...args);
	}

	public debug(message: string, ...args: unknown[]): void {
		this.log(LogLevel.Debug, 'debug', bgMagentaBright, message, ...args);
	}

	protected log(level: LogLevel, type: LogLevelString, color: Color, message: string, ...args: unknown[]): void {
		if (level > this.level) return;
		const messages = message.split(/\n/);
		if (messages.length > 1) return messages.forEach((r) => this.log(level, type, color, r));

		console[type](`${color(whiteBright(` ${type.toUpperCase()} `))} - ${this.format(message)}`, ...args);
	}

	private format(message: string) {
		let words = message.split(' ');
		words = words.map((w) => (!isNaN(Number(w)) || w.match(/\d+m?s/gm) ? blueBright(w) : w));
		message = words.join(' ');
		message = message.replace(/\[.+ => \w+\s?\d?\]/, cyan);
		return whiteBright(message);
	}
}

type LogLevelString = 'info' | 'warn' | 'error' | 'debug';

const enum LogLevel {
	Error = 0,
	Warn = 1,
	Info = 2,
	Debug = 3
}

const verbose = process.argv.includes('--verbose');
export const logger = new Logger().setLevel(verbose ? LogLevel.Debug : LogLevel.Info);
