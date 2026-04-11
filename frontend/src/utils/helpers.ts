import { TFunction } from 'i18next';

/**
 * returns a reference to the listener function - for removal
 * */
export function addOutsideClickListener(
	element: HTMLElement | null,
	callback: () => void
) {
	if (!element) return;

	function handleClickOutside(event: MouseEvent) {
		if (element && !element.contains(event.target as Node)) {
			callback();
		}
	}
	document.addEventListener('mousedown', handleClickOutside);

	return handleClickOutside;
}

export function removeOutsideClickListener(
	element: HTMLElement | null,
	listener: ((event: MouseEvent) => void) | undefined
) {
	if (!element || !listener) return;

	document.removeEventListener('mousedown', listener);
}

export namespace Helpers {
	export function formatLargeMoneyNumber(value: number): string {
		if (value >= 1_000_000_000) {
			return `${(value / 1_000_000_000).toFixed(1)}b`;
		} else if (value >= 1_000_000) {
			return `${(value / 1_000_000).toFixed(1)}m`;
		} else if (value >= 1_000) {
			return `${(value / 1_000).toFixed(1)}k`;
		} else {
			return `${value.toLocaleString()}`;
		}
	}

	export function msToSec(ms: number) {
		return ms / 1000;
	}

	export function formatNumberWithSpaces(value: number): string {
		return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	}

	export function showRootMarginOverlay(rootMargin: string) {
		const margins = rootMargin.split(' ').map((m) => parseFloat(m));
		const viewportHeight = window.innerHeight;
		const viewportWidth = window.innerWidth;

		const [top = 0, right = 0, bottom = 0, left = 0] =
			margins.length === 1
				? [margins[0], margins[0], margins[0], margins[0]]
				: margins.length === 2
					? [margins[0], margins[1], margins[0], margins[1]]
					: margins;

		const boxTop = Math.max(0, 0 + Math.abs(top));
		const boxLeft = Math.max(0, 0 + left);
		const boxHeight = viewportHeight + top + bottom;
		const boxWidth = viewportWidth + left + right;

		let overlay = document.getElementById('rootMarginOverlay');
		if (!overlay) {
			overlay = document.createElement('div');
			overlay.id = 'rootMarginOverlay';
			document.body.appendChild(overlay);
		}

		Object.assign(overlay.style, {
			position: 'fixed',
			pointerEvents: 'none',
			border: '2px dashed red',
			top: `${boxTop}px`,
			left: `${boxLeft}px`,
			height: `${boxHeight}px`,
			width: `${boxWidth}px`,
			zIndex: '9999'
		});
	}

	export const toBase64 = (file: File): Promise<string | undefined> =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				const base64String = reader.result as string;

				// ensure the string has a comma and split only if the comma exists
				const indexOfComma = base64String.indexOf(',');
				if (indexOfComma === -1) {
					reject(new Error('File has no content'));
					return;
				}

				// extract the actual base64 data after the comma
				const base64Data = base64String.substring(indexOfComma + 1);

