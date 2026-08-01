// German translations for unit converter page content.
// Provides localized titles, descriptions, about text, how-to steps, and FAQs
// for each converter type. The actual conversion logic (units, factors) stays
// in converters.ts — only the display strings are translated here.

import type { FaqItem } from './types';
import type { FactorRow } from './converters';

export interface ConverterI18n {
  name: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  intro: string;
  about: string[];
  howto: string[];
  factorRows: FactorRow[];
  faqs: FaqItem[];
  keywords: string[];
  note?: string;
}

const lengthDe: ConverterI18n = {
  name: 'Länge',
  title: 'Längenumrechner',
  metaTitle: 'Längenumrechner — cm in Zoll, Meter in Fuß, km in Meilen',
  metaDescription:
    'Kostenloser Längenumrechner für cm in Zoll, Meter in Fuß, km in Meilen und mehr. Sofortige, genaue Entfernungsumrechnungen zwischen metrischen und imperialen Einheiten.',
  description: 'Rechnen Sie cm in Zoll, Meter in Fuß, Kilometer in Meilen und jede andere Längeneinheit sofort um.',
  intro:
    'Dieser Längenumrechner wandelt jede Entfernungsmessung sofort in eine andere Einheit um. Er ist für die alltäglichen Suchen gedacht — cm in Zoll für eine Bildschirmgröße, Meter in Fuß für einen Raum oder Kilometer in Meilen für einen Lauf — und deckt metrische, imperiale und nautische Einheiten an einem Ort ab.',
  about: [
    'Länge (oder Entfernung) misst, wie weit zwei Punkte voneinander entfernt sind. Die Welt verwendet zwei Hauptsysteme: das metrische System, aufgebaut auf dem Meter und seinen dezimalen Vielfachen (Millimeter, Zentimeter, Kilometer), und das imperiale/US-amerikanische System, aufgebaut auf Zoll, Fuß, Yard und Meile. Da die meisten Länder metrisch messen, während die USA weiterhin Fuß und Zoll verwenden, ist die Umrechnung zwischen beiden eine der häufigsten Messaufgaben im Internet.',
    'Jede Umrechnung hier ist am Meter verankert, der SI-Basiseinheit der Länge. Ein Zoll ist definiert als genau 0,0254 Meter, ein Fuß als 0,3048 Meter und eine Meile als 1.609,344 Meter — die Ergebnisse sind daher exakt per Definition und keine gerundeten Näherungen. Geben Sie einen Wert ein und dieses Tool zeigt ihn gleichzeitig in allen unterstützten Einheiten an.',
  ],
  keywords: [
    'längenumrechner', 'cm in zoll', 'zoll in cm', 'meter in fuß',
    'fuß in meter', 'km in meilen', 'meilen in km', 'mm in zoll',
    'yard in meter', 'entfernungsrechner',
  ],
  howto: [
    'Geben Sie die Entfernung ein, die Sie umrechnen möchten.',
    'Wählen Sie die Ausgangseinheit (z. B. Zentimeter).',
    'Wählen Sie die Zieleinheit (z. B. Zoll).',
    'Das Ergebnis erscheint sofort — kein Knopfdruck nötig.',
    'Nutzen Sie die Tausch-Pfeile, um die Richtung umzukehren, oder lesen Sie das Raster für alle Einheiten auf einen Blick.',
  ],
  factorRows: [
    { label: '1 Zoll', value: '2,54 cm = 25,4 mm' },
    { label: '1 Fuß', value: '30,48 cm = 0,3048 m' },
    { label: '1 Yard', value: '0,9144 m = 3 Fuß' },
    { label: '1 Meile', value: '1,609344 km = 1.760 Yards' },
    { label: '1 Zentimeter', value: '0,393701 Zoll' },
    { label: '1 Meter', value: '3,28084 Fuß = 39,3701 Zoll' },
  ],
  faqs: [
    { q: 'Wie rechne ich cm in Zoll um?', a: 'Teilen Sie den Zentimeterwert durch 2,54. Zum Beispiel: 30 cm ÷ 2,54 ≈ 11,81 Zoll. Oder multiplizieren Sie mit 0,393701.' },
    { q: 'Wie viele Fuß sind ein Meter?', a: 'Ein Meter entspricht genau 3,28084 Fuß oder 39,3701 Zoll. Um Meter in Fuß umzurechnen, multiplizieren Sie mit 3,28084.' },
    { q: 'Wie rechne ich km in Meilen um?', a: 'Multiplizieren Sie Kilometer mit 0,621371, um Meilen zu erhalten. 10 km sind also etwa 6,21 Meilen. Umgekehrt multiplizieren Sie Meilen mit 1,60934.' },
    { q: 'Was ist der Unterschied zwischen metrisch und imperial?', a: 'Das metrische System basiert auf dem Meter und verwendet Dezimalvielfache (mm, cm, km). Das imperiale System verwendet Zoll, Fuß, Yard und Meilen mit unterschiedlichen Umrechnungsfaktoren.' },
    { q: 'Wie genau ist dieser Längenumrechner?', a: 'Die Umrechnungen verwenden die exakten, offiziell definierten Faktoren (1 Zoll = exakt 0,0254 m), sodass die Ergebnisse mathematisch exakt sind.' },
  ],
};

