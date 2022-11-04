export function getGenre(given: string[]) {
	const main = ['Pop', 'Rock', 'Hip Hop', 'Latin', 'Dance', 'R&B', 'Classical', 'Folk', 'Metal', 'Rap', 'K-Pop'];
	return main.find((g) => given.some((r) => r.toUpperCase() === g.toUpperCase())) ?? toTitleCase(given[0]);
}
function toTitleCase(str?: string) {
	return str?.replace(/\w\S*/g, (txt) => {
		return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
	});
}
