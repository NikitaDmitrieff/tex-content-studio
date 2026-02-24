export type RosterCharacter = {
  name: string
  age: number
  job: string
  backstory: string
  physical_description: string
  personality_traits: string[]
  reason_never_exercised: string
  visual_dna: string
  emoji: string
  gender: 'M' | 'F'
  locale: 'fr' | 'en'
}

export const CHARACTER_ROSTER: RosterCharacter[] = [
  {
    name: 'Yasmine Belkacem',
    age: 24,
    job: 'Caissière en pharmacie',
    backstory:
      "Yasmine a pris 20 kilos pendant le COVID, debout derrière un comptoir 9h par jour à grignoter. Sa mère lui répète qu'elle était tellement jolie avant. Son ex l'a unfollow sur Insta et elle l'a remarqué.",
    physical_description:
      'Ronde, début 20s, cheveux ondulés foncés en chignon lâche, peau mate, cernes sous les yeux, sweat oversize par-dessus la blouse de pharmacie, baskets usées',
    personality_traits: ['Humour auto-dépréciatif', 'Secrètement compétitive', 'Scroll TikTok jusqu\'à 3h du mat'],
    reason_never_exercised: "Se dit qu'elle est trop crevée après le boulot. La vraie raison c'est qu'elle a peur d'être la grosse à la salle.",
    visual_dna:
      'same young woman, early 20s, dark wavy hair in messy bun, olive skin, dark circles, oversized hoodie, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F48A}',
    gender: 'F',
    locale: 'fr',
  },
  {
    name: 'Théo Martin',
    age: 22,
    job: 'Livreur Uber Eats',
    backstory:
      "Théo jouait en CFA3 jusqu'à sa rupture des croisés à 19 ans. Trois ans de canapé, PlayStation et kebabs plus tard, il peut plus courir 100 mètres. Ses anciens coéquipiers jouent encore le dimanche et il regarde depuis sa voiture.",
    physical_description:
      'Skinny-fat, début 20s, cheveux bruns en désordre, pâle, barbe clairsemée, vieux survêt et maillot de Mbappé trop petit, sac Uber Eats',
    personality_traits: ['Vit dans le déni sur son poids', 'Drôle de manière auto-destructrice', 'Ami fidèle qui est là pour tout le monde sauf lui'],
    reason_never_exercised: "Son genou c'est son excuse mais il a guéri il y a un an. Il a peur d'essayer et de découvrir qu'il a tout perdu pour de bon.",
    visual_dna:
      'same young man, early 20s, messy brown hair, pale skin, patchy stubble, faded soccer jersey, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F6F5}',
    gender: 'M',
    locale: 'fr',
  },
  {
    name: 'Fatou Diallo',
    age: 28,
    job: 'Assistante maternelle',
    backstory:
      "Après deux grossesses en trois ans, Fatou a gardé les kilos les deux fois. Elle court après les gamins toute la journée mais arrive pas à perdre. Son mari dit que ça le dérange pas mais elle a vu comment il a regardé sa sœur au dernier repas de famille.",
    physical_description:
      'Ronde, fin 20s, peau noire, tresses avec perles colorées, visage rond, yeux brillants mais fatigués, robe à motifs colorés ou leggings tachés',
    personality_traits: ['Fait toujours passer les autres en premier', 'Cache sa douleur derrière un grand rire', 'Lit des blogs fitness à 1h du mat en cachette'],
    reason_never_exercised: "Entre les enfants, le boulot et la cuisine pour la famille, y a littéralement plus de temps. Elle a essayé une fois et sa belle-mère a dit qu'elle était égoïste.",
    visual_dna:
      'same full-figured Black woman, late 20s, dark skin, braided hair with beads, colorful dress, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F476}',
    gender: 'F',
    locale: 'fr',
  },
  {
    name: 'Lucas Moreau',
    age: 26,
    job: 'Préparateur de commandes Amazon',
    backstory:
      "Lucas fait 15 000 pas par jour au boulot mais mange un McDo dans sa voiture tous les midis. Il s'est essoufflé en montant des cartons la semaine dernière et un collègue de 19 ans lui a demandé si ça allait. Ça l'a piqué.",
    physical_description:
      'Corps mou avec du ventre, milieu 20s, cheveux ras, visage rougeaud, en sueur, gilet Amazon par-dessus t-shirt noir, chaussures de sécu, toujours ses écouteurs',
    personality_traits: ['Bosse dur mais mange encore plus', 'Discret, reste dans son coin', 'Compétitif quand on le cherche'],
    reason_never_exercised: "Pense que son taf c'est déjà du sport. \"Je fais 15K pas mec.\" Mais il sait que c'est pas pareil. Trop crevé après les shifts pour faire autre chose que manger et dormir.",
    visual_dna:
      'same soft-bodied man, mid 20s, buzzed hair, reddish face, work vest over black tee, harsh fluorescent lighting, low quality phone camera, grainy',
    emoji: '\u{1F4E6}',
    gender: 'M',
    locale: 'fr',
  },
  {
    name: 'Amira Hassan',
    age: 23,
    job: 'Étudiante infirmière',
    backstory:
      "Amira grignote à chaque période de partiels. Elle prend du poids chaque année d'école d'infirmière. Ses blouses sont serrées maintenant et elle se cache derrière sa blouse de stage. Elle se dit qu'elle commencera après les exams mais les exams s'arrêtent jamais.",
    physical_description:
      'Visage rond, début 20s, porte le hijab dans des tons sobres, peau claire mate, lunettes fines, blouse trop grande, sac de cours lourd, énergie nerveuse',
    personality_traits: ['Perfectionniste qui craque sous la pression', 'Mange quand elle stresse', 'Profondément bienveillante — a choisi infirmière pour une raison'],
    reason_never_exercised: "\"Après les partiels.\" \"Après le stage.\" \"Après le diplôme.\" Y a toujours un truc après. Au fond elle pense qu'elle mérite pas ce temps pour elle.",
    visual_dna:
      'same young woman with hijab, early 20s, light brown skin, wire-rim glasses, oversized scrubs, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1FA7A}',
    gender: 'F',
    locale: 'fr',
  },
  {
    name: 'Kylian Dubois',
    age: 29,
    job: 'Chauffeur VTC',
    backstory:
      "Kylian est assis dans sa voiture 12h par jour. Mange un Burger King entre les courses. Son siège est cassé alors il se penche bizarre et son dos le tue. Sa fille de 5 ans a dessiné un portrait de lui — un cercle avec des jambes. Il a rigolé. Puis il a plus rigolé.",
    physical_description:
      'Gros ventre, fin 20s, cheveux courts foncés avec dégradé, peau brune, barbe clairsemée, toujours en jogger et sweat zippé, marque de support téléphone sur la main',
    personality_traits: ['Papa drôle qui esquive avec des blagues', 'Fier mais têtu', 'Ferait n\'importe quoi pour sa fille'],
    reason_never_exercised: "Pas le temps entre les courses, récupérer sa fille et dormir. Et puis la salle ça coûte de l'argent qu'il a pas. Sa voiture c'est son bureau, son resto et son canapé.",
    visual_dna:
      'same big-bellied man, late 20s, close-cropped dark hair, brown skin, patchy beard, zip-up hoodie, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F697}',
    gender: 'M',
    locale: 'fr',
  },
  {
    name: 'Chloé Bernard',
    age: 25,
    job: 'Intérimaire de bureau',
    backstory:
      "Chloé est assise à un bureau 8h, mange des BN de la salle de pause, puis rentre chez elle pour Netflix et Deliveroo. Elle a pas porté de jean depuis un an parce que plus rien lui va. Elle a acheté des pantalons stretch et appelle ça un choix de style.",
    physical_description:
      'Forme poire, milieu 20s, cheveux blonds en queue basse, peau claire avec rougeurs sur les joues, lunettes, gilet oversize par-dessus un haut basique, pantalon stretch noir, ballerines',
    personality_traits: ['Reine de la rationalisation', 'Secrètement jalouse des influenceuses fitness', 'Mange ses émotions et connaît tous les livreurs Deliveroo par leur prénom'],
    reason_never_exercised: "S'est inscrite à la salle deux fois et y est allée zéro fois. A résilié les deux. Se dit qu'elle va commencer le running mais ses chaussures sont encore dans la boîte.",
    visual_dna:
      'same young blonde woman, mid 20s, low ponytail, fair skin, glasses, oversized cardigan, harsh office lighting, low quality phone camera, grainy',
    emoji: '\u{1F4BB}',
    gender: 'F',
    locale: 'fr',
  },
  {
    name: 'Mamadou Traoré',
    age: 27,
    job: 'Ouvrier BTP',
    backstory:
      "Mamadou est costaud — il porte des parpaings toute la journée. Mais il boit 4 bières tous les soirs et mange des énormes plats de riz. Sa tension est déjà élevée à 27 ans. Le médecin a dit \"vous êtes jeune, ça devrait pas arriver.\"",
    physical_description:
      'Musclé mais avec un gros ventre à bière, fin 20s, peau noire, cheveux courts, bras costauds, toujours poussiéreux, gilet jaune fluo et boots de chantier, mains calleuses',
    personality_traits: ['Dur à l\'extérieur, inquiet à l\'intérieur', 'Loyal envers son équipe', 'Pense que le fitness c\'est pour les maigres'],
    reason_never_exercised: "\"Je porte des parpaings toute la journée, pourquoi j'irais à la salle ?\" Mais c'est pas les muscles le problème — c'est les 4 bières et le riz à minuit.",
    visual_dna:
      'same muscular big-bellied Black man, late 20s, dark skin, short hair, high-vis vest, dusty work clothes, harsh outdoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F3D7}\uFE0F',
    gender: 'M',
    locale: 'fr',
  },
  {
    name: 'Sofia Rodrigues',
    age: 30,
    job: 'Caissière Carrefour',
    backstory:
      "Mère célibataire de deux enfants. Sofia nourrit ses gosses en premier et mange leurs restes debout dans la cuisine à 22h. Elle s'est pas acheté de fringues depuis deux ans. Son aîné lui a demandé pourquoi elle vient jamais à la piscine avec eux.",
    physical_description:
      'Forte, 30 ans, cheveux noirs en queue de cheval fatiguée, peau mate, poches sous les yeux, polo Carrefour trop serré, baskets, toujours un élastique de gamine au poignet',
    personality_traits: ['Sacrifie tout pour ses enfants', 'Dure mais épuisée émotionnellement', 'Pleure sous la douche'],
    reason_never_exercised: "Ses enfants mangent en premier. Son temps est pour eux. Elle pense sincèrement qu'elle compte pas assez pour s'accorder 30 minutes.",
    visual_dna:
      'same heavyset woman, 30, dark ponytail, tan skin, tired eyes, store uniform polo, harsh fluorescent lighting, low quality phone camera, grainy',
    emoji: '\u{1F6D2}',
    gender: 'F',
    locale: 'fr',
  },
  {
    name: 'Romain Leclerc',
    age: 24,
    job: 'Technicien support IT',
    backstory:
      "Romain game jusqu'à 4h du mat, dort jusqu'à midi le week-end, et vit de Monster Energy et de pizzas surgelées Picard. Il a vu une photo du mariage d'un pote où il s'est pas reconnu. Sa chaise de bureau a cassé le mois dernier et il s'est dit que c'était la chaise le problème.",
    physical_description:
      'En surpoids, milieu 20s, cheveux foncés gras, peau très pâle de jamais sortir, barbe clairsemée, t-shirts de gaming oversize et shorts de basket toute l\'année, lunettes anti-lumière bleue',
    personality_traits: ['Esprit vif en ligne, gauche IRL', 'Sait que son hygiène de vie est nulle mais gère avec l\'humour', 'Intelligent quand il s\'y met'],
    reason_never_exercised: "Son monde c'est les écrans. Sortir dehors c'est un environnement hostile. Il a essayé une vidéo YouTube une fois et son voisin du dessous a tapé au plafond.",
    visual_dna:
      'same overweight pale man, mid 20s, greasy dark hair, neckbeard, oversized gaming t-shirt, blue light glasses, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F3AE}',
    gender: 'M',
    locale: 'fr',
  },

  // ── English / International ──────────────────────────────────────
  {
    name: 'Marcus Williams',
    age: 28,
    job: 'Amazon warehouse picker',
    backstory:
      "Marcus does 15,000 steps a day at work but hits the McDonald's drive-thru every single lunch. Got winded carrying boxes last week and a 19-year-old coworker asked if he was okay. That stung.",
    physical_description:
      'Soft body with a gut, late 20s, short fade, dark skin, always sweating, hi-vis vest over a black tee, steel-toe boots, earbuds in',
    personality_traits: ['Works hard but eats harder', 'Quiet, keeps to himself', 'Competitive when pushed'],
    reason_never_exercised: "Thinks his job IS exercise. '15K steps bro.' But he knows it's not the same. Too wiped after shifts to do anything but eat and sleep.",
    visual_dna:
      'same soft-bodied Black man, late 20s, short fade, dark skin, work vest over black tee, harsh fluorescent lighting, low quality phone camera, grainy',
    emoji: '\u{1F4E6}',
    gender: 'M',
    locale: 'en',
  },
  {
    name: 'Jessica Nguyen',
    age: 24,
    job: 'Dental receptionist',
    backstory:
      "Jess gained 40 pounds since college sitting behind a desk 9 hours a day snacking on the candy they keep for patients. Her mom keeps saying she used to be so pretty. Her ex unfollowed her on Instagram and she noticed.",
    physical_description:
      'Round-faced, early 20s, dark straight hair in a low bun, light brown skin, dark circles, oversized cardigan over scrubs, worn sneakers',
    personality_traits: ['Self-deprecating humor', 'Secretly competitive', 'Doomscrolls TikTok until 3am'],
    reason_never_exercised: "Tells herself she's too tired after work. The real reason is she's terrified of being the fat girl at the gym.",
    visual_dna:
      'same young Asian-American woman, early 20s, dark hair in low bun, light brown skin, dark circles, oversized cardigan, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F9B7}',
    gender: 'F',
    locale: 'en',
  },
  {
    name: 'Darnell Jackson',
    age: 22,
    job: 'DoorDash driver',
    backstory:
      "Darnell played varsity basketball until he tore his ACL senior year. Three years of couch, PlayStation, and fast food later, he can't run 100 yards. His old teammates still play pickup on Sundays and he watches from his car.",
    physical_description:
      "Skinny-fat, early 20s, messy locs, brown skin, patchy stubble, old basketball jersey that's too tight now, slides with socks",
    personality_traits: ['In denial about his weight', 'Funny in a self-destructive way', 'Loyal friend who shows up for everyone but himself'],
    reason_never_exercised: "His knee is his excuse but it healed a year ago. He's scared to try and find out he lost it for good.",
    visual_dna:
      'same skinny-fat young Black man, early 20s, messy locs, brown skin, old basketball jersey, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F3C0}',
    gender: 'M',
    locale: 'en',
  },
  {
    name: 'Brittany Kowalski',
    age: 29,
    job: 'School cafeteria worker',
    backstory:
      "After two kids in three years, Brittany kept the weight both times. She runs after toddlers all day but can't lose it. Her husband says he doesn't mind but she saw how he looked at her sister at the last family barbecue.",
    physical_description:
      'Full-figured, late 20s, dirty blonde hair in a messy ponytail, pale with flushed cheeks, stained apron over a faded t-shirt, sneakers',
    personality_traits: ['Always puts others first', 'Hides her pain behind a big laugh', 'Secretly reads fitness blogs at 1am'],
    reason_never_exercised: "Between the kids, work, and cooking for the family, there's literally no time left. She tried once and her mother-in-law called her selfish.",
    visual_dna:
      'same full-figured blonde woman, late 20s, messy ponytail, pale skin, flushed cheeks, stained apron, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F37D}\uFE0F',
    gender: 'F',
    locale: 'en',
  },
  {
    name: 'Frank Delgado',
    age: 54,
    job: 'Long-haul trucker',
    backstory:
      "Frank spent 30 years behind the wheel eating gas station sandwiches and chugging energy drinks. His knees are shot, his back is done, and he hasn't seen his feet in years. His daughter's wedding is in 6 months and he overheard her tell a friend she was embarrassed he wouldn't fit in the family photos.",
    physical_description:
      'Heavyset, mid-50s, ruddy complexion, permanent five o\'clock shadow, calloused hands, beat-up trucker cap and flannel shirt',
    personality_traits: ['Stubborn but secretly sensitive', 'Dry humor', 'Reliable for everyone except himself'],
    reason_never_exercised: "Always told himself he'd start 'next month.' Thinks the gym is for young people and narcissists. Deep down he's afraid of failing in front of everyone.",
    visual_dna:
      "same heavyset man, mid-50s, ruddy complexion, five o'clock shadow, trucker cap, flannel shirt, harsh indoor lighting, low quality phone camera, grainy",
    emoji: '\u{1F69A}',
    gender: 'M',
    locale: 'en',
  },
  {
    name: 'Priya Sharma',
    age: 26,
    job: 'Call center agent',
    backstory:
      "Priya sits in a cubicle 10 hours a day with a headset on, stress-eating vending machine chips between calls. She's gained weight every year since she started. Her salwar kameez doesn't fit anymore and she wears stretchy pants calling it a 'style choice.'",
    physical_description:
      'Pear-shaped, mid 20s, long dark hair usually tied back, brown skin, glasses, oversized hoodie over work clothes, earbuds always in',
    personality_traits: ['Perfectionist who cracks under pressure', 'Stress eater who knows every vending machine by heart', 'Deeply empathetic — chose this job to help people'],
    reason_never_exercised: "Tried a YouTube workout once and her downstairs neighbor banged on the ceiling. Now she just watches fitness TikToks from bed.",
    visual_dna:
      'same pear-shaped South Asian woman, mid 20s, long dark hair tied back, brown skin, glasses, oversized hoodie, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F4DE}',
    gender: 'F',
    locale: 'en',
  },
  {
    name: 'Tyler Reed',
    age: 23,
    job: 'IT help desk tech',
    backstory:
      "Tyler games until 4am, sleeps till noon on weekends, and lives on Monster Energy and frozen pizza. He saw a photo from his buddy's wedding where he didn't recognize himself. His desk chair broke last month and he told himself it was the chair's fault.",
    physical_description:
      'Overweight, early 20s, greasy dark hair, very pale from never going outside, patchy neckbeard, oversized gaming t-shirts and basketball shorts year-round, blue light glasses',
    personality_traits: ['Quick-witted online, awkward IRL', 'Knows his lifestyle is trash but copes with humor', 'Smart when he applies himself'],
    reason_never_exercised: "His world is screens. Outside is a hostile environment. He tried a YouTube workout video once and his neighbor complained about the noise.",
    visual_dna:
      'same overweight pale man, early 20s, greasy dark hair, neckbeard, oversized gaming t-shirt, blue light glasses, harsh indoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F3AE}',
    gender: 'M',
    locale: 'en',
  },
  {
    name: 'Maria Santos',
    age: 30,
    job: 'Walmart cashier',
    backstory:
      "Single mom of two. Maria feeds her kids first and eats their leftovers standing in the kitchen at 10pm. She hasn't bought herself clothes in two years. Her oldest asked why she never comes to the pool with them.",
    physical_description:
      'Heavyset, 30, dark hair in a tired ponytail, tan skin, bags under her eyes, store uniform polo stretched tight, sneakers, always has a hair tie on her wrist',
    personality_traits: ['Sacrifices everything for her kids', 'Tough but emotionally drained', 'Cries in the shower'],
    reason_never_exercised: "Her kids eat first. Her time is theirs. She genuinely believes she doesn't matter enough to give herself 30 minutes.",
    visual_dna:
      'same heavyset Latina woman, 30, dark ponytail, tan skin, tired eyes, store uniform polo, harsh fluorescent lighting, low quality phone camera, grainy',
    emoji: '\u{1F6D2}',
    gender: 'F',
    locale: 'en',
  },
  {
    name: 'DeShawn Carter',
    age: 27,
    job: 'Construction worker',
    backstory:
      "DeShawn is strong — he carries cinder blocks all day. But he drinks 4 beers every night and eats massive takeout portions. His blood pressure is already high at 27. The doctor said 'you're young, this shouldn't be happening.'",
    physical_description:
      'Muscular but with a big beer gut, late 20s, dark skin, close-cropped hair, thick arms, always dusty, hi-vis vest and steel-toes, calloused hands',
    personality_traits: ['Tough exterior, worried inside', 'Loyal to his crew', 'Thinks fitness is for skinny people'],
    reason_never_exercised: "\"I carry cinder blocks all day, why would I go to the gym?\" But it's not the muscles that are the problem — it's the 4 beers and the takeout at midnight.",
    visual_dna:
      'same muscular big-bellied Black man, late 20s, dark skin, close-cropped hair, hi-vis vest, dusty work clothes, harsh outdoor lighting, low quality phone camera, grainy',
    emoji: '\u{1F3D7}\uFE0F',
    gender: 'M',
    locale: 'en',
  },
  {
    name: 'Ashley Thompson',
    age: 25,
    job: 'Night shift security guard',
    backstory:
      "Ashley works 11pm to 7am sitting at a desk watching monitors. She eats gas station food at 3am because nothing else is open. She sleeps through the day and hasn't seen sunlight properly in months. Her uniform keeps getting tighter and she's running out of belt holes.",
    physical_description:
      'Stocky, mid 20s, auburn hair pulled back tight, pale with dark circles from night shifts, security uniform stretched at the buttons, heavy boots, flashlight on belt',
    personality_traits: ['Night owl who forgot what daylight feels like', 'Sarcastic defense mechanism', 'Reads a lot during quiet shifts'],
    reason_never_exercised: "Her schedule is backwards. When gyms are open she's asleep. When she's awake everything is closed. She's tried home workouts but falls asleep on the mat.",
    visual_dna:
      'same stocky young woman, mid 20s, auburn hair pulled back, pale skin, dark circles, security uniform, harsh fluorescent lighting, low quality phone camera, grainy',
    emoji: '\u{1F6E1}\uFE0F',
    gender: 'F',
    locale: 'en',
  },
]
