import { SEARCH_DEBOUNCE_MS } from '@/types/types';
import { Helpers } from '@/utils/helpers';
import { ClickAwayListener } from '@mui/material';
import { countries } from 'country-data-list';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { CircleFlag } from 'react-circle-flags';
import { useTranslation } from 'react-i18next';
import BaseButton from '../Buttons/BaseButton';
import LazyFlag from '../LazyLoading/LazyFlag';
import { LazyLoadContextProvider } from '../LazyLoading/LazyLoadContextProvider';
import { Input } from './input';

// Country interface
export interface Country {
	alpha2: string;
	alpha3: string;
	countryCallingCodes: string[];
	currencies: string[];
	emoji?: string;
	ioc: string;
	languages: string[];
	name: string;
	status: string;
}

// Dropdown props
interface CountryDropdownProps {
	options?: Country[];
	onChange?: (country: Country) => void;
	defaultValueAlpha2?: string;
	disabled?: boolean;
	placeholder?: string;
	slim?: boolean;
	className?: string;
}

export default function CountryDropdown({
	options = countries.all.filter(
		(country: Country) =>
			country.emoji && country.status !== 'deleted' && country.ioc !== 'PRK'
	),
	onChange,
	defaultValueAlpha2: defaultValueAlpha2,
	disabled = false,
	placeholder,
	slim = false,
	className
}: CountryDropdownProps) {
	const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(
		undefined
	);
	const [searchVal, setSearchVal] = useState<string>('');

	const { t } = useTranslation();
	const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
	const searchDebounceTimeout = useRef<NodeJS.Timeout>(undefined);

	const modalRef = useRef<HTMLDivElement | null>(null);

	const [mappedOptions, setMappedOptions] = useState<Country[]>([]);

	useEffect(() => {
		if (defaultValueAlpha2) {
			const initialCountry = options.find(
				(country) => country.alpha2 === defaultValueAlpha2
			);
			if (initialCountry) {
				setSelectedCountry(initialCountry);
			} else {
				setSelectedCountry(undefined);
			}
		} else {
			setSelectedCountry(undefined);
		}
	}, [defaultValueAlpha2]);

	useEffect(() => {
		const x = searchVal.toLocaleLowerCase();

		Helpers.debounce(
			() => {
				setMappedOptions(
					searchVal
						? options.filter((c: Country) =>
								c.name.toLocaleLowerCase().includes(x)
						  )
						: options
				);
			},
			SEARCH_DEBOUNCE_MS,
			searchDebounceTimeout
		)();
	}, [searchVal, options]);

	const handleSelect = useCallback(
		(country: Country) => {
			setSelectedCountry(country);
			setIsInputFocused(false);
			onChange?.(country);
		},
		[onChange]
	);

	return (
		<ClickAwayListener
			onClickAway={() => {
				setIsInputFocused(false);
				setSearchVal('');
			}}>
			<div className={`relative h-full flex ${className || ''}`}>
				<BaseButton
					disabled={disabled}
					className="w-full"
					onClick={() => setIsInputFocused((prev) => !prev)}>
					{selectedCountry ? (
						<div className="flex items-center w-full gap-2 overflow-hidden">
							<div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
								<CircleFlag
									countryCode={selectedCountry.alpha2.toLowerCase()}
									height={20}
								/>
							</div>
							{slim === false && (
								<span className="overflow-hidden text-ellipsis whitespace-nowrap">
									{selectedCountry.name}
								</span>
							)}
						</div>
					) : (
						<span>
							{slim === false ? (
								placeholder || selectedCountry
							) : (
								<Globe size={20} />
							)}
						</span>
					)}
					<ChevronDown
						size={20}
						className={`transition-transform duration-300 ${
							isInputFocused ? 'rotate-180' : ''
						}`}
					/>
				</BaseButton>
				<div
					className={`input-modal ${isInputFocused ? 'active' : ''}`}
					ref={modalRef}>
					<div className="flex flex-col gap-2 relative">
						<Input
							placeholder={t('settings.profile.searchCountry')}
							className="h-full border-0! focus-visible:ring-0! focus-visible:border-0!"
							value={searchVal}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								setSearchVal(e.target.value)
							}
							onFocus={() => setIsInputFocused(true)}
							searchIcon
						/>
						<div className="w-full h-px bg-primary-blue" />

						<LazyLoadContextProvider rootRef={modalRef}>
							{mappedOptions
								.filter((x) => x.name)
								.map((option) => {
									const isActive = option.name === selectedCountry?.name;

									return (
										<div
											className={`dropdown-item flex items-center gap-5 ${
												isActive ? 'bg-dimmed-blue!' : ''
											}`}
											key={option.alpha2}
											onClick={() => handleSelect(option)}>
											<div className="inline-flex items-center justify-center w-6 h-6 shrink-0 overflow-hidden rounded-full">
												<LazyFlag code={option.alpha2.toLowerCase()} />
											</div>
											<span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
												{option.name}
											</span>
											{selectedCountry?.alpha2 === option.alpha2 && (
												<Check size={20} className="ml-auto opacity-50" />
											)}
										</div>
									);
								})}
						</LazyLoadContextProvider>
					</div>
				</div>
			</div>
		</ClickAwayListener>
	);
}
