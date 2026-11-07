import base from "@cldmv/configs/prettier.json" with { type: "json" };

// No .jsonv files in this repository, so the jsonv plugin and its override are dropped.
export default {
	...base,
	plugins: [],
	overrides: base.overrides.filter((entry) => entry.files !== "*.jsonv")
};
