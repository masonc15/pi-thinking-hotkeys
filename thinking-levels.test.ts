import { describe, expect, it } from "vitest";
import thinkingHotkeysExtension, { stepThinkingForTest, type MinimalThinkingContext, type MinimalPiApi } from "./index.js";
import {
	THINKING_LEVELS,
	isThinkingLevel,
	nextThinkingLevel,
	rankThinkingLevel,
	supportedThinkingLevelsFromModel,
	type ThinkingLevel,
} from "./thinking-levels.js";

describe("thinking level helpers", () => {
	it("defines the canonical Pi/Codex ordering", () => {
		expect(THINKING_LEVELS).toEqual(["off", "minimal", "low", "medium", "high", "xhigh"]);
		expect(rankThinkingLevel("off")).toBeLessThan(rankThinkingLevel("minimal"));
		expect(rankThinkingLevel("minimal")).toBeLessThan(rankThinkingLevel("low"));
		expect(rankThinkingLevel("low")).toBeLessThan(rankThinkingLevel("medium"));
		expect(rankThinkingLevel("medium")).toBeLessThan(rankThinkingLevel("high"));
		expect(rankThinkingLevel("high")).toBeLessThan(rankThinkingLevel("xhigh"));
	});

	it("validates known thinking levels", () => {
		expect(isThinkingLevel("off")).toBe(true);
		expect(isThinkingLevel("xhigh")).toBe(true);
		expect(isThinkingLevel("maximum")).toBe(false);
		expect(isThinkingLevel(undefined)).toBe(false);
	});

	it("steps up and down without wrapping", () => {
		expect(nextThinkingLevel("off", THINKING_LEVELS, "up")).toBe("minimal");
		expect(nextThinkingLevel("minimal", THINKING_LEVELS, "up")).toBe("low");
		expect(nextThinkingLevel("high", THINKING_LEVELS, "down")).toBe("medium");
		expect(nextThinkingLevel("off", THINKING_LEVELS, "down")).toBeUndefined();
		expect(nextThinkingLevel("xhigh", THINKING_LEVELS, "up")).toBeUndefined();
	});

	it("skips unsupported levels", () => {
		const available = ["off", "high", "xhigh"] as const;
		expect(nextThinkingLevel("off", available, "up")).toBe("high");
		expect(nextThinkingLevel("high", available, "up")).toBe("xhigh");
		expect(nextThinkingLevel("xhigh", available, "down")).toBe("high");
		expect(nextThinkingLevel("high", available, "down")).toBe("off");
	});

	it("moves from an unsupported current level in the requested direction", () => {
		const available = ["off", "high", "xhigh"] as const;
		expect(nextThinkingLevel("medium", available, "up")).toBe("high");
		expect(nextThinkingLevel("medium", available, "down")).toBe("off");
	});

	it("returns undefined for a single available level at both bounds", () => {
		expect(nextThinkingLevel("high", ["high"], "up")).toBeUndefined();
		expect(nextThinkingLevel("high", ["high"], "down")).toBeUndefined();
	});

	it("returns undefined for no available levels", () => {
		expect(nextThinkingLevel("medium", [], "up")).toBeUndefined();
		expect(nextThinkingLevel("medium", [], "down")).toBeUndefined();
	});

	it("treats missing or unknown model as unavailable", () => {
		expect(supportedThinkingLevelsFromModel(undefined)).toBeUndefined();
		expect(supportedThinkingLevelsFromModel(null)).toBeUndefined();
		expect(supportedThinkingLevelsFromModel("model")).toBeUndefined();
	});

	it("returns off only for non-reasoning models", () => {
		expect(supportedThinkingLevelsFromModel({ reasoning: false })).toEqual(["off"]);
		expect(supportedThinkingLevelsFromModel({})).toEqual(["off"]);
	});

	it("returns all levels for reasoning models without a map", () => {
		expect(supportedThinkingLevelsFromModel({ reasoning: true })).toEqual(THINKING_LEVELS);
	});

	it("excludes null thinkingLevelMap entries and includes omitted entries", () => {
		expect(
			supportedThinkingLevelsFromModel({
				reasoning: true,
				thinkingLevelMap: {
					minimal: null,
					low: null,
					medium: null,
					high: "high",
					xhigh: "max",
				},
			}),
		).toEqual(["off", "high", "xhigh"]);
	});

	it("supports models that cannot disable thinking", () => {
		expect(
			supportedThinkingLevelsFromModel({
				reasoning: true,
				thinkingLevelMap: {
					off: null,
					minimal: null,
					low: null,
					medium: "medium",
					high: "high",
				},
			}),
		).toEqual(["medium", "high", "xhigh"]);
	});
});

