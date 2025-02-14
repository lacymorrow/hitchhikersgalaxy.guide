import { type PlayerRef } from "@remotion/player";
import { type RefObject, useEffect, useState } from "react";

export const useCurrentPlayerFrame = (
	playerRef: RefObject<PlayerRef | null>,
) => {
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		const player = playerRef.current;
		if (!player) return;

		const interval = setInterval(() => {
			setFrame(player.getCurrentFrame());
		}, 1000 / 60); // 60fps update rate

		return () => clearInterval(interval);
	}, [playerRef]);

	return frame;
};
