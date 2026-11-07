export interface NounDeclensionCell {
  ar: string
  tr: string
  suffix: string
  rule: string
}

export interface NounGroup {
  number: 'singular' | 'dual' | 'plural'
  numberLabel: string
  nom: NounDeclensionCell // 主格 Marfūʿ
  acc: NounDeclensionCell // 宾格 Manṣūb
  gen: NounDeclensionCell // 属格 Majrūr
}

export interface DeclensionNoun {
  id: string
  baseAr: string
  baseTr: string
  zh: string
  root: string
  masculine: {
    indef: NounGroup[]
    def: NounGroup[]
  }
  feminine: {
    indef: NounGroup[]
    def: NounGroup[]
  }
}

function buildRegularNoun(
  id: string,
  stemAr: string,
  stemTr: string,
  zh: string,
  root: string,
): DeclensionNoun {
  return {
    id,
    baseAr: stemAr,
    baseTr: stemTr,
    zh,
    root,
    masculine: {
      indef: [
        {
          number: 'singular',
          numberLabel: '单数 (مُفْرَد)',
          nom: { ar: `${stemAr}ٌ`, tr: `${stemTr}un`, suffix: 'ـٌ (-un)', rule: '单数泛指主格：词尾标双合口符 (-un)' },
          acc: { ar: `${stemAr}ًا`, tr: `${stemTr}an`, suffix: 'ـًا (-an)', rule: '单数泛指宾格：词尾标双开口符并加护卫字母 ا (-an)' },
          gen: { ar: `${stemAr}ٍ`, tr: `${stemTr}in`, suffix: 'ـٍ (-in)', rule: '单数泛指属格：词尾标双齐齿符 (-in)' },
        },
        {
          number: 'dual',
          numberLabel: '双数 (مُثَنَّى · 两个人)',
          nom: { ar: `${stemAr}َانِ`, tr: `${stemTr}āni`, suffix: 'ـَانِ (-āni)', rule: '双数主格：词尾加长音 ا + نِ (-āni)' },
          acc: { ar: `${stemAr}َيْنِ`, tr: `${stemTr}ayni`, suffix: 'ـَيْنِ (-ayni)', rule: '双数宾格：词尾加软音 يْ + نِ (-ayni)' },
          gen: { ar: `${stemAr}َيْنِ`, tr: `${stemTr}ayni`, suffix: 'ـَيْنِ (-ayni)', rule: '双数属格：与宾格同形，均为 ـَيْنِ (-ayni)' },
        },
        {
          number: 'plural',
          numberLabel: '完整阳性复数 (جَمْع مُذَكَّر سَالِم)',
          nom: { ar: `${stemAr}ُونَ`, tr: `${stemTr}ūna`, suffix: 'ـُونَ (-ūna)', rule: '完整阳性复数主格：词尾加长音 و + نَ (-ūna)' },
          acc: { ar: `${stemAr}ِينَ`, tr: `${stemTr}īna`, suffix: 'ـِينَ (-īna)', rule: '完整阳性复数宾格：词尾加长音 ي + نَ (-īna)' },
          gen: { ar: `${stemAr}ِينَ`, tr: `${stemTr}īna`, suffix: 'ـِينَ (-īna)', rule: '完整阳性复数属格：与宾格同形，均为 ـِينَ (-īna)' },
        },
      ],
      def: [
        {
          number: 'singular',
          numberLabel: '单数 (مُفْرَد)',
          nom: { ar: `الْ${stemAr}ُ`, tr: `al-${stemTr}u`, suffix: 'ـُ (-u)', rule: '定指单数主格：加冠词 الـ 后去掉鼻音，标单合口符 (-u)' },
          acc: { ar: `الْ${stemAr}َ`, tr: `al-${stemTr}a`, suffix: 'ـَ (-a)', rule: '定指单数宾格：标单开口符 (-a)，无需护卫字母 ا' },
          gen: { ar: `الْ${stemAr}ِ`, tr: `al-${stemTr}i`, suffix: 'ـِ (-i)', rule: '定指单数属格：标单齐齿符 (-i)' },
        },
        {
          number: 'dual',
          numberLabel: '双数 (مُثَنَّى · 两个人)',
          nom: { ar: `الْ${stemAr}َانِ`, tr: `al-${stemTr}āni`, suffix: 'ـَانِ (-āni)', rule: '定指双数主格：加冠词 الـ，词尾仍为 ـَانِ (-āni)' },
          acc: { ar: `الْ${stemAr}َيْنِ`, tr: `al-${stemTr}ayni`, suffix: 'ـَيْنِ (-ayni)', rule: '定指双数宾格：词尾为 ـَيْنِ (-ayni)' },
          gen: { ar: `الْ${stemAr}َيْنِ`, tr: `al-${stemTr}ayni`, suffix: 'ـَيْنِ (-ayni)', rule: '定指双数属格：词尾为 ـَيْنِ (-ayni)' },
        },
        {
          number: 'plural',
          numberLabel: '完整阳性复数 (جَمْع مُذَكَّر سَالِم)',
          nom: { ar: `الْ${stemAr}ُونَ`, tr: `al-${stemTr}ūna`, suffix: 'ـُونَ (-ūna)', rule: '定指阳性复数主格：词尾为 ـُونَ (-ūna)' },
          acc: { ar: `الْ${stemAr}ِينَ`, tr: `al-${stemTr}īna`, suffix: 'ـِينَ (-īna)', rule: '定指阳性复数宾格：词尾为 ـِينَ (-īna)' },
          gen: { ar: `الْ${stemAr}ِينَ`, tr: `al-${stemTr}īna`, suffix: 'ـِينَ (-īna)', rule: '定指阳性复数属格：词尾为 ـِينَ (-īna)' },
        },
      ],
    },
    feminine: {
      indef: [
        {
          number: 'singular',
          numberLabel: '单数 (مُفْرَدَة)',
          nom: { ar: `${stemAr}َةٌ`, tr: `${stemTr}atun`, suffix: 'ـَةٌ (-atun)', rule: '阴性单数泛指主格：加阴性标志 ة 并标双合口符 (-atun)' },
          acc: { ar: `${stemAr}َةً`, tr: `${stemTr}atan`, suffix: 'ـَةً (-atan)', rule: '阴性单数泛指宾格：ة 直接标双开口符 (-atan)，不加护卫字母 ا！' },
          gen: { ar: `${stemAr}َةٍ`, tr: `${stemTr}atin`, suffix: 'ـَةٍ (-atin)', rule: '阴性单数泛指属格：词尾 ةٍ (-atin)' },
        },
        {
          number: 'dual',
          numberLabel: '双数 (مُثَنَّى · 两个女性)',
          nom: { ar: `${stemAr}َتَانِ`, tr: `${stemTr}atāni`, suffix: 'ـَتَانِ (-atāni)', rule: '阴性双数主格：词尾 ة 展开为普通 ت，再加 ـَانِ (-atāni)' },
          acc: { ar: `${stemAr}َتَيْنِ`, tr: `${stemTr}atayni`, suffix: 'ـَتَيْنِ (-atayni)', rule: '阴性双数宾格：ة 展开为 ت，再加 ـَيْنِ (-atayni)' },
          gen: { ar: `${stemAr}َتَيْنِ`, tr: `${stemTr}atayni`, suffix: 'ـَتَيْنِ (-atayni)', rule: '阴性双数属格：与宾格同形 (-atayni)' },
        },
        {
          number: 'plural',
          numberLabel: '完整阴性复数 (جَمْع مُؤَنَّث سَالِم)',
          nom: { ar: `${stemAr}َاتٌ`, tr: `${stemTr}ātun`, suffix: 'ـَاتٌ (-ātun)', rule: '完整阴性复数主格：去掉 ة 换成长音 ـَاتٌ (-ātun)' },
          acc: { ar: `${stemAr}َاتٍ`, tr: `${stemTr}ātin`, suffix: 'ـَاتٍ (-ātin) ⚠️', rule: '重点特例：完整阴性复数没有 -an 音，宾格与属格统一标双齐齿符 ـَاتٍ (-ātin)！' },
          gen: { ar: `${stemAr}َاتٍ`, tr: `${stemTr}ātin`, suffix: 'ـَاتٍ (-ātin)', rule: '完整阴性复数属格：词尾为 ـَاتٍ (-ātin)' },
        },
      ],
      def: [
        {
          number: 'singular',
          numberLabel: '单数 (مُفْرَدَة)',
          nom: { ar: `الْ${stemAr}َةُ`, tr: `al-${stemTr}atu`, suffix: 'ـَةُ (-atu)', rule: '定指阴性单数主格：词尾 ـَةُ (-atu)' },
          acc: { ar: `الْ${stemAr}َةَ`, tr: `al-${stemTr}ata`, suffix: 'ـَةَ (-ata)', rule: '定指阴性单数宾格：词尾 ـَةَ (-ata)' },
          gen: { ar: `الْ${stemAr}َةِ`, tr: `al-${stemTr}ati`, suffix: 'ـَةِ (-ati)', rule: '定指阴性单数属格：词尾 ـَةِ (-ati)' },
        },
        {
          number: 'dual',
          numberLabel: '双数 (مُثَنَّى · 两个女性)',
          nom: { ar: `الْ${stemAr}َتَانِ`, tr: `al-${stemTr}atāni`, suffix: 'ـَتَانِ (-atāni)', rule: '定指阴性双数主格：词尾 ـَتَانِ (-atāni)' },
          acc: { ar: `الْ${stemAr}َتَيْنِ`, tr: `al-${stemTr}atayni`, suffix: 'ـَتَيْنِ (-atayni)', rule: '定指阴性双数宾格：词尾 ـَتَيْنِ (-atayni)' },
          gen: { ar: `الْ${stemAr}َتَيْنِ`, tr: `al-${stemTr}atayni`, suffix: 'ـَتَيْنِ (-atayni)', rule: '定指阴性双数属格：词尾 ـَتَيْنِ (-atayni)' },
        },
        {
          number: 'plural',
          numberLabel: '完整阴性复数 (جَمْع مُؤَنَّث سَالِم)',
          nom: { ar: `الْ${stemAr}َاتُ`, tr: `al-${stemTr}ātu`, suffix: 'ـَاتُ (-ātu)', rule: '定指阴性复数主格：词尾 ـَاتُ (-ātu)' },
          acc: { ar: `الْ${stemAr}َاتِ`, tr: `al-${stemTr}āti`, suffix: 'ـَاتِ (-āti) ⚠️', rule: '重点特例：完整阴性复数宾格与属格同形，均标齐齿符 ـَاتِ (-āti)！' },
          gen: { ar: `الْ${stemAr}َاتِ`, tr: `al-${stemTr}āti`, suffix: 'ـَاتِ (-āti)', rule: '定指阴性复数属格：词尾 ـَاتِ (-āti)' },
        },
      ],
    },
  }
}

