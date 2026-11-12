# Időzseton – Mire költöd az életedet?

**Magyar nyelvű, interaktív keresztyén etikai önismereti játék XI. osztályos diákoknak.**

## A játék működése
1. Címlap.
2. „A valóság – Így telik egy iskolai napom”: 24 egyórás zseton beosztása és 24 szeletes időkerék.
3. „Ideális iskolai napom”: újabb 24 órás beosztás, alapból rögzített, de indokoltan módosítható piros (kötött) zsetonokkal és külön jelölt „lopott idővel”.
4. „Szembesülés”: két időkerék és eltérésgrafikon, forrásalapú személyes reflexiók, bibliai útmutatás, többórás vállalás és export.

**Megjegyzés:** az „alvás” beosztható (zöld) tevékenység, de szükséges pihenés; a szabadidő értékelése nem minősíti a diákot. Nincsenek előírt, tökéletes óraszámok vagy erkölcsi pontozás.

## Kipróbálás és közzététel
A böngészős játék egyelőre az `index.html` fájlból, függőség és telepítés nélkül elindítható. GitHub Pages-en a `main` ág gyökérmappájából tehető közzé.

## Személyes eredménylap

Az összehasonlító képernyőn három helyi letöltés választható:

- **PNG:** nagy felbontású személyes eredménylap, egymás melletti valós és ideális időkerékkel, 12 kategóriás óratáblázattal, eltérésekkel, az aktuális vállalással és bibliai iránytűvel. A kép külön Canvas-elrendezésből készül, nem a képernyő fényképe, ezért mobilon is ugyanaz az elrendezése.
- **PDF:** ugyanennek az eredménylapnak nyomtatható, szükség esetén többoldalas A4-változata. A rendszer helyben rajzolt, éles oldalképeket ágyaz a PDF-be; a szöveg ezért nem kereshető vagy kijelölhető. A magyar betűket rendszerbetűkkel rajzolja, külön betűkészlet vagy külső könyvtár nélkül.
- **TXT:** részletes, UTF-8 BOM-os szöveg, az összes kapcsolódó eredeti igei útmutatással, igehellyel és reflexiós kérdéssel. Az ismétlődő szakirodalmi hivatkozásokat nem másolja minden bekezdés mögé.

A hosszú vállalás több oldalra tördelődik, a szöveget a rendszer nem csonkítja. A PNG hosszú eredménynél a mobilos képméretkorlátokhoz igazítja a felbontást. Ha egy jól olvasható kép már nem készíthető, érthető hibaüzenet PDF vagy TXT választását javasolja. A PDF továbbra is több oldalra tördelhető.

A letöltés nem módosítja az időbeosztást, és csak két teljes, szabályos 24 órás nappal engedélyezett. Az exportokhoz nem történik hálózati kérés. A teljes bibliográfia a [Felhasznált források](sources.html) oldalon és az eredeti [forrásjegyzékben](FORRASJEGYZEK.md) elérhető; az alkalmazás meglévő forrásmegjelölései is megmaradtak.

## Automatikus tesztek

A repozitórium gyökeréből, Node.js használatával:

```bash
node tests/game_mechanics.test.js
node tests/navigation_guard.test.js
node tests/result_exports.test.js
node tests/result_sheet.test.js
node tests/pdf_export.test.js
```

A tesztek a játékmechanikát, a 24 órás navigációs és exportvédelmet, a közös adatpillanatképet, a hosszú szövegek tördelését, a hibaágakat és a többoldalas PDF szerkezetét ellenőrzik.

## Források és fejlesztés
- [FORRASJEGYZEK.md](FORRASJEGYZEK.md) – a bibliai és pedagógiai magyarázatok forrásai és az értelmezési szabályok.
- [JULES_FELADAT.md](JULES_FELADAT.md) – a Google Jules-nak előkészített, ellenőrizhető fejlesztési specifikáció és elfogadási feltételek.

### Kötelező vizuális referenciák
Az Időzseton végleges dizájnja a már meglévő tananyagcsaládhoz illeszkedjen:

- [Digitális Lelkiismeret](https://github.com/tobiasistvant-sketch/Digitalis-Lelkiismeret)
- [DiákÉletkerék](https://github.com/tobiasistvant-sketch/DiakEletkerek)

A részletes, a referencia-repók CSS-éből ellenőrzött paletta és vizuális szabályok a `JULES_FELADAT.md` dokumentumban találhatók. A jelenlegi v0.2 prototípus megjelenése **nem végleges**, a négyoldalas játékmenet és a forrásalapú etikai tartalom azonban megőrzendő.

## Adatkezelés
A játék kliensoldali. Nem kér regisztrációt és nem gyűjt személyes adatokat; a helyben készített eredmény csak a játékos döntésére kerülhet letöltésre. A kutatáshoz használt PDF- és DOCX-forrásfájlok nem szerepelnek a nyilvános repóban.
