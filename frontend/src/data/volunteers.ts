import type { CategoryKey } from '@/pages/MainDashboard/EmployeeCard';

export interface Volunteer {
	id: string;
	name: string;
	role: string;
	category: CategoryKey;
	location: string;
	experience: number;
	available: boolean;
	phone: string;
}

/**
 * Mock volunteer data — varied counts per category.
 */
export const ALL_VOLUNTEERS: Volunteer[] = [
	// construction — 8
	{ id: 'v1', name: 'Adam Borkowski', role: 'Pomocnik budowlany', category: 'construction', location: 'Lublin', experience: 2, available: true, phone: '501 234 567' },
	{ id: 'v2', name: 'Damian Krawczyk', role: 'Wolontariusz remontowy', category: 'construction', location: 'Lublin', experience: 1, available: true, phone: '512 345 678' },
	{ id: 'v3', name: 'Łukasz Pawlak', role: 'Malarz', category: 'construction', location: 'Lublin', experience: 3, available: false, phone: '523 456 789' },
	{ id: 'v4', name: 'Norbert Czajka', role: 'Pomocnik elektryczny', category: 'construction', location: 'Lublin', experience: 1, available: true, phone: '534 567 890' },
	{ id: 'v5', name: 'Sebastian Lis', role: 'Stolarz amator', category: 'construction', location: 'Lublin', experience: 4, available: true, phone: '545 678 901' },
	{ id: 'v6', name: 'Wojciech Tomczak', role: 'Pomocnik hydraulika', category: 'construction', location: 'Lublin', experience: 2, available: true, phone: '556 789 012' },
	{ id: 'v7', name: 'Grzegorz Halicki', role: 'Dekarz amator', category: 'construction', location: 'Lublin', experience: 3, available: false, phone: '567 890 123' },
	{ id: 'v8', name: 'Michał Stępień', role: 'Wolontariusz budowlany', category: 'construction', location: 'Lublin', experience: 1, available: true, phone: '578 901 234' },

	// agriculture — 4
	{ id: 'v9', name: 'Stanisław Zając', role: 'Wolontariusz rolny', category: 'agriculture', location: 'Lublin', experience: 5, available: true, phone: '589 012 345' },
	{ id: 'v10', name: 'Wiesław Kubiak', role: 'Ogrodnik amator', category: 'agriculture', location: 'Lublin', experience: 3, available: true, phone: '590 123 456' },
	{ id: 'v11', name: 'Henryk Baran', role: 'Pomoc przy zbiorach', category: 'agriculture', location: 'Lublin', experience: 2, available: false, phone: '601 234 567' },
	{ id: 'v12', name: 'Elżbieta Woźniak', role: 'Wolontariuszka rolnicza', category: 'agriculture', location: 'Lublin', experience: 1, available: true, phone: '612 345 678' },

	// automotive — 7
	{ id: 'v13', name: 'Kamil Duda', role: 'Mechanik amator', category: 'automotive', location: 'Lublin', experience: 4, available: true, phone: '623 456 789' },
	{ id: 'v14', name: 'Artur Pietrzak', role: 'Pomocnik warsztatowy', category: 'automotive', location: 'Lublin', experience: 2, available: true, phone: '634 567 890' },
	{ id: 'v15', name: 'Radosław Wrona', role: 'Wolontariusz motoryzacyjny', category: 'automotive', location: 'Lublin', experience: 1, available: false, phone: '645 678 901' },
	{ id: 'v16', name: 'Jacek Chmielewski', role: 'Kierowca wolontariusz', category: 'automotive', location: 'Lublin', experience: 6, available: true, phone: '656 789 012' },
	{ id: 'v17', name: 'Dariusz Sawicki', role: 'Blacharz amator', category: 'automotive', location: 'Lublin', experience: 3, available: true, phone: '667 890 123' },
	{ id: 'v18', name: 'Bartłomiej Król', role: 'Pomocnik lakierniczy', category: 'automotive', location: 'Lublin', experience: 1, available: true, phone: '678 901 234' },
	{ id: 'v19', name: 'Tomasz Grabowski', role: 'Elektryk samochodowy', category: 'automotive', location: 'Lublin', experience: 5, available: false, phone: '689 012 345' },

	// technology — 10
	{ id: 'v20', name: 'Julia Bąk', role: 'Wolontariuszka IT', category: 'technology', location: 'Lublin', experience: 2, available: true, phone: '690 123 456' },
	{ id: 'v21', name: 'Natalia Mazurek', role: 'Pomocniczka przy sprzęcie', category: 'technology', location: 'Lublin', experience: 1, available: true, phone: '701 234 567' },
	{ id: 'v22', name: 'Konrad Urbański', role: 'Wolontariusz sieciowy', category: 'technology', location: 'Lublin', experience: 3, available: true, phone: '712 345 678' },
	{ id: 'v23', name: 'Filip Sokołowski', role: 'Pomocnik techniczny', category: 'technology', location: 'Lublin', experience: 2, available: false, phone: '723 456 789' },
	{ id: 'v24', name: 'Marcin Kalinowski', role: 'IT wolontariusz', category: 'technology', location: 'Lublin', experience: 4, available: true, phone: '734 567 890' },
	{ id: 'v25', name: 'Oliwia Jaworska', role: 'Wsparcie cyfrowe', category: 'technology', location: 'Lublin', experience: 1, available: true, phone: '745 678 901' },
	{ id: 'v26', name: 'Piotr Nowak', role: 'Programista wolontariusz', category: 'technology', location: 'Lublin', experience: 5, available: true, phone: '756 789 012' },
	{ id: 'v27', name: 'Alicja Dąbrowska', role: 'UX/UI pomocnik', category: 'technology', location: 'Lublin', experience: 2, available: true, phone: '767 890 123' },
	{ id: 'v28', name: 'Krzysztof Lewandowski', role: 'Wsparcie systemowe', category: 'technology', location: 'Lublin', experience: 6, available: false, phone: '778 901 234' },
	{ id: 'v29', name: 'Zuzanna Kowalska', role: 'Wolontariuszka cyfrowa', category: 'technology', location: 'Lublin', experience: 1, available: true, phone: '789 012 345' },

	// healthcare — 9
	{ id: 'v30', name: 'Katarzyna Sadowska', role: 'Wolontariuszka medyczna', category: 'healthcare', location: 'Lublin', experience: 3, available: true, phone: '790 123 456' },
	{ id: 'v31', name: 'Beata Kwiatkowska', role: 'Pierwsza pomoc', category: 'healthcare', location: 'Lublin', experience: 2, available: true, phone: '801 234 567' },
	{ id: 'v32', name: 'Teresa Wasilak', role: 'Opiekunka seniorów', category: 'healthcare', location: 'Lublin', experience: 5, available: true, phone: '812 345 678' },
	{ id: 'v33', name: 'Renata Głowacka', role: 'Wolontariuszka hospicyjna', category: 'healthcare', location: 'Lublin', experience: 4, available: false, phone: '823 456 789' },
	{ id: 'v34', name: 'Paulina Stasiak', role: 'Pomocniczka pielęgniarska', category: 'healthcare', location: 'Lublin', experience: 1, available: true, phone: '834 567 890' },
	{ id: 'v35', name: 'Izabela Rutkowska', role: 'Opiekunka dzieci', category: 'healthcare', location: 'Lublin', experience: 3, available: true, phone: '845 678 901' },
	{ id: 'v36', name: 'Monika Zawadzka', role: 'Asystentka medyczna', category: 'healthcare', location: 'Lublin', experience: 2, available: true, phone: '856 789 012' },
	{ id: 'v37', name: 'Agnieszka Kowalczyk', role: 'Wolontariuszka zdrowia', category: 'healthcare', location: 'Lublin', experience: 4, available: false, phone: '867 890 123' },
	{ id: 'v38', name: 'Ewa Malinowska', role: 'Pomoc przy rehabilitacji', category: 'healthcare', location: 'Lublin', experience: 1, available: true, phone: '878 901 234' },

	// education — 5
	{ id: 'v39', name: 'Dorota Michalak', role: 'Korepetytorka', category: 'education', location: 'Lublin', experience: 4, available: true, phone: '889 012 345' },
	{ id: 'v40', name: 'Anna Krajewska', role: 'Wolontariuszka edukacyjna', category: 'education', location: 'Lublin', experience: 2, available: true, phone: '890 123 456' },
	{ id: 'v41', name: 'Jakub Szymczak', role: 'Tutor', category: 'education', location: 'Lublin', experience: 3, available: false, phone: '901 234 567' },
	{ id: 'v42', name: 'Patryk Wiśniewski', role: 'Pomoc szkolna', category: 'education', location: 'Lublin', experience: 1, available: true, phone: '912 345 678' },
	{ id: 'v43', name: 'Aleksandra Pawlik', role: 'Nauczycielka wolontariuszka', category: 'education', location: 'Lublin', experience: 6, available: true, phone: '923 456 789' },

	// gastronomy — 6
	{ id: 'v44', name: 'Magdalena Cieślak', role: 'Kucharka wolontariuszka', category: 'gastronomy', location: 'Lublin', experience: 3, available: true, phone: '934 567 890' },
	{ id: 'v45', name: 'Justyna Wieczorek', role: 'Pomoc kuchenna', category: 'gastronomy', location: 'Lublin', experience: 1, available: true, phone: '945 678 901' },
	{ id: 'v46', name: 'Tomasz Gajda', role: 'Wolontariusz gastronomiczny', category: 'gastronomy', location: 'Lublin', experience: 2, available: true, phone: '956 789 012' },
	{ id: 'v47', name: 'Piotr Ostrowski', role: 'Pomocnik cateringowy', category: 'gastronomy', location: 'Lublin', experience: 1, available: false, phone: '967 890 123' },
	{ id: 'v48', name: 'Kinga Walczak', role: 'Wolontariuszka jadłodajni', category: 'gastronomy', location: 'Lublin', experience: 4, available: true, phone: '978 901 234' },
	{ id: 'v49', name: 'Ewa Bielecka', role: 'Pomoc przy wydawaniu posiłków', category: 'gastronomy', location: 'Lublin', experience: 2, available: true, phone: '989 012 345' },

	// trade — 3
	{ id: 'v50', name: 'Agata Sobczak', role: 'Wolontariuszka w sklepie', category: 'trade', location: 'Lublin', experience: 1, available: true, phone: '501 111 222' },
	{ id: 'v51', name: 'Dawid Jabłoński', role: 'Sortowanie darów', category: 'trade', location: 'Lublin', experience: 1, available: true, phone: '502 222 333' },
	{ id: 'v52', name: 'Edyta Kaczmarek', role: 'Wolontariuszka handlowa', category: 'trade', location: 'Lublin', experience: 1, available: false, phone: '503 333 444' },

	// transport — 11
	{ id: 'v53', name: 'Andrzej Wróblewski', role: 'Kierowca wolontariusz', category: 'transport', location: 'Lublin', experience: 8, available: true, phone: '504 444 555' },
	{ id: 'v54', name: 'Zbigniew Malinowski', role: 'Transport darów', category: 'transport', location: 'Lublin', experience: 3, available: true, phone: '505 555 666' },
	{ id: 'v55', name: 'Mariusz Baranowski', role: 'Wolontariusz transportowy', category: 'transport', location: 'Lublin', experience: 2, available: false, phone: '506 666 777' },
	{ id: 'v56', name: 'Szymon Górski', role: 'Kierowca pomocowy', category: 'transport', location: 'Lublin', experience: 5, available: true, phone: '507 777 888' },
	{ id: 'v57', name: 'Piotr Kowalewski', role: 'Transport medyczny', category: 'transport', location: 'Lublin', experience: 4, available: true, phone: '508 888 999' },
	{ id: 'v58', name: 'Ryszard Nowicki', role: 'Wolontariusz kierowca', category: 'transport', location: 'Lublin', experience: 6, available: true, phone: '509 999 000' },
	{ id: 'v59', name: 'Marek Czarnecki', role: 'Kierowca ciężarowy', category: 'transport', location: 'Lublin', experience: 10, available: true, phone: '511 000 111' },
	{ id: 'v60', name: 'Henryk Mazur', role: 'Transport humanitarny', category: 'transport', location: 'Lublin', experience: 7, available: true, phone: '522 111 222' },
	{ id: 'v61', name: 'Leszek Wiśniewki', role: 'Kurier wolontariusz', category: 'transport', location: 'Lublin', experience: 2, available: false, phone: '533 222 333' },
	{ id: 'v62', name: 'Bogusław Kamiński', role: 'Pomocnik logistyczny', category: 'transport', location: 'Lublin', experience: 3, available: true, phone: '544 333 444' },
	{ id: 'v63', name: 'Waldemar Pająk', role: 'Kierowca dostawczy', category: 'transport', location: 'Lublin', experience: 4, available: true, phone: '555 444 555' },

	// services — 5
	{ id: 'v64', name: 'Małgorzata Witkowska', role: 'Pomoc domowa', category: 'services', location: 'Lublin', experience: 3, available: true, phone: '566 555 666' },
	{ id: 'v65', name: 'Grażyna Kaźmierczak', role: 'Wolontariuszka usługowa', category: 'services', location: 'Lublin', experience: 2, available: true, phone: '577 666 777' },
	{ id: 'v66', name: 'Janusz Szulc', role: 'Złota rączka', category: 'services', location: 'Lublin', experience: 7, available: true, phone: '588 777 888' },
	{ id: 'v67', name: 'Tadeusz Wilk', role: 'Pomocnik konserwatora', category: 'services', location: 'Lublin', experience: 4, available: false, phone: '599 888 999' },
	{ id: 'v68', name: 'Halina Nowakowska', role: 'Sprzątanie wolontariackie', category: 'services', location: 'Lublin', experience: 1, available: true, phone: '600 999 000' },
];
