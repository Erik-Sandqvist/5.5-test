/* Ramverk – produktdata (demo). Alla motiv, konstnärer, priser och omdömen är fiktiva. */
window.RV = window.RV || {};

RV.categories = [
  { id: 'abstrakt', name: 'Abstrakt', blurb: 'Former, färgfält och rytm.', tint: '#E9E4F2' },
  { id: 'natur', name: 'Natur & landskap', blurb: 'Fjäll, hav och stjärnhimlar.', tint: '#DDE6E3' },
  { id: 'botaniskt', name: 'Botaniskt', blurb: 'Blad, blommor och citrus.', tint: '#E3EADB' },
  { id: 'typografi', name: 'Typografi', blurb: 'Ord att ha på väggen.', tint: '#EEE9DF' },
  { id: 'retro', name: 'Retro', blurb: '70-tal, sport och solnedgångar.', tint: '#F5E1D6' },
  { id: 'arkitektur', name: 'Arkitektur', blurb: 'Betong, funkis och fasader.', tint: '#E1E3E6' },
];

RV.collections = {
  nyheter: { name: 'Nyheter', blurb: 'Motiv som släppts de senaste veckorna.' },
  'mest-salda': { name: 'Mest sålda', blurb: 'De motiv flest har valt för sina väggar.' },
  rea: { name: 'Rea', blurb: 'Utvalda motiv till nedsatt pris, så länge lagret räcker.' },
  limited: { name: 'Limited edition', blurb: 'Numrerade och signerade tryck i begränsad upplaga.' },
};

RV.colors = [
  { id: 'svartvit', name: 'Svartvitt', hex: '#1B1B1B' },
  { id: 'bla', name: 'Blå', hex: '#3E5C8A' },
  { id: 'gron', name: 'Grön', hex: '#4E6B53' },
  { id: 'rosa', name: 'Rosa', hex: '#E7A5B1' },
  { id: 'orange', name: 'Orange', hex: '#E07A3F' },
  { id: 'gul', name: 'Gul', hex: '#E8C14A' },
  { id: 'rod', name: 'Röd', hex: '#C9412E' },
  { id: 'beige', name: 'Beige', hex: '#D8C6AA' },
];

/* Pris per storlek. frame = pris för standardram (aluminium) i samma storlek. */
RV.sizes = [
  { id: '21x30', w: 21, h: 30, label: '21 × 30 cm', price: 149, frame: 199 },
  { id: '30x40', w: 30, h: 40, label: '30 × 40 cm', price: 229, frame: 279 },
  { id: '50x70', w: 50, h: 70, label: '50 × 70 cm', price: 349, frame: 449 },
  { id: '70x100', w: 70, h: 100, label: '70 × 100 cm', price: 549, frame: 649 },
];

RV.frames = [
  { id: 'none', name: 'Utan ram', short: 'Utan ram', color: null, mult: 0 },
  { id: 'black', name: 'Svart aluminium', short: 'Svart', color: '#1C1C1E', mult: 1 },
  { id: 'white', name: 'Vit aluminium', short: 'Vit', color: '#F4F4F1', mult: 1 },
  { id: 'oak', name: 'Massiv ek', short: 'Ek', color: '#C9A077', mult: 1.2, material: 'wood' },
  { id: 'walnut', name: 'Valnöt', short: 'Valnöt', color: '#5C3C29', mult: 1.3, material: 'wood' },
  { id: 'brass', name: 'Borstad mässing', short: 'Mässing', color: '#B69A5C', mult: 1.25, material: 'metal' },
];

RV.MAT_PRICE = 79;
RV.FREE_SHIPPING = 499;
RV.LIMITED_FACTOR = 1.8;

RV.walls = [
  { id: 'kalk', name: 'Kalkvit', hex: '#E7E3DA', tone: 'light' },
  { id: 'salvia', name: 'Salvia', hex: '#BFC6B2', tone: 'light' },
  { id: 'lera', name: 'Lera', hex: '#D6BDA8', tone: 'light' },
  { id: 'dimbla', name: 'Dimblå', hex: '#B6C1CB', tone: 'light' },
  { id: 'kol', name: 'Kol', hex: '#35373A', tone: 'dark' },
];