const weightDe: ConverterI18n = {
  name: 'Gewicht',
  title: 'Gewichtsumrechner',
  metaTitle: 'Gewichtsumrechner — kg in lbs, Gramm in Unzen, Stone in kg',
  metaDescription:
    'Kostenloser Gewichtsumrechner für kg in Pfund, Gramm in Unzen, Stone in Kilogramm und mehr. Sofortige, genaue Massenumrechnungen.',
  description: 'Rechnen Sie kg in Pfund, Gramm in Unzen, Stone in Kilogramm und jede andere Gewichtseinheit sofort um.',
  intro:
    'Dieser Gewichtsumrechner wandelt jede Masse sofort von einer Einheit in eine andere um. Ob Sie ein Rezept umrechnen, Ihr Gepäck prüfen oder Fitnessdaten vergleichen — geben Sie einfach den Wert ein und erhalten Sie das Ergebnis.',
  about: [
    'Gewicht (genauer: Masse) misst die Stoffmenge eines Objekts. Das metrische System verwendet Gramm und Kilogramm, während das imperiale System Unzen, Pfund und Stone nutzt. Da Lebensmittelverpackungen, Fitnessgeräte und internationale Versanddaten oft unterschiedliche Einheiten verwenden, ist ein schneller Umrechner im Alltag unverzichtbar.',
    'Alle Werte sind am Kilogramm verankert, der SI-Basiseinheit der Masse. Ein Pfund (lb) entspricht exakt 0,45359237 kg und eine Unze exakt 28,349523125 g. Die Ergebnisse sind daher per Definition exakt.',
  ],
  keywords: [
    'gewichtsumrechner', 'kg in pfund', 'pfund in kg', 'gramm in unzen',
    'unzen in gramm', 'stone in kg', 'kg in stone', 'massenrechner',
    'lbs in kg', 'gewicht umrechnen',
  ],
  howto: [
    'Geben Sie das Gewicht ein, das Sie umrechnen möchten.',
    'Wählen Sie die Ausgangseinheit (z. B. Kilogramm).',
    'Wählen Sie die Zieleinheit (z. B. Pfund).',
    'Das umgerechnete Gewicht erscheint sofort.',
    'Tauschen Sie die Richtung mit den Pfeilen oder lesen Sie das Raster für alle Einheiten.',
  ],
  factorRows: [
    { label: '1 Kilogramm', value: '2,20462 lb = 35,274 oz' },
    { label: '1 Pfund (lb)', value: '0,453592 kg = 16 oz' },
    { label: '1 Unze (oz)', value: '28,3495 g' },
    { label: '1 Stone', value: '6,35029 kg = 14 lb' },
    { label: '1 Gramm', value: '0,035274 oz' },
    { label: '1 metrische Tonne', value: '1.000 kg = 2.204,62 lb' },
  ],
  faqs: [
    { q: 'Wie rechne ich kg in Pfund um?', a: 'Multiplizieren Sie Kilogramm mit 2,20462. Zum Beispiel: 70 kg × 2,20462 ≈ 154,3 lb.' },
    { q: 'Wie viele Gramm hat eine Unze?', a: 'Eine Unze (oz) entspricht etwa 28,3495 Gramm. Multiplizieren Sie Unzen mit 28,3495 für Gramm.' },
    { q: 'Was ist ein Stone in Kilogramm?', a: 'Ein Stone entspricht exakt 6,35029 kg oder 14 Pfund. In Großbritannien wird Stone häufig für das Körpergewicht verwendet.' },
    { q: 'Wie rechne ich Gramm in Unzen um?', a: 'Teilen Sie den Grammwert durch 28,3495 oder multiplizieren Sie mit 0,035274.' },
    { q: 'Ist der Gewichtsumrechner kostenlos?', a: 'Ja. Der Umrechner ist völlig kostenlos, ohne Anmeldung, und alle Berechnungen laufen in Ihrem Browser.' },
  ],
};