describe("extension step handler", () => {
	function createContext(model: unknown, idle = true) {
		const notifications: Array<{ message: string; type?: "info" | "warning" | "error" }> = [];
		const statusCalls: Array<{ id: string; text: string | undefined }> = [];
		const ctx = {
			model,
			isIdle: () => idle,
			ui: {
				notify: (message: string, type?: "info" | "warning" | "error") => {
					notifications.push(type === undefined ? { message } : { message, type });
				},
				setStatus: (id: string, text: string | undefined) => {
					statusCalls.push({ id, text });
				},
			},
		} as MinimalThinkingContext;
		return { notifications, statusCalls, ctx };
	}

	function createPi(initial: string, clamp?: (level: ThinkingLevel) => ThinkingLevel) {
		let level = initial;
		const calls: ThinkingLevel[] = [];
		const pi: MinimalPiApi = {
			getThinkingLevel: () => level,
			setThinkingLevel: (next: ThinkingLevel) => {
				calls.push(next);
				level = clamp ? clamp(next) : next;
			},
		};
		return { calls, pi };
	}

	it("increases to the next supported level", async () => {
		const runtime = createPi("low");
		const context = createContext({ reasoning: true });

		await stepThinkingForTest(runtime.pi, context.ctx, "up");

		expect(runtime.calls).toEqual(["medium"]);
		expect(context.statusCalls).toEqual([]);
		expect(context.notifications.at(-1)?.message).toBe("Thinking level: medium.");
	});

	it("decreases to the next supported level", async () => {
		const runtime = createPi("high");
		const context = createContext({ reasoning: true });

		await stepThinkingForTest(runtime.pi, context.ctx, "down");

		expect(runtime.calls).toEqual(["medium"]);
		expect(context.statusCalls).toEqual([]);
	});

	it("does not wrap at the minimum", async () => {
		const runtime = createPi("off");
		const context = createContext({ reasoning: true });

		await stepThinkingForTest(runtime.pi, context.ctx, "down");

		expect(runtime.calls).toEqual([]);
		expect(context.notifications.at(-1)?.message).toBe("Thinking is already at the minimum: off.");
	});

	it("does not wrap at the maximum", async () => {
		const runtime = createPi("xhigh");
		const context = createContext({ reasoning: true });

		await stepThinkingForTest(runtime.pi, context.ctx, "up");

		expect(runtime.calls).toEqual([]);
		expect(context.notifications.at(-1)?.message).toBe("Thinking is already at the maximum: xhigh.");
	});

	it("skips unsupported levels according to thinkingLevelMap", async () => {
		const runtime = createPi("off");
		const context = createContext({
			reasoning: true,
			thinkingLevelMap: {
				minimal: null,
				low: null,
				medium: null,
				high: "high",
				xhigh: "max",
			},
		});

		await stepThinkingForTest(runtime.pi, context.ctx, "up");

		expect(runtime.calls).toEqual(["high"]);
		expect(context.statusCalls).toEqual([]);
	});

	it("moves unsupported current levels in the requested direction", async () => {
		const runtime = createPi("medium");
		const context = createContext({
			reasoning: true,
			thinkingLevelMap: {
				minimal: null,
				low: null,
				medium: null,
				high: "high",
				xhigh: "max",
			},
		});

		await stepThinkingForTest(runtime.pi, context.ctx, "up");

		expect(runtime.calls).toEqual(["high"]);
	});

	it("forces non-reasoning models to off", async () => {
		const runtime = createPi("high");
		const context = createContext({ reasoning: false });

		await stepThinkingForTest(runtime.pi, context.ctx, "down");

		expect(runtime.calls).toEqual(["off"]);
		expect(context.notifications.at(-1)?.message).toBe("Current model does not support thinking; thinking is off.");
	});

	it("reports Pi clamp read-back", async () => {
		const runtime = createPi("high", (requested) => (requested === "xhigh" ? "high" : requested));
		const context = createContext({ reasoning: true });

		await stepThinkingForTest(runtime.pi, context.ctx, "up");

		expect(runtime.calls).toEqual(["xhigh"]);
		expect(context.notifications.at(-1)?.message).toBe("Thinking level: high requested xhigh, clamped by model.");
	});

	it("restores the previous level on a wrong-direction clamp", async () => {
		const runtime = createPi("medium", (requested) => (requested === "high" ? "low" : requested));
		const context = createContext({ reasoning: true });

		await stepThinkingForTest(runtime.pi, context.ctx, "up");

		expect(runtime.calls).toEqual(["high", "medium"]);
		expect(context.notifications.at(-1)?.type).toBe("warning");
		expect(context.notifications.at(-1)?.message).toBe(
			"Pi clamped high to low, which is not a higher level; restored medium.",
		);
	});

	it("phrases in-flight changes as next-turn changes", async () => {
		const runtime = createPi("low");
		const context = createContext({ reasoning: true }, false);

		await stepThinkingForTest(runtime.pi, context.ctx, "up");

		expect(context.notifications.at(-1)?.message).toBe("Thinking level for the next turn: medium.");
	});

	it("does not mutate when no model is selected", async () => {
		const runtime = createPi("low");
		const context = createContext(undefined);

		await stepThinkingForTest(runtime.pi, context.ctx, "up");

		expect(runtime.calls).toEqual([]);
		expect(context.notifications.at(-1)?.message).toBe(
			"Thinking shortcuts are unavailable until a model is selected.",
		);
	});
});

describe("extension registration", () => {
	it("registers the Codex-style Alt comma and Alt period shortcuts", () => {
		const shortcuts: Array<{ shortcut: string; description: string }> = [];
		const events: string[] = [];
		const fakePi = {
			registerShortcut: (shortcut: string, options: { description: string }) => {
				shortcuts.push({ shortcut, description: options.description });
			},
			on: (event: string) => {
				events.push(event);
			},
			getThinkingLevel: () => "off",
			setThinkingLevel: () => undefined,
		};

		thinkingHotkeysExtension(fakePi as never);

		expect(shortcuts).toEqual([
			{ shortcut: "alt+,", description: "Decrease thinking level" },
			{ shortcut: "alt+.", description: "Increase thinking level" },
		]);
		expect(events).toEqual([]);
	});
});
