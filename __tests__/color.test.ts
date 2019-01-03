import * as C from "../src/color";
import * as Utils from "../src/utils";
import { Result } from "safe-types";

interface ColorTable {
	color: string;
	hex: string;
	rgb: Utils.ColorTuple;
	hsl: Utils.ColorTuple;
}

const color_tables: ColorTable[] = [
	{
		color: "Black",
		hex: "#000000",
		rgb: [0, 0, 0],
		hsl: [0, 0, 0],
	},
	{
		color: "White",
		hex: "#FFFFFF",
		rgb: [255, 255, 255],
		hsl: [0, 0, 100],
	},
	{
		color: "Red",
		hex: "#FF0000",
		rgb: [255, 0, 0],
		hsl: [0, 100, 50],
	},
	{
		color: "Lime",
		hex: "#00FF00",
		rgb: [0, 255, 0],
		hsl: [120, 100, 50],
	},
	{
		color: "Blue",
		hex: "#0000FF",
		rgb: [0, 0, 255],
		hsl: [240, 100, 50],
	},
	{
		color: "Yellow",
		hex: "#FFFF00",
		rgb: [255, 255, 0],
		hsl: [60, 100, 50],
	},
	{
		color: "Cyan",
		hex: "#00FFFF",
		rgb: [0, 255, 255],
		hsl: [180, 100, 50],
	},
	{
		color: "Magenta",
		hex: "#FF00FF",
		rgb: [255, 0, 255],
		hsl: [300, 100, 50],
	},
	{
		color: "Silver",
		hex: "#C0C0C0",
		rgb: [192, 192, 192],
		hsl: [0, 0, 75],
	},
	{
		color: "Gray",
		hex: "#808080",
		rgb: [128, 128, 128],
		hsl: [0, 0, 50],
	},
	{
		color: "Maroon",
		hex: "#800000",
		rgb: [128, 0, 0],
		hsl: [0, 100, 25],
	},
	{
		color: "Olive",
		hex: "#808000",
		rgb: [128, 128, 0],
		hsl: [60, 100, 25],
	},
	{
		color: "Green",
		hex: "#008000",
		rgb: [0, 128, 0],
		hsl: [120, 100, 25],
	},
	{
		color: "Purple",
		hex: "#800080",
		rgb: [128, 0, 128],
		hsl: [300, 100, 25],
	},
	{
		color: "Teal",
		hex: "#008080",
		rgb: [0, 128, 128],
		hsl: [180, 100, 25],
	},
	{
		color: "Navy",
		hex: "#000080",
		rgb: [0, 0, 128],
		hsl: [240, 100, 25],
	},
];

describe("parseHexString", async () => {
	it("should return Ok with valid cases", async () => {
		let tt = [
			// Lowercase
			{ in: "ffffff", out: Result.Ok([0xff, 0xff, 0xff]) },
			{ in: "#ffffff", out: Result.Ok([0xff, 0xff, 0xff]) },
			{ in: "fff", out: Result.Ok([0xff, 0xff, 0xff]) },
			{ in: "#fff", out: Result.Ok([0xff, 0xff, 0xff]) },
			{ in: "#a0c", out: Result.Ok([0xaa, 0x00, 0xcc]) },
			{ in: "bada55", out: Result.Ok([0xba, 0xda, 0x55]) },

			// Uppercase
			{ in: "FFFFFF", out: Result.Ok([0xff, 0xff, 0xff]) },
			{ in: "#FFFFFF", out: Result.Ok([0xff, 0xff, 0xff]) },
			{ in: "FFF", out: Result.Ok([0xff, 0xff, 0xff]) },
			{ in: "#FFF", out: Result.Ok([0xff, 0xff, 0xff]) },
			{ in: "#A0C", out: Result.Ok([0xaa, 0x00, 0xcc]) },
			{ in: "BADA55", out: Result.Ok([0xba, 0xda, 0x55]) },
		];

		for (let tc of tt) {
			expect(Utils.parseHexString(tc.in)).toEqual(tc.out);
		}
	});

	it("should return Err with invalid cases", async () => {
		let tt = [
			{ in: "fffff", out: Result.Err(Utils.ColorErrors.InvalidLength) },
			{ in: "ffff", out: Result.Err(Utils.ColorErrors.InvalidLength) },
			{ in: "ff", out: Result.Err(Utils.ColorErrors.InvalidLength) },
			{ in: "f", out: Result.Err(Utils.ColorErrors.InvalidLength) },
			{ in: "", out: Result.Err(Utils.ColorErrors.InvalidLength) },

			{ in: "ghijkl", out: Result.Err(Utils.ColorErrors.InvalidChars) },
			{ in: "abcdeg", out: Result.Err(Utils.ColorErrors.InvalidChars) },
			{ in: "      ", out: Result.Err(Utils.ColorErrors.InvalidChars) },
		];

		for (let tc of tt) {
			expect(Utils.parseHexString(tc.in)).toEqual(tc.out);
		}
	});
});

