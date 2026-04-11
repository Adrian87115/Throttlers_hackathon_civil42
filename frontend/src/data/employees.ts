import type { Employee } from '@/pages/MainDashboard/EmployeeCard';

/**
 * Single source of truth for all employees (97 total).
 * Lublin-based employees (64) match entries in districts.ts by name.
 * Non-Lublin employees (33) are spread across other Polish cities.
 */
export const ALL_EMPLOYEES: Employee[] = [
	// ── Lublin employees (from districts) ──────────────────────────────

	// Stare Miasto
	{ id: 'sm1', name: 'Anna Kowalska', role: 'Frontend Developer', category: 'technology', location: 'Lublin', experience: 5, available: true },
	{ id: 'sm2', name: 'Piotr Nowak', role: 'Kucharz', category: 'gastronomy', location: 'Lublin', experience: 4, available: true },
	{ id: 'sm3', name: 'Ewa Szymańska', role: 'Pielęgniarka', category: 'healthcare', location: 'Lublin', experience: 6, available: false },
	{ id: 'sm4', name: 'Tomasz Wiśniewski', role: 'Sprzedawca', category: 'trade', location: 'Lublin', experience: 3, available: true },

	// Śródmieście
	{ id: 'sr1', name: 'Katarzyna Lewandowska', role: 'Nauczycielka', category: 'education', location: 'Lublin', experience: 10, available: true },
	{ id: 'sr2', name: 'Jan Dąbrowski', role: 'Backend Developer', category: 'technology', location: 'Lublin', experience: 7, available: true },
	{ id: 'sr3', name: 'Maria Zielińska', role: 'Lekarz', category: 'healthcare', location: 'Lublin', experience: 12, available: true },

	// Wieniawa
	{ id: 'wi1', name: 'Barbara Nowicka', role: 'Data Analyst', category: 'technology', location: 'Lublin', experience: 4, available: true },
	{ id: 'wi2', name: 'Michał Adamczyk', role: 'Nauczyciel', category: 'education', location: 'Lublin', experience: 8, available: true },
	{ id: 'wi3', name: 'Iwona Sikora', role: 'Fryzjer', category: 'services', location: 'Lublin', experience: 6, available: false },

	// Rury
	{ id: 'ru1', name: 'Sylwia Jabłońska', role: 'Pielęgniarka', category: 'healthcare', location: 'Lublin', experience: 9, available: true },
	{ id: 'ru2', name: 'Rafał Stępień', role: 'Kucharz', category: 'gastronomy', location: 'Lublin', experience: 5, available: true },

	// LSM
	{ id: 'ls1', name: 'Paweł Majewski', role: 'Rolnik', category: 'agriculture', location: 'Lublin', experience: 15, available: true },
	{ id: 'ls2', name: 'Aleksandra Olszewska', role: 'Sprzedawca', category: 'trade', location: 'Lublin', experience: 3, available: true },

	// Czuby Północne
	{ id: 'cpn1', name: 'Marek Wójcik', role: 'Elektryk', category: 'construction', location: 'Lublin', experience: 7, available: true },
	{ id: 'cpn2', name: 'Agnieszka Kamińska', role: 'Hydraulik', category: 'services', location: 'Lublin', experience: 5, available: false },
	{ id: 'cpn3', name: 'Krzysztof Jankowski', role: 'Murarz', category: 'construction', location: 'Lublin', experience: 11, available: true },

	// Czuby Południowe
	{ id: 'cpd1', name: 'Zofia Mazur', role: 'UX Designer', category: 'technology', location: 'Lublin', experience: 3, available: true },
	{ id: 'cpd2', name: 'Robert Kowalczyk', role: 'Kierowca TIR', category: 'transport', location: 'Lublin', experience: 14, available: true },

	// Węglin Północny
	{ id: 'wpn1', name: 'Karol Michalski', role: 'DevOps Engineer', category: 'technology', location: 'Lublin', experience: 6, available: true },
	{ id: 'wpn2', name: 'Monika Wróbel', role: 'Kierowca', category: 'transport', location: 'Lublin', experience: 4, available: true },
	{ id: 'wpn3', name: 'Grzegorz Dudek', role: 'Elektryk', category: 'construction', location: 'Lublin', experience: 9, available: false },

	// Węglin Południowy
	{ id: 'wpd1', name: 'Tomasz Grabowski', role: 'Ogrodnik', category: 'agriculture', location: 'Lublin', experience: 8, available: true },
	{ id: 'wpd2', name: 'Joanna Krawczyk', role: 'Nauczycielka', category: 'education', location: 'Lublin', experience: 10, available: true },

	// Czechów Północny
	{ id: 'cn1', name: 'Kamil Szewczyk', role: 'Murarz', category: 'construction', location: 'Lublin', experience: 12, available: true },
	{ id: 'cn2', name: 'Dorota Błaszczyk', role: 'Fryzjer', category: 'services', location: 'Lublin', experience: 7, available: true },
	{ id: 'cn3', name: 'Artur Kozłowski', role: 'Mechanik', category: 'automotive', location: 'Lublin', experience: 10, available: true },
	{ id: 'cn4', name: 'Justyna Marciniak', role: 'Sprzedawca', category: 'trade', location: 'Lublin', experience: 2, available: false },

	// Czechów Południowy
	{ id: 'cs1', name: 'Marta Kowalczyk', role: 'Lekarz', category: 'healthcare', location: 'Lublin', experience: 15, available: true },
	{ id: 'cs2', name: 'Filip Zawadzki', role: 'Programista', category: 'technology', location: 'Lublin', experience: 4, available: true },

	// Bronowice
	{ id: 'br1', name: 'Andrzej Wojciechowski', role: 'Spawacz', category: 'construction', location: 'Lublin', experience: 13, available: true },
	{ id: 'br2', name: 'Małgorzata Kaczmarek', role: 'Fryzjer', category: 'services', location: 'Lublin', experience: 5, available: true },

	// Kalinowszczyzna
	{ id: 'ka1', name: 'Łukasz Piotrowski', role: 'Kierowca TIR', category: 'transport', location: 'Lublin', experience: 11, available: true },
	{ id: 'ka2', name: 'Natalia Grabowska', role: 'Kucharz', category: 'gastronomy', location: 'Lublin', experience: 6, available: false },
	{ id: 'ka3', name: 'Damian Pawlak', role: 'Mechanik', category: 'automotive', location: 'Lublin', experience: 8, available: true },

	// Ponikwoda
	{ id: 'po1', name: 'Renata Michalak', role: 'Sprzedawca', category: 'trade', location: 'Lublin', experience: 4, available: true },
	{ id: 'po2', name: 'Wojciech Sikora', role: 'Rolnik', category: 'agriculture', location: 'Lublin', experience: 18, available: true },

	// Sławin
	{ id: 'sl1', name: 'Dariusz Kubiak', role: 'Ogrodnik', category: 'agriculture', location: 'Lublin', experience: 10, available: true },
	{ id: 'sl2', name: 'Beata Walczak', role: 'Nauczycielka', category: 'education', location: 'Lublin', experience: 14, available: false },

	// Szerokie
	{ id: 'sz1', name: 'Tadeusz Nowicki', role: 'Rolnik', category: 'agriculture', location: 'Lublin', experience: 20, available: true },
	{ id: 'sz2', name: 'Helena Pawlak', role: 'Pielęgniarka', category: 'healthcare', location: 'Lublin', experience: 7, available: true },

	// Wrotków
	{ id: 'wr1', name: 'Stanisław Kowal', role: 'Elektryk', category: 'construction', location: 'Lublin', experience: 9, available: true },
	{ id: 'wr2', name: 'Elżbieta Mazurek', role: 'Kucharz', category: 'gastronomy', location: 'Lublin', experience: 5, available: true },
	{ id: 'wr3', name: 'Jacek Borkowski', role: 'Mechanik', category: 'automotive', location: 'Lublin', experience: 11, available: false },

	// Dziesiąta
	{ id: 'dz1', name: 'Henryk Jaworski', role: 'Murarz', category: 'construction', location: 'Lublin', experience: 16, available: true },
	{ id: 'dz2', name: 'Grażyna Pietrzak', role: 'Sprzedawca', category: 'trade', location: 'Lublin', experience: 6, available: true },

	// Głusk
	{ id: 'gl1', name: 'Zbigniew Ostrowski', role: 'Rolnik', category: 'agriculture', location: 'Lublin', experience: 22, available: true },
	{ id: 'gl2', name: 'Teresa Sokołowska', role: 'Ogrodnik', category: 'agriculture', location: 'Lublin', experience: 12, available: true },
	{ id: 'gl3', name: 'Wiesław Lis', role: 'Kierowca', category: 'transport', location: 'Lublin', experience: 8, available: false },

	// Hajdów-Zadębie
	{ id: 'hz1', name: 'Bogdan Kaczor', role: 'Spawacz', category: 'construction', location: 'Lublin', experience: 14, available: true },
	{ id: 'hz2', name: 'Halina Wilk', role: 'Kucharz', category: 'gastronomy', location: 'Lublin', experience: 7, available: true },

	// Zemborzyce
	{ id: 'ze1', name: 'Józef Baran', role: 'Rolnik', category: 'agriculture', location: 'Lublin', experience: 25, available: true },
	{ id: 'ze2', name: 'Danuta Sokół', role: 'Sprzedawca', category: 'trade', location: 'Lublin', experience: 4, available: false },

	// Abramowice
	{ id: 'ab1', name: 'Mirosław Górski', role: 'Mechanik', category: 'automotive', location: 'Lublin', experience: 10, available: true },
	{ id: 'ab2', name: 'Jadwiga Kwiatkowska', role: 'Nauczycielka', category: 'education', location: 'Lublin', experience: 18, available: true },

	// Felin
	{ id: 'fe1', name: 'Ryszard Cieślak', role: 'Kierowca TIR', category: 'transport', location: 'Lublin', experience: 13, available: true },
	{ id: 'fe2', name: 'Urszula Duda', role: 'Hydraulik', category: 'services', location: 'Lublin', experience: 9, available: true },

	// Tatary
	{ id: 'tt1', name: 'Adam Sawicki', role: 'Spawacz', category: 'construction', location: 'Lublin', experience: 8, available: true },
	{ id: 'tt2', name: 'Magdalena Bąk', role: 'Lekarz', category: 'healthcare', location: 'Lublin', experience: 11, available: false },

	// Kośminek
	{ id: 'ko1', name: 'Leszek Woźniak', role: 'Elektryk', category: 'construction', location: 'Lublin', experience: 10, available: true },
	{ id: 'ko2', name: 'Bożena Rutkowska', role: 'Kucharz', category: 'gastronomy', location: 'Lublin', experience: 6, available: true },
	{ id: 'ko3', name: 'Mariusz Zając', role: 'Mechanik', category: 'automotive', location: 'Lublin', experience: 7, available: true },

	// Za Cukrownią
	{ id: 'zc1', name: 'Edward Wieczorek', role: 'Murarz', category: 'construction', location: 'Lublin', experience: 15, available: false },
	{ id: 'zc2', name: 'Krystyna Stasiak', role: 'Fryzjer', category: 'services', location: 'Lublin', experience: 4, available: true },

	// ── Non-Lublin employees (33) ──────────────────────────────────────

	// Kraków (5)
	{ id: 'kr1', name: 'Jan Nowak', role: 'Murarz', category: 'construction', location: 'Kraków', experience: 12, available: true },
	{ id: 'kr2', name: 'Aleksander Kopeć', role: 'Programista', category: 'technology', location: 'Kraków', experience: 6, available: true },
	{ id: 'kr3', name: 'Weronika Lis', role: 'Lekarz', category: 'healthcare', location: 'Kraków', experience: 9, available: true },
	{ id: 'kr4', name: 'Patryk Górka', role: 'Kucharz', category: 'gastronomy', location: 'Kraków', experience: 4, available: false },
	{ id: 'kr5', name: 'Izabela Wawrzyniak', role: 'Nauczycielka', category: 'education', location: 'Kraków', experience: 11, available: true },

	// Gdańsk (4)
	{ id: 'gd1', name: 'Maria Wiśniewska', role: 'Pielęgniarka', category: 'healthcare', location: 'Gdańsk', experience: 8, available: false },
	{ id: 'gd2', name: 'Bartosz Szulc', role: 'Spawacz', category: 'construction', location: 'Gdańsk', experience: 14, available: true },
	{ id: 'gd3', name: 'Natalia Kwiecień', role: 'UX Designer', category: 'technology', location: 'Gdańsk', experience: 3, available: true },
	{ id: 'gd4', name: 'Szymon Kołodziej', role: 'Kierowca TIR', category: 'transport', location: 'Gdańsk', experience: 10, available: true },

	// Wrocław (4)
	{ id: 'wr-c1', name: 'Piotr Zieliński', role: 'Mechanik samochodowy', category: 'automotive', location: 'Wrocław', experience: 15, available: true },
	{ id: 'wr-c2', name: 'Olga Sobczak', role: 'Sprzedawca', category: 'trade', location: 'Wrocław', experience: 5, available: true },
	{ id: 'wr-c3', name: 'Marcin Pietrzak', role: 'Backend Developer', category: 'technology', location: 'Wrocław', experience: 8, available: true },
	{ id: 'wr-c4', name: 'Klaudia Tomczak', role: 'Fryzjer', category: 'services', location: 'Wrocław', experience: 6, available: false },

	// Poznań (4)
	{ id: 'pz1', name: 'Paulina Król', role: 'Nauczycielka', category: 'education', location: 'Poznań', experience: 10, available: true },
	{ id: 'pz2', name: 'Dawid Malinowski', role: 'Rolnik', category: 'agriculture', location: 'Poznań', experience: 16, available: true },
	{ id: 'pz3', name: 'Julia Chmielowska', role: 'Pielęgniarka', category: 'healthcare', location: 'Poznań', experience: 5, available: true },
	{ id: 'pz4', name: 'Norbert Sawicki', role: 'Elektryk', category: 'construction', location: 'Poznań', experience: 9, available: true },

	// Katowice (3)
	{ id: 'kt1', name: 'Tomasz Kamiński', role: 'Mechanik', category: 'automotive', location: 'Katowice', experience: 13, available: true },
	{ id: 'kt2', name: 'Ewa Kaczmarczyk', role: 'Kucharz', category: 'gastronomy', location: 'Katowice', experience: 7, available: true },
	{ id: 'kt3', name: 'Radosław Zieliński', role: 'Kierowca', category: 'transport', location: 'Katowice', experience: 6, available: false },

	// Łódź (3)
	{ id: 'lo1', name: 'Andrzej Dąbrowski', role: 'Kierowca TIR', category: 'transport', location: 'Łódź', experience: 14, available: true },
	{ id: 'lo2', name: 'Katarzyna Zawisza', role: 'Sprzedawca', category: 'trade', location: 'Łódź', experience: 4, available: true },
	{ id: 'lo3', name: 'Sebastian Witkowski', role: 'Murarz', category: 'construction', location: 'Łódź', experience: 11, available: true },

	// Szczecin (3)
	{ id: 'sc1', name: 'Magdalena Polak', role: 'Sprzedawca', category: 'trade', location: 'Szczecin', experience: 3, available: true },
	{ id: 'sc2', name: 'Adam Wrona', role: 'Hydraulik', category: 'services', location: 'Szczecin', experience: 8, available: true },
	{ id: 'sc3', name: 'Oliwia Mazurkiewicz', role: 'Lekarz', category: 'healthcare', location: 'Szczecin', experience: 10, available: false },

	// Bydgoszcz (3)
	{ id: 'by1', name: 'Jakub Szymczak', role: 'Hydraulik', category: 'services', location: 'Bydgoszcz', experience: 11, available: true },
	{ id: 'by2', name: 'Anna Borkowska', role: 'Ogrodnik', category: 'agriculture', location: 'Bydgoszcz', experience: 7, available: true },
	{ id: 'by3', name: 'Łukasz Nowicki', role: 'Elektryk', category: 'construction', location: 'Bydgoszcz', experience: 5, available: true },

	// Rzeszów (4)
	{ id: 'rz1', name: 'Agnieszka Wojciechowska', role: 'Ogrodnik', category: 'agriculture', location: 'Rzeszów', experience: 9, available: false },
	{ id: 'rz2', name: 'Paweł Bednarek', role: 'Kucharz', category: 'gastronomy', location: 'Rzeszów', experience: 5, available: true },
	{ id: 'rz3', name: 'Monika Jabłońska', role: 'Nauczycielka', category: 'education', location: 'Rzeszów', experience: 12, available: true },
	{ id: 'rz4', name: 'Grzegorz Włodarczyk', role: 'Mechanik', category: 'automotive', location: 'Rzeszów', experience: 8, available: true }
];
