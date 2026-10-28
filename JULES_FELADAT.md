# Jules fejlesztői feladat – IDŐZSETON v0.2

## Kiindulás és cél
Magyar nyelvű, XI. osztályos református etikai játék technikai véglegesítése a meglévő index.html alapján. A négyoldalas prototípust a tanár már kipróbálta és elfogadta. **A pedagógiai koncepciót, a négy képernyő játékmenetét és az igei/etikai szövegeket tilos önkényesen átírni. A jelenlegi v0.2 látvány csak működő prototípus: a végső dizájnt az alábbi két, már meglévő referenciajáték egységes arculatához kell igazítani.** A fejlesztést külön ágon, ellenőrizhető pull requestben végezd.

Elsőként olvasd el az index.html, README.md és FORRASJEGYZEK.md fájlokat. A projekt statikus, függőségmentes, GitHub Pages-kompatibilis HTML/CSS/JavaScript alkalmazás.

## Változatlanul megőrzendő játékmenet
1. **Címlap:** „IDŐZSETON – Mire költöd az életedet?”; a téma egy *átlagos iskolai nap*.
2. **Valós iskolai nap:** a tanuló pontosan 24 egyórás zsetont oszt ki. Piros/kötött: iskola/munka, utazás, egyéb kötelességek. Zöld/beosztható: alvás, tanulás, telefon/internet, család, barátok, sport/hobbi, hit/elcsendesedés, pihenés/szórakozás, egyéb. Az alvás **zöld**, bár alapvető szükséglet. Elkészül a 24 szeletes időkerék.
3. **Ideális, de megvalósítható iskolai nap:** újabb 24 zseton. A piros kategóriák először a valós napból öröklődnek, és zároltak, de tudatos feloldás után változtathatók. A kötött időből zöld tevékenységbe áttett zseton piros szegélyt kap, „lopott idő” megjelöléssel. Ez önmagában nem jelenti, hogy a diák erkölcstelenül cselekedett; a döntés indoka és következménye számít. Elkészül a második időkerék.
4. **Összehasonlítás:** valós és ideális kerék, kategóriánkénti óraszámok és eltérések, a kötött időből átcsoportosított zsetonok száma, forrásalapú személyre szabott igei/etikai reflexiók és kérdések. Több óra átcsoportosításával kapcsolatos saját vállalás is megfogalmazható. Eredmény menthető UTF-8 fájlba.

## Teológiai és pedagógiai forrásvédelem
A FORRASJEGYZEK.md a korábban ellenőrzött feltöltött forrásokat és az ezek alapján megfogalmazott reflexiókat dokumentálja. A teljes PDF és DOCX források **nincsenek** a publikus repóban. Ne keress helyettük más szakirodalmat, ne készíts új bibliai idézeteket, és ne tulajdoníts nem igazolt állításokat a forrásoknak. Ha ellenőrizendő tartalmat találsz, jelezd a PR-ben, és kérj külön tartalmi felülvizsgálatot; az ilyen részt ne változtasd meg automatikusan.

Nem vezethetsz be előírt egészségi, erkölcsi, vallásossági vagy képernyőidő-óraszám-küszöböt. **Nincs erkölcsi pontozás, rangsor vagy „tökéletes nap” értékelés.** A reflexiót kiválasztó algoritmus saját didaktikai játékszabály, nem forrásszöveg és nem diagnózis. Őrizd meg az ítélkezésmentes, érett tizenéveseknek szóló hangot.


## KÖTELEZŐ DIZÁJNFELADAT – AZONOS ARCULAT A KÉT ELŐZŐ JÁTÉKKAL
A felhasználó **kifejezett követelménye**, hogy az Időzseton **úgy nézzen ki, mint a Digitális Lelkiismeret és a DiákÉletkerék**. Ez nem opcionális inspiráció, hanem az elsődleges vizuális elfogadási feltétel. A két, ugyanazon GitHub-fiókban található nyilvános referenciaprojekt:

- **Digitális Lelkiismeret:** https://github.com/tobiasistvant-sketch/Digitalis-Lelkiismeret — különösen `index.html` és `css/styles.css`.
- **DiákÉletkerék:** https://github.com/tobiasistvant-sketch/DiakEletkerek — különösen `index.html` és `css/styles.css`. Ennek CSS-e már eleve a Digitális Lelkiismeret vizuális rendszerére épül.