RV.artists = {
  'Ines Morell': { city: 'Göteborg', bio: 'Ines målar ljuset som det ser ut en timme före solnedgången. Hennes tryck bygger på akvarellskisser från Bohuskusten som hon sedan förenklar till några få färgfält.' },
  'Aron Lindqvist': { city: 'Malmö', bio: 'Geometri, rytm och kontrast. Aron arbetar i serier om tolv och låter slumpen välja nästa form.' },
  'Theo Nakamura-Berg': { city: 'Kiruna', bio: 'Fotograf som blivit illustratör. Theos landskap utgår från vandringar längs Kungsleden.' },
  'Maja Ekdahl': { city: 'Stockholm', bio: 'Klipper i färgat papper och skannar in resultatet. Inspirerad av 50-talets modernister.' },
  'Elin Fors': { city: 'Uppsala', bio: 'Arkitekt som ritar mönster på kvällarna. Varma färger och tydliga former.' },
  'Studio Kvist': { city: 'Stockholm', bio: 'Designduo som gör motiv med glimten i ögat, från blomstermarknader till 80-talsmönster.' },
  'Noor Haddad': { city: 'Lund', bio: 'Arbetar med mjuka övergångar och material som terrazzo och kalkputs.' },
  'Jonas Vik': { city: 'Örebro', bio: 'Tecknar svensk efterkrigsarkitektur, en fasad i taget.' },
  'Klara Sund': { city: 'Norrköping', bio: 'Grafisk formgivare med förkärlek för stora bokstäver och stränga rutnät.' },
  'Oskar Blom': { city: 'Visby', bio: 'Minimalist. Oskar tar bort tills bara det nödvändiga finns kvar.' },
};

