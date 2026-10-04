/**
 *
 *	@Project: @cldmv/uuid
 *	@Filename: /tests/types/consumer.test.mjs
 *	@Date: 2026-10-03T17:37:05-07:00 (1791074225)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-03T17:44:07-07:00 (1791074647)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Consumer type-check tests. These run under Node's own test runner (`node --test`), not
 * Vitest: they pack the package with `npm pack`, unpack the tarball into a throwaway
 * consumer project, and compile TypeScript fixtures that import it by name with
 * `moduleResolution: nodenext`, `strict: true` and no `skipLibCheck`. That is what a
 * TypeScript user installing the published package sees, so it catches a missing `types`
 * condition (the import silently becomes `any`) as well as declarations that do not
 * compile or describe the API wrongly.
 *
 * Needs a build first (`npm run build`): the published declarations live in types/dist/.
 * `npm run test:types` builds and then runs this file.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tscBin = require.resolve("typescript/bin/tsc");
// Inside the repo's gitignored tmp/ so the consumer can find @types/node in the repo's
// node_modules (TypeScript walks up the tree for type roots), while @cldmv/uuid itself
// resolves to the unpacked tarball in the consumer's own node_modules.
const workDir = path.join(repoRoot, "tmp", `types-consumer-${process.pid}`);
const consumerDir = path.join(workDir, "consumer");

/**
 * Write a tsconfig for one fixture and compile it.
 * @param {string} name - Fixture name, used for the tsconfig file name.
 * @param {string[]} files - Fixture files to compile.
 * @param {string[]} types - Global type packages to load (`[]` = none, not even @types/node).
 * @param {object} [extra] - Additional compiler options.
 * @returns {{ status: number|null, output: string }} tsc exit status and combined output.
 */
function compile(name, files, types, extra = {}) {
	const tsconfig = path.join(consumerDir, `tsconfig.${name}.json`);
	writeFileSync(
		tsconfig,
		JSON.stringify(
			{
				compilerOptions: {
					strict: true,
					module: "nodenext",
					moduleResolution: "nodenext",
					target: "es2022",
					lib: ["es2022"],
					types,
					noEmit: true,
					skipLibCheck: false,
					...extra
				},
				files
			},
			null,
			"\t"
		)
	);
	const res = spawnSync(process.execPath, [tscBin, "-p", tsconfig, "--pretty", "false"], { cwd: consumerDir, encoding: "utf8" });
	return { status: res.status, output: `${res.stdout}${res.stderr}` };
}