export const DECLENSION_NOUNS: DeclensionNoun[] = [
  buildRegularNoun('muallim', 'مُعَلِّم', 'muʿallim', '教师', 'ع-ل-م'),
  buildRegularNoun('mudarris', 'مُدَرِّس', 'mudarris', '讲师', 'د-ر-س'),
  buildRegularNoun('muslim', 'مُسْلِم', 'muslim', '穆斯林', 'س-ل-م'),
  buildRegularNoun('muhandis', 'مُهَنْدِس', 'muhandis', '工程师', 'ه-ن-د-س'),
  buildRegularNoun('muwazzaf', 'مُوَظَّف', 'muwaẓẓaf', '职员', 'و-ظ-ف'),
  buildRegularNoun('musafir', 'مُسَافِر', 'musāfir', '旅客', 'س-ف-ر'),
  buildRegularNoun('mutarjim', 'مُتَرْجِم', 'mutarjim', '翻译员', 'ت-ر-ج-م'),
  buildRegularNoun('mujtahid', 'مُجْتَهِد', 'mujtahid', '勤奋者', 'ج-ه-د'),
]

export interface BrokenPluralPattern {
  pattern: string
  tr: string
  singularHint: string
  desc: string
  pairs: { singAr: string; singTr: string; plurAr: string; plurTr: string; zh: string }[]
}

export const BROKEN_PLURAL_PATTERNS: BrokenPluralPattern[] = [
  {
    pattern: 'أَفْعَال',
    tr: 'afʿāl',
    singularHint: '常见于 فَعَل / فَعْل / فِعْل 型短单数',
    desc: '最常见的破碎复数词型：词首加 أَ，第 2 根字母后插长音 ا。',
    pairs: [
      { singAr: 'قَلَمٌ', singTr: 'qalamun', plurAr: 'أَقْلَامٌ', plurTr: 'aqlāmun', zh: '笔' },
      { singAr: 'وَلَدٌ', singTr: 'waladun', plurAr: 'أَوْلَادٌ', plurTr: 'awlādun', zh: '男孩；孩子' },
      { singAr: 'وَقْتٌ', singTr: 'waqtun', plurAr: 'أَوْقَاتٌ', plurTr: 'awqātun', zh: '时间' },
    ],
  },
  {
    pattern: 'فُعُول',
    tr: 'fuʿūl',
    singularHint: '常见于 فَعْل / فَعِل 型三母单数',
    desc: '第 1、2 根字母标合口符 u，第 2 根字母后加长音 و。',
    pairs: [
      { singAr: 'بَيْتٌ', singTr: 'baytun', plurAr: 'بُيُوتٌ', plurTr: 'buyūtun', zh: '房子' },
      { singAr: 'دَرْسٌ', singTr: 'darsun', plurAr: 'دُرُوسٌ', plurTr: 'durūsun', zh: '课程' },
      { singAr: 'قَلْبٌ', singTr: 'qalbun', plurAr: 'قُلُوبٌ', plurTr: 'qulūbun', zh: '心脏；心' },
    ],
  },
  {
    pattern: 'فُعُل',
    tr: 'fuʿul',
    singularHint: '常见于含长音的 فِعَال / فَعِيل 型单数',
    desc: '去掉单数中的长音字母，前两个根字母全部改为短合口符 u-u。',
    pairs: [
      { singAr: 'كِتَابٌ', singTr: 'kitābun', plurAr: 'كُتُبٌ', plurTr: 'kutubun', zh: '书；书籍' },
      { singAr: 'مَدِينَةٌ', singTr: 'madīnatun', plurAr: 'مُدُنٌ', plurTr: 'mudunun', zh: '城市' },
      { singAr: 'طَرِيقٌ', singTr: 'ṭarīqun', plurAr: 'طُرُقٌ', plurTr: 'ṭuruqun', zh: '道路' },
    ],
  },
  {
    pattern: 'فُعَّال',
    tr: 'fuʿʿāl',
    singularHint: '专门对应「فَاعِل（主动名词）」指人名词',
    desc: '首字母合口 u，中间根字母加叠音 ّ 并后接长音 ا。',
    pairs: [
      { singAr: 'طَالِبٌ', singTr: 'ṭālibun', plurAr: 'طُلَّابٌ', plurTr: 'ṭullābun', zh: '学生' },
      { singAr: 'تَاجِرٌ', singTr: 'tājirun', plurAr: 'تُجَّارٌ', plurTr: 'tujjārun', zh: '商人' },
      { singAr: 'عَامِلٌ', singTr: 'ʿāmilun', plurAr: 'عُمَّالٌ', plurTr: 'ʿummālun', zh: '工人' },
    ],
  },
  {
    pattern: 'فِعَال',
    tr: 'fiʿāl',
    singularHint: '常见于 فَعِيل 形容词及部分 فَعَل / فَعْل 名词',
    desc: '首字母齐齿 i，第 2 根字母后插长音 ا。',
    pairs: [
      { singAr: 'كَبِيرٌ', singTr: 'kabīrun', plurAr: 'كِبَارٌ', plurTr: 'kibārun', zh: '大的；大人物' },
      { singAr: 'صَغِيرٌ', singTr: 'ṣaghīrun', plurAr: 'صِغَارٌ', plurTr: 'ṣighārun', zh: '小的；孩子们' },
      { singAr: 'رَجُلٌ', singTr: 'rajulun', plurAr: 'رِجَالٌ', plurTr: 'rijālun', zh: '男人' },
    ],
  },
  {
    pattern: 'أَفْعِلَاءُ / فُعَلَاءُ',
    tr: 'afʿilāʾu / fuʿalāʾu',
    singularHint: '常见于指代高尚身份或品质的 فَعِيل / فَاعِل 型词',
    desc: '词尾带长音 اءُ（属于半变尾词，泛指也不加鼻音符！）。',
    pairs: [
      { singAr: 'صَدِيقٌ', singTr: 'ṣadīqun', plurAr: 'أَصْدِقَاءُ', plurTr: 'aṣdiqāʾu', zh: '朋友' },
      { singAr: 'طَبِيبٌ', singTr: 'ṭabībun', plurAr: 'أَطِبَّاءُ', plurTr: 'aṭibbāʾu', zh: '医生' },
      { singAr: 'عَالِمٌ', singTr: 'ʿālimun', plurAr: 'عُلَمَاءُ', plurTr: 'ʿulamāʾu', zh: '学者；科学家' },
    ],
  },
  {
    pattern: 'مَفَاعِلُ',
    tr: 'mafāʿilu',
    singularHint: '对应一切四字母场所名词（مَفْعَل / مَفْعِل / مَفْعَلَة）',
    desc: '在第 2 个字母后插长音 ا，后接齐齿符 i（半变尾词，不加鼻音符）。',
    pairs: [
      { singAr: 'مَدْرَسَةٌ', singTr: 'madrasatun', plurAr: 'مَدَارِسُ', plurTr: 'madārisu', zh: '学校' },
      { singAr: 'مَسْجِدٌ', singTr: 'masjidun', plurAr: 'مَسَاجِدُ', plurTr: 'masājidu', zh: '清真寺' },
      { singAr: 'مَكْتَبٌ', singTr: 'maktabun', plurAr: 'مَكَاتِبُ', plurTr: 'makātibu', zh: '办公室；书桌' },
    ],
  },
  {
    pattern: 'مَفَاعِيلُ',
    tr: 'mafāʿīlu',
    singularHint: '对应五字母工具名词（مِفْعَال / مَفْعُول）',
    desc: '前插长音 ا、后插长音 ي（同样属于半变尾词，不标鼻音符）。',
    pairs: [
      { singAr: 'مِفْتَاحٌ', singTr: 'miftāḥun', plurAr: 'مَفَاتِيحُ', plurTr: 'mafātīḥu', zh: '钥匙' },
      { singAr: 'مِصْبَاحٌ', singTr: 'miṣbāḥun', plurAr: 'مَصَابِيحُ', plurTr: 'maṣābīḥu', zh: '灯；明灯' },
      { singAr: 'مَوْضُوعٌ', singTr: 'mawḍūʿun', plurAr: 'مَوَاضِيعُ', plurTr: 'mawāḍīʿu', zh: '主题；话题' },
    ],
  },
]