const temperatureDe: ConverterI18n = {
  name: 'Temperatur',
  title: 'Temperaturumrechner',
  metaTitle: 'Temperaturumrechner — Celsius in Fahrenheit, Fahrenheit in Celsius, Kelvin',
  metaDescription:
    'Kostenloser Temperaturumrechner für Celsius in Fahrenheit, Fahrenheit in Celsius und Kelvin. Sofortige, exakte Umrechnung mit der korrekten Formel.',
  description: 'Rechnen Sie Celsius in Fahrenheit, Fahrenheit in Celsius und Kelvin sofort mit der exakten Formel um.',
  intro:
    'Dieser Temperaturumrechner wandelt Celsius, Fahrenheit und Kelvin sofort ineinander um. Er ist ideal für Reisen, Kochen, Wissenschaft oder wann immer Sie eine Temperaturangabe in einem anderen Format benötigen.',
  about: [
    'Temperatur misst die thermische Energie eines Objekts oder einer Umgebung. Die drei gängigsten Skalen sind Celsius (°C, weltweit im Alltag verwendet), Fahrenheit (°F, hauptsächlich in den USA) und Kelvin (K, in der Wissenschaft). Im Gegensatz zu Länge oder Gewicht ist die Umrechnung nicht linear — Fahrenheit und Celsius haben unterschiedliche Nullpunkte und Skalengrößen.',
    'Die Umrechnungsformeln lauten: °F = °C × 9/5 + 32 und °C = (°F − 32) × 5/9. Kelvin = °C + 273,15. Dieser Rechner wendet die exakten Formeln an und zeigt das Ergebnis sofort an.',
  ],
  keywords: [
    'temperaturumrechner', 'celsius in fahrenheit', 'fahrenheit in celsius',
    'kelvin umrechnen', 'temperatur umrechnen', 'grad umrechner',
    'celsius fahrenheit formel', 'fahrenheit celsius', 'temperaturrechner',
    'c in f umrechnen',
  ],
  howto: [
    'Geben Sie die Temperatur ein, die Sie umrechnen möchten.',
    'Wählen Sie die Ausgangsskala (z. B. Celsius).',
    'Wählen Sie die Zielskala (z. B. Fahrenheit).',
    'Das Ergebnis erscheint sofort mit der exakten Formel.',
    'Tauschen Sie die Richtung mit den Pfeilen.',
  ],
  factorRows: [
    { label: '0 °C', value: '32 °F = 273,15 K' },
    { label: '100 °C', value: '212 °F = 373,15 K' },
    { label: '37 °C (Körpertemperatur)', value: '98,6 °F' },
    { label: '−40 °C', value: '−40 °F (Schnittpunkt)' },
    { label: '0 K (absoluter Nullpunkt)', value: '−273,15 °C = −459,67 °F' },
  ],
  faqs: [
    { q: 'Wie rechne ich Celsius in Fahrenheit um?', a: 'Multiplizieren Sie die Celsius-Temperatur mit 9/5 und addieren Sie 32. Beispiel: 25 °C × 9/5 + 32 = 77 °F.' },
    { q: 'Wie rechne ich Fahrenheit in Celsius um?', a: 'Subtrahieren Sie 32 vom Fahrenheit-Wert und multiplizieren Sie mit 5/9. Beispiel: 72 °F → (72 − 32) × 5/9 ≈ 22,2 °C.' },
    { q: 'Was ist der Unterschied zwischen Celsius und Kelvin?', a: 'Kelvin = Celsius + 273,15. Die Skalengröße ist identisch, nur der Nullpunkt unterscheidet sich (0 K = −273,15 °C, der absolute Nullpunkt).' },
    { q: 'Bei welcher Temperatur sind Celsius und Fahrenheit gleich?', a: 'Bei −40 Grad. −40 °C = −40 °F — das ist der einzige Schnittpunkt beider Skalen.' },
    { q: 'Ist der Temperaturumrechner genau?', a: 'Ja. Er verwendet die exakten Umrechnungsformeln ohne Rundung, sodass die Ergebnisse mathematisch korrekt sind.' },
  ],
};

