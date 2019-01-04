import { Result } from "safe-types";

export enum ErrorCode {
	None,
	ErrInvalidLength,
	ErrInvalidChars,
	ErrInvalidRange,
	ErrStringConv,
	ErrNaN,
}

export type ColorTuple = [number, number, number];

export interface ColorParseError {
	code: ErrorCode;
	message: string;
}

const pkgName = "colorjs";

export const ColorErrors = {
	get InvalidLength(): ColorParseError {
		return {
			code: ErrorCode.ErrInvalidLength,
			message: `[${pkgName}] Invalid length: expected 3 or 6`,
		};
	},

	get InvalidChars(): ColorParseError {
		return {
			code: ErrorCode.ErrInvalidChars,
			message: `[${pkgName}] Invalid characters: only hexadecimal character allowed.`,
		};
	},

	get InvalidRange(): ColorParseError {
		return {
			code: ErrorCode.ErrInvalidRange,
			message: `[${pkgName}] Invalid Range: value not within allowed range.`,
		};
	},

	get StringConv(): ColorParseError {
		return {
			code: ErrorCode.ErrStringConv,
			message: `[${pkgName}] String convert: failed to parse string to number.`,
		};
	},

	get NaN(): ColorParseError {
		return {
			code: ErrorCode.ErrNaN,
			message: `[${pkgName}] NaN: encountered a NaN value.`,
		};
	},
};

type Validator<T> = (...x: T[]) => Result<void, ColorParseError>;

function validateRange(low: number, high: number): Validator<number> {
	let min = Math.min(low, high);
	let max = Math.max(low, high);

	return (...ns) => {
		for (let n of ns) {
			if (min > n || n > max) {
				return Result.Err(ColorErrors.InvalidRange);
			}
		}

		return Result.Ok(undefined);
	};
}

const validateHue = validateRange(0, 360);
const validatePercent = validateRange(0, 100);
const validate8bit = validateRange(0, 0xff);

const validateNaN: Validator<number> = (...ns) => {
	if (ns.some(Number.isNaN)) {
		return Result.Err(ColorErrors.NaN);
	}

	return Result.Ok(undefined);
};

export function parseHexString(s: string): Result<ColorTuple, ColorParseError> {
	if (s.startsWith("#")) {
		s = s.slice(1);
	}

	switch (s.length) {
		default:
			return Result.Err(ColorErrors.InvalidLength);
		case 3:
			s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
			break;
		case 6:
			break;
	}

	if (!Array.from(s).every(isHex)) {
		return Result.Err(ColorErrors.InvalidChars);
	}

	let r = parseInt(s.slice(0, 2), 16);
	let g = parseInt(s.slice(2, 4), 16);
	let b = parseInt(s.slice(4, 6), 16);

	return Result.Ok<ColorTuple>([r, g, b]);
}

function isHex(s: string): boolean {
	let code = s.codePointAt(0);
	if (!code) {
		return false;
	}

	// 0-9 are code points 48-57
	// A-F are code points 65-70
	// a-f are code points 97-102
	return (
		(code >= 48 && code <= 57) ||
		(code >= 65 && code <= 70) ||
		(code >= 97 && code <= 102)
	);
}

export function rgbToHSL(
	r: number,
	g: number,
	b: number
): Result<ColorTuple, ColorParseError> {
	// https://www.rapidtables.com/convert/color/rgb-to-hsl.html
	let valid = Result.every([validateNaN(r, g, b), validate8bit(r, g, b)]);
	if (valid.is_err()) {
		let err = valid.unwrap_err();
		return Result.Err(err);
	}

	// Nominalize range to 0-1
	r /= 0xff;
	g /= 0xff;
	b /= 0xff;

	let cMax = Math.max(r, g, b);
	let cMin = Math.min(r, g, b);
	let delta = cMax - cMin;

	let h = 0;
	let s = 0;
	let l = (cMax + cMin) / 2;

	// Has saturation
	if (delta !== 0 || !(r === g && g === b)) {
		s = delta / (1 - Math.abs(2 * l - 1));
	}

	switch (delta !== 0) {
		case cMax === r:
			h = ((g - b) / delta) % 6;
			break;
		case cMax === g:
			h = 2.0 + (b - r) / delta;
			break;
		case cMax === b:
			h = 4.0 + (r - g) / delta;
			break;
	}

	h *= 60;
	if (h < 0) {
		h += 360;
	}

	return Result.Ok<ColorTuple>([
		Math.round(h),
		Math.round(s * 100),
		Math.round(l * 100),
	]);
}

export function hslToRGB(
	h: number,
	s: number,
	l: number
): Result<ColorTuple, ColorParseError> {
	// https://www.rapidtables.com/convert/color/hsl-to-rgb.html
	let valid = Result.every([
		validateNaN(h, s, l),
		validateHue(h),
		validatePercent(s, l),
	]);
	if (valid.is_err()) {
		let err = valid.unwrap_err();
		return Result.Err(err);
	}

	if (h === 360) {
		h = 0;
	}
	// Nominalize range to 0-1
	s /= 100;
	l /= 100;

	let hh = h / 60;
	let C = (1 - Math.abs(2 * l - 1)) * s;
	let X = C * (1 - Math.abs((hh % 2) - 1));
	let M = l - C / 2;

	let r = 0;
	let g = 0;
	let b = 0;

	switch (true) {
		case h < 60:
			r = C;
			g = X;
			break;
		case h < 120:
			r = X;
			g = C;
			break;
		case h < 180:
			g = C;
			b = X;
			break;
		case h < 240:
			g = X;
			b = C;
			break;
		case h < 300:
			r = X;
			b = C;
			break;
		case h < 360:
			r = C;
			b = X;
			break;
	}

	r += M;
	g += M;
	b += M;

	r *= 0xff;
	g *= 0xff;
	b *= 0xff;

	return Result.Ok<ColorTuple>([Math.round(r), Math.round(g), Math.round(b)]);
}

export function hsvToRGB(
	h: number,
	s: number,
	v: number
): Result<ColorTuple, ColorParseError> {
	// https://www.rapidtables.com/convert/color/hsv-to-rgb.html
	let valid = Result.every([
		validateNaN(h, s, v),
		validateHue(h),
		validatePercent(s, v),
	]);
	if (valid.is_err()) {
		let err = valid.unwrap_err();
		return Result.Err(err);
	}

	if (h === 360) {
		h = 0;
	}
	// Nominalize range to 0-1
	s /= 100;
	v /= 100;

	let hh = h / 60;
	let C = v * s;
	let X = C * (1 - Math.abs((hh % 2) - 1));
	let M = v - C;

	let r = 0;
	let g = 0;
	let b = 0;

	switch (true) {
		case h < 60:
			r = C;
			g = X;
			break;
		case h < 120:
			r = X;
			g = C;
			break;
		case h < 180:
			g = C;
			b = X;
			break;
		case h < 240:
			g = X;
			b = C;
			break;
		case h < 300:
			r = X;
			b = C;
			break;
		case h < 360:
			r = C;
			b = X;
			break;
	}

	r += M;
	g += M;
	b += M;

	r *= 0xff;
	g *= 0xff;
	b *= 0xff;

	return Result.Ok<ColorTuple>([Math.round(r), Math.round(g), Math.round(b)]);
}