RV.products = [
  { id: 'solnedgang-no-3', title: 'Solnedgång Nº 3', artist: 'Ines Morell', cat: 'retro', color: 'orange', wall: '#E9DDD0', pop: 99, rating: 4.9, reviews: 412, added: '2026-06-02', desc: 'En varm kvällshimmel i tre lager. Randerna i solen är ett eko av 70-talets affischer.' },
  { id: 'fjallvarld', title: 'Fjällvärld', artist: 'Theo Nakamura-Berg', cat: 'natur', color: 'bla', wall: '#E4E1DA', pop: 97, rating: 4.9, reviews: 356, added: '2026-03-18', desc: 'Sex bergskammar i dis, tecknade efter en vandring mellan Abisko och Nikkaluokta.' },
  { id: 'blomstermarknad', title: 'Blomstermarknad', artist: 'Studio Kvist', cat: 'botaniskt', color: 'rosa', wall: '#E6D8CF', pop: 98, rating: 4.8, reviews: 298, added: '2026-05-10', desc: 'En hyllning till lördagsmorgonens blomsterstånd, med tulpaner, prästkragar och ringblommor.' },
  { id: 'skargard', title: 'Skärgård', artist: 'Ines Morell', cat: 'natur', color: 'bla', wall: '#DCE0DE', pop: 96, rating: 4.9, reviews: 267, added: '2026-04-22', desc: 'Kobbar och skär i motljus. Den sista timmen innan solen går ner bakom horisonten.' },
  { id: 'bauhaus-studie-07', title: 'Bauhaus Studie 07', artist: 'Aron Lindqvist', cat: 'abstrakt', color: 'orange', wall: '#E7E3DA', pop: 95, rating: 4.8, reviews: 241, added: '2026-02-11', desc: 'Tolv rutor, sju former och fyra färger. Den sjunde studien i en serie om slump och ordning.' },
  { id: 'fika', title: 'Fika', artist: 'Maja Ekdahl', cat: 'typografi', color: 'orange', wall: '#E9E2D6', pop: 95, rating: 4.9, reviews: 388, added: '2026-01-20', desc: 'Fyra bokstäver som inte behöver översättas. Gjord för köksväggen.' },
  { id: 'aura-04', title: 'Aura 04', artist: 'Noor Haddad', cat: 'abstrakt', color: 'rosa', wall: '#E7E3DA', pop: 94, rating: 4.7, reviews: 142, added: '2026-09-02', desc: 'Mjuka färgfält som flyter in i varandra. Ett lugnt motiv för sovrummet.' },
  { id: 'utklipp-i-juni', title: 'Utklipp i juni', artist: 'Maja Ekdahl', cat: 'abstrakt', color: 'bla', wall: '#E4E0D6', pop: 93, rating: 4.8, reviews: 118, added: '2026-09-09', desc: 'Handklippta former i färgat papper, inskannade och tryckta i full storlek.' },
  { id: 'gronska', title: 'Grönska', artist: 'Studio Kvist', cat: 'botaniskt', color: 'gron', wall: '#E2E0D6', pop: 92, rating: 4.8, reviews: 203, added: '2026-03-01', desc: 'En solfjäder av blad i fem gröna toner.' },
  { id: 'stjarnkarta', title: 'Stjärnhimlen', artist: 'Theo Nakamura-Berg', cat: 'natur', color: 'bla', wall: '#D9D6CE', pop: 92, rating: 5.0, reviews: 96, added: '2026-08-14', limited: { edition: 250, left: 37 }, desc: 'Himlen över Stockholm en klar vinternatt, med stjärnbilder och koordinater. Numrerad och signerad.' },
  { id: 'pulsar', title: 'Pulsar', artist: 'Aron Lindqvist', cat: 'abstrakt', color: 'svartvit', wall: '#E7E3DA', pop: 91, rating: 4.8, reviews: 176, added: '2025-11-30', desc: 'Sextiotvå mätserier från en roterande neutronstjärna, staplade ovanpå varandra.' },
  { id: 'valv', title: 'Valv', artist: 'Elin Fors', cat: 'abstrakt', color: 'beige', wall: '#E3DCD2', pop: 90, rating: 4.7, reviews: 164, added: '2025-10-12', sale: 0.3, desc: 'Sex valv i varma jordtoner, inspirerade av södra Europas portgångar.' },
  { id: 'tennisklubben-1974', title: 'Tennisklubben', artist: 'Oskar Blom', cat: 'retro', color: 'gron', wall: '#E6DFD2', pop: 90, rating: 4.8, reviews: 88, added: '2026-09-12', desc: 'Grusbana, nät och en boll på väg. En klubbaffisch från en sommar som aldrig fanns.' },
  { id: 'citrus', title: 'Citrus', artist: 'Elin Fors', cat: 'botaniskt', color: 'orange', wall: '#E8E3D8', pop: 89, rating: 4.7, reviews: 151, added: '2025-12-04', sale: 0.25, desc: 'Apelsin, citron, grapefrukt och lime i ett rutnät. Friskt i köket.' },
  { id: 'form-1968', title: 'Form 1968', artist: 'Klara Sund', cat: 'typografi', color: 'rod', wall: '#E0DDD6', pop: 88, rating: 4.9, reviews: 74, added: '2026-07-01', limited: { edition: 300, left: 58 }, desc: 'En utställningsaffisch i schweizisk anda: rutnät, en röd cirkel och två stora siffror.' },
  { id: 'lagom', title: 'Lagom', artist: 'Oskar Blom', cat: 'typografi', color: 'gron', wall: '#DCD8CE', pop: 88, rating: 4.8, reviews: 131, added: '2026-02-26', desc: 'Inte för mycket, inte för lite. Ett ord och en våg på djupgrön botten.' },
  { id: 'rutor-i-rorelse', title: 'Rutor i rörelse', artist: 'Studio Kvist', cat: 'retro', color: 'rosa', wall: '#E7E3DA', pop: 87, rating: 4.6, reviews: 97, added: '2026-05-28', desc: 'Ett schackrutigt mönster som böljar. Rosa och vinrött, rakt ur 70-talet.' },
  { id: 'manfaser', title: 'Månfaser', artist: 'Noor Haddad', cat: 'natur', color: 'bla', wall: '#D8D6D0', pop: 86, rating: 4.8, reviews: 109, added: '2026-09-05', desc: 'Åtta faser, en cykel på 29,5 dygn. Månen från nymåne till avtagande skära.' },
  { id: 'bjorkskog', title: 'Björkskog', artist: 'Theo Nakamura-Berg', cat: 'natur', color: 'beige', wall: '#E3E0D8', pop: 86, rating: 4.7, reviews: 84, added: '2026-09-15', desc: 'Vita stammar i morgondis. Tre lager skog som försvinner in i dimman.' },
  { id: 'dyner', title: 'Dyner', artist: 'Ines Morell', cat: 'natur', color: 'orange', wall: '#E7DED2', pop: 85, rating: 4.7, reviews: 122, added: '2025-09-19', desc: 'Sanddyner i fem toner under en låg sol.' },
  { id: 'kebnekaise-topografi', title: 'Kebnekaise', artist: 'Elin Fors', cat: 'natur', color: 'svartvit', wall: '#DFE0DA', pop: 84, rating: 4.8, reviews: 67, added: '2026-04-02', desc: 'Höjdkurvor runt Sveriges högsta topp, med sjö, rutnät och koordinater.' },
  { id: 'ljus-och-skugga', title: 'Ljus och skugga', artist: 'Klara Sund', cat: 'typografi', color: 'gul', wall: '#E4E1DA', pop: 83, rating: 4.6, reviews: 58, added: '2026-08-28', desc: 'En utställningsaffisch om fotografi: gult ljus, svart skugga och tre ord.' },
  { id: 'op-art-21', title: 'Op Art 21', artist: 'Aron Lindqvist', cat: 'abstrakt', color: 'svartvit', wall: '#E7E3DA', pop: 82, rating: 4.6, reviews: 71, added: '2025-08-08', desc: 'Svarta ränder som buktar ut mot betraktaren. En optisk illusion i 50 × 70.' },
  { id: 'horisont', title: 'Horisont', artist: 'Oskar Blom', cat: 'abstrakt', color: 'bla', wall: '#E4E1DA', pop: 81, rating: 4.7, reviews: 64, added: '2025-11-02', desc: 'En sol, en linje och en spegling. Mer behövs inte.' },
  { id: 'betongdrom', title: 'Betongdröm', artist: 'Jonas Vik', cat: 'arkitektur', color: 'beige', wall: '#E2DED5', pop: 80, rating: 4.7, reviews: 55, added: '2026-01-08', desc: 'Ett höghus från miljonprogrammet med balkonger, gardiner och tända fönster.' },
  { id: 'terrazzo', title: 'Terrazzo', artist: 'Noor Haddad', cat: 'abstrakt', color: 'beige', wall: '#E7E3DA', pop: 79, rating: 4.5, reviews: 48, added: '2025-07-15', desc: 'Hundrasjuttio stenflisor i sju färger, som ett golv i en italiensk trappuppgång.' },
  { id: 'funkis-1932', title: 'Funkis 1932', artist: 'Jonas Vik', cat: 'arkitektur', color: 'bla', wall: '#E4E1DA', pop: 78, rating: 4.6, reviews: 43, added: '2025-06-21', sale: 0.2, desc: 'En vit villa med platt tak, bandfönster och runt fönster. Funktionalism i sin renaste form.' },
  { id: 'memphis-86', title: 'Memphis 86', artist: 'Studio Kvist', cat: 'retro', color: 'rosa', wall: '#E7E3DA', pop: 77, rating: 4.5, reviews: 39, added: '2025-05-30', sale: 0.3, desc: 'Sicksack, konfetti och primärformer. Ett glatt 80-talsmönster.' },
];

