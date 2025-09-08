import * as migration_20250821_162815 from "./20250821_162815";

export const migrations = [
	{
		up: migration_20250821_162815.up,
		down: migration_20250821_162815.down,
		name: "20250821_162815",
	},
];
