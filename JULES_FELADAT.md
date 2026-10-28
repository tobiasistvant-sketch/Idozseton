# Jules fejlesztői feladat – IDŐZSETON v0.2

## Kiindulás és cél
Magyar nyelvű, XI. osztályos református etikai játék technikai véglegesítése a meglévő index.html alapján. A négyoldalas prototípust a tanár már kipróbálta és elfogadta. **Ne építsd újra és ne írd át önkényesen sem a pedagógiai koncepciót, sem a jóváhagyott látványvilágot, sem az igei és etikai szövegeket.** A fejlesztést külön ágon, ellenőrizhető pull requestben végezd.

Elsőként olvasd el az index.html, README.md és FORRASJEGYZEK.md fájlokat. A projekt statikus, függőségmentes, GitHub Pages-kompatibilis HTML/CSS/JavaScript alkalmazás.

## Változatlanul megőrzendő játékmenet
1. **Címlap:** „IDŐZSETON – Mire költöd az életedet?”; a téma egy *átlagos iskolai nap*.
2. **Valós iskolai nap:** a tanuló pontosan 24 egyórás zsetont oszt ki. Piros/kötött: iskola/munka, utazás, egyéb kötelességek. Zöld/beosztható: alvás, tanulás, telefon/internet, család, barátok, sport/hobbi, hit/elcsendesedés, pihenés/szórakozás, egyéb. Az alvás **zöld**, bár alapvető szükséglet. Elkészül a 24 szeletes időkerék.
3. **Ideális, de megvalósítható iskolai nap:** újabb 24 zseton. A piros kategóriák először a valós napból öröklődnek, és zároltak, de tudatos feloldás után változtathatók. A kötött időből zöld tevékenységbe áttett zseton piros szegélyt kap, „lopott idő” megjelöléssel. Ez önmagában nem jelenti, hogy a diák erkölcstelenül cselekedett; a döntés indoka és következménye számít. Elkészül a második időkerék.
4. **Összehasonlítás:** valós és ideális kerék, kategóriánkénti óraszámok és eltérések, a kötött időből átcsoportosított zsetonok száma, forrásalapú személyre szabott igei/etikai reflexiók és kérdések. Több óra átcsoportosításával kapcsolatos saját vállalás is megfogalmazható. Eredmény menthető UTF-8 fájlba.

## Teológiai és pedagógiai forrásvédelem
A FORRASJEGYZEK.md a korábban ellenőrzött feltöltött forrásokat és az ezek alapján megfogalmazott reflexiókat dokumentálja. A teljes PDF és DOCX források **nincsenek** a publikus repóban. Ne keress helyettük más szakirodalmat, ne készíts új bibliai idézeteket, és ne tulajdoníts nem igazolt állításokat a forrásoknak. Ha ellenőrizendő tartalmat találsz, jelezd a PR-ben, és kérj külön tartalmi felülvizsgálatot; az ilyen részt ne változtasd meg automatikusan.

Nem vezethetsz be előírt egészségi, erkölcsi, vallásossági vagy képernyőidő-óraszám-küszöböt. **Nincs erkölcsi pontozás, rangsor vagy „tökéletes nap” értékelés.** A reflexiót kiválasztó algoritmus saját didaktikai játékszabály, nem forrásszöveg és nem diagnózis. Őrizd meg az ítélkezésmentes, érett tizenéveseknek szóló hangot.

## Konkrét technikai feladatok
- Vizsgáld át a teljes működést: navigáció, visszalépés, szerkesztés, újrakezdés, teljes 24 órás kiosztás, és korábbi állapotok következetes kezelése.
- Ellenőrizd a pirosból zöldbe átcsoportosított zsetonok **eredetkövetését** módosítás, visszavonás, újraelosztás és újrakezdés esetén is.
- Mindkét időkerék minden esetben 24 egységet mutasson, és egyezzen a kategóriánkénti adatokkal.
- Az eltérések és a kiválasztott magyarázatok legyenek következetesek. Vizsgáld meg a nulla, szélsőséges és ismételten módosított kiosztásokat.
- Javítsd a mobilos használhatóságot, billentyűzetes kezelést, hozzáférhető címkéket, fókuszállapotot, színkontrasztot és kijelzést a meglévő megjelenés megtartásával.
- Vizsgáld meg a tanuló által írt vállalás kezelését; ne kerüljön végrehajtható HTML-ként a DOM-ba. Ellenőrizd a mentett fájl magyar ékezeteit és UTF-8 kódolását.
- Ne adj hozzá szervert, regisztrációt, telemetriát, elemző szolgáltatást vagy fölösleges külső függőséget. Az alkalmazás internet nélkül, helyi HTML-fájlként is fusson.
- Készíts egyszerű teszteket/tesztútmutatót a játékmechanikáról, lehetőleg függőségmentesen.
- Ellenőrizd, hogy a forráshivatkozások a PDF-oldalszámot vagy a nyomtatott oldalszámot jelölik-e; hibagyanút külön jelezz, de a források hiányában ne javítsd találgatással.

## Elfogadási feltételek
1. Mind a négy képernyő működik mobilon és asztali böngészőben.
2. Egyik állapotban sem osztható ki több vagy kevesebb mint 24 óra a véglegesítéskor.
3. A piros idő alapértelmezés szerint zárolt a harmadik oldalon, feloldható és pontosan jelölt a zöldbe átcsoportosítás után.
4. A két időkerék, a különbséggrafikon, a „lopott idő” és az exportált eredmény számai egyeznek.
5. A teljes elfogadott etikai szöveg, igehely és forrás hűen megmarad.
6. A vállalás több zsetonra is kiterjedhet.
7. A statikus alkalmazás helyben és GitHub Pages-en egyaránt használható.

## Kért átadás
Először elemezd röviden a meglévő kódot. Utána csak az indokolt technikai javításokat végezd el. Nyiss **pull requestet** a main ágra, és a leírásban külön mutasd be: a módosításokat, a lefuttatott teszteket, az esetleg fennmaradó hibákat és a további **tanári/teológiai tartalmi ellenőrzést** igénylő pontokat. A PR-t ne olvaszd be automatikusan.