export interface VerbFormEntry {
  form: string
  roman: string
  pastPattern: string
  presentPattern: string
  masdarPattern: string
  activeParticiple: string
  addition: string
  coreNuance: string
  desc: string
  example: {
    root: string
    pastAr: string
    presentAr: string
    masdarAr: string
    tr: string
    zh: string
    contrast: string
  }
}

export const TEN_VERB_FORMS: VerbFormEntry[] = [
  {
    form: '第 I 式',
    roman: 'I',
    pastPattern: 'فَعَلَ / فَعِلَ',
    presentPattern: 'يَفْعُلُ / يَفْعَلُ',
    masdarPattern: 'فَعْل (不规则)',
    activeParticiple: 'فَاعِل',
    addition: '原形三母词根（无附加）',
    coreNuance: '基础动作',
    desc: '最原始的三母动词，表示最基础的行为或状态，是一切派生式的起点。',
    example: {
      root: 'ع-ل-م',
      pastAr: 'عَلِمَ',
      presentAr: 'يَعْلَمُ',
      masdarAr: 'عِلْم',
      tr: 'ʿalima / yaʿlamu',
      zh: '知道；获悉',
      contrast: '基础意义：自己知道某事',
    },
  },
  {
    form: '第 II 式',
    roman: 'II',
    pastPattern: 'فَعَّلَ',
    presentPattern: 'يُفَعِّلُ',
    masdarPattern: 'تَفْعِيل',
    activeParticiple: 'مُفَعِّل',
    addition: '中间根字母加叠音符 ّ',
    coreNuance: '使动 · 强化 · 反复',
    desc: '把中间字母双写叠音，最常见的作用是把「自己做」变成「让别人做（使动）」，或表示动作程度剧烈。',
    example: {
      root: 'ع-ل-م',
      pastAr: 'عَلَّمَ',
      presentAr: 'يُعَلِّمُ',
      masdarAr: 'تَعْلِيم',
      tr: 'ʿallama / yuʿallimu',
      zh: '教导；教授（让别人知道）',
      contrast: '对比第 I 式 عَلِمَ (知道) → 第 II 式 عَلَّمَ (教会别人)，词源名词 تَعْلِيم 即「教育」',
    },
  },
  {
    form: '第 III 式',
    roman: 'III',
    pastPattern: 'فَاعَلَ',
    presentPattern: 'يُفَاعِلُ',
    masdarPattern: 'مُفَاعَلَة / فِعَال',
    activeParticiple: 'مُفَاعِل',
    addition: '第 1 个根字母后插入长音 ا',
    coreNuance: '互动 · 对某人做',
    desc: '表示动作在双方之间双向互动，或者试图对某人施加某动作。',
    example: {
      root: 'س-ف-ر',
      pastAr: 'سَافَرَ',
      presentAr: 'يُسَافِرُ',
      masdarAr: 'سَفَر',
      tr: 'sāfara / yusāfiru',
      zh: '旅行；出差',
      contrast: '施事者 مُسَافِر (旅客)；又如 كَتَبَ (写) → كَاتَبَ (与某人通信)',
    },
  },
  {
    form: '第 IV 式',
    roman: 'IV',
    pastPattern: 'أَفْعَلَ',
    presentPattern: 'يُفْعِلُ',
    masdarPattern: 'إِفْعَال',
    activeParticiple: 'مُفْعِل',
    addition: '词首加开口的 أَ，第 1 根字母变静符',
    coreNuance: '使动 · 进入某状态',
    desc: '与第 II 式类似，常把不及物动词变成及物（使动），如「出去」变「拿出/导演」，「平安」变「归顺」。',
    example: {
      root: 'س-ل-م',
      pastAr: 'أَسْلَمَ',
      presentAr: 'يُسْلِمُ',
      masdarAr: 'إِسْلَام',
      tr: 'aslama / yuslimu',
      zh: '归顺；交付和平',
      contrast: '词源名词 إِسْلَام (伊斯兰)，主动名词 مُسْلِم (穆斯林)',
    },
  },
  {
    form: '第 V 式',
    roman: 'V',
    pastPattern: 'تَفَعَّلَ',
    presentPattern: 'يَتَفَعَّلُ',
    masdarPattern: 'تَفَعُّل',
    activeParticiple: 'مُتَفَعِّل',
    addition: '在第 II 式（فَعَّلَ）前加前缀 تَـ',
    coreNuance: '第 II 式的反身 · 循序渐进',
    desc: '「教别人」是第 II 式 عَلَّمَ，那么「教自己（即自发地学习、钻研）」就是加了反身前缀 تَـ 的第 V 式 تَعَلَّمَ！',
    example: {
      root: 'ع-ل-م',
      pastAr: 'تَعَلَّمَ',
      presentAr: 'يَتَعَلَّمُ',
      masdarAr: 'تَعَلُّم',
      tr: 'taʿallama / yataʿallamu',
      zh: '学习；掌握（使自己习得）',
      contrast: 'عَلِمَ (知道) → عَلَّمَ (教导) → تَعَلَّمَ (学习)',
    },
  },
  {
    form: '第 VI 式',
    roman: 'VI',
    pastPattern: 'تَفَاعَلَ',
    presentPattern: 'يَتَفَاعَلُ',
    masdarPattern: 'تَفَاعُل',
    activeParticiple: 'مُتَفَاعِل',
    addition: '在第 III 式（فَاعَلَ）前加前缀 تَـ',
    coreNuance: '群体相互动作 · 假装',
    desc: '表示双方或多方彼此共同做某事（相互），有时也表示假装处于某种状态。',
    example: {
      root: 'ع-و-ن',
      pastAr: 'تَعَاوَنَ',
      presentAr: 'يَتَعَاوَنُ',
      masdarAr: 'تَعَاوُن',
      tr: 'taʿāwana / yataʿāwanu',
      zh: '互相帮助；合作',
      contrast: 'عَوْن (帮助) → تَعَاوُن (合作/互助)',
    },
  },
  {
    form: '第 VII 式',
    roman: 'VII',
    pastPattern: 'اِنْفَعَلَ',
    presentPattern: 'يَنْفَعِلُ',
    masdarPattern: 'اِنْفِعَال',
    activeParticiple: 'مُنْفَعِل',
    addition: '词首加前缀 اِنْـ (in-)',
    coreNuance: '自然被动 · 不及物状态',
    desc: '表示承受动作后的自然结果或被动状态（如「折断了」、「打开了」、「结束了」）。',
    example: {
      root: 'ص-ر-ف',
      pastAr: 'اِنْصَرَفَ',
      presentAr: 'يَنْصَرِفُ',
      masdarAr: 'اِنْصِرَاف',
      tr: 'inṣarafa / yanṣarifu',
      zh: '离开；散去',
      contrast: '又如 كَسَرَ (他打碎了) → اِنْكَسَرَ (它碎了)',
    },
  },
  {
    form: '第 VIII 式',
    roman: 'VIII',
    pastPattern: 'اِفْتَعَلَ',
    presentPattern: 'يَفْتَعِلُ',
    masdarPattern: 'اِفْتِعَال',
    activeParticiple: 'مُفْتَعِل',
    addition: '词首加 اِ，并在第 1 根字母后插入中缀 ـتَـ',
    coreNuance: '反身 · 费力参与 · 聚集',
    desc: '极高频派生式！注意插入的 ت 是词型自带的中缀，不是词根字母！',
    example: {
      root: 'ج-م-ع',
      pastAr: 'اِجْتَمَعَ',
      presentAr: 'يَجْتَمِعُ',
      masdarAr: 'اِجْتِمَاع',
      tr: 'ijtamaʿa / yajtamiʿu',
      zh: '聚会；开会',
      contrast: 'جَمَعَ (收集) → اِجْتَمَعَ (大家聚在一起)，اِجْتِمَاع (会议)',
    },
  },
  {
    form: '第 IX 式',
    roman: 'IX',
    pastPattern: 'اِفْعَلَّ',
    presentPattern: 'يَفْعَلُّ',
    masdarPattern: 'اِفْعِلَال',
    activeParticiple: 'مُفْعَلّ',
    addition: '词首加 اِ，第 3 根字母加叠音 ّ',
    coreNuance: '颜色变化 · 生理特征',
    desc: '专门用于表示变成某种颜色（变红、变绿、变白）或身体特征的变化。',
    example: {
      root: 'ح-م-ر',
      pastAr: 'اِحْمَرَّ',
      presentAr: 'يَحْمَرُّ',
      masdarAr: 'اِحْمِرَار',
      tr: 'iḥmarra / yaḥmarru',
      zh: '变红；脸红',
      contrast: '来自颜色词根 ح-م-ر（أَحْمَر 红色）',
    },
  },
  {
    form: '第 X 式',
    roman: 'X',
    pastPattern: 'اِسْتَفْعَلَ',
    presentPattern: 'يَسْتَفْعِلُ',
    masdarPattern: 'اِسْتِفْعَال',
    activeParticiple: 'مُسْتَفْعِل',
    addition: '词首加标志性三字母前缀 اِسْتَـ (ista-)',
    coreNuance: '寻求 · 请求 · 认为某物如何',
    desc: '只要看到 استـ 开头就是第 X 式！常表示「请求/寻求某事物」或「把某物投入使用」。',
    example: {
      root: 'ع-م-ل',
      pastAr: 'اِسْتَعْمَلَ',
      presentAr: 'يَسْتَعْمِلُ',
      masdarAr: 'اِسْتِعْمَال',
      tr: 'istaʿmala / yastaʿmilu',
      zh: '使用；运用（寻求其发挥作用）',
      contrast: 'عَمِلَ (做/劳动) → اِسْتَعْمَلَ (使用)；又如 غَفَرَ (饶恕) → اِسْتَغْفَرَ (求饶恕)',
    },
  },
]

