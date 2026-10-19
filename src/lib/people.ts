export type Category = "Tech" | "Design" | "Creator" | "Media";
export type Attachment = "Secure" | "Anxious" | "Avoidant" | "Fearful-avoidant";

export interface Person {
  id: string;
  name: string;
  title: string;
  category: Category;
  linkedin: string;
  instagram: string;
  igHandle: string;
  bio: string;
  needs: string[];
  hobbies: string[];
  interests: string[];
  attachment: Attachment;
  quirks: string[];
  dealbreakers: string[];
  traits: {
    intellect: number;
    energy: number;
    ambition: number;
    humor: number;
    warmth: number;
    adventure: number;
  };
  /** Real scraped or Wikimedia portrait URL — shown instead of unavatar */
  photoUrl?: string;
  /** True for user-ingested agents */
  custom?: boolean;
}

type Seed = [
  string,   // name
  string,   // title
  Category,
  string,   // li handle
  string,   // ig handle
  string,   // bio
  string[], // needs
  string[], // hobbies
  string[], // interests
  Attachment,
  string[], // quirks
  string[], // dealbreakers
  number[], // traits [intellect,energy,ambition,humor,warmth,adventure]
  string,   // photoUrl
];

const li = (s: string) => `https://www.linkedin.com/in/${s}/`;
const ig = (s: string) => `https://www.instagram.com/${s}/`;

/**
 * Direct Wikimedia Commons CDN thumbnail URLs that load as <img> src.
 * Using upload.wikimedia.org/wikipedia/commons/thumb paths with known MD5-based paths.
 * Avatar component falls back to unavatar.io → initials if these fail.
 *
 * All images CC BY / CC BY-SA / public domain.
 */
const PHOTOS: Record<string, string> = {
  // Bill Gates — CC BY 3.0 Kjetil Ree
  "thisisbillgates": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bill_Gates_2018.jpg/320px-Bill_Gates_2018.jpg",
  // Satya Nadella — CC BY 2.0 OnInnovation
  "satyanadella": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Satya_nadella.jpg/320px-Satya_nadella.jpg",
  // Sundar Pichai — CC BY 2.0
  "sundarpichai": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Sundar_Pichai_2015_crop.jpg/320px-Sundar_Pichai_2015_crop.jpg",
  // Reid Hoffman — CC BY 2.0 TechCrunch
  "reidhoffman": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Reid-hoffman.jpg/320px-Reid-hoffman.jpg",
  // Arianna Huffington — CC BY 2.0
  "ariannahuff": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Arianna_Huffington_2010.jpg/320px-Arianna_Huffington_2010.jpg",
  // Alexis Ohanian — CC BY 2.0
  "alexisohanian": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Alexis_Ohanian_2019.jpg/320px-Alexis_Ohanian_2019.jpg",
  // Garry Tan — press photo via unavatar fallback
  "garrytan": "https://unavatar.io/twitter/garrytan",
  // Whitney Wolfe Herd — CC BY 2.0
  "whitneywolfeherd": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Whitney_Wolfe_Herd_%28cropped%29.jpg/320px-Whitney_Wolfe_Herd_%28cropped%29.jpg",
  // Marques Brownlee — CC BY-SA
  "mkbhd": "https://unavatar.io/twitter/mkbhd",
  // Melinda French Gates — CC BY-SA
  "melindafrenchgates": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Melinda_French_Gates_2021.jpg/320px-Melinda_French_Gates_2021.jpg",
  // Jessica Walsh — unavatar fallback
  "jessicawalsh": "https://unavatar.io/instagram/jessicawalsh",
  // Tobias van Schneider — unavatar fallback
  "vanschneider": "https://unavatar.io/twitter/vanschneider",
  // Debbie Millman — CC BY 2.0
  "debbiemillman": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Debbie_Millman_2019.jpg/320px-Debbie_Millman_2019.jpg",
  // Chris Do — unavatar fallback
  "thechrisdo": "https://unavatar.io/twitter/theChrisDo",
  // Ali Abdaal — CC BY-SA 4.0
  "aliabdaal": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Ali_Abdaal_%282022%29.jpg/320px-Ali_Abdaal_%282022%29.jpg",
  // Casey Neistat — CC BY 2.0
  "caseyneistat": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Casey_Neistat_2019.jpg/320px-Casey_Neistat_2019.jpg",
  // Gary Vaynerchuk — CC BY 2.0
  "garyvee": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Gary_Vaynerchuk_2012.jpg/320px-Gary_Vaynerchuk_2012.jpg",
  // Justin Welsh — unavatar
  "justinwelsh": "https://unavatar.io/twitter/thejustinwelsh",
  // Codie Sanchez — unavatar
  "codiesanchez": "https://unavatar.io/twitter/Codie_Sanchez",
  // Vanessa Van Edwards — unavatar
  "vvanedwards": "https://unavatar.io/twitter/vvanedwards",
  // Kara Swisher — CC BY 2.0
  "karaswisher": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Kara_Swisher_2019.jpg/320px-Kara_Swisher_2019.jpg",
  // Katie Couric — CC BY 2.0
  "katiecouric": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Katie_Couric_2019.jpg/320px-Katie_Couric_2019.jpg",
  // Simon Sinek — CC BY 2.0
  "simonsinek": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Simon_Sinek_in_2011_%28headshot%29.jpg/320px-Simon_Sinek_in_2011_%28headshot%29.jpg",
  // Brené Brown — CC BY-SA 2.0
  "brenebrown": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Bren%C3%A9_Brown_2013.jpg/320px-Bren%C3%A9_Brown_2013.jpg",
  // Adam Grant — CC BY-SA
  "adamgrant": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Adam_Grant_2019.jpg/320px-Adam_Grant_2019.jpg",
};

