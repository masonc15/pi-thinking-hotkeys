import { matchesKey, parseKey, setKittyProtocolActive } from "@mariozechner/pi-tui";

const cases = [
	{
		name: "legacy ESC comma",
		data: "\x1b,",
		key: "alt+,",
		kitty: false,
		expectedMatches: false,
		expectedParsed: undefined,
	},
	{
		name: "legacy ESC period",
		data: "\x1b.",
		key: "alt+.",
		kitty: false,
		expectedMatches: false,
		expectedParsed: undefined,
	},
	{
		name: "modifyOtherKeys comma",
		data: "\x1b[27;3;44~",
		key: "alt+,",
		kitty: false,
		expectedMatches: true,
		expectedParsed: "alt+,",
	},
	{
		name: "modifyOtherKeys period",
		data: "\x1b[27;3;46~",
		key: "alt+.",
		kitty: false,
		expectedMatches: true,
		expectedParsed: "alt+.",
	},
	{
		name: "kitty comma",
		data: "\x1b[44;3u",
		key: "alt+,",
		kitty: true,
		expectedMatches: true,
		expectedParsed: "alt+,",
	},
	{
		name: "kitty period",
		data: "\x1b[46;3u",
		key: "alt+.",
		kitty: true,
		expectedMatches: true,
		expectedParsed: "alt+.",
	},
	{
		name: "legacy ESC a",
		data: "\x1ba",
		key: "alt+a",
		kitty: false,
		expectedMatches: true,
		expectedParsed: "alt+a",
	},
];

let failures = 0;

for (const testCase of cases) {
	setKittyProtocolActive(testCase.kitty);
	const matches = matchesKey(testCase.data, testCase.key);
	const parsed = parseKey(testCase.data);
	const ok = matches === testCase.expectedMatches && parsed === testCase.expectedParsed;

	console.log(`${ok ? "✓" : "✗"} ${testCase.name}: matches=${String(matches)} parsed=${String(parsed)}`);

	if (!ok) failures += 1;
}

setKittyProtocolActive(false);

if (failures > 0) {
	console.error(`${failures} key parser diagnostic case(s) did not match expectations.`);
	process.exit(1);
}
