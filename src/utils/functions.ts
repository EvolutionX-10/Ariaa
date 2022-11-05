export async function wait(ms: number) {
	return (await import('node:util')).promisify(setTimeout)(ms);
}