describe("rgbToHSL", async () => {
	it("should return Ok", async () => {
		let tt = [...color_tables];

		expect.assertions(tt.length);
		for (let tc of tt) {
			Utils.rgbToHSL(...tc.rgb).match({
				Ok: hsl => {
					// For a better failure message
					expect({ ...tc, hsl }).toEqual(tc);
				},
				Err: err => {
					console.error(err, tc);
					throw new Error(
						`Expected ${tc.color} to be ${tc.hsl.join(", ")}`
					);
				},
			});
		}
	});

	it("should return Err", async () => {
		let tt: Array<{
			in: Utils.ColorTuple;
			out: Result<Utils.ColorTuple, Utils.ColorParseError>;
		}> = [
			{
				in: [0, 0, 256],
				out: Result.Err(Utils.ColorErrors.InvalidRange),
			},
			{
				in: [0, 0, 255.001],
				out: Result.Err(Utils.ColorErrors.InvalidRange),
			},
			{
				in: [0, NaN, 255],
				out: Result.Err(Utils.ColorErrors.NaN),
			},
		];

		for (let tc of tt) {
			expect(Utils.rgbToHSL(...tc.in)).toEqual(tc.out);
		}
	});
});

describe("hslToRGB", async () => {
	it("should return Ok", async () => {
		let tt = [...color_tables];

		expect.assertions(tt.length);
		for (let tc of tt) {
			Utils.hslToRGB(...tc.hsl).match({
				Ok: rgb => {
					// The formula isn't perfect in both directions.
					// This color is 1 off.
					if (tc.color === "Silver") {
						expect({ ...tc, rgb }).toEqual({
							...tc,
							rgb: tc.rgb.map(n => n - 1),
						});
						return;
					}
					// For a better failure message
					expect({ ...tc, rgb }).toEqual(tc);
				},
				Err: err => {
					console.error(err, tc);
					throw new Error(
						`Expected ${tc.color} to be ${tc.rgb.join(", ")}`
					);
				},
			});
		}
	});

	it("should return Err", async () => {
		let tt: Array<{
			in: Utils.ColorTuple;
			out: Result<Utils.ColorTuple, Utils.ColorParseError>;
		}> = [
			{
				in: [0, 0, 101],
				out: Result.Err(Utils.ColorErrors.InvalidRange),
			},
			{
				in: [0, 0, -1],
				out: Result.Err(Utils.ColorErrors.InvalidRange),
			},
			{
				in: [0, 101, 10],
				out: Result.Err(Utils.ColorErrors.InvalidRange),
			},
			{
				in: [0, -1, 10],
				out: Result.Err(Utils.ColorErrors.InvalidRange),
			},
			{
				in: [-1, 0, 0],
				out: Result.Err(Utils.ColorErrors.InvalidRange),
			},
			{
				in: [361, 0, 0],
				out: Result.Err(Utils.ColorErrors.InvalidRange),
			},
			{
				in: [NaN, 0, 0],
				out: Result.Err(Utils.ColorErrors.NaN),
			},
			{
				in: [0, NaN, 0],
				out: Result.Err(Utils.ColorErrors.NaN),
			},
			{
				in: [0, 0, NaN],
				out: Result.Err(Utils.ColorErrors.NaN),
			},
		];

		for (let tc of tt) {
			expect(Utils.hslToRGB(...tc.in)).toEqual(tc.out);
		}
	});
});

describe("Hex", async () => {
	it("should work", async () => {
		let tt = [...color_tables];

		for (let tc of tt) {
			let c = new C.Hex(tc.hex);
			let rgb = c.toRGB();
			let hsl = c.toHSL();

			expect([rgb.r, rgb.g, rgb.b]).toEqual(tc.rgb);
			expect([hsl.h, hsl.s, hsl.l]).toEqual(tc.hsl);
		}
	});
});

describe("RGB", async () => {
	it("should work", async () => {
		let tt = [...color_tables];

		for (let tc of tt) {
			let c = new C.RGB(...tc.rgb);
			let hex = c.toHex();
			let hsl = c.toHSL();

			expect(hex.toString()).toEqual(tc.hex);
			expect([hsl.h, hsl.s, hsl.l]).toEqual(tc.hsl);
		}
	});
});

describe("HSL", async () => {
	it("should work", async () => {
		let tt = [...color_tables];

		for (let tc of tt) {
			let c = new C.HSL(...tc.hsl);
			let hex = c.toHex();
			let rgb = c.toRGB();

			if (tc.color === "Silver") {
				let adjusted = tc.rgb.map(n => n - 1);
				expect(hex.toString()).toEqual(
					"#" +
						adjusted
							.map(n => n.toString(16).padStart(2, "0"))
							.join("")
							.toUpperCase()
				);
				expect([rgb.r, rgb.g, rgb.b]).toEqual(adjusted);
				continue;
			}

			expect(hex.toString()).toEqual(tc.hex);
			expect([rgb.r, rgb.g, rgb.b]).toEqual(tc.rgb);
		}
	});
});