const speedDe: ConverterI18n = {
  name: 'Geschwindigkeit',
  title: 'Geschwindigkeitsumrechner',
  metaTitle: 'Geschwindigkeitsumrechner — km/h in mph, m/s, Knoten',
  metaDescription:
    'Kostenloser Geschwindigkeitsumrechner für km/h in mph, mph in km/h, Knoten, m/s und Fuß pro Sekunde. Sofortige, genaue Umrechnung.',
  description: 'Rechnen Sie mph in km/h, km/h in mph, Knoten, m/s und Fuß pro Sekunde sofort um.',
  intro:
    'Dieser Geschwindigkeitsumrechner wandelt jede Geschwindigkeitsangabe sofort in eine andere Einheit um. Ideal für Autofahrer, Sportler, Seefahrer oder wenn Sie internationale Geschwindigkeitsangaben vergleichen möchten.',
  about: [
    'Geschwindigkeit misst, wie schnell sich ein Objekt bewegt — die zurückgelegte Strecke pro Zeiteinheit. Die gebräuchlichsten Einheiten sind Kilometer pro Stunde (km/h), Meilen pro Stunde (mph), Meter pro Sekunde (m/s) und Knoten (nautische Meilen pro Stunde). Da Tachometer, Wetterberichte und Sportdaten je nach Land unterschiedliche Einheiten verwenden, ist ein schneller Umrechner praktisch.',
    'Alle Werte sind am Meter pro Sekunde verankert (SI-Einheit). 1 km/h = 1/3,6 m/s, 1 mph ≈ 0,44704 m/s und 1 Knoten ≈ 0,514444 m/s.',
  ],
  keywords: [
    'geschwindigkeitsumrechner', 'km/h in mph', 'mph in km/h', 'knoten umrechnen',
    'm/s umrechnen', 'geschwindigkeit umrechnen', 'meilen pro stunde',
    'kilometer pro stunde', 'speed converter deutsch', 'fuß pro sekunde',
  ],
  howto: [
    'Geben Sie die Geschwindigkeit ein, die Sie umrechnen möchten.',
    'Wählen Sie die Ausgangseinheit (z. B. km/h).',
    'Wählen Sie die Zieleinheit (z. B. mph).',
    'Das Ergebnis erscheint sofort.',
    'Tauschen Sie die Richtung oder lesen Sie das Raster für alle Einheiten.',
  ],
  factorRows: [
    { label: '1 km/h', value: '0,621371 mph = 0,277778 m/s' },
    { label: '1 mph', value: '1,60934 km/h = 0,44704 m/s' },
    { label: '1 Knoten', value: '1,852 km/h = 1,15078 mph' },
    { label: '1 m/s', value: '3,6 km/h = 2,23694 mph' },
    { label: '100 km/h', value: '62,137 mph' },
    { label: '60 mph', value: '96,561 km/h' },
  ],
  faqs: [
    { q: 'Wie rechne ich km/h in mph um?', a: 'Multiplizieren Sie km/h mit 0,621371. Beispiel: 100 km/h × 0,621371 ≈ 62,1 mph.' },
    { q: 'Wie rechne ich mph in km/h um?', a: 'Multiplizieren Sie mph mit 1,60934. Beispiel: 60 mph × 1,60934 ≈ 96,6 km/h.' },
    { q: 'Was ist ein Knoten in km/h?', a: 'Ein Knoten entspricht exakt 1,852 km/h oder einer nautischen Meile pro Stunde. Knoten werden in der See- und Luftfahrt verwendet.' },
    { q: 'Wie rechne ich m/s in km/h um?', a: 'Multiplizieren Sie m/s mit 3,6. Beispiel: 10 m/s × 3,6 = 36 km/h.' },
    { q: 'Ist dieser Geschwindigkeitsumrechner kostenlos?', a: 'Ja. Komplett kostenlos, ohne Anmeldung, und alle Berechnungen laufen lokal in Ihrem Browser.' },
  ],
};

