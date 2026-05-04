export const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"] as const;

export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
export type ThinkingDirection = "down" | "up";

export interface ModelLike {
	reasoning?: unknown;
	thinkingLevelMap?: Partial<Record<ThinkingLevel, string | null>>;
}

const THINKING_LEVEL_RANK: Record<ThinkingLevel, number> = {
	off: 0,
	minimal: 1,
	low: 2,
	medium: 3,
	high: 4,
	xhigh: 5,
};

export function isThinkingLevel(value: unknown): value is ThinkingLevel {
	return typeof value === "string" && (THINKING_LEVELS as readonly string[]).includes(value);
}

export function rankThinkingLevel(level: ThinkingLevel): number {
	return THINKING_LEVEL_RANK[level];
}

export function supportedThinkingLevelsFromModel(model: unknown): ThinkingLevel[] | undefined {
	if (!model || typeof model !== "object") return undefined;

	const candidate = model as ModelLike;
	if (!candidate.reasoning) return ["off"];

	const map = candidate.thinkingLevelMap;
	if (!map) return [...THINKING_LEVELS];

	return THINKING_LEVELS.filter((level) => map[level] !== null);
}

export function nextThinkingLevel(
	current: ThinkingLevel,
	available: readonly ThinkingLevel[],
	direction: ThinkingDirection,
): ThinkingLevel | undefined {
	const availableSet = new Set(available);
	const sorted = THINKING_LEVELS.filter((level) => availableSet.has(level));
	const currentRank = rankThinkingLevel(current);

	if (direction === "up") {
		return sorted.find((level) => rankThinkingLevel(level) > currentRank);
	}

	for (let index = sorted.length - 1; index >= 0; index -= 1) {
		const level = sorted[index];
		if (level && rankThinkingLevel(level) < currentRank) return level;
	}

	return undefined;
}
