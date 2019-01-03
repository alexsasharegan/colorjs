import { parseHexString, rgbToHSL, hslToRGB } from "./utils";

export enum ColorFormat {
	Hex = "hex",
	RGB = "rbg",
	HSL = "hsl",
}

type ColorMatcher<T> = {
	[ColorFormat.Hex]: (c: Hex) => T;
	[ColorFormat.HSL]: (c: HSL) => T;
	[ColorFormat.RGB]: (c: RGB) => T;
};

export interface BasicColor {
	match<T>(matcher: ColorMatcher<T>): T;
	toString(): string;
	toHex(): Hex;
	toRGB(): RGB;
	toHSL(): HSL;
}

export class RGB implements BasicColor {
	constructor(
		public r: number = 0,
		public g: number = 0,
		public b: number = 0
	) {}

	get format() {
		return ColorFormat.RGB;
	}

	match<T>(m: ColorMatcher<T>): T {
		return m[ColorFormat.RGB](this);
	}

	toString() {
		return `rgb(${this.r}, ${this.g}, ${this.b})`;
	}

	toHex() {
		return new Hex(
			`${this.r.toString(16).padStart(2, "0")}${this.g
				.toString(16)
				.padStart(2, "0")}${this.b.toString(16).padStart(2, "0")}`
		);
	}

	toRGB() {
		return this;
	}

	toHSL() {
		return rgbToHSL(this.r, this.g, this.b)
			.map(([h, s, l]) => new HSL(h, s, l))
			.unwrap();
	}
}

export class HSL implements BasicColor {
	constructor(
		public h: number = 0,
		public s: number = 0,
		public l: number = 0
	) {}

	get format() {
		return ColorFormat.HSL;
	}

	match<T>(m: ColorMatcher<T>): T {
		return m[ColorFormat.HSL](this);
	}

	toString() {
		return `hsl(${this.h}, ${this.s}, ${this.l})`;
	}

	toHSL() {
		return this;
	}

	toHex() {
		return hslToRGB(this.h, this.s, this.l)
			.map(([r, g, b]) => Hex.fromValues(r, g, b))
			.unwrap();
	}

	toRGB() {
		return hslToRGB(this.h, this.s, this.l)
			.map(([r, g, b]) => new RGB(r, g, b))
			.unwrap();
	}
}

export class Hex implements BasicColor {
	public r = 0;
	public g = 0;
	public b = 0;

	constructor(hex?: string) {
		if (hex) {
			let [r, g, b] = parseHexString(hex).unwrap();
			this.r = r;
			this.g = g;
			this.b = b;
		}
	}

	get format() {
		return ColorFormat.RGB;
	}

	match<T>(m: ColorMatcher<T>): T {
		return m[ColorFormat.Hex](this);
	}

	toString() {
		return `#${this.r.toString(16).padStart(2, "0")}${this.g
			.toString(16)
			.padStart(2, "0")}${this.b
			.toString(16)
			.padStart(2, "0")}`.toUpperCase();
	}

	toHex() {
		return this;
	}

	toHSL() {
		return rgbToHSL(this.r, this.g, this.b)
			.map(([h, s, l]) => new HSL(h, s, l))
			.unwrap();
	}

	toRGB() {
		return new RGB(this.r, this.g, this.b);
	}

	static fromValues(r: number, g: number, b: number) {
		let hex = new Hex();
		hex.r = r;
		hex.g = g;
		hex.b = b;

		return hex;
	}
}

export type Color = RGB | HSL | Hex;
