/* ZomBombadil — Ainulindalë: Music of the Ainur
 * Track data. To publish audio later, just set audioUrl to the MP3 path
 * (relative, e.g. "audio/track01-two-trees.mp3") and flip status to "released".
 * The page needs no other changes — the play button wakes up on its own.
 */
const TRACKS = [
  { n: 1, title: "The Two Trees", status: "released", audioUrl: "audio/track01-two-trees.mp3",
    note: "An ambient hymn for the first light — silver and gold, before the dark learned their names." },
  { n: 2, title: "Varda Elentári", status: "released", audioUrl: "audio/track02-varda.mp3",
    note: "A power ballad for the Queen of Stars, who hung the lamps of heaven and never looked away." },
  { n: 3, title: "Ulmo", status: "released", audioUrl: "audio/track03-ulmo.mp3",
    note: "Heavy water, heavy sound — a metal hymn for the lord of the deep places." },
  { n: 4, title: "Yavanna", status: "released", audioUrl: "audio/track04-yavanna.mp3",
    note: "Roots-reggae for the giver of fruits; everything green keeps time." },
  { n: 5, title: "The Discord of Melkor", status: "in-progress", audioUrl: null,
    note: "The theme that broke the music. Still being wrestled into shape." },
  { n: 6, title: "Lúthien's Song", status: "in-progress", audioUrl: null,
    note: "A love song strong enough to make stone weep. In the workshop." },
  { n: 7, title: "The Voyage of Eärendil", status: "in-progress", audioUrl: null,
    note: "One mariner, one star, one impossible westward road. Charting the course." },
];
