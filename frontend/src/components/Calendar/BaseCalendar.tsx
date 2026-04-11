import { Helpers } from '@/utils/helpers';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';

type HighlightRange = {
	from: Date;
	to: Date;
};

type Props = {
	highlights?: HighlightRange[];
	className?: string;
};

export default function BaseCalendar({ highlights, className }: Props) {
	const { t } = useTranslation();

	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [toDisplay, setToDisplay] = useState<React.JSX.Element[]>([]);

	const months: string[] = [
		t('customCalendar.months.january'),
		t('customCalendar.months.february'),
		t('customCalendar.months.march'),
		t('customCalendar.months.april'),
		t('customCalendar.months.may'),
		t('customCalendar.months.june'),
		t('customCalendar.months.july'),
		t('customCalendar.months.august'),
		t('customCalendar.months.september'),
		t('customCalendar.months.october'),
		t('customCalendar.months.november'),
		t('customCalendar.months.december')
	];

	// inclusive range check
	function isInHighlightRange(
		date: Date,
		highlight: HighlightRange | undefined
	): boolean {
		if (!highlight) return false;
		const normalizedDate = Helpers.normalizeDate(date);
		const normalizedFrom = Helpers.normalizeDate(highlight.from);
		const normalizedTo = Helpers.normalizeDate(highlight.to);
		return normalizedDate >= normalizedFrom && normalizedDate <= normalizedTo;
	}

	function isHighlightStart(
		date: Date,
		highlight: HighlightRange | undefined
	): boolean {
		if (!highlight) return false;
		return Helpers.compareDates(date, highlight.from) === 0;
	}

	function isHighlightEnd(
		date: Date,
		highlight: HighlightRange | undefined
	): boolean {
		if (!highlight) return false;
		return Helpers.compareDates(date, highlight.to) === 0;
	}

	function isToday(date: Date): boolean {
		return Helpers.compareDates(date, new Date()) === 0;
	}

	// todo: FIX HIGHLIGHTING DURING START OF THE MONTh

	useEffect(() => {
		// day of week, monday=0, sunday = 6
		const firstDayOfMonth: number =
			(new Date(
				selectedDate.getFullYear(),
				selectedDate.getMonth(),
				1
			).getDay() +
				6) %
			7;

		// number of days in this month
		const numberOfDays: number = new Date(
			selectedDate.getFullYear(),
			selectedDate.getMonth() + 1,
			0
		).getDate();

		let tableRows: React.JSX.Element[] = [];
		let dayNumber: number = 1;

		// we are marking starting from the oldest one
		const reversedHighlights = [...(highlights || [])]
			.filter(
				(x) =>
					x.to.getMonth() === selectedDate.getMonth() ||
					x.from.getMonth() === selectedDate.getMonth()
			)
			.reverse();
		let currentHighlightIndex = 0;

		for (let i = 0; i < 6; i++) {
			let row = [];
			for (let j = 0; j < 7; j++) {
				const h = reversedHighlights[currentHighlightIndex] as
					| HighlightRange
					| undefined;

				console.log(h, currentHighlightIndex);

				const dayInd = i * 7 + j;

				const cellDate = new Date(
					selectedDate.getFullYear(),
					selectedDate.getMonth(),
					dayNumber
				);

				const inRange = isInHighlightRange(cellDate, h);
				const isStart = isHighlightStart(cellDate, h);
				const isEnd = isHighlightEnd(cellDate, h);
				const isTodayCell = isToday(cellDate);

				const classNames = [
					inRange ? 'colored' : '',
					isTodayCell ? 'currentDay' : '',
					isStart ? 'roundedLeft' : '',
					isEnd ? 'roundedRight' : ''
				]
					.filter(Boolean)
					.join(' ');

				if (dayNumber > numberOfDays) break;
				if (i === 0 && j < firstDayOfMonth) {
					row.push(<td key={'space-' + dayInd} className={classNames}></td>);
				} else {
					// the text is passed as a data attribute to allow for a bigger padding in "today" cell without affecting the layout

					row.push(
						<td
							key={'day' + dayInd}
							className={classNames}
							data-day-text={isTodayCell ? dayNumber.toString() : ''}>
							{dayNumber}
						</td>
					);
					dayNumber++;
				}

				// move to next highlight if we reached its end
				if (h && cellDate.getTime() === Helpers.normalizeDate(h.to).getTime()) {
					currentHighlightIndex++;
				}
			}
			tableRows.push(<tr key={'week' + i}>{row}</tr>);

			if (dayNumber > numberOfDays) break;
		}

		setToDisplay(tableRows);
	}, [selectedDate, highlights]);

	function handleMonthChange(changeDirection: number) {
		let t = new Date(selectedDate);
		t.setMonth(selectedDate.getMonth() + changeDirection);

		setSelectedDate(t);
	}

	return (
		<div
			className={`details-calendar border rounded-lg border-gray-400/30 shadow-base shadow-dimmed-blue bg-bg-lighter w-fit ${className || ''}`}>
			<div className="flex w-full justify-between items-center mb-4">
				<div className="text-lg  font-bold">
					{months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
				</div>
				<div className="flex items-center gap-2">
					<div
						className="rounded-full p-2 transition-colors duration-300 hover:bg-gray-400/20 cursor-pointer"
						onClick={() => handleMonthChange(-1)}>
						<BiLeftArrow size={20} />
					</div>
					<div
						className="rounded-full p-2 transition-colors duration-300 hover:bg-gray-400/20 cursor-pointer"
						onClick={() => handleMonthChange(1)}>
						<BiRightArrow size={20} />
					</div>
				</div>
			</div>
			<table>
				<thead>
					<tr>
						<th>{t('customCalendar.days.monday')}</th>
						<th>{t('customCalendar.days.tuesday')}</th>
						<th>{t('customCalendar.days.wednesday')}</th>
						<th>{t('customCalendar.days.thursday')}</th>
						<th>{t('customCalendar.days.friday')}</th>
						<th>{t('customCalendar.days.saturday')}</th>
						<th>{t('customCalendar.days.sunday')}</th>
					</tr>
				</thead>
				<tbody>{toDisplay}</tbody>
			</table>
		</div>
	);
}