				if (!base64Data) {
					reject(new Error('Invalid base64 string'));
				} else {
					resolve(base64Data);
				}
			};
			reader.onerror = reject;
		});

	export function formatPostalCode(continuousCode: string): string {
		if (continuousCode.length !== 5)
			throw Error('unable to format, invalid postal code');

		return `${continuousCode.substring(0, 2)}-${continuousCode.substring(
			2,
			6
		)}`;
	}

	export function formatIdCardNumber(continuousCode: string): string {
		if (continuousCode.length !== 9)
			throw Error('unable to format, invalid id card number');

		return `${continuousCode.substring(0, 3)} ${continuousCode.substring(
			3,
			10
		)}`;
	}

	export function isValidDate(d: unknown): d is Date {
		return d instanceof Date && !isNaN(d?.getTime());
	}

	export const convertToFormatDate = (date: Date): string => {
		const day = date.getDate();
		const month = date.getMonth() + 1;
		const year = date.getFullYear();

		const hour = date.getHours();
		const minutes = date.getMinutes();

		const formattedDay = day < 10 ? `0${day}` : day;
		const formattedMonth = month < 10 ? `0${month}` : month;

		const formattedHours = hour < 10 ? `0${hour}` : hour;
		const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

		return `${formattedDay}.${formattedMonth}.${year} ${formattedHours}:${formattedMinutes}`;
	};

	export function getRemainingTime(unlockDate: Date | null) {
		const now = new Date();
		if (!unlockDate) return null;

		const difference = unlockDate.getTime() - now.getTime();

		if (difference <= 0) {
			return {
				remainingDays: 0,
				remainingHours: 0,
				remainingMinutes: 0,
				remainingSeconds: 0
			};
		}

		const remainingDays = Math.floor(difference / (1000 * 60 * 60 * 24));
		const remainingHours = Math.floor(
			(difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
		);
		const remainingMinutes = Math.floor(
			(difference % (1000 * 60 * 60)) / (1000 * 60)
		);
		const remainingSeconds = Math.floor((difference % (1000 * 60)) / 1000);

		return {
			remainingDays,
			remainingHours,
			remainingMinutes,
			remainingSeconds
		};
	}

	export function formatIsoDate(isoDateString: string): string {
		return isoDateString.split('T')[0];
	}

	export function formatIsoDateToDDMMYYYY(dateString?: string): string {
		if (!dateString) return '';

		const date = new Date(dateString);
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		return `${day}.${month}.${year}`;
	}

	export const isValidEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	/**
	 * we need to pass timer as otherwise it wouldnt be possible to use inside onChange callbacks
	 */
	export function debounce(
		cb: Function,
		ms: number,
		timer: React.RefObject<NodeJS.Timeout | undefined>
	) {
		return (...args: any) => {
			clearTimeout(timer.current);
			timer.current = setTimeout(() => {
				cb(...args);
			}, ms);
		};
	}

	export function fixCursorPos(e: React.ChangeEvent<HTMLInputElement>) {
		const start = e.target.selectionStart;
		const end = e.target.selectionEnd;

		setTimeout(() => {
			e.target.setSelectionRange(start, end);
		}, 10); // to prevent cursor jumping
	}

	export function randomBetween(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	export function formatBigNumbersWithCommas(value: number): string {
		const fixedValue = value.toFixed(2);

		const [integerPart, decimalPart] = fixedValue.split('.');

		const formattedIntegerPart = integerPart.replace(
			/\B(?=(\d{3})+(?!\d))/g,
			','
		);

		return `${formattedIntegerPart}.${decimalPart}`;
	}

	export function parseFormattedNumber(value: string): number {
		if (!value || !value.length) return 0;

		const plain = value.replace(/,/g, '');
		const parsed = parseFloat(plain);

		if (isNaN(parsed)) {
			throw new Error(`Invalid formatted number: "${value}"`);
		}

		return parsed;
	}

	export interface RemainingTimeProps {
		remainingDays: number;
		remainingHours: number;
		remainingMinutes: number;
		remainingSeconds: number;
	}

	export function formatDate(date: Date | string): string {
		if (typeof date === 'string') date = new Date(date);

		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
		const year = date.getFullYear();

		return `${day}.${month}.${year}`;
	}

	export function formatTime(date: Date): string {
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		return `${hours}:${minutes}:${seconds}`;
	}

	export function formatTimeWithMs(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		if (hours > 0)
			return `${hours}:${String(minutes).padStart(2, '0')}:${String(
				seconds
			).padStart(2, '0')}`;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}

	export function formatTimeWithSecs(secs: number): string {
		const hours = Math.floor(secs / 3600);
		const minutes = Math.floor((secs % 3600) / 60);
		const seconds = secs % 60;

		if (hours > 0)
			return `${hours}:${String(minutes).padStart(2, '0')}:${String(
				seconds
			).padStart(2, '0')}`;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}

	export function formatTimeWithLabelsSec(
		seconds: number,
		t: TFunction
	): string {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		const parts: string[] = [];

		if (days > 0) parts.push(t('time.days', { count: days }));
		if (hours > 0) parts.push(t('time.hours', { count: hours }));
		if (minutes > 0) parts.push(t('time.minutes', { count: minutes }));
		if (secs > 0) parts.push(t('time.seconds', { count: secs }));

		// total time is 0 seconds
		if (parts.length === 0) return t('time.seconds', { count: 0 });

		return parts.join(' ');
	}

	export function objectsEqual(a: any, b: any): boolean {
		if (a === b) return true;

		if (typeof a !== typeof b) return false;
		if (a === null || b === null) return a === b;

		// arrays
		if (Array.isArray(a)) {
			if (!Array.isArray(b)) return false;
			if (a.length !== b.length) return false;

			for (let i = 0; i < a.length; i++) {
				if (!objectsEqual(a[i], b[i])) return false;
			}

			return true;
		}

		// plain objects
		if (typeof a === 'object') {
			const k1 = Object.keys(a);
			const k2 = Object.keys(b);

			if (k1.length !== k2.length) return false;
			for (const key of k1) {
				if (!k2.includes(key)) return false;
				if (!objectsEqual(a[key], b[key])) return false;
			}

			return true;
		}

		// Primitive values
		return a === b;
	}

	export function addMonths(date: Date, monthsNumber: number): Date {
		const newDate = new Date(date); // Create a new Date object to avoid mutating the original one
		newDate.setMonth(newDate.getMonth() + monthsNumber);
		return newDate;
	}

	export function addDays(date: Date, daysNumber: number): Date {
		const newDate = new Date(date); // Create a new Date object to avoid mutating the original one
		newDate.setDate(newDate.getDate() + daysNumber);
		return newDate;
	}

	export function addYears(date: Date, yearsNumber: number): Date {
		const newDate = new Date(date); // Create a new Date object to avoid mutating the original one
		newDate.setFullYear(newDate.getFullYear() + yearsNumber);
		return newDate;
	}

	export function dayDifference(date1: Date, date2: Date): number {
		const diffTime = Math.abs(date2.getTime() - date1.getTime());
		return Math.floor(diffTime / (1000 * 60 * 60 * 24));
	}

	// Normalize a date to midnight for accurate comparisons
	export function normalizeDate(date: Date): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	}

	export function compareDates(a: Date, b: Date): number {
		const normA = normalizeDate(a);
		const normB = normalizeDate(b);
		if (normA < normB) return -1;
		if (normA > normB) return 1;
		return 0;
	}

	export function getCurrentTimeInSeconds(): number {
		return Math.floor(Date.now() / 1000);
	}

	export type TimePeriods =
		| 'all'
		| 'day'
		| 'week'
		| 'month'
		| 'halfyear'
		| 'year';

	export function isNumeric(str: string) {
		return /^-?\d*\.?(\d+)?$/.test(str);
	}
}

export const generalHeader = {
	font: { bold: true, color: { rgb: 'FFFFFF' } },

	alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
	border: {
		top: { style: 'thin', color: { rgb: '000000' } },
		bottom: { style: 'thin', color: { rgb: '000000' } },
		left: { style: 'thin', color: { rgb: '000000' } },
		right: { style: 'thin', color: { rgb: '000000' } }
	}
};

export const firstCell = {
	...generalHeader,
	fill: { fgColor: { rgb: '767B91' } },
	font: { bold: true, color: { rgb: '000000' } }
};
export const otherCells = {
	...generalHeader,
	fill: { fgColor: { rgb: 'C7CCDB' } },
	font: { bold: true, color: { rgb: '000000' } }
};
export const emailCells = {
	...generalHeader,
	fill: { fgColor: { rgb: 'EEE1B3' } },
	font: { bold: true, color: { rgb: '000000' } }
};

export const generalNameCell = {
	...generalHeader,
	fill: { fgColor: { rgb: '2A324B' } }
};

export const invalidatedCell = {
	fill: { fgColor: { rgb: '818589' } }
};

export const graphPalette = ['#1E4797', '#C00000', '#A6A6A6', '#382A67'];
