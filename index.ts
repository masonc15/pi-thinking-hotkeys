import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	isThinkingLevel,
	nextThinkingLevel,
	rankThinkingLevel,
	supportedThinkingLevelsFromModel,
	type ThinkingDirection,
	type ThinkingLevel,
} from "./thinking-levels.js";

export interface MinimalPiApi {
	getThinkingLevel(): unknown;
	setThinkingLevel(level: ThinkingLevel): void;
}

export interface MinimalUiContext {
	notify(message: string, type?: "info" | "warning" | "error"): void;
	setStatus(id: string, text: string | undefined): void;
}

export interface MinimalThinkingContext {
	model: unknown;
	isIdle(): boolean;
	ui: MinimalUiContext;
}

const STATUS_ID = "thinking-hotkeys";

function notify(ctx: MinimalThinkingContext, message: string, type: "info" | "warning" | "error" = "info"): void {
	ctx.ui.notify(message, type);
}

function setThinkingStatus(ctx: MinimalThinkingContext, level: string): void {
	ctx.ui.setStatus(STATUS_ID, `thinking: ${level}`);
}

function isClampAllowed(before: ThinkingLevel, after: ThinkingLevel, direction: ThinkingDirection): boolean {
	if (direction === "up") return rankThinkingLevel(after) >= rankThinkingLevel(before);
	return rankThinkingLevel(after) <= rankThinkingLevel(before);
}

function directionLabel(direction: ThinkingDirection): string {
	return direction === "up" ? "higher" : "lower";
}

function boundLabel(direction: ThinkingDirection): string {
	return direction === "up" ? "maximum" : "minimum";
}

export async function stepThinkingForTest(
	pi: MinimalPiApi,
	ctx: MinimalThinkingContext,
	direction: ThinkingDirection,
): Promise<void> {
	const beforeRaw = pi.getThinkingLevel();
	if (!isThinkingLevel(beforeRaw)) {
		notify(ctx, "Current thinking level is unknown; not changing it.", "warning");
		return;
	}

	const before = beforeRaw;
	if (!ctx.model) {
		notify(ctx, "Thinking shortcuts are unavailable until a model is selected.", "info");
		return;
	}

	const available = supportedThinkingLevelsFromModel(ctx.model);
	if (!available || available.length === 0) {
		notify(ctx, "No supported thinking levels were found for this model.", "warning");
		return;
	}

	if (available.length === 1 && available[0] === "off") {
		if (before !== "off") pi.setThinkingLevel("off");
		setThinkingStatus(ctx, "off");
		notify(ctx, "Current model does not support thinking; thinking is off.", "info");
		return;
	}

	const target = nextThinkingLevel(before, available, direction);
	if (!target) {
		setThinkingStatus(ctx, before);
		notify(ctx, `Thinking is already at the ${boundLabel(direction)}: ${before}.`, "info");
		return;
	}

	pi.setThinkingLevel(target);

	const afterRaw = pi.getThinkingLevel();
	if (!isThinkingLevel(afterRaw)) {
		notify(ctx, `Requested thinking level ${target}, but Pi reported an unknown result.`, "warning");
		return;
	}

	const after = afterRaw;
	if (after !== target && !isClampAllowed(before, after, direction)) {
		pi.setThinkingLevel(before);
		const restoredRaw = pi.getThinkingLevel();
		const restored = isThinkingLevel(restoredRaw) ? restoredRaw : before;
		setThinkingStatus(ctx, restored);
		notify(
			ctx,
			`Pi clamped ${target} to ${after}, which is not a ${directionLabel(direction)} level; restored ${restored}.`,
			"warning",
		);
		return;
	}

	setThinkingStatus(ctx, after);
	const suffix = ctx.isIdle() ? "" : " for the next turn";
	if (after === target) {
		notify(ctx, `Thinking level${suffix}: ${after}.`, "info");
	} else {
		notify(ctx, `Thinking level${suffix}: ${after} requested ${target}, clamped by model.`, "info");
	}
}

export default function thinkingHotkeysExtension(pi: ExtensionAPI): void {
	pi.registerShortcut("alt+,", {
		description: "Decrease thinking level",
		handler: async (ctx: ExtensionContext) => stepThinkingForTest(pi, ctx, "down"),
	});

	pi.registerShortcut("alt+.", {
		description: "Increase thinking level",
		handler: async (ctx: ExtensionContext) => stepThinkingForTest(pi, ctx, "up"),
	});

	pi.on("thinking_level_select", (event, ctx) => {
		setThinkingStatus(ctx, event.level);
	});

	pi.on("model_select", (_event, ctx) => {
		setThinkingStatus(ctx, String(pi.getThinkingLevel()));
	});

	pi.on("session_start", (_event, ctx) => {
		setThinkingStatus(ctx, String(pi.getThinkingLevel()));
	});
}
