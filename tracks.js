/* ZomBombadil — Ainulindalë: Music of the Ainur
 * Track data. To publish audio later, just set audioUrl to the MP3 path
 * (relative, e.g. "audio/track01-two-trees.mp3") and flip status to "released".
 * The page needs no other changes — the play button wakes up on its own.
 */
const TRACKS = [
  { n: 1, title: "The Two Trees", status: "released", audioUrl: "audio/track01-two-trees.mp3", art: "artwork/track01.jpg",
    note: "An ambient hymn for the first light — silver and gold, before the dark learned their names." },
  { n: 2, title: "Varda Elentári", status: "released", audioUrl: "audio/track02-varda.mp3", art: "artwork/track02.jpg",
    note: "A power ballad for the Queen of Stars, who hung the lamps of heaven and never looked away." },
  { n: 3, title: "Ulmo", status: "released", audioUrl: "audio/track03-ulmo.mp3", art: "artwork/track03.jpg",
    note: "Heavy water, heavy sound — a metal hymn for the lord of the deep places." },
  { n: 4, title: "Yavanna", status: "released", audioUrl: "audio/track04-yavanna.mp3", art: "artwork/track04.jpg",
    note: "Roots-reggae for the giver of fruits; everything green keeps time." },
  { n: 5, title: "The Discord of Melkor", status: "released", audioUrl: "audio/track05-discord-of-melkor.mp3", art: "artwork/track05.jpg",
    note: "The theme that broke the music — rap metal, metalcore, and a breakdown that shakes the heavens." },
  { n: 6, title: "Lúthien's Song", status: "released", audioUrl: "audio/track06-luthien-song.mp3", art: "artwork/track06.jpg",
    note: "A love song strong enough to make stone weep — harp and strings for the nightingale of Doriath." },
  { n: 7, title: "The Voyage of Eärendil", status: "released", audioUrl: "audio/track07-voyage-of-earendil.mp3", art: "artwork/track07.jpg",
    note: "One mariner, one star — a majestic voyage into the peaceful west." },
];