**A reference CSS-ekben ellenőrzött design tokenek (ezeket következetesen használd):**
- Sötétkék fejléc és elsődleges mély tónus: `#052738`
- Meleg törtfehér oldalfelület: `#FBF9F6`
- Fehér kártyák: `#FFFFFF`; világosszürke felületek: `#F0F2F3`
- Türkiz kiemelések: `#31B6C7`; másodlagos kék akcentus: `#2196F3`
- Fő szöveg: `#1C2D37`; halvány szöveg: `#5A6E7B`; elválasztó: `#E0E5E8`
- Betűk: `Plus Jakarta Sans` törzsszöveg, `Space Grotesk` címsorok; rendszerbetűs fallback offline használathoz
- Kártyák: 8/12/20 px körüli lekerekítések, puha árnyékok; tágas, modern, mobilbarát szerkezet
- A tanári anyaghoz illő **pasztell magyarázó panelek** (például bibliai útmutatás, etikai reflexió), mint a referenciákban

**Szerkezeti és vizuális minták:**
- Egységes sötétkék fejléc, baloldali ikon és kétsoros játékcím, jobbra tantárgy-jelvény.
- Kezdőoldalon `hero-card`, `hero-badge`, nagy cím, alcím, felvezetés, 2–3 információs kártya, jól látható `Kezdés` gomb.
- További képernyőkön egységes lépésjelzők, világos kártyák, következetes navigáció és gombok.
- Az eredményképernyőn a grafikonok és időkerék esztétikája is illeszkedjen a referenciákhoz. A bibliai, etikai és önreflexiós szövegek kapjanak az előző játékokra emlékeztető, világos pasztell szekciókat.
- Külön maradjon jól megkülönböztethető a **piros/kötött**, **zöld/beosztható** és a **piros szegélyű, átcsoportosított („lopott idő”)** zseton. Ezek funkcionális adatjelölések, ezért az arculat egységesítése nem írhatja felül a jelentésüket.
- Ne legyen sötét témájú, neon/glow/üveg-hatású vagy túlzsúfolt új dizájn. Ne készíts egy harmadik, eltérő designrendszert.
- A grafikonok ne csak szín alapján legyenek érthetők: címkék, szöveges jelmagyarázat, kontraszt, billentyűzetes navigáció.
- Külső Google Fonts használatakor a program a betűk letöltése nélkül is maradjon jól használható. A korábban kért adatgyűjtés-mentesség és statikus működés változatlan.

**Kért eredmény:** egymás mellé téve a három projektet egyértelműen látszódjon, hogy ugyanannak az oktatási digitális tananyagcsaládnak a tagjai. Az `Időzseton` sajátossága a 24 órás zsetonkerék, **nem** egy külön vizuális stílus.

## Konkrét technikai feladatok
- Vizsgáld át a teljes működést: navigáció, visszalépés, szerkesztés, újrakezdés, teljes 24 órás kiosztás, és korábbi állapotok következetes kezelése.
- Ellenőrizd a pirosból zöldbe átcsoportosított zsetonok **eredetkövetését** módosítás, visszavonás, újraelosztás és újrakezdés esetén is.
- Mindkét időkerék minden esetben 24 egységet mutasson, és egyezzen a kategóriánkénti adatokkal.
- Az eltérések és a kiválasztott magyarázatok legyenek következetesek. Vizsgáld meg a nulla, szélsőséges és ismételten módosított kiosztásokat.
- Javítsd a mobilos használhatóságot, billentyűzetes kezelést, hozzáférhető címkéket, fókuszállapotot, színkontrasztot és kijelzést a két megadott referenciajáték arculatához igazítva.
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
8. **A dizájn összehangolt a Digitális Lelkiismeret és a DiákÉletkerék tényleges CSS/HTML megjelenésével; a funkcionális piros/zöld/átcsoportosított zsetonok továbbra is megkülönböztethetők.**

## Kért átadás
Először elemezd röviden a meglévő kódot. Utána a kért, referenciákhoz igazított arculati egységesítést és az indokolt technikai javításokat végezd el. Nyiss **pull requestet** a main ágra, és a leírásban külön mutasd be: a módosításokat, a lefuttatott teszteket, az esetleg fennmaradó hibákat és a további **tanári/teológiai tartalmi ellenőrzést** igénylő pontokat. A PR-t ne olvaszd be automatikusan.