export interface GrammarQuizQuestion {
  id: string
  category: '句法变格' | '正偏与定语' | '动词变位' | '词根与词法'
  promptZh: string
  sentenceBefore: string
  blankPlaceholder: string
  sentenceAfter: string
  options: { ar: string; tr: string; label?: string }[]
  correctIndex: number
  explanation: string
}

export const GRAMMAR_QUIZ_BANK: GrammarQuizQuestion[] = [
  {
    id: 'q1',
    category: '句法变格',
    promptZh: '学生在学校里。（注意介词 فِي 对后面名词词尾格位的影响）',
    sentenceBefore: 'الطَّالِبُ فِي',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'الْمَدْرَسَةُ', tr: 'al-madrasatu (-tu)', label: '主格合口符' },
      { ar: 'الْمَدْرَسَةِ', tr: 'al-madrasati (-ti)', label: '属格齐齿符' },
      { ar: 'الْمَدْرَسَةَ', tr: 'al-madrasata (-ta)', label: '宾格开口符' },
      { ar: 'مَدْرَسَةٌ', tr: 'madrasatun (-tun)', label: '泛指主格' },
    ],
    correctIndex: 1,
    explanation: '介词 فِي (在…里) 属于拉拽词（حروف الجر），后面的名词必须处于「属格（Majrūr）」，词尾标齐齿符 -ti。',
  },
  {
    id: 'q2',
    category: '句法变格',
    promptZh: '老师打开了那扇门。（注意动词句中「主语」与「宾语」的格位区别）',
    sentenceBefore: 'فَتَحَ الْمُدَرِّسُ',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'الْبَابُ', tr: 'al-bābu (-u)', label: '主格合口符' },
      { ar: 'الْبَابِ', tr: 'al-bābi (-i)', label: '属格齐齿符' },
      { ar: 'الْبَابَ', tr: 'al-bāba (-a)', label: '宾格开口符' },
      { ar: 'بَابٌ', tr: 'bābun (-un)', label: '泛指主格' },
    ],
    correctIndex: 2,
    explanation: '在动词句「فَتَحَ الْمُدَرِّسُ الْبَابَ」中，الْمُدَرِّسُ 是发出动作的主语（标主格 -u），而承受动作的「门」是直接宾语（مفعول به），必须标宾格开口符 -a！',
  },
  {
    id: 'q3',
    category: '正偏与定语',
    promptZh: '汽车的钥匙。（正偏组合 الإِضَافَة：注意第一个词「正次」的规则）',
    sentenceBefore: '',
    blankPlaceholder: '______',
    sentenceAfter: 'السَّيَّارَةِ',
    options: [
      { ar: 'الْمِفْتَاحُ', tr: 'al-miftāḥu', label: '带冠词 الـ' },
      { ar: 'مِفْتَاحٌ', tr: 'miftāḥun', label: '带双符鼻音 -un' },
      { ar: 'مِفْتَاحُ', tr: 'miftāḥu', label: '无冠词·单符 -u' },
      { ar: 'مِفْتَاحًا', tr: 'miftāḥan', label: '带宾格鼻音 -an' },
    ],
    correctIndex: 2,
    explanation: '正偏组合黄金铁律：正次（第一个词）必须「去冠（不能加 الـ）、去鼻音（只能标单符 -u/-a/-i）」，因此只能是 مِفْتَاحُ السَّيَّارَةِ。',
  },
  {
    id: 'q4',
    category: '正偏与定语',
    promptZh: '这所学校很大。（注意阴性起词与述语的性数配合）',
    sentenceBefore: 'الْمَدْرَسَةُ',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'كَبِيرَةٌ', tr: 'kabīratun', label: '阴性·泛指主格' },
      { ar: 'كَبِيرٌ', tr: 'kabīrun', label: '阳性·泛指主格' },
      { ar: 'الْكَبِيرَةُ', tr: 'al-kabīratu', label: '阴性·定指' },
      { ar: 'كَبِيرَةٍ', tr: 'kabīratin', label: '阴性·属格' },
    ],
    correctIndex: 0,
    explanation: '起词 الْمَدْرَسَةُ 以 ة 结尾，是阴性定指名词；作述语的形容词必须配合阴性（加 ة）且保持泛指主格（-tun），才能构成「学校是大的」完整句子。若选 الْكَبِيرَةُ 则变成「那所大学校」短语。',
  },
  {
    id: 'q5',
    category: '动词变位',
    promptZh: '我昨天去了图书馆。（主语是「我 أَنَا」，选择正确的过去式变位）',
    sentenceBefore: '',
    blankPlaceholder: '______',
    sentenceAfter: 'إِلَى الْمَكْتَبَةِ أَمْسِ',
    options: [
      { ar: 'ذَهَبَ', tr: 'dhahaba', label: '词尾 ـَ (他)' },
      { ar: 'ذَهَبَتْ', tr: 'dhahab-at', label: '词尾 ـَتْ (她)' },
      { ar: 'ذَهَبْنَا', tr: 'dhahab-nā', label: '词尾 ـنَا (我们)' },
      { ar: 'ذَهَبْتُ', tr: 'dhahab-tu', label: '词尾 ـتُ (我)' },
    ],
    correctIndex: 3,
    explanation: '过去式动词靠后缀区分人称：第一人称「我（أَنَا）」对应的过去式词尾永远是合口的 ـتُ (-tu) → ذَهَبْتُ。',
  },
  {
    id: 'q6',
    category: '动词变位',
    promptZh: '我们现在正在学习阿拉伯语。（主语是「我们 نَحْنُ」，选择正确的现在式变位）',
    sentenceBefore: 'نَحْنُ',
    blankPlaceholder: '______',
    sentenceAfter: 'اللُّغَةَ الْعَرَبِيَّةَ الْآنَ',
    options: [
      { ar: 'أَدْرُسُ', tr: 'a-drusu', label: '前缀 أَـ (我)' },
      { ar: 'نَدْرُسُ', tr: 'na-drusu', label: '前缀 نَـ (我们)' },
      { ar: 'يَدْرُسُ', tr: 'ya-drusu', label: '前缀 يَـ (他)' },
      { ar: 'تَدْرُسُ', tr: 'ta-drusu', label: '前缀 تَـ (你/她)' },
    ],
    correctIndex: 1,
    explanation: '现在式动词靠前缀（أَنَيْتُ 法则）区分人称：نَحْنُ (我们) 对应前缀 نَـ (na-) → نَدْرُسُ。',
  },
  {
    id: 'q7',
    category: '词根与词法',
    promptZh: '两位男老师在办公室里。（「两位男老师」作起词处于主格，应该用哪个双数词尾？）',
    sentenceBefore: '',
    blankPlaceholder: '______',
    sentenceAfter: 'فِي الْمَكْتَبِ',
    options: [
      { ar: 'الْمُعَلِّمَيْنِ', tr: 'al-muʿallimayni', label: '双数宾/属格 ـَيْنِ' },
      { ar: 'الْمُعَلِّمُونَ', tr: 'al-muʿallimūna', label: '复数主格 ـُونَ' },
      { ar: 'الْمُعَلِّمَانِ', tr: 'al-muʿallimāni', label: '双数主格 ـَانِ' },
      { ar: 'الْمُعَلِّمُ', tr: 'al-muʿallimu', label: '单数主格 ـُ' },
    ],
    correctIndex: 2,
    explanation: '阿语双数（两个人/两件事物）有专门词尾：主格加 ـَانِ (-āni)，宾格和属格加 ـَيْنِ (-ayni)。作句首起词处于主格，因此选 الْمُعَلِّمَانِ。',
  },
  {
    id: 'q8',
    category: '词根与词法',
    promptZh: '单词「مِفْتَاح（钥匙）」是由词根「ف-ت-ح（打开）」套入哪个词型词型派生出来的？',
    sentenceBefore: 'ف - ت - ح ←',
    blankPlaceholder: 'مِفْتَاح',
    sentenceAfter: '',
    options: [
      { ar: 'مَفْعَل', tr: 'mafʿal · 场所名词', label: '表示动作场所' },
      { ar: 'مِفْعَال', tr: 'mifʿāl · 工具名词', label: '表示开门的工具' },
      { ar: 'فَاعِل', tr: 'fāʿil · 主动名词', label: '表示施事者' },
      { ar: 'مَفْعُول', tr: 'mafʿūl · 被动名词', label: '表示受事者' },
    ],
    correctIndex: 1,
    explanation: '词首加 مِـ (mi-)，第二根字母后加长音 ا，构成工具名词词型「مِفْعَال (mifʿāl)」，专门表示完成该动作的器具（打开门的工具 = 钥匙 مِفْتَاح）。',
  },
  {
    id: 'q9',
    category: '正偏与定语',
    promptZh: '这些是新书。（注意「非人复数 كُتُبٌ」在语法上视同哪种性数？）',
    sentenceBefore: 'هَذِهِ كُتُبٌ',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'جَدِيدٌ', tr: 'jadīdun', label: '阳性单数' },
      { ar: 'جَدِيدَانِ', tr: 'jadīdāni', label: '阳性双数' },
      { ar: 'جَدِيدَةٌ', tr: 'jadīdatun', label: '阴性单数' },
      { ar: 'الْجَدِيدَةُ', tr: 'al-jadīdatu', label: '阴性定指' },
    ],
    correctIndex: 2,
    explanation: '阿语黄金铁律：一切无生命事物的复数（如 كُتُبٌ 书籍、بُيُوتٌ 房屋）在语法上律视同「阴性单数」，因此指示代词用 هَذِهِ，修饰它的泛指形容词也用阴性单数 جَدِيدَةٌ！',
  },
  {
    id: 'q10',
    category: '句法变格',
    promptZh: '的确，知识就是光。（注意强调虚词 إِنَّ 对紧随其后的起词格位的影响）',
    sentenceBefore: 'إِنَّ',
    blankPlaceholder: '______',
    sentenceAfter: 'نُورٌ',
    options: [
      { ar: 'الْعِلْمُ', tr: 'al-ʿilmu (-u)', label: '主格合口符' },
      { ar: 'الْعِلْمِ', tr: 'al-ʿilmi (-i)', label: '属格齐齿符' },
      { ar: 'الْعِلْمَ', tr: 'al-ʿilma (-a)', label: '宾格开口符' },
      { ar: 'عِلْمٌ', tr: 'ʿilmun (-un)', label: '泛指主格' },
    ],
    correctIndex: 2,
    explanation: '强调虚词 إِنَّ（的确）属于「立宾扬主」家族：它会把原本处于主格的起词变成「宾格（-a）」，而述语 نُورٌ 保持主格（-un）→ إِنَّ الْعِلْمَ نُورٌ。',
  },
  {
    id: 'q11',
    category: '句法变格',
    promptZh: '那场考试曾经很简单。（注意过去系动词 كَانَ 对后面述语格位的影响）',
    sentenceBefore: 'كَانَ الِامْتِحَانُ',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'سَهْلًا', tr: 'sahlan (-an)', label: '宾格双开口符' },
      { ar: 'سَهْلٌ', tr: 'sahlun (-un)', label: '主格双合口符' },
      { ar: 'سَهْلٍ', tr: 'sahlin (-in)', label: '属格双齐齿符' },
      { ar: 'السَّهْلُ', tr: 'al-sahlu (-u)', label: '定指主格' },
    ],
    correctIndex: 0,
    explanation: '过去残缺动词 كَانَ（曾经是）的作用是「扬主立宾」：起词 الِامْتِحَانُ 保持主格（-u），而述语必须变成宾格（سَهْلًا -an）！',
  },
  {
    id: 'q12',
    category: '词根与词法',
    promptZh: '从「عَلِمَ（他知道）」派生出「عَلَّمَ（他教导别人）」，这是通过第几式动词实现的？',
    sentenceBefore: 'عَلِمَ (I) ←',
    blankPlaceholder: 'عَلَّمَ',
    sentenceAfter: '(使动·教导)',
    options: [
      { ar: 'فَاعَلَ', tr: '第 III 式 · 互动', label: '插入长音 ا' },
      { ar: 'فَعَّلَ', tr: '第 II 式 · 使动/强化', label: '中间根字母加叠音 ّ' },
      { ar: 'اِنْفَعَلَ', tr: '第 VII 式 · 被动', label: '加前缀 اِنْـ' },
      { ar: 'اِسْتَفْعَلَ', tr: '第 X 式 · 求动', label: '加前缀 اِسْتَـ' },
    ],
    correctIndex: 1,
    explanation: '第 II 式（فَعَّلَ faʿʿala）将中间根字母加叠音符 ّ，最核心的功能就是把「自己知道（عَلِمَ）」变成「让别人知道/教导（عَلَّمَ）」，其词源名词正是 تَعْلِيم（教育）。',
  },
  {
    id: 'q13',
    category: '词根与词法',
    promptZh: '我看见了那些男老师。（「男老师们」作动词宾语，完整阳性复数的宾格词尾是什么？）',
    sentenceBefore: 'رَأَيْتُ',
    blankPlaceholder: '______',
    sentenceAfter: 'فِي الْمَدْرَسَةِ',
    options: [
      { ar: 'الْمُعَلِّمُونَ', tr: 'al-muʿallimūna', label: '复数主格 ـُونَ' },
      { ar: 'الْمُعَلِّمَانِ', tr: 'al-muʿallimāni', label: '双数主格 ـَانِ' },
      { ar: 'الْمُعَلِّمِينَ', tr: 'al-muʿallimīna', label: '复数宾/属格 ـِينَ' },
      { ar: 'الْمُعَلِّمُ', tr: 'al-muʿallimu', label: '单数主格 ـُ' },
    ],
    correctIndex: 2,
    explanation: '完整阳性复数在主格时词尾是 ـُونَ (-ūna)，而在宾格和属格时统一变成 ـِينَ (-īna)。此处作「我看见了（رَأَيْتُ）」的直接宾语，故选 الْمُعَلِّمِينَ。',
  },
  {
    id: 'q14',
    category: '动词变位',
    promptZh: '女学生写下了功课。（主语「الطَّالِبَةُ」是阴性单数，句首过去式动词应选哪个？）',
    sentenceBefore: '',
    blankPlaceholder: '______',
    sentenceAfter: 'الطَّالِبَةُ الدَّرْسَ',
    options: [
      { ar: 'كَتَبَ', tr: 'kataba', label: '阳性第三人称' },
      { ar: 'كَتَبَتْ', tr: 'katabat (-at)', label: '阴性第三人称 ـَتْ' },
      { ar: 'كَتَبْتُ', tr: 'katabtu (-tu)', label: '第一人称我' },
      { ar: 'كَتَبْنَا', tr: 'katabnā (-nā)', label: '第一人称我们' },
    ],
    correctIndex: 1,
    explanation: '当动词句的主语是阴性（如 الطَّالِبَةُ 女学生），过去式动词词尾必须加上阴性静符标志 ـَتْ (-at) → كَتَبَتْ。',
  },
  {
    id: 'q15',
    category: '正偏与定语',
    promptZh: '我买了一辆新汽车。（「新汽车」是泛指阴性宾语，形容词定语该如何配合？）',
    sentenceBefore: 'اِشْتَرَيْتُ سَيَّارَةً',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'جَدِيدَةٌ', tr: 'jadīdatun (-tun)', label: '阴性主格' },
      { ar: 'جَدِيدًا', tr: 'jadīdan (-an)', label: '阳性宾格' },
      { ar: 'الْجَدِيدَةَ', tr: 'al-jadīdata', label: '阴性定指宾格' },
      { ar: 'جَدِيدَةً', tr: 'jadīdatan (-tan)', label: '阴性泛指宾格' },
    ],
    correctIndex: 3,
    explanation: '形容词定语必须与被修饰名词（سَيَّارَةً）在「性、数、格、指代」四方面完全一致：阴性、单数、宾格、泛指 → جَدِيدَةً（注意以 ة 结尾的词标双开口符时不加 ا）。',
  },
  {
    id: 'q16',
    category: '词根与词法',
    promptZh: '以「اِسْتَـ (ista-)」开头的动词（如 اِسْتَعْمَلَ 使用、اِسْتَغْفَرَ 求饶恕）属于第几式动词？',
    sentenceBefore: 'ع - م - ل ←',
    blankPlaceholder: 'اِسْتَعْمَلَ',
    sentenceAfter: '(使用 / 寻求效用)',
    options: [
      { ar: 'اِسْتَفْعَلَ', tr: '第 X 式 (Form X)', label: '前缀 اِسْتَـ · 求动/使用' },
      { ar: 'اِفْتَعَلَ', tr: '第 VIII 式 (Form VIII)', label: '中缀 ـتَـ · 反身/聚集' },
      { ar: 'تَفَعَّلَ', tr: '第 V 式 (Form V)', label: '前缀 تَـ + 叠音' },
      { ar: 'أَفْعَلَ', tr: '第 IV 式 (Form IV)', label: '前缀 أَ · 使动' },
    ],
    correctIndex: 0,
    explanation: '词首带有标志性的三字母前缀「اِسْتَـ (ista-)」永远是第 X 式动词（اِسْتَفْعَلَ），核心含义是「寻求、请求某事物」或「将其投入使用」。',
  },
  {
    id: 'q17',
    category: '句法变格',
    promptZh: '太阳比月亮更大。（比较级词型 أَفْعَلُ 属于「半变尾词」，词尾该如何标符？）',
    sentenceBefore: 'الشَّمْسُ',
    blankPlaceholder: '______',
    sentenceAfter: 'مِنَ الْقَمَرِ',
    options: [
      { ar: 'أَكْبَرٌ', tr: 'akbarun (-un)', label: '带双合口鼻音' },
      { ar: 'أَكْبَرُ', tr: 'akbaru (-u)', label: '单合口符（无鼻音）' },
      { ar: 'أَكْبَرِ', tr: 'akbari (-i)', label: '单齐齿符' },
      { ar: 'كَبِيرٌ', tr: 'kabīrun', label: '原级形容词' },
    ],
    correctIndex: 1,
    explanation: '比较级与颜色词（أَفْعَلُ 词型）属于「半变尾词（الممنوع من الصرف）」，泛指时绝不加双符鼻音，因此主格只能标单合口符 أَكْبَرُ (-u)。',
  },
  {
    id: 'q18',
    category: '正偏与定语',
    promptZh: '我读了三本书。（注意数字 3~10 的「阴阳反配」铁律：كِتَاب 单数是阳性！）',
    sentenceBefore: 'قَرَأْتُ',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'ثَلَاثَ كُتُبٍ', tr: 'thalātha kutubin', label: '数词无 ة + 复数属格' },
      { ar: 'ثَلَاثَةَ كِتَابٍ', tr: 'thalāthata kitābin', label: '数词带 ة + 单数属格' },
      { ar: 'ثَلَاثَةَ كُتُبٍ', tr: 'thalāthata kutubin', label: '数词带 ة + 复数属格' },
      { ar: 'ثَلَاثَةَ كِتَابًا', tr: 'thalāthata kitāban', label: '数词带 ة + 单数宾格' },
    ],
    correctIndex: 2,
    explanation: '数字 3~10 两大铁律：① 数词性别与被数名词单数性别相反（كِتَاب 是阳性，所以数词必须加 ة 用 ثَلَاثَةَ）；② 被数名词用泛指复数属格（كُتُبٍ）。',
  },
  {
    id: 'q19',
    category: '正偏与定语',
    promptZh: '教室里有二十名学生。（数字 11~99 后面的被数名词应该用什么数与格？）',
    sentenceBefore: 'فِي الْفَصْلِ عِشْرُونَ',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'طُلَّابٍ', tr: 'ṭullābin', label: '复数属格' },
      { ar: 'طُلَّابٌ', tr: 'ṭullābun', label: '复数主格' },
      { ar: 'طَالِبٍ', tr: 'ṭālibin', label: '单数属格' },
      { ar: 'طَالِبًا', tr: 'ṭāliban (-an)', label: '泛指单数宾格' },
    ],
    correctIndex: 3,
    explanation: '数字 11~99 后面的被数名词作「区分语（تمييز）」，永远使用【泛指单数宾格（-an）】，因此选 طَالِبًا！',
  },
  {
    id: 'q20',
    category: '动词变位',
    promptZh: '现在不要走出房间！（禁止式「لَا + 现在式」会使动词词尾变成什么格？）',
    sentenceBefore: 'لَا',
    blankPlaceholder: '______',
    sentenceAfter: 'مِنَ الْغُرْفَةِ الْآنَ',
    options: [
      { ar: 'تَخْرُجُ', tr: 'takhruju (-u)', label: '主格合口符' },
      { ar: 'تَخْرُجْ', tr: 'takhruj (-ْ)', label: '切音格静符' },
      { ar: 'تَخْرُجَ', tr: 'takhruja (-a)', label: '宾格开口符' },
      { ar: 'خَرَجْتَ', tr: 'kharajta', label: '过去式' },
    ],
    correctIndex: 1,
    explanation: '表达「不要做某事」的禁止虚词 لَا 会使后面的第二人称现在式动词处于「切音格（مجزوم）」，词尾合口符 -u 变成静符（ْ）→ لَا تَخْرُجْ。',
  },
  {
    id: 'q21',
    category: '正偏与定语',
    promptZh: '走进教室的那名女学生很勤奋。（先行词「الطَّالِبَةُ」是确指阴性单数，关系代词选哪个？）',
    sentenceBefore: 'الطَّالِبَةُ',
    blankPlaceholder: '______',
    sentenceAfter: 'دَخَلَتِ الْفَصْلَ مُجْتَهِدَةٌ',
    options: [
      { ar: 'الَّذِي', tr: 'alladhī', label: '阳性单数关系代词' },
      { ar: 'الَّذِينَ', tr: 'alladhīna', label: '阳性复数关系代词' },
      { ar: 'الَّتِي', tr: 'allatī', label: '阴性单数关系代词' },
      { ar: 'هَذِهِ', tr: 'hādhihi', label: '阴性指示代词' },
    ],
    correctIndex: 2,
    explanation: '关系代词必须与前面的确指先行词性数一致：الطَّالِبَةُ 是阴性单数，因此必须用阴性关系代词 الَّتِي (allatī)。',
  },
  {
    id: 'q22',
    category: '动词变位',
    promptZh: '我想要学习阿拉伯语。（注意不定式虚词 أَنْ 对后面现在式动词词尾的影响）',
    sentenceBefore: 'أُرِيدُ أَنْ',
    blankPlaceholder: '______',
    sentenceAfter: 'اللُّغَةَ الْعَرَبِيَّةَ',
    options: [
      { ar: 'أَتَعَلَّمَ', tr: 'ataʿallama (-a)', label: '现在式宾格开口符' },
      { ar: 'أَتَعَلَّمُ', tr: 'ataʿallamu (-u)', label: '现在式主格合口符' },
      { ar: 'أَتَعَلَّمْ', tr: 'ataʿallam (-ْ)', label: '现在式切音格静符' },
      { ar: 'تَعَلَّمْتُ', tr: 'taʿallamtu', label: '过去式' },
    ],
    correctIndex: 0,
    explanation: '虚词 أَنْ（以及 لَنْ / لِـ / كَيْ）是现在式宾格工具词，会使后面的现在式动词词尾从主格 -u 变成宾格开口符 -a → أُرِيدُ أَنْ أَتَعَلَّمَ。',
  },
  {
    id: 'q23',
    category: '动词变位',
    promptZh: '哈立德昨天没有去学校。（虚词 لَمْ 后接什么形态的动词来表达过去否定？）',
    sentenceBefore: 'لَمْ',
    blankPlaceholder: '______',
    sentenceAfter: 'خَالِدٌ إِلَى الْمَدْرَسَةِ أَمْسِ',
    options: [
      { ar: 'ذَهَبَ', tr: 'dhahaba', label: '过去式' },
      { ar: 'يَذْهَبُ', tr: 'yadhhabu (-u)', label: '现在式主格' },
      { ar: 'يَذْهَبَ', tr: 'yadhhaba (-a)', label: '现在式宾格' },
      { ar: 'يَذْهَبْ', tr: 'yadhhab (-ْ)', label: '现在式切音格静符' },
    ],
    correctIndex: 3,
    explanation: 'لَمْ 是过去否定切音词：后面永远接「现在式切音格（词尾标静符 ْ）」，但把时间意义拉回过去，表示「过去没有做某事」→ لَمْ يَذْهَبْ。',
  },
  {
    id: 'q24',
    category: '句法变格',
    promptZh: '课程被写在了黑板上。（过去被动式 كُتِبَ 后面的「课程」作代主语，应处于什么格？）',
    sentenceBefore: 'كُتِبَ',
    blankPlaceholder: '______',
    sentenceAfter: 'عَلَى السَّبُّورَةِ',
    options: [
      { ar: 'الدَّرْسَ', tr: 'al-darsa (-a)', label: '宾格开口符' },
      { ar: 'الدَّرْسُ', tr: 'al-darsu (-u)', label: '主格合口符（代主语）' },
      { ar: 'الدَّرْسِ', tr: 'al-darsi (-i)', label: '属格齐齿符' },
      { ar: 'دَرْسًا', tr: 'darsan (-an)', label: '泛指宾格' },
    ],
    correctIndex: 1,
    explanation: '当动词变为被动式（كَتَبَ → كُتِبَ 首合倒二齐），原来的宾语自动升格为「代主语（نائب الفاعل）」，必须标主格合口符 (-u) → كُتِبَ الدَّرْسُ！',
  },
  {
    id: 'q25',
    category: '句法变格',
    promptZh: '孩子高高兴兴地回到了家里。（表示动作伴随状态的「状语 الحال」应该用什么形式？）',
    sentenceBefore: 'رَجَعَ الطِّفْلُ إِلَى الْبَيْتِ',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'سَعِيدٌ', tr: 'saʿīdun (-un)', label: '泛指主格' },
      { ar: 'السَّعِيدُ', tr: 'al-saʿīdu', label: '定指主格' },
      { ar: 'سَعِيدًا', tr: 'saʿīdan (-an)', label: '泛指宾格（状态状语）' },
      { ar: 'سَعِيدٍ', tr: 'saʿīdin (-in)', label: '泛指属格' },
    ],
    correctIndex: 2,
    explanation: '描述主语或宾语在动作发生时所处状态的成分叫「状态状语（الحال）」，永远使用【泛指宾格（-an）】→ سَعِيدًا（高高兴兴地）。',
  },
  {
    id: 'q26',
    category: '词根与词法',
    promptZh: '我看见了女老师们。（注意【完整阴性复数 ـَات】在宾格位置的特殊标符规则！）',
    sentenceBefore: 'رَأَيْتُ',
    blankPlaceholder: '______',
    sentenceAfter: 'فِي الْجَامِعَةِ',
    options: [
      { ar: 'الْمُعَلِّمَاتَ', tr: 'al-muʿallimāta (-ta)', label: '标开口符 -a（错误）' },
      { ar: 'الْمُعَلِّمَاتُ', tr: 'al-muʿallimātu (-tu)', label: '主格合口符 -u' },
      { ar: 'الْمُعَلِّمَاتِ', tr: 'al-muʿallimāti (-ti)', label: '宾/属格同形标齐齿符 -i' },
      { ar: 'مُعَلِّمَاتٌ', tr: 'muʿallimātun', label: '泛指主格' },
    ],
    correctIndex: 2,
    explanation: '重点特例：以 ـَات 结尾的完整阴性复数在阿语中【绝对没有开口符 -a】！它的宾格与属格完全同形，都标齐齿符（定指 ـَاتِ -āti / 泛指 ـَاتٍ -ātin）！',
  },
  {
    id: 'q27',
    category: '词根与词法',
    promptZh: '四字母场所名词「مَسْجِد（清真寺）」和「مَدْرَسَة（学校）」的破碎复数遵循哪个词型？',
    sentenceBefore: 'مَسْجِد / مَدْرَسَة ←',
    blankPlaceholder: 'مَسَاجِدُ / مَدَارِسُ',
    sentenceAfter: '',
    options: [
      { ar: 'مَفَاعِلُ', tr: 'mafāʿilu（场所复数词型）', label: '半变尾破碎复数' },
      { ar: 'أَفْعَال', tr: 'afʿāl', label: '三母短词复数' },
      { ar: 'فُعُول', tr: 'fuʿūl', label: '三母短词复数' },
      { ar: 'فُعَّال', tr: 'fuʿʿāl', label: '主动名词复数' },
    ],
    correctIndex: 0,
    explanation: '凡是以 مَـ 开头的四字母场所名词（مَفْعَل / مَفْعِل / مَفْعَلَة），其破碎复数统一套入「مَفَاعِلُ (mafāʿilu)」词型，且属于半变尾词不加鼻音符！',
  },
  {
    id: 'q28',
    category: '动词变位',
    promptZh: '中空动词「قَالَ（他说了）」在第一人称「我说了」时，过去式该如何变位？',
    sentenceBefore: 'أَنَا',
    blankPlaceholder: '______',
    sentenceAfter: 'الْحَقَّ (我说出了真相)',
    options: [
      { ar: 'قَالْتُ', tr: 'qāltu（双静符冲突）', label: '保留长音 ا' },
      { ar: 'قُلْتُ', tr: 'qultu', label: '长音缩合为合口短音 u' },
      { ar: 'قَوَلْتُ', tr: 'qawaltu', label: '还原柔母 و' },
      { ar: 'أَقُولُ', tr: 'aqūlu', label: '现在式' },
    ],
    correctIndex: 1,
    explanation: '中空动词（中间根字母为柔母 و/ي，如 قَالَ ← ق-و-ل）在接带静符的人称后缀（ـتُ / ـتَ / ـنَا）时，中间长音必须脱落并缩合为短元音 → قُلْتُ (qultu)！',
  },
  {
    id: 'q29',
    category: '句法变格',
    promptZh: '老师啊，我有一个问题。（注意呼格虚词 يَا 后接单个名称时的标符规则）',
    sentenceBefore: 'يَا',
    blankPlaceholder: '______',
    sentenceAfter: 'عِنْدِي سُؤَالٌ',
    options: [
      { ar: 'أُسْتَاذٌ', tr: 'ustādhun (-un)', label: '带双符鼻音' },
      { ar: 'أُسْتَاذُ', tr: 'ustādhu (-u)', label: '去鼻音标单合口符' },
      { ar: 'الْأُسْتَاذُ', tr: 'al-ustādhu', label: '直接带冠词 الـ' },
      { ar: 'أُسْتَاذٍ', tr: 'ustādhin (-in)', label: '属格' },
    ],
    correctIndex: 1,
    explanation: '呼格铁律：当呼唤词 يَا 后面接单个词（非正偏组合）时，必须去掉双符鼻音，定于单合口符 (-u) → يَا أُسْتَاذُ / يَا خَالِدُ。',
  },
  {
    id: 'q30',
    category: '句法变格',
    promptZh: '我在市场看见了你的父亲。（「五名词」中的 أَبٌ 作正次且处于宾格时，用哪个长音字母变格？）',
    sentenceBefore: 'رَأَيْتُ',
    blankPlaceholder: '______',
    sentenceAfter: 'فِي السُّوقِ',
    options: [
      { ar: 'أَبُوكَ', tr: 'abūka (-ū-)', label: '五名词主格长音 و' },
      { ar: 'أَبِيكَ', tr: 'abīka (-ī-)', label: '五名词属格长音 ي' },
      { ar: 'أَبَاكَ', tr: 'abāka (-ā-)', label: '五名词宾格长音 ا' },
      { ar: 'أَبٌ', tr: 'abun', label: '泛指单数' },
    ],
    correctIndex: 2,
    explanation: '五名词（أَبٌ / أَخٌ / ذُو 等）后接偏次时靠长音字母变格：主格用 و (أَبُوكَ)，宾格用 ا (أَبَاكَ)，属格用 ي (أَبِيكَ)。此处作「看见」的宾语，故选 أَبَاكَ。',
  },
  {
    id: 'q31',
    category: '动词变位',
    promptZh: '首柔动词「وَصَلَ（他到达了）」变成第三人称现在式「他到达」时，词形是什么？',
    sentenceBefore: 'وَصَلَ (过去式) ←',
    blankPlaceholder: '______',
    sentenceAfter: '(现在式：他到达)',
    options: [
      { ar: 'يَوْصِلُ', tr: 'yawṣilu', label: '保留首柔母 و' },
      { ar: 'يَصِلُ', tr: 'yaṣilu', label: '首柔母 و 脱落' },
      { ar: 'يُوصِلُ', tr: 'yūṣilu', label: '第 IV 式现在式' },
      { ar: 'وَاصِلٌ', tr: 'wāṣilun', label: '主动名词' },
    ],
    correctIndex: 1,
    explanation: '首柔动词（第 1 根字母为 و，如 وَصَلَ / وَجَدَ / وَقَفَ）在变为第 I 式现在式和命令式时，开头的 و 会脱落：وَصَلَ → يَصِلُ (yaṣilu)！',
  },
  {
    id: 'q32',
    category: '动词变位',
    promptZh: '凡是努力的人，必将成功。（双切音条件代词 مَنْ 会使条件动词与结果动词变成什么格？）',
    sentenceBefore: 'مَنْ يَجْتَهِدْ',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'يَنْجَحُ', tr: 'yanjaḥu (-u)', label: '主格合口符' },
      { ar: 'يَنْجَحَ', tr: 'yanjaḥa (-a)', label: '宾格开口符' },
      { ar: 'يَنْجَحْ', tr: 'yanjaḥ (-ْ)', label: '切音格静符' },
      { ar: 'نَاجِحٌ', tr: 'nājiḥun', label: '主动名词' },
    ],
    correctIndex: 2,
    explanation: '切音条件词（إِنْ / مَنْ / مَا / مَهْمَا）具有「双切音」威力：条件动词（يَجْتَهِدْ）和结果动词（يَنْجَحْ）必须双双处于切音格（标静符 ْ）！',
  },
  {
    id: 'q33',
    category: '句法变格',
    promptZh: '除了一个学生外，学生们都出席了。（肯定完整句后，例外词 إِلَّا 后面的名词处于什么格？）',
    sentenceBefore: 'حَضَرَ الطُّلَّابُ إِلَّا',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'طَالِبٌ', tr: 'ṭālibun (-un)', label: '主格' },
      { ar: 'طَالِبٍ', tr: 'ṭālibin (-in)', label: '属格' },
      { ar: 'طَالِبًا', tr: 'ṭāliban (-an)', label: '宾格（被排除词）' },
      { ar: 'الطَّالِبُ', tr: 'al-ṭālibu', label: '定指主格' },
    ],
    correctIndex: 2,
    explanation: '当 إِلَّا（除了）前面的句子是肯定且主干完整时，إِلَّا 后面的被排除词（المستثنى）必须处于宾格 → طَالِبًا (-an)。',
  },
  {
    id: 'q34',
    category: '句法变格',
    promptZh: '天空多么美丽啊！（感叹句式「مَا أَفْعَلَ」后面的被感叹名词处于什么格？）',
    sentenceBefore: 'مَا أَجْمَلَ',
    blankPlaceholder: '______',
    sentenceAfter: '',
    options: [
      { ar: 'السَّمَاءُ', tr: 'al-samāʾu (-u)', label: '主格' },
      { ar: 'السَّمَاءَ', tr: 'al-samāʾa (-a)', label: '宾格开口符' },
      { ar: 'السَّمَاءِ', tr: 'al-samāʾi (-i)', label: '属格' },
      { ar: 'سَمَاءٌ', tr: 'samāʾun', label: '泛指主格' },
    ],
    correctIndex: 1,
    explanation: '标准感叹句式「مَا أَفْعَلَ + 宾语」中，أَجْمَلَ 是感叹动词，而被感叹的事物（السَّمَاءَ）作直接宾语，必须标宾格开口符 (-a)！',
  },
  {
    id: 'q35',
    category: '词根与词法',
    promptZh: '我透彻地理解了这堂课。（动词后面接它自己的同源词源名词宾格，这种修辞成分叫什么？）',
    sentenceBefore: 'فَهِمْتُ الدَّرْسَ',
    blankPlaceholder: '______',
    sentenceAfter: 'جَيِّدًا',
    options: [
      { ar: 'فَهْمًا', tr: 'fahman · 绝对宾语 (المفعول المطلق)', label: '同根词源名词宾格' },
      { ar: 'فَاهِمٌ', tr: 'fāhimun · 主动名词', label: '主格' },
      { ar: 'مَفْهُومٌ', tr: 'mafhūmun · 被动名词', label: '主格' },
      { ar: 'يَفْهَمُ', tr: 'yafhamu · 现在式', label: '动词' },
    ],
    correctIndex: 0,
    explanation: '在动词（فَهِمْتُ）后接同一个词根的词源名词并标宾格（فَهْمًا），称为「绝对宾语（المفعول المطلق）」，用于强化动作或说明动作程度。',
  },
  {
    id: 'q36',
    category: '词根与词法',
    promptZh: '在第 II ~ X 式的派生分词（均以 مُـ 开头）中，如何区分「主动名词」与「被动名词」？',
    sentenceBefore: 'مُحْتَرِم (尊重他人者) vs',
    blankPlaceholder: 'مُحْتَرَم',
    sentenceAfter: '(受人尊敬者)',
    options: [
      { ar: '倒数第二字母：主动标 -i-，被动标 -a-', tr: 'muḥtarim (-i-) vs muḥtaram (-a-)', label: '核心音变规则' },
      { ar: '词首字母：主动标 ma-，被动标 mu-', tr: 'ma- vs mu-', label: '错误' },
      { ar: '词尾必须加长音 و', tr: '-ū', label: '错误' },
      { ar: '两者发音完全相同', tr: 'same', label: '错误' },
    ],
    correctIndex: 0,
    explanation: '第 II~X 式分词全部以合口的 مُـ (mu-) 开头：倒数第二个根字母标齐齿符 (-i-) 为主动名词（如 مُعَلِّم / مُسْتَخْدِم），标开口符 (-a-) 为被动名词（如 مُحْتَرَم / مُسْتَعْمَل）！',
  },
]

