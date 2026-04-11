import type { CategoryKey } from '../MainDashboard/EmployeeCard';

export interface DistrictEmployee {
	id: string;
	name: string;
	role: string;
	category: CategoryKey;
	available: boolean;
}

export interface District {
	id: string;
	name: string;
	center: { lat: number; lng: number };
	employees: DistrictEmployee[];
	color: string;
	polygon: { lat: number; lng: number }[];
}

// All 27 Lublin districts with approximate polygon boundaries
export const LUBLIN_DISTRICTS: District[] = [
	{
		id: 'stare-miasto',
		name: 'Stare Miasto',
		center: { lat: 51.2490, lng: 22.5720 },
		color: '#3b82f6',
		polygon: [
			{ lat: 51.2530, lng: 22.5650 },
			{ lat: 51.2530, lng: 22.5800 },
			{ lat: 51.2450, lng: 22.5800 },
			{ lat: 51.2450, lng: 22.5650 }
		],
		employees: [
			{ id: 'sm1', name: 'Anna Kowalska', role: 'Frontend Developer', category: 'technology', available: true },
			{ id: 'sm2', name: 'Piotr Nowak', role: 'Kucharz', category: 'gastronomy', available: true },
			{ id: 'sm3', name: 'Ewa Szymańska', role: 'Pielęgniarka', category: 'healthcare', available: false },
			{ id: 'sm4', name: 'Tomasz Wiśniewski', role: 'Sprzedawca', category: 'trade', available: true }
		]
	},
	{
		id: 'srodmiescie',
		name: 'Śródmieście',
		center: { lat: 51.2465, lng: 22.5600 },
		color: '#22c55e',
		polygon: [
			{ lat: 51.2530, lng: 22.5480 },
			{ lat: 51.2530, lng: 22.5650 },
			{ lat: 51.2400, lng: 22.5650 },
			{ lat: 51.2400, lng: 22.5480 }
		],
		employees: [
			{ id: 'sr1', name: 'Katarzyna Lewandowska', role: 'Nauczycielka', category: 'education', available: true },
			{ id: 'sr2', name: 'Jan Dąbrowski', role: 'Backend Developer', category: 'technology', available: true },
			{ id: 'sr3', name: 'Maria Zielińska', role: 'Lekarz', category: 'healthcare', available: true }
		]
	},
	{
		id: 'wieniawa',
		name: 'Wieniawa',
		center: { lat: 51.2470, lng: 22.5380 },
		color: '#06b6d4',
		polygon: [
			{ lat: 51.2540, lng: 22.5250 },
			{ lat: 51.2540, lng: 22.5480 },
			{ lat: 51.2400, lng: 22.5480 },
			{ lat: 51.2400, lng: 22.5250 }
		],
		employees: [
			{ id: 'wi1', name: 'Barbara Nowicka', role: 'Data Analyst', category: 'technology', available: true },
			{ id: 'wi2', name: 'Michał Adamczyk', role: 'Nauczyciel', category: 'education', available: true },
			{ id: 'wi3', name: 'Iwona Sikora', role: 'Fryzjer', category: 'services', available: false }
		]
	},
	{
		id: 'rury',
		name: 'Rury',
		center: { lat: 51.2350, lng: 22.5500 },
		color: '#ec4899',
		polygon: [
			{ lat: 51.2400, lng: 22.5380 },
			{ lat: 51.2400, lng: 22.5650 },
			{ lat: 51.2290, lng: 22.5650 },
			{ lat: 51.2290, lng: 22.5380 }
		],
		employees: [
			{ id: 'ru1', name: 'Sylwia Jabłońska', role: 'Pielęgniarka', category: 'healthcare', available: true },
			{ id: 'ru2', name: 'Rafał Stępień', role: 'Kucharz', category: 'gastronomy', available: true }
		]
	},
	{
		id: 'lsm',
		name: 'LSM',
		center: { lat: 51.2540, lng: 22.5200 },
		color: '#14b8a6',
		polygon: [
			{ lat: 51.2610, lng: 22.5080 },
			{ lat: 51.2610, lng: 22.5300 },
			{ lat: 51.2470, lng: 22.5300 },
			{ lat: 51.2470, lng: 22.5080 }
		],
		employees: [
			{ id: 'ls1', name: 'Paweł Majewski', role: 'Rolnik', category: 'agriculture', available: true },
			{ id: 'ls2', name: 'Aleksandra Olszewska', role: 'Sprzedawca', category: 'trade', available: true }
		]
	},
	{
		id: 'czuby-polnocne',
		name: 'Czuby Północne',
		center: { lat: 51.2350, lng: 22.5100 },
		color: '#f59e0b',
		polygon: [
			{ lat: 51.2420, lng: 22.4970 },
			{ lat: 51.2420, lng: 22.5250 },
			{ lat: 51.2280, lng: 22.5250 },
			{ lat: 51.2280, lng: 22.4970 }
		],
		employees: [
			{ id: 'cpn1', name: 'Marek Wójcik', role: 'Elektryk', category: 'construction', available: true },
			{ id: 'cpn2', name: 'Agnieszka Kamińska', role: 'Hydraulik', category: 'services', available: false },
			{ id: 'cpn3', name: 'Krzysztof Jankowski', role: 'Murarz', category: 'construction', available: true }
		]
	},
	{
		id: 'czuby-poludniowe',
		name: 'Czuby Południowe',
		center: { lat: 51.2220, lng: 22.5100 },
		color: '#84cc16',
		polygon: [
			{ lat: 51.2280, lng: 22.4970 },
			{ lat: 51.2280, lng: 22.5250 },
			{ lat: 51.2140, lng: 22.5250 },
			{ lat: 51.2140, lng: 22.4970 }
		],
		employees: [
			{ id: 'cpd1', name: 'Zofia Mazur', role: 'UX Designer', category: 'technology', available: true },
			{ id: 'cpd2', name: 'Robert Kowalczyk', role: 'Kierowca TIR', category: 'transport', available: true }
		]
	},
	{
		id: 'weglin-polnocny',
		name: 'Węglin Północny',
		center: { lat: 51.2450, lng: 22.4850 },
		color: '#f97316',
		polygon: [
			{ lat: 51.2550, lng: 22.4650 },
			{ lat: 51.2550, lng: 22.4970 },
			{ lat: 51.2370, lng: 22.4970 },
			{ lat: 51.2370, lng: 22.4650 }
		],
		employees: [
			{ id: 'wpn1', name: 'Karol Michalski', role: 'DevOps Engineer', category: 'technology', available: true },
			{ id: 'wpn2', name: 'Monika Wróbel', role: 'Kierowca', category: 'transport', available: true },
			{ id: 'wpn3', name: 'Grzegorz Dudek', role: 'Elektryk', category: 'construction', available: false }
		]
	},
	{
		id: 'weglin-poludniowy',
		name: 'Węglin Południowy',
		center: { lat: 51.2300, lng: 22.4800 },
		color: '#fb923c',
		polygon: [
			{ lat: 51.2370, lng: 22.4650 },
			{ lat: 51.2370, lng: 22.4970 },
			{ lat: 51.2200, lng: 22.4970 },
			{ lat: 51.2200, lng: 22.4650 }
		],
		employees: [
			{ id: 'wpd1', name: 'Tomasz Grabowski', role: 'Ogrodnik', category: 'agriculture', available: true },
			{ id: 'wpd2', name: 'Joanna Krawczyk', role: 'Nauczycielka', category: 'education', available: true }
		]
	},
	{
		id: 'czechow-polnocny',
		name: 'Czechów Północny',
		center: { lat: 51.2750, lng: 22.5450 },
		color: '#8b5cf6',
		polygon: [
			{ lat: 51.2850, lng: 22.5300 },
			{ lat: 51.2850, lng: 22.5600 },
			{ lat: 51.2680, lng: 22.5600 },
			{ lat: 51.2680, lng: 22.5300 }
		],
		employees: [
			{ id: 'cn1', name: 'Kamil Szewczyk', role: 'Murarz', category: 'construction', available: true },
			{ id: 'cn2', name: 'Dorota Błaszczyk', role: 'Fryzjer', category: 'services', available: true },
			{ id: 'cn3', name: 'Artur Kozłowski', role: 'Mechanik', category: 'automotive', available: true },
			{ id: 'cn4', name: 'Justyna Marciniak', role: 'Sprzedawca', category: 'trade', available: false }
		]
	},
	{
		id: 'czechow-poludniowy',
		name: 'Czechów Południowy',
		center: { lat: 51.2630, lng: 22.5450 },
		color: '#a78bfa',
		polygon: [
			{ lat: 51.2680, lng: 22.5300 },
			{ lat: 51.2680, lng: 22.5600 },
			{ lat: 51.2570, lng: 22.5600 },
			{ lat: 51.2570, lng: 22.5300 }
		],
		employees: [
			{ id: 'cs1', name: 'Marta Kowalczyk', role: 'Lekarz', category: 'healthcare', available: true },
			{ id: 'cs2', name: 'Filip Zawadzki', role: 'Programista', category: 'technology', available: true }
		]
	},
	{
		id: 'bronowice',
		name: 'Bronowice',
		center: { lat: 51.2600, lng: 22.5100 },
		color: '#ef4444',
		polygon: [
			{ lat: 51.2680, lng: 22.4970 },
			{ lat: 51.2680, lng: 22.5250 },
			{ lat: 51.2530, lng: 22.5250 },
			{ lat: 51.2530, lng: 22.4970 }
		],
		employees: [
			{ id: 'br1', name: 'Andrzej Wojciechowski', role: 'Spawacz', category: 'construction', available: true },
			{ id: 'br2', name: 'Małgorzata Kaczmarek', role: 'Fryzjer', category: 'services', available: true }
		]
	},
	{
		id: 'kalinowszczyzna',
		name: 'Kalinowszczyzna',
		center: { lat: 51.2600, lng: 22.5750 },
		color: '#eab308',
		polygon: [
			{ lat: 51.2680, lng: 22.5650 },
			{ lat: 51.2680, lng: 22.5900 },
			{ lat: 51.2530, lng: 22.5900 },
			{ lat: 51.2530, lng: 22.5650 }
		],
		employees: [
			{ id: 'ka1', name: 'Łukasz Piotrowski', role: 'Kierowca TIR', category: 'transport', available: true },
			{ id: 'ka2', name: 'Natalia Grabowska', role: 'Kucharz', category: 'gastronomy', available: false },
			{ id: 'ka3', name: 'Damian Pawlak', role: 'Mechanik', category: 'automotive', available: true }
		]
	},
	{
		id: 'ponikwoda',
		name: 'Ponikwoda',
		center: { lat: 51.2580, lng: 22.5950 },
		color: '#a855f7',
		polygon: [
			{ lat: 51.2680, lng: 22.5900 },
			{ lat: 51.2680, lng: 22.6100 },
			{ lat: 51.2480, lng: 22.6100 },
			{ lat: 51.2480, lng: 22.5900 }
		],
		employees: [
			{ id: 'po1', name: 'Renata Michalak', role: 'Sprzedawca', category: 'trade', available: true },
			{ id: 'po2', name: 'Wojciech Sikora', role: 'Rolnik', category: 'agriculture', available: true }
		]
	},
	{
		id: 'slawin',
		name: 'Sławin',
		center: { lat: 51.2700, lng: 22.5100 },
		color: '#10b981',
		polygon: [
			{ lat: 51.2800, lng: 22.4950 },
			{ lat: 51.2800, lng: 22.5300 },
			{ lat: 51.2650, lng: 22.5300 },
			{ lat: 51.2650, lng: 22.4950 }
		],
		employees: [
			{ id: 'sl1', name: 'Dariusz Kubiak', role: 'Ogrodnik', category: 'agriculture', available: true },
			{ id: 'sl2', name: 'Beata Walczak', role: 'Nauczycielka', category: 'education', available: false }
		]
	},
	{
		id: 'szerokie',
		name: 'Szerokie',
		center: { lat: 51.2200, lng: 22.5650 },
		color: '#0ea5e9',
		polygon: [
			{ lat: 51.2290, lng: 22.5550 },
			{ lat: 51.2290, lng: 22.5800 },
			{ lat: 51.2100, lng: 22.5800 },
			{ lat: 51.2100, lng: 22.5550 }
		],
		employees: [
			{ id: 'sz1', name: 'Tadeusz Nowicki', role: 'Rolnik', category: 'agriculture', available: true },
			{ id: 'sz2', name: 'Helena Pawlak', role: 'Pielęgniarka', category: 'healthcare', available: true }
		]
	},
	{
		id: 'wrotków',
		name: 'Wrotków',
		center: { lat: 51.2350, lng: 22.5850 },
		color: '#f43f5e',
		polygon: [
			{ lat: 51.2430, lng: 22.5750 },
			{ lat: 51.2430, lng: 22.6000 },
			{ lat: 51.2260, lng: 22.6000 },
			{ lat: 51.2260, lng: 22.5750 }
		],
		employees: [
			{ id: 'wr1', name: 'Stanisław Kowal', role: 'Elektryk', category: 'construction', available: true },
			{ id: 'wr2', name: 'Elżbieta Mazurek', role: 'Kucharz', category: 'gastronomy', available: true },
			{ id: 'wr3', name: 'Jacek Borkowski', role: 'Mechanik', category: 'automotive', available: false }
		]
	},
	{
		id: 'dziesiata',
		name: 'Dziesiąta',
		center: { lat: 51.2400, lng: 22.6050 },
		color: '#d946ef',
		polygon: [
			{ lat: 51.2480, lng: 22.5980 },
			{ lat: 51.2480, lng: 22.6200 },
			{ lat: 51.2320, lng: 22.6200 },
			{ lat: 51.2320, lng: 22.5980 }
		],
		employees: [
			{ id: 'dz1', name: 'Henryk Jaworski', role: 'Murarz', category: 'construction', available: true },
			{ id: 'dz2', name: 'Grażyna Pietrzak', role: 'Sprzedawca', category: 'trade', available: true }
		]
	},
	{
		id: 'glusk',
		name: 'Głusk',
		center: { lat: 51.2100, lng: 22.5900 },
		color: '#65a30d',
		polygon: [
			{ lat: 51.2200, lng: 22.5750 },
			{ lat: 51.2200, lng: 22.6100 },
			{ lat: 51.1980, lng: 22.6100 },
			{ lat: 51.1980, lng: 22.5750 }
		],
		employees: [
			{ id: 'gl1', name: 'Zbigniew Ostrowski', role: 'Rolnik', category: 'agriculture', available: true },
			{ id: 'gl2', name: 'Teresa Sokołowska', role: 'Ogrodnik', category: 'agriculture', available: true },
			{ id: 'gl3', name: 'Wiesław Lis', role: 'Kierowca', category: 'transport', available: false }
		]
	},
	{
		id: 'hajdow-zadecie',
		name: 'Hajdów-Zadębie',
		center: { lat: 51.2500, lng: 22.6200 },
		color: '#0891b2',
		polygon: [
			{ lat: 51.2600, lng: 22.6100 },
			{ lat: 51.2600, lng: 22.6400 },
			{ lat: 51.2400, lng: 22.6400 },
			{ lat: 51.2400, lng: 22.6100 }
		],
		employees: [
			{ id: 'hz1', name: 'Bogdan Kaczor', role: 'Spawacz', category: 'construction', available: true },
			{ id: 'hz2', name: 'Halina Wilk', role: 'Kucharz', category: 'gastronomy', available: true }
		]
	},
	{
		id: 'zemboryce',
		name: 'Zemborzyce',
		center: { lat: 51.2050, lng: 22.5350 },
		color: '#059669',
		polygon: [
			{ lat: 51.2150, lng: 22.5200 },
			{ lat: 51.2150, lng: 22.5550 },
			{ lat: 51.1930, lng: 22.5550 },
			{ lat: 51.1930, lng: 22.5200 }
		],
		employees: [
			{ id: 'ze1', name: 'Józef Baran', role: 'Rolnik', category: 'agriculture', available: true },
			{ id: 'ze2', name: 'Danuta Sokół', role: 'Sprzedawca', category: 'trade', available: false }
		]
	},
	{
		id: 'abramowice',
		name: 'Abramowice',
		center: { lat: 51.2150, lng: 22.6050 },
		color: '#7c3aed',
		polygon: [
			{ lat: 51.2250, lng: 22.5950 },
			{ lat: 51.2250, lng: 22.6200 },
			{ lat: 51.2050, lng: 22.6200 },
			{ lat: 51.2050, lng: 22.5950 }
		],
		employees: [
			{ id: 'ab1', name: 'Mirosław Górski', role: 'Mechanik', category: 'automotive', available: true },
			{ id: 'ab2', name: 'Jadwiga Kwiatkowska', role: 'Nauczycielka', category: 'education', available: true }
		]
	},
	{
		id: 'felin',
		name: 'Felin',
		center: { lat: 51.2300, lng: 22.6250 },
		color: '#dc2626',
		polygon: [
			{ lat: 51.2400, lng: 22.6150 },
			{ lat: 51.2400, lng: 22.6450 },
			{ lat: 51.2200, lng: 22.6450 },
			{ lat: 51.2200, lng: 22.6150 }
		],
		employees: [
			{ id: 'fe1', name: 'Ryszard Cieślak', role: 'Kierowca TIR', category: 'transport', available: true },
			{ id: 'fe2', name: 'Urszula Duda', role: 'Hydraulik', category: 'services', available: true }
		]
	},
	{
		id: 'tatary',
		name: 'Tatary',
		center: { lat: 51.2530, lng: 22.5900 },
		color: '#e11d48',
		polygon: [
			{ lat: 51.2580, lng: 22.5800 },
			{ lat: 51.2580, lng: 22.5980 },
			{ lat: 51.2470, lng: 22.5980 },
			{ lat: 51.2470, lng: 22.5800 }
		],
		employees: [
			{ id: 'tt1', name: 'Adam Sawicki', role: 'Spawacz', category: 'construction', available: true },
			{ id: 'tt2', name: 'Magdalena Bąk', role: 'Lekarz', category: 'healthcare', available: false }
		]
	},
	{
		id: 'kose',
		name: 'Kośminek',
		center: { lat: 51.2420, lng: 22.5880 },
		color: '#be185d',
		polygon: [
			{ lat: 51.2470, lng: 22.5800 },
			{ lat: 51.2470, lng: 22.5980 },
			{ lat: 51.2370, lng: 22.5980 },
			{ lat: 51.2370, lng: 22.5800 }
		],
		employees: [
			{ id: 'ko1', name: 'Leszek Woźniak', role: 'Elektryk', category: 'construction', available: true },
			{ id: 'ko2', name: 'Bożena Rutkowska', role: 'Kucharz', category: 'gastronomy', available: true },
			{ id: 'ko3', name: 'Mariusz Zając', role: 'Mechanik', category: 'automotive', available: true }
		]
	},
	{
		id: 'za-cukrownia',
		name: 'Za Cukrownią',
		center: { lat: 51.2560, lng: 22.5550 },
		color: '#ca8a04',
		polygon: [
			{ lat: 51.2610, lng: 22.5480 },
			{ lat: 51.2610, lng: 22.5650 },
			{ lat: 51.2530, lng: 22.5650 },
			{ lat: 51.2530, lng: 22.5480 }
		],
		employees: [
			{ id: 'zc1', name: 'Edward Wieczorek', role: 'Murarz', category: 'construction', available: false },
			{ id: 'zc2', name: 'Krystyna Stasiak', role: 'Fryzjer', category: 'services', available: true }
		]
	}
];