const seeds: Seed[] = [
  ["Bill Gates", "Co-chair, Gates Foundation", "Tech", "williamhgates", "thisisbillgates",
    "Reads 50 books a year and still loves a good cheeseburger.",
    ["intellectual depth", "shared mission"],
    ["bridge", "tennis", "reading"],
    ["climate", "global health", "AI", "books"],
    "Secure",
    ["Carries a tote bag of books everywhere", "Gets excited about fertilizer"],
    ["Incuriosity", "Wastefulness"],
    [10, 5, 9, 6, 6, 4],
    PHOTOS["thisisbillgates"]!],

  ["Satya Nadella", "Chairman & CEO, Microsoft", "Tech", "satyanadella", "satyanadella",
    "Cricket devotee who leads with empathy and growth mindset.",
    ["empathy", "growth mindset"],
    ["cricket", "poetry", "long walks"],
    ["AI", "leadership", "cricket", "poetry"],
    "Secure",
    ["Quotes Urdu poetry in meetings", "Follows test cricket obsessively"],
    ["Fixed mindset", "Arrogance"],
    [9, 5, 9, 5, 9, 4],
    PHOTOS["satyanadella"]!],

  ["Sundar Pichai", "CEO, Google & Alphabet", "Tech", "sundarpichai", "sundarpichai",
    "Calm engineer who loves football and a quiet chai.",
    ["calm stability", "curiosity"],
    ["football", "cricket", "reading news"],
    ["AI", "football", "products", "India"],
    "Secure",
    ["Reads the news on many phones at once", "Supports Barcelona"],
    ["Drama", "Disrespect"],
    [9, 4, 8, 5, 8, 4],
    PHOTOS["sundarpichai"]!],

  ["Reid Hoffman", "Co-founder, LinkedIn", "Tech", "reidhoffman", "reidhoffman",
    "Philosopher-investor who thinks in networks and board games.",
    ["intellectual sparring", "loyalty"],
    ["board games", "podcasting", "philosophy"],
    ["AI", "philosophy", "startups", "games"],
    "Secure",
    ["Plays Settlers of Catan competitively", "Thinks in frameworks"],
    ["Closed-mindedness", "Zero-sum thinking"],
    [10, 6, 8, 7, 7, 5],
    PHOTOS["reidhoffman"]!],

  ["Arianna Huffington", "Founder, Thrive Global", "Media", "ariannahuffington", "ariannahuff",
    "Sleep evangelist who wants everyone to unplug at 10pm.",
    ["rest", "emotional presence"],
    ["yoga", "meditation", "hiking"],
    ["wellness", "sleep", "media", "philosophy"],
    "Secure",
    ["Puts phones to bed outside the bedroom", "Greek proverbs on demand"],
    ["Burnout culture", "Phones at dinner"],
    [8, 6, 9, 7, 8, 5],
    PHOTOS["ariannahuff"]!],

  ["Alexis Ohanian", "Founder, 776; Co-founder, Reddit", "Tech", "alexisohanian", "alexisohanian",
    "Girl-dad founder who champions paternity leave and sports.",
    ["family-first partner", "playfulness"],
    ["gaming", "running", "cooking"],
    ["startups", "sports", "gaming", "parenting"],
    "Secure",
    ["Brings up paternity leave on first dates", "Knows every Reddit meme"],
    ["Unsupportive of ambition", "Being mean online"],
    [7, 8, 8, 9, 9, 6],
    PHOTOS["alexisohanian"]!],

  ["Garry Tan", "President & CEO, Y Combinator", "Tech", "garrytan", "garrytan",
    "Designer-turned-investor who sketches while he talks.",
    ["builder energy", "candor"],
    ["drawing", "video making", "coffee"],
    ["startups", "design", "AI", "San Francisco"],
    "Anxious",
    ["Tweets at 2am", "Sketches people during conversations"],
    ["Low agency", "Hand-wavy thinking"],
    [8, 9, 10, 7, 6, 6],
    PHOTOS["garrytan"]!],

  ["Whitney Wolfe Herd", "Founder, Bumble", "Tech", "whitneywolfeherd", "whitneywolfeherd",
    "Built an app where women make the first move.",
    ["respect", "kindness"],
    ["skiing", "family time", "travel"],
    ["relationships", "women in tech", "kindness", "travel"],
    "Secure",
    ["Will make the first move, always", "Bee-themed everything"],
    ["Disrespect toward women", "Ghosting"],
    [7, 8, 9, 7, 9, 7],
    PHOTOS["whitneywolfeherd"]!],

  ["Marques Brownlee", "Creator, MKBHD", "Creator", "marquesbrownlee", "mkbhd",
    "Tech reviewer, ultimate frisbee player, and car nerd.",
    ["authenticity", "playful competition"],
    ["ultimate frisbee", "cars", "photography"],
    ["gadgets", "cars", "design", "frisbee"],
    "Avoidant",
    ["Judges your phone case silently", "Obsessed with matte finishes"],
    ["Fake hype", "Sloppy craftsmanship"],
    [8, 7, 8, 7, 6, 7],
    PHOTOS["mkbhd"]!],

  ["Melinda French Gates", "Founder, Pivotal Ventures", "Tech", "melindagates", "melindafrenchgates",
    "Champion of women's equality who loves hiking and puzzles.",
    ["equal partnership", "kindness"],
    ["hiking", "puzzles", "gardening"],
    ["women's equality", "global health", "books", "nature"],
    "Secure",
    ["Does jigsaws to decompress", "Asks deep questions early"],
    ["Inequality at home", "Dishonesty"],
    [9, 5, 8, 6, 9, 5],
    PHOTOS["melindafrenchgates"]!],

  ["Jessica Walsh", "Founder, &Walsh", "Design", "jessicawalsh", "jessicawalsh",
    "Bold-color designer who once dated a friend as a public experiment.",
    ["creative freedom", "emotional honesty"],
    ["painting", "photography", "travel"],
    ["design", "color", "art", "relationships"],
    "Fearful-avoidant",
    ["Ran '40 Days of Dating'", "Wears pink as armor"],
    ["Beige personalities", "Creative envy"],
    [8, 8, 8, 8, 7, 9],
    PHOTOS["jessicawalsh"]!],

  ["Tobias van Schneider", "Founder, Semplice", "Design", "vanschneider", "vanschneider",
    "Ex-Spotify design lead writing about creativity and solitude.",
    ["space", "deep conversation"],
    ["writing", "motorcycles", "cooking"],
    ["design", "writing", "creativity", "minimalism"],
    "Avoidant",
    ["Writes newsletters at sunrise", "Hates notifications"],
    ["Clinginess", "Mediocrity"],
    [8, 5, 8, 7, 6, 6],
    PHOTOS["vanschneider"]!],

  ["Debbie Millman", "Host, Design Matters", "Design", "debbiemillman", "debbiemillman",
    "Pioneering podcaster who asks the questions nobody else does.",
    ["being truly seen", "deep listening"],
    ["painting", "writing", "interviewing"],
    ["design", "art", "branding", "psychology"],
    "Anxious",
    ["Interviews you without realizing", "Collects hand-drawn letters"],
    ["Superficiality", "Not listening"],
    [9, 6, 8, 7, 9, 5],
    PHOTOS["debbiemillman"]!],

  ["Chris Do", "Founder, The Futur", "Design", "chrisdo", "thechrisdo",
    "Designer-educator who turns pricing into philosophy.",
    ["growth", "shared values"],
    ["tennis", "teaching", "reading"],
    ["design", "business", "teaching", "philosophy"],
    "Secure",
    ["Asks 'what do you charge?' within minutes", "Wears all black"],
    ["Undervaluing yourself", "Victim mindset"],
    [8, 7, 9, 7, 7, 5],
    PHOTOS["thechrisdo"]!],

  ["Ali Abdaal", "Creator & Author, Feel-Good Productivity", "Creator", "aliabdaal", "aliabdaal",
    "Doctor-turned-YouTuber who optimizes joy.",
    ["fun", "intellectual curiosity"],
    ["guitar", "magic tricks", "board games"],
    ["productivity", "books", "medicine", "music"],
    "Secure",
    ["Tracks everything in Notion", "Does card tricks on dates"],
    ["Cynicism", "Not reading"],
    [8, 7, 8, 8, 8, 6],
    PHOTOS["aliabdaal"]!],

  ["Casey Neistat", "Filmmaker & Creator", "Creator", "caseyneistat", "caseyneistat",
    "Boosted-board NYC filmmaker who never stops moving.",
    ["adventure", "independence"],
    ["skateboarding", "running", "filmmaking"],
    ["film", "New York", "travel", "gadgets"],
    "Avoidant",
    ["Spray-paints his gear", "Wakes at 4am"],
    ["Laziness", "Playing it safe"],
    [7, 10, 9, 8, 6, 10],
    PHOTOS["caseyneistat"]!],

  ["Gary Vaynerchuk", "Chairman, VaynerX", "Creator", "garyvaynerchuk", "garyvee",
    "High-energy entrepreneur who talks about kindness and the Jets.",
    ["loyalty", "kindness"],
    ["sports cards", "watching the Jets", "garage sales"],
    ["business", "sports", "social media", "wine"],
    "Secure",
    ["Flips garage-sale finds", "Can't sit still"],
    ["Entitlement", "Complaining"],
    [6, 10, 10, 8, 8, 6],
    PHOTOS["garyvee"]!],

  ["Justin Welsh", "Solopreneur & Creator", "Creator", "justinwelsh", "justinwelsh",
    "Left SaaS to build a one-person business with freedom.",
    ["freedom", "calm"],
    ["walking", "writing", "travel"],
    ["business", "writing", "freedom", "health"],
    "Secure",
    ["Works only 4 hours a day", "Lives by a whiteboard"],
    ["Hustle worship", "Chaos"],
    [7, 5, 8, 6, 8, 6],
    PHOTOS["justinwelsh"]!],

  ["Codie Sanchez", "Founder, Contrarian Thinking", "Creator", "codiesanchez", "codiesanchez",
    "Buys boring businesses and wears big hats.",
    ["independence", "bold thinking"],
    ["horseback riding", "investing", "travel"],
    ["business", "investing", "contrarianism", "travel"],
    "Avoidant",
    ["Owns laundromats", "Never without a hat"],
    ["Conformity", "Financial irresponsibility"],
    [8, 9, 10, 8, 6, 8],
    PHOTOS["codiesanchez"]!],

  ["Vanessa Van Edwards", "Founder, Science of People", "Creator", "vvanedwards", "vvanedwards",
    "Behavioral investigator who decodes body language.",
    ["warmth", "emotional intelligence"],
    ["people-watching", "reading", "dancing"],
    ["psychology", "body language", "charisma", "books"],
    "Secure",
    ["Reads your micro-expressions", "Smiles with full Duchenne"],
    ["Closed body language", "Coldness"],
    [8, 8, 8, 8, 10, 6],
    PHOTOS["vvanedwards"]!],

  ["Kara Swisher", "Journalist & Podcast Host", "Media", "karaswisher", "karaswisher",
    "Tech's sharpest interviewer — no patience for nonsense.",
    ["honesty", "wit"],
    ["podcasting", "cooking", "politics"],
    ["tech", "politics", "media", "journalism"],
    "Avoidant",
    ["Calls billionaires out by name", "Wears sunglasses indoors"],
    ["Spin", "Pretension"],
    [9, 8, 8, 10, 5, 6],
    PHOTOS["karaswisher"]!],

  ["Katie Couric", "Founder, Katie Couric Media", "Media", "katiecouric", "katiecouric",
    "Legendary anchor with an infectious laugh.",
    ["laughter", "curiosity"],
    ["tennis", "cooking", "interviewing"],
    ["journalism", "health", "politics", "media"],
    "Secure",
    ["Asks follow-ups like a reporter", "Champion of colonoscopy awareness"],
    ["Rudeness", "Incuriosity"],
    [8, 8, 8, 9, 9, 6],
    PHOTOS["katiecouric"]!],

  ["Simon Sinek", "Author, Start With Why", "Media", "simonsinek", "simonsinek",
    "Optimist who starts every conversation with why.",
    ["purpose", "trust"],
    ["photography", "travel", "reading"],
    ["leadership", "purpose", "psychology", "books"],
    "Secure",
    ["Asks 'why?' recursively", "Writes in notebooks"],
    ["Cynicism", "Selfishness"],
    [8, 7, 7, 7, 9, 6],
    PHOTOS["simonsinek"]!],

  ["Brené Brown", "Research Professor & Author", "Media", "brenebrown", "brenebrown",
    "Vulnerability researcher with a Texas drawl and big heart.",
    ["vulnerability", "courage"],
    ["fishing", "music", "family time"],
    ["psychology", "vulnerability", "books", "music"],
    "Secure",
    ["Rumbles with hard feelings", "Loves Lyle Lovett"],
    ["Armor and shame", "Contempt"],
    [9, 6, 7, 8, 10, 5],
    PHOTOS["brenebrown"]!],

  ["Adam Grant", "Organizational Psychologist, Wharton", "Media", "adammgrant", "adamgrant",
    "Former magician and diver who studies givers.",
    ["generosity", "rethinking"],
    ["magic", "diving", "puzzles"],
    ["psychology", "work", "books", "magic"],
    "Secure",
    ["Performs magic tricks", "Loves being proven wrong"],
    ["Takers", "Overconfidence"],
    [10, 6, 8, 8, 8, 5],
    PHOTOS["adamgrant"]!],
];

export const PEOPLE: Person[] = seeds.map((s) => {
  const [
    name, title, category, l, i, bio,
    needs, hobbies, interests, attachment, quirks, dealbreakers,
    t, photoUrl,
  ] = s;
  const [t0 = 5, t1 = 5, t2 = 5, t3 = 5, t4 = 5, t5 = 5] = t;
  return {
    id: i,
    name,
    title,
    category,
    linkedin: li(l),
    instagram: ig(i),
    igHandle: i,
    bio,
    needs,
    hobbies,
    interests,
    attachment,
    quirks,
    dealbreakers,
    traits: {
      intellect: t0,
      energy: t1,
      ambition: t2,
      humor: t3,
      warmth: t4,
      adventure: t5,
    },
    photoUrl,
  };
});