const volumeDe: ConverterI18n = {
  name: 'Volumen',
  title: 'Volumenumrechner',
  metaTitle: 'Volumenumrechner — Liter in Gallonen, ml in Flüssigunzen, Tassen',
  metaDescription:
    'Kostenloser Volumenumrechner für Liter in Gallonen, Milliliter in Flüssigunzen, Tassen in ml und mehr. Sofortige, genaue Volumenumrechnungen.',
  description: 'Rechnen Sie Liter in Gallonen, ml in Flüssigunzen, Tassen in Milliliter und mehr sofort um.',
  intro:
    'Dieser Volumenumrechner wandelt jedes Hohlmaß sofort in eine andere Einheit um. Ob für ein Kochrezept, beim Tanken oder beim Vergleich von Getränkegrößen — geben Sie den Wert ein und erhalten Sie die Umrechnung.',
  about: [
    'Volumen misst den Rauminhalt eines dreidimensionalen Körpers oder einer Flüssigkeit. Das metrische System verwendet Liter und Milliliter, während das US-System Gallonen, Quarts, Pints, Tassen und Flüssigunzen nutzt. Auch das britische imperiale System hat eigene Gallonen und Flüssigunzen, die sich von den US-Einheiten unterscheiden.',
    'Alle Werte sind am Liter verankert. Eine US-Gallone entspricht 3,785412 Litern, eine imperiale Gallone 4,54609 Litern. Eine US-Flüssigunze ist 29,5735 ml. Die Ergebnisse sind exakt nach den offiziellen Definitionen.',
  ],
  keywords: [
    'volumenumrechner', 'liter in gallonen', 'gallonen in liter', 'ml in flüssigunzen',
    'tassen in ml', 'milliliter umrechnen', 'volumen umrechnen',
    'hohlmaße umrechnen', 'kubikzentimeter in liter', 'flüssigunzen in ml',
  ],
  howto: [
    'Geben Sie das Volumen ein, das Sie umrechnen möchten.',
    'Wählen Sie die Ausgangseinheit (z. B. Liter).',
    'Wählen Sie die Zieleinheit (z. B. US-Gallonen).',
    'Das umgerechnete Volumen erscheint sofort.',
    'Tauschen Sie die Richtung oder lesen Sie das Raster für alle Volumeneinheiten.',
  ],
  factorRows: [
    { label: '1 US-Gallone', value: '3,785412 L = 128 US-fl oz' },
    { label: '1 imperiale Gallone', value: '4,54609 L = 1,20095 US-Gallonen' },
    { label: '1 Liter', value: '0,264172 US-Gallonen = 33,814 US-fl oz' },
    { label: '1 US-Tasse', value: '236,588 mL = 8 US-fl oz' },
    { label: '1 US-Flüssigunze', value: '29,5735 mL' },
    { label: '1 Kubikmeter', value: '1.000 L = 264,172 US-Gallonen' },
  ],
  faqs: [
    { q: 'Wie rechne ich Liter in Gallonen um?', a: 'Für US-Gallonen teilen Sie Liter durch 3,785412. 10 Liter ≈ 2,64 US-Gallonen. Für imperiale Gallonen teilen Sie durch 4,54609.' },
    { q: 'Wie viele ml hat eine Flüssigunze?', a: 'Eine US-Flüssigunze entspricht etwa 29,5735 ml. Eine imperiale (britische) Flüssigunze ist etwas kleiner mit 28,4131 ml.' },
    { q: 'Wie rechne ich Tassen in ml um?', a: 'Eine US-Tasse entspricht etwa 236,588 ml. Multiplizieren Sie die Tassen mit 236,588 für Milliliter.' },
    { q: 'Warum sind US- und UK-Gallonen unterschiedlich?', a: 'Sie wurden getrennt standardisiert. Eine US-Gallone fasst 3,785 Liter, eine imperiale (UK) Gallone 4,546 Liter — etwa 20 % mehr.' },
    { q: 'Ist der Volumenumrechner kostenlos?', a: 'Ja. Komplett kostenlos, ohne Anmeldung, alle Berechnungen laufen in Ihrem Browser.' },
  ],
};