RV.reviews = [
  { name: 'Sara L.', city: 'Göteborg', product: 'solnedgang-no-3', stars: 5, text: 'Färgerna är ännu varmare i verkligheten. Ramen i ek kändes gedigen och allt kom välpackat på två dagar.' },
  { name: 'Mehmet K.', city: 'Stockholm', product: 'fjallvarld', stars: 5, text: 'Vi köpte 70 × 100 till vardagsrummet. Papperet är tjockt och matt, inga reflexer alls från fönstret.' },
  { name: 'Johanna B.', city: 'Umeå', product: 'blomstermarknad', stars: 5, text: 'Gallerivägg-verktyget gjorde det lätt att välja. Hela väggen tog en kvart att hänga med mallen som följde med.' },
  { name: 'Anton W.', city: 'Malmö', product: 'bauhaus-studie-07', stars: 4, text: 'Snyggt tryck och skarpa kanter. Leveransen tog en dag extra, men kundtjänsten svarade direkt.' },
  { name: 'Linnea P.', city: 'Uppsala', product: 'fika', stars: 5, text: 'Hänger i köket och alla gäster kommenterar den. Passepartouten gör verkligen skillnad.' },
  { name: 'David H.', city: 'Lund', product: 'stjarnkarta', stars: 5, text: 'Numrerad och signerad, med ett äkthetsintyg i kuvertet. Känns som ett riktigt konstköp.' },
];
