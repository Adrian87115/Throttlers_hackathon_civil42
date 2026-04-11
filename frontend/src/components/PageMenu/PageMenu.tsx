import React, { useLayoutEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

type Props = {
	items: PageMenuItem[];
	className?: string;
	compact?: boolean;
	underlineWidth?: number;
};

export interface PageMenuItem {
	link: string;
	displayName: string;
	icon?: React.JSX.Element;
	className?: string;
}

export default function PageMenu({
	items,
	className,
	compact = false,
	underlineWidth = 100
}: Props) {
	const location = useLocation();
	const pathname = location.pathname;

	const selectionBox = useRef<HTMLLIElement>(null);

	const isItemActive = (item: PageMenuItem): boolean => {
		if (pathname === item.link) {
			return true;
		}

		if (item.link.endsWith('/') && pathname === item.link.slice(0, -1)) {
			return true;
		}

		if (pathname.endsWith('/') && item.link === pathname.slice(0, -1)) {
			return true;
		}

		return false;
	};

	const hasActiveItem = items.some((item) => isItemActive(item));

	useLayoutEffect(() => {
		const parent = document.querySelector('.page-menu');

		if (parent && selectionBox.current) {
			const parentLeft = parent.getBoundingClientRect().left;

			const lis = parent.querySelectorAll('li:not(.selection-box)');
			for (let i = 0; i < lis.length; i++) {
				const li = lis[i];

				if (li.classList.contains('active')) {
					const liLeft = li.getBoundingClientRect().left;
					const offsetLeft = liLeft - parentLeft;
					const width = compact
						? Math.min(li.clientWidth * (underlineWidth / 100), li.clientWidth)
						: li.clientWidth;
					selectionBox.current.style.transform = `translateX(${
						offsetLeft + (li.clientWidth - width) / 2
					}px)`;
					selectionBox.current.style.width = width + 'px';

					return;
				}
			}
		}
	}, [pathname]);

	return (
		<ul
			className={`flex items-center ${
				compact ? 'gap-1' : 'gap-5'
			} page-menu  relative ${className ?? ''}`}>
			<li
				ref={selectionBox}
				className={`absolute h-[3px] bg-dimmed-blue selection-box rounded-full bottom-[-2px] z-10 transition-all duration-300`}
			/>
			{items.map((x, index: number) => {
				const isActive = isItemActive(x) || (!hasActiveItem && index === 0);
				return (
					<li
						key={x.link}
						className={`${isActive ? 'active' : 'text-grayed-out'} ${
							x.className || ''
						}`}>
						<Link to={x.link} className="flex items-center gap-1" key={index}>
							{x.icon}
							{x.displayName}
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