const areaDe: ConverterI18n = {
  name: 'Fläche',
  title: 'Flächenumrechner',
  metaTitle: 'Flächenumrechner — Quadratfuß in m², Acres in Hektar',
  metaDescription:
    'Kostenloser Flächenumrechner für Quadratfuß in Quadratmeter, Acres in Hektar und m² in ft². Sofortige, genaue Flächenumrechnungen.',
  description: 'Rechnen Sie Quadratfuß in Quadratmeter, Acres in Hektar und jede andere Flächeneinheit sofort um.',
  intro:
    'Dieser Flächenumrechner wandelt jede Oberflächenmessung sofort in eine andere Einheit um. Er konzentriert sich auf Umrechnungen für Immobilien, Bau und Grundstücke — Quadratfuß in Quadratmeter für Grundrisse und Acres in Hektar für Landflächen.',
  about: [
    'Fläche misst die Größe einer zweidimensionalen Oberfläche wie eines Bodens, einer Wand oder eines Grundstücks. Im metrischen System werden Quadratmeter (m²) und Quadratkilometer verwendet, im imperialen System Quadratfuß (ft²), Quadratyards und Quadratmeilen, plus Acre und Hektar für Landflächen.',
    'Alle Werte sind am Quadratmeter verankert, der SI-Einheit für Fläche. Ein Quadratfuß = 0,09290304 m², ein Acre = 4.046,8564224 m² und ein Hektar = exakt 10.000 m². Da Fläche mit dem Quadrat der Länge skaliert, sind die Faktoren die quadrierten Längenfaktoren.',
  ],
  keywords: [
    'flächenumrechner', 'quadratfuß in quadratmeter', 'quadratmeter in quadratfuß',
    'acres in hektar', 'hektar in acres', 'm² in ft²', 'ft² in m²',
    'fläche umrechnen', 'grundstücksfläche rechner', 'quadratyard in m²',
  ],
  howto: [
    'Geben Sie die Fläche ein, die Sie umrechnen möchten.',
    'Wählen Sie die Ausgangseinheit (z. B. Quadratfuß).',
    'Wählen Sie die Zieleinheit (z. B. Quadratmeter).',
    'Das Ergebnis erscheint sofort.',
    'Tauschen Sie die Richtung oder lesen Sie das Raster für alle Flächeneinheiten.',
  ],
  factorRows: [
    { label: '1 Quadratfuß', value: '0,092903 m² = 144 Quadratzoll' },
    { label: '1 Quadratmeter', value: '10,7639 ft² = 1,19599 Quadratyards' },
    { label: '1 Acre', value: '4.046,86 m² = 43.560 Quadratfuß' },
    { label: '1 Hektar', value: '10.000 m² = 2,471054 Acres' },
    { label: '1 Quadratkilometer', value: '100 Hektar = 247,105 Acres' },
    { label: '1 Quadratmeile', value: '2,589988 km² = 640 Acres' },
  ],
  faqs: [
    { q: 'Wie rechne ich Quadratfuß in Quadratmeter um?', a: 'Multiplizieren Sie Quadratfuß mit 0,092903. Beispiel: 1.000 ft² × 0,092903 ≈ 92,9 m².' },
    { q: 'Wie viele Quadratfuß hat ein Acre?', a: 'Ein Acre entspricht exakt 43.560 Quadratfuß oder etwa 4.046,86 Quadratmeter.' },
    { q: 'Wie rechne ich Acres in Hektar um?', a: 'Multiplizieren Sie Acres mit 0,404686 für Hektar. 10 Acres ≈ 4,05 Hektar.' },
    { q: 'Was ist größer — ein Acre oder ein Hektar?', a: 'Ein Hektar ist größer: 1 Hektar = 2,471 Acres. Ein Hektar entspricht 10.000 m² (100 m × 100 m).' },
    { q: 'Ist der Flächenumrechner kostenlos?', a: 'Ja. Völlig kostenlos, ohne Anmeldung, und alle Berechnungen laufen lokal in Ihrem Browser.' },
  ],
};