before(() => {
	for (const built of ["dist/uuid.mjs", "types/dist/uuid.d.mts"]) {
		assert.ok(existsSync(path.join(repoRoot, built)), `${built} is missing; run \`npm run build\` first (or use \`npm run test:types\`)`);
	}

	rmSync(workDir, { recursive: true, force: true });
	const pkgDir = path.join(consumerDir, "node_modules", "@cldmv", "uuid");
	mkdirSync(pkgDir, { recursive: true });

	const pack = spawnSync("npm", ["pack", "--pack-destination", workDir], {
		cwd: repoRoot,
		encoding: "utf8",
		shell: process.platform === "win32"
	});
	assert.equal(pack.status, 0, `npm pack failed:\n${pack.stderr}`);
	// workDir was emptied above, so the tarball npm just wrote is the only .tgz in it.
	const [filename] = readdirSync(workDir).filter((file) => file.endsWith(".tgz"));
	assert.ok(filename, `npm pack wrote no tarball:\n${pack.stdout}`);

	const untar = spawnSync("tar", ["-xzf", path.join(workDir, filename), "-C", pkgDir, "--strip-components=1"], { encoding: "utf8" });
	assert.equal(untar.status, 0, `tar failed:\n${untar.stderr}`);

	writeFileSync(path.join(consumerDir, "package.json"), JSON.stringify({ name: "uuid-types-consumer", private: true, type: "module" }));

	writeFileSync(
		path.join(consumerDir, "main.mts"),
		`import UUIDDefault, { UUID, uuid, ISSUER_CATEGORIES } from "@cldmv/uuid";
import { UUID as MainUUID, uuid as mainUuid, ISSUER_CATEGORIES as MAIN_CATEGORIES } from "@cldmv/uuid/main";

// The default export, the named exports and the ./main subpath are all the same class.
const same: typeof UUID = UUIDDefault;
const sameLower: typeof UUID = uuid;
const sameMain: typeof UUID = MainUUID;
const sameMainLower: typeof UUID = mainUuid;

// RFC generators: options are optional, and passing a buffer returns the buffer.
const v1: string = UUID.v1();
const v4: string = UUID.v4();
const v4Random: string = UUID.v4({ random: new Uint8Array(16) });
const v4Buf: Uint8Array = UUID.v4({ buf: new Uint8Array(16), offset: 0 });
const v6: string = UUID.v6({ msecs: Date.now() });
const v7: string = UUID.v7();
const v8: string = UUID.v8({ data: new Uint8Array(16) });
const v1Node: string = UUID.v1({ node: [1, 2, 3, 4, 5, 6], clockseq: 0 });
const v3: string = UUID.v3("example.com", UUID.DNS);
const v5: string = UUID.v5("https://example.com", UUID.URL);
const nil: string = UUID.NIL;
const parsed: Uint8Array = UUID.parse(v4);
const text: string = UUID.stringify(parsed);
const fromArray: string = UUID.stringify(Array.from(parsed));
const valid: boolean = UUID.validateRFC(v4);
const rfcVersion: string | number | null = UUID.version(v4);

// Custom variants: the timestamp argument is optional.
const ta: UUID = UUID.TA();
const tb: UUID = UUID.TB(new Date());
const ia: UUID = UUID.IA(ISSUER_CATEGORIES.SPEC_ORIGINATOR);
const viaTimestamp: UUID = UUID.createTimestampVariant(undefined, 2);
const viaIssuer: UUID = UUID.createIssuerVariant(MAIN_CATEGORIES.UNASSIGNED, 1, new Uint8Array(16));
const instance = new UUID();
const fromString = new UUID(ta.toString());
const ts: number | null = tb.getTimestamp();
const issuerID: number | null = ia.getIssuerID();
const bytes: Uint8Array = ta.toBuffer();
const asString: string = \`\${ta}\`;
const json: string = JSON.stringify({ id: ta });
const category: number = ISSUER_CATEGORIES.UNASSIGNED;

// Registry and validation helpers.
const registry = await UUID.getRegistry();
const available: boolean = registry.isAvailable(300);
const info = await UUID.getIssuerInfo(1);
const report = await UUID.validate(ta.toBuffer());

export {
	same, sameLower, sameMain, sameMainLower, v1, v4, v4Random, v4Buf, v6, v7, v8, v1Node, v3, v5, nil, parsed,
	text, fromArray, valid, rfcVersion, ta, tb, ia, viaTimestamp, viaIssuer, instance, fromString, ts, issuerID,
	bytes, asString, json, category, available, info, report
};
`
	);

	writeFileSync(
		path.join(consumerDir, "subpaths.mts"),
		`import { randomBytes } from "@cldmv/uuid/rng";
import { fromHex, toHex, toBufferLike } from "@cldmv/uuid/bytes";
import { md5, sha1 } from "@cldmv/uuid/hash";

const random: Uint8Array = randomBytes(16);
const hex: string = toHex(random);
const back: Uint8Array = fromHex(hex);
const copy: Uint8Array = toBufferLike(back);
const md5Digest: Uint8Array = md5(random, "name");
const sha1Digest: Uint8Array = sha1(random, "name");

export { random, hex, back, copy, md5Digest, sha1Digest };
`
	);

	// The README's TypeScript example, verbatim, so the documented types stay true.
	const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
	const example = /TypeScript Support\n[\s\S]*?```typescript\n([\s\S]*?)```/.exec(readme);
	assert.ok(example, "README.md has no ```typescript block under its TypeScript Support heading");
	writeFileSync(path.join(consumerDir, "readme.mts"), `${example[1]}\nexport {};\n`);

	writeFileSync(
		path.join(consumerDir, "wrong.mts"),
		`import { UUID } from "@cldmv/uuid";

const n: number = UUID.v4();

export { n };
`
	);
});

after(() => {
	rmSync(workDir, { recursive: true, force: true });
});

test("the main entry and ./main type-check without @types/node", () => {
	// types: [] keeps @types/node out, so this also shows the UUID declarations do not
	// depend on Node-only globals such as Buffer (the package also runs in browsers).
	const { status, output } = compile("main", ["main.mts"], []);
	assert.equal(status, 0, output);
});

test("the README TypeScript example type-checks", () => {
	// noUnusedLocals is off by default, so the example's unused bindings are fine.
	const { status, output } = compile("readme", ["readme.mts"], []);
	assert.equal(status, 0, output);
});

test("the ./rng, ./bytes and ./hash subpaths type-check", () => {
	// The Node variants of these modules return Buffers, so they need @types/node like any
	// other Node-only declaration.
	const { status, output } = compile("subpaths", ["subpaths.mts"], ["node"]);
	assert.equal(status, 0, output);
});

test("the browser variants of ./rng, ./bytes and ./hash type-check without @types/node", () => {
	// With the "browser" condition the browser declarations are picked, which return plain
	// Uint8Arrays and must not need Node's globals.
	const { status, output } = compile("browser", ["subpaths.mts"], [], { customConditions: ["browser"] });
	assert.equal(status, 0, output);
});

test("a wrong assignment from UUID.v4() fails to compile", () => {
	// If UUID were `any` (no types condition on ./main), this would compile.
	const { status, output } = compile("wrong", ["wrong.mts"], []);
	assert.notEqual(status, 0, "expected tsc to reject assigning UUID.v4() to a number");
	assert.match(output, /wrong\.mts\(3,7\): error TS2322: Type 'string' is not assignable to type 'number'\./);
	// The only error is the deliberate one, not a problem in the package's own declarations.
	assert.equal(output.trim().split("\n").filter((line) => /error TS\d+/.test(line)).length, 1, output);
});
