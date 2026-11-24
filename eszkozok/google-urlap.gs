/**
 * Vasdesign – ajánlatkérő Google Űrlap létrehozása
 *
 * HASZNÁLAT (egyszer kell lefuttatni):
 * 1. Lépj be az új e-mail-fiókoddal, és nyisd meg: https://script.google.com
 * 2. „Új projekt” → töröld ki a benne lévő pár sort → másold be ezt az egész fájlt.
 * 3. Lent az ERTESITES_CIM sorba írd be, hová kéred az értesítéseket.
 * 4. Fent a függvényválasztóban legyen „letrehoz”, majd „Futtatás”.
 * 5. Engedélyezd a hozzáférést (Speciális → „Ugrás a projektre” → Engedélyezés).
 * 6. A lenti „Végrehajtási napló” tartalmát másold ki és küldd el nekem.
 */

const ERTESITES_CIM = 'IDE_IRD_AZ_EMAIL_CIMET@gmail.com';

const TIPUSOK = [
  'Galéria, lépcső', 'Vas-üveg ajtó, térelválasztó', 'Kerítés, kapu', 'Korlát',
  'Ablakrács, biztonsági rács', 'Előtető', 'Polc, bútor, egyéb vas elem',
  'Fürdőszoba, terasz, lakásátalakítás', 'Régi vasszerkezet felújítása',
];
const HELYEK = ['Beltér', 'Kültér', 'Párás tér (fürdő)'];
const FELULETEK = [
  'Még nem tudom, kérek javaslatot', 'Porfestés', 'Tűzihorganyzás + porfestés (duplex)',
  'Tűzihorganyzás', 'Nyers acél, viasz vagy lakk', 'Kovácsoltvas-hatású / vascsillám festés',
  'Patinázott, antik hatás', 'Corten acél', 'Rozsdamentes acél',
];
const HOZZAJARULAS = 'Elolvastam az adatkezelési tájékoztatót, és hozzájárulok, hogy az adataimat az ajánlatkérés megválaszolásához kezeljék.';

function letrehoz() {
  if (ERTESITES_CIM.indexOf('IDE_IRD') === 0) throw new Error('Előbb írd be az ERTESITES_CIM sorba az e-mail címet!');

  const form = FormApp.create('Vasdesign – ajánlatkérés');
  form.setDescription('Egyedi vas- és kovácsoltvas elemek, belsőépítészet. Az üzenetre e-mailben vagy telefonon válaszolok.');
  form.setConfirmationMessage('Köszönöm, megkaptam az üzenetét. Hamarosan jelentkezem.');
  form.setShowLinkToRespondAgain(false);
  form.setAllowResponseEdits(false);

  const emailSzabaly = FormApp.createTextValidation()
    .setHelpText('Kérem, érvényes e-mail címet adjon meg.')
    .requireTextIsEmail().build();

  form.addTextItem().setTitle('Név').setRequired(true);
  form.addTextItem().setTitle('E-mail cím').setValidation(emailSzabaly).setRequired(true);
  form.addTextItem().setTitle('Telefonszám (nem kötelező)');
  form.addListItem().setTitle('Mire kér ajánlatot?').setChoiceValues(TIPUSOK).setRequired(true);
  form.addTextItem().setTitle('Hozzávetőleges méret').setHelpText('pl. 12 fm kerítés, 1,1 m magas');
  form.addMultipleChoiceItem().setTitle('Hová kerül?').setChoiceValues(HELYEK);
  form.addListItem().setTitle('Felületkezelés').setChoiceValues(FELULETEK);
  form.addParagraphTextItem().setTitle('Üzenet').setHelpText('Stílus, szín, határidő, helyszín (kerület)…').setRequired(true);
  form.addCheckboxItem().setTitle('Adatkezelés').setChoiceValues([HOZZAJARULAS]).setRequired(true);

  // Válaszok táblázatba
  const tabla = SpreadsheetApp.create('Vasdesign – ajánlatkérések');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, tabla.getId());

  // E-mail értesítés minden új ajánlatkérésről
  ScriptApp.newTrigger('ertesites').forForm(form).onFormSubmit().create();

  // A weboldal bekötéséhez szükséges azonosítók (előre kitöltött linkből)
  const minta = form.createResponse();
  form.getItems().forEach(function (it) {
    const t = it.getType();
    if (t === FormApp.ItemType.TEXT) minta.withItemResponse(it.asTextItem().createResponse('MINTA'));
    if (t === FormApp.ItemType.PARAGRAPH_TEXT) minta.withItemResponse(it.asParagraphTextItem().createResponse('MINTA'));
    if (t === FormApp.ItemType.LIST) minta.withItemResponse(it.asListItem().createResponse(it.asListItem().getChoices()[0].getValue()));
    if (t === FormApp.ItemType.MULTIPLE_CHOICE) minta.withItemResponse(it.asMultipleChoiceItem().createResponse(it.asMultipleChoiceItem().getChoices()[0].getValue()));
    if (t === FormApp.ItemType.CHECKBOX) minta.withItemResponse(it.asCheckboxItem().createResponse([it.asCheckboxItem().getChoices()[0].getValue()]));
  });
  const kitoltott = minta.toPrefilledUrl();
  const mezok = {};
  (kitoltott.split('?')[1] || '').split('&').forEach(function (p) {
    const kv = p.split('=');
    if (kv[0].indexOf('entry.') === 0) mezok[kv[0]] = decodeURIComponent(kv[1].replace(/\+/g, ' '));
  });

  Logger.log('=== EZT KÜLDD EL ===');
  Logger.log('KULDES_CIM: ' + form.getPublishedUrl().replace(/\/viewform.*$/, '/formResponse'));
  Logger.log('URLAP_LINK: ' + form.getPublishedUrl());
  form.getItems().forEach(function (it, i) {
    Logger.log('MEZO ' + (i + 1) + ': ' + it.getTitle() + ' = ' + Object.keys(mezok)[i]);
  });
  Logger.log('TABLAZAT: ' + tabla.getUrl());
  Logger.log('=== VÉGE ===');
}

function ertesites(e) {
  const valaszok = e.response.getItemResponses();
  const ertek = function (cim) {
    const v = valaszok.filter(function (r) { return r.getItem().getTitle() === cim; })[0];
    return v ? String(v.getResponse()) : '';
  };
  const sorok = valaszok
    .filter(function (r) { return r.getItem().getTitle() !== 'Adatkezelés'; })
    .map(function (r) { return r.getItem().getTitle() + ': ' + r.getResponse(); });
  const valaszCim = ertek('E-mail cím');
  MailApp.sendEmail({
    to: ERTESITES_CIM,
    replyTo: valaszCim || ERTESITES_CIM,
    subject: 'Új ajánlatkérés: ' + ertek('Név') + ' – ' + ertek('Mire kér ajánlatot?'),
    body: sorok.join('\n') + '\n\n(A „Válasz” gombbal közvetlenül az érdeklődőnek írhat.)',
  });
}