const currencyDe: ConverterI18n = {
  name: 'Währung',
  title: 'Währungsumrechner',
  metaTitle: 'Währungsumrechner — USD in EUR, EUR in USD, GBP, JPY und mehr',
  metaDescription:
    'Kostenloser Währungsumrechner mit täglichen Wechselkursen. Rechnen Sie USD in EUR, EUR in USD, GBP, JPY, INR und mehr sofort um.',
  description: 'Rechnen Sie USD in EUR, USD in INR, GBP, JPY und mehr mit täglichen Wechselkursen und interaktiven Kursverlauf-Diagrammen um.',
  intro:
    'Dieser Währungsumrechner zeigt aktuelle Wechselkurse für über 50 Währungen. Er eignet sich für Reiseplanung, internationale Einkäufe oder den schnellen Überblick über den aktuellen Kurs — mit täglicher Aktualisierung und Kursverlauf-Diagrammen.',
  about: [
    'Ein Währungsumrechner wandelt einen Geldbetrag von einer Währung in eine andere um, basierend auf dem aktuellen Wechselkurs. Wechselkurse schwanken ständig aufgrund von Marktbedingungen, Zinspolitik und Wirtschaftsdaten. Dieser Rechner verwendet täglich aktualisierte Kurse und zeigt auch den historischen Verlauf.',
    'Alle Kurse beziehen sich auf den US-Dollar (USD) als Basiswährung. Die Umrechnung zwischen zwei Nicht-USD-Währungen erfolgt über den Umweg USD: Betrag × (Zielkurs / Ausgangskurs). Die angezeigten Kurse sind Richtwerte — für tatsächliche Transaktionen gelten die Kurse Ihrer Bank.',
  ],
  keywords: [
    'währungsumrechner', 'usd in eur', 'eur in usd', 'dollar in euro',
    'euro in dollar', 'pfund in euro', 'wechselkurs', 'devisenkurs',
    'währung umrechnen', 'geld umrechnen',
  ],
  howto: [
    'Geben Sie den Betrag ein, den Sie umrechnen möchten.',
    'Wählen Sie die Ausgangswährung (z. B. EUR).',
    'Wählen Sie die Zielwährung (z. B. USD).',
    'Der umgerechnete Betrag und der aktuelle Kurs erscheinen sofort.',
    'Scrollen Sie nach unten, um den historischen Kursverlauf im Diagramm zu sehen.',
  ],
  factorRows: [
    { label: '1 EUR', value: '≈ 1,08 USD' },
    { label: '1 GBP', value: '≈ 1,27 USD' },
    { label: '1 USD', value: '≈ 0,93 EUR' },
    { label: '1 CHF', value: '≈ 1,12 USD' },
    { label: '1 JPY', value: '≈ 0,0067 USD' },
    { label: '1 USD', value: '≈ 83,3 INR' },
  ],
  note: 'Hinweis: Die angezeigten Wechselkurse werden täglich aktualisiert und dienen nur als Richtwerte. Für tatsächliche Finanztransaktionen verwenden Sie bitte die aktuellen Kurse Ihrer Bank oder Ihres Finanzdienstleisters.',
  faqs: [
    { q: 'Wie aktuell sind die Wechselkurse?', a: 'Die Kurse werden täglich aktualisiert. Sie sind Richtwerte für den Überblick — für exakte Transaktionskurse wenden Sie sich an Ihre Bank.' },
    { q: 'Wie rechne ich Dollar in Euro um?', a: 'Geben Sie den USD-Betrag ein und wählen Sie EUR als Zielwährung. Der aktuelle Kurs und das Ergebnis erscheinen sofort.' },
    { q: 'Kann ich auch exotische Währungen umrechnen?', a: 'Ja, der Umrechner unterstützt über 50 Währungen, darunter auch weniger gehandelte wie THB, VND, NGN und viele mehr.' },
    { q: 'Sind die Wechselkurse für Bankgeschäfte geeignet?', a: 'Nein. Die Kurse sind indikative Mittelkurse. Banken und Wechselstuben berechnen einen Aufschlag (Spread). Nutzen Sie die Kurse für eine Orientierung.' },
    { q: 'Ist der Währungsumrechner kostenlos?', a: 'Ja. Komplett kostenlos, ohne Anmeldung, und Ihre Daten bleiben auf Ihrem Gerät.' },
  ],
};

// ---------------------------------------------------------------------------
// Hub page strings
// ---------------------------------------------------------------------------

export interface ConverterHubI18n {
  metaTitle: string;
  metaDescription: string;
  breadcrumbHome: string;
  breadcrumbHub: string;
  eyebrowCount: string;
  title: string;
  description: string;
  proseTitle: string;
  proseIntro: string;
  faqTitle: string;
}

export const converterHubDe: ConverterHubI18n = {
  metaTitle: 'Einheitenumrechner — Kostenloser Online-Umrechnungsrechner',
  metaDescription:
    'Kostenloser Einheitenumrechner: Länge, Gewicht, Temperatur, Geschwindigkeit, Volumen, Fläche und Währung. Schnelle, genaue Umrechnungen ohne Anmeldung.',
  breadcrumbHome: 'Startseite',
  breadcrumbHub: 'Einheitenumrechner',
  eyebrowCount: '7 Umrechner',
  title: 'Einheitenumrechner',
  description:
    'Ein schneller, kostenloser Umrechnungsrechner. Wählen Sie unten einen Umrechner, um sofort zwischen metrischen und imperialen Einheiten zu wechseln — ohne Anmeldung, ohne Ablenkung, Ergebnisse beim Tippen.',
  proseTitle: 'Ein Umrechner für jede Alltagsmessung',
  proseIntro:
    'Ob Sie ein Rezept nachkochen, eine Reise planen, eine Produktspezifikation lesen oder Hausaufgaben machen — häufig müssen Sie einen Wert von einer Einheit in eine andere umrechnen. Dieser Einheitenumrechner vereint die gängigsten Umrechnungen an einem Ort, mit einem eigenen Tool für jeden Messtyp. Jeder Umrechner läuft vollständig in Ihrem Browser — die Ergebnisse erscheinen sofort und Ihre Eingaben verlassen nie Ihr Gerät.',
  faqTitle: 'Häufige Fragen zum Einheitenumrechner',
};

// ---------------------------------------------------------------------------
// Individual converter page section labels
// ---------------------------------------------------------------------------

export interface ConverterPageLabelsDe {
  breadcrumbHome: string;
  breadcrumbHub: string;
  eyebrow: string;
  aboutPrefix: string;
  aboutSuffix: string;
  howtoPrefix: string;
  howtoSuffix: string;
  factorSuffix: string;
  factorIntro: string;
  supportedPrefix: string;
  supportedSuffix: string;
  faqTitle: string;
  otherConverters: string;
  allTools: string;
  hubCta: string;
}

export const converterPageLabels: ConverterPageLabelsDe = {
  breadcrumbHome: 'Startseite',
  breadcrumbHub: 'Einheitenumrechner',
  eyebrow: 'Einheitenumrechner',
  aboutPrefix: 'Über den ',
  aboutSuffix: '',
  howtoPrefix: 'So verwenden Sie diesen ',
  howtoSuffix: '',
  factorSuffix: ' Umrechnungsfaktoren',
  factorIntro: 'Exakte Referenzfaktoren dieses Umrechners:',
  supportedPrefix: 'Unterstützte ',
  supportedSuffix: '-Einheiten',
  faqTitle: 'Häufig gestellte Fragen',
  otherConverters: 'Weitere Umrechner',
  allTools: 'Alle Tools',
  hubCta: 'Einheitenumrechner-Übersicht',
};

// ---------------------------------------------------------------------------
// Export: map keyed by English converter slug
// ---------------------------------------------------------------------------

export const convertersDe: Record<string, ConverterI18n> = {
  length: lengthDe,
  weight: weightDe,
  temperature: temperatureDe,
  speed: speedDe,
  volume: volumeDe,
  area: areaDe,
  currency: currencyDe,
};
