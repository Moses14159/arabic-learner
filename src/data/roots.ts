import type { Word } from './words'

export interface DerivedWord extends Word {
  wazn: string
  waznRole: string
  pos: string
}

export interface RootFamily {
  id: string
  letters: [string, string, string]
  display: string
  coreMeaning: string
  story: string
  words: DerivedWord[]
}

export interface WaznTemplate {
  pattern: string
  tr: string
  role: string
  desc: string
  example: string
}

export const WAZN_TEMPLATES: WaznTemplate[] = [
  { pattern: 'فَعَلَ', tr: 'faʿala', role: '基本过去式动词', desc: '将三个词根字母依次填入 ف - ع - ل，表示「他做了某动作」。', example: 'كَتَبَ (他写了)' },
  { pattern: 'فَاعِل', tr: 'fāʿil', role: '主动分词（施事者）', desc: '在第一个根字母后插入长音 ا，表示「做该动作的人」。', example: 'كَاتِب (作家/写字的人)' },
  { pattern: 'مَفْعُول', tr: 'mafʿūl', role: '被动分词（受事者）', desc: '词首加 مَـ，第二根字母后加长音 و，表示「承受动作的事物」。', example: 'مَكْتُوب (信件/被写下的)' },
  { pattern: 'مَفْعَل / مَفْعَلَة', tr: 'mafʿal(a)', role: '时空名词（场所）', desc: '词首加 مَـ，表示「发生该动作的地点或场所」。', example: 'مَكْتَب (办公室) / مَكْتَبَة (图书馆)' },
  { pattern: 'مِفْعَال', tr: 'mifʿāl', role: '工具名词', desc: '词首加 مِـ，第二根字母后加长音 ا，表示「完成该动作的工具」。', example: 'مِفْتَاح (钥匙 ← فتح 打开)' },
  { pattern: 'فَعَّلَ', tr: 'faʿʿala', role: '第 II 式派生动词（使动/强化）', desc: '将中间根字母加叠音符 ّ，常把「自己做」变成「让别人做/教别人做」。', example: 'عَلِمَ (知道) → عَلَّمَ (教导)' },
]

export const ROOT_FAMILIES: RootFamily[] = [
  {
    id: 'ktb',
    letters: ['ك', 'ت', 'ب'],
    display: 'ك · ت · ب',
    coreMeaning: '书写 · 记录',
    story: '阿语最经典的第一词根：一切与「写字、书本、办公桌、书店」相关的词都从这三个辅音生长出来。',
    words: [
      { ar: 'كَتَبَ', tr: 'kataba', zh: '他写了', wazn: 'فَعَلَ', waznRole: '第 I 式动词', pos: '动词' },
      { ar: 'كِتَاب', tr: 'kitāb', zh: '书；书籍', wazn: 'فِعَال', waznRole: '名词', pos: '名词' },
      { ar: 'كُتُب', tr: 'kutub', zh: '书籍（复数）', wazn: 'فُعُل', waznRole: '破碎复数', pos: '名词' },
      { ar: 'كَاتِب', tr: 'kātib', zh: '作家；书记员', wazn: 'فَاعِل', waznRole: '主动分词（写的人）', pos: '名词' },
      { ar: 'مَكْتَب', tr: 'maktab', zh: '办公室；书桌', wazn: 'مَفْعَل', waznRole: '场所名词（写字的地方）', pos: '名词' },
      { ar: 'مَكْتَبَة', tr: 'maktaba', zh: '图书馆；书店', wazn: 'مَفْعَلَة', waznRole: '大型场所名词（藏书之地）', pos: '名词' },
      { ar: 'مَكْتُوب', tr: 'maktūb', zh: '信件；注定的（被写好的）', wazn: 'مَفْعُول', waznRole: '被动分词', pos: '形容词/名词' },
    ],
  },
  {
    id: 'drs',
    letters: ['د', 'ر', 'س'],
    display: 'د · ر · س',
    coreMeaning: '学习 · 钻研 · 授课',
    story: '从自己读书（darasa），到给别人上课（darrasa），再到上课的地方（madrasa 学校），全由「د-ر-س」统领。',
    words: [
      { ar: 'دَرَسَ', tr: 'darasa', zh: '他学习了', wazn: 'فَعَلَ', waznRole: '第 I 式动词', pos: '动词' },
      { ar: 'دَرَّسَ', tr: 'darrasa', zh: '他教授了；教书', wazn: 'فَعَّلَ', waznRole: '第 II 式使动动词', pos: '动词' },
      { ar: 'دَرْس', tr: 'dars', zh: '课；一节课', wazn: 'فَعْل', waznRole: '词根名词（Masdar）', pos: '名词' },
      { ar: 'مَدْرَسَة', tr: 'madrasa', zh: '学校', wazn: 'مَفْعَلَة', waznRole: '场所名词（学习的地方）', pos: '名词' },
      { ar: 'مُدَرِّس', tr: 'mudarris', zh: '教师；老师', wazn: 'مُفَعِّل', waznRole: '第 II 式主动分词（教书的人）', pos: '名词' },
      { ar: 'دِرَاسَة', tr: 'dirāsa', zh: '学业；研究', wazn: 'فِعَالَة', waznRole: '词根名词', pos: '名词' },
    ],
  },
  {
    id: '3lm',
    letters: ['ع', 'ل', 'م'],
    display: 'ع · ل · م',
    coreMeaning: '知晓 · 知识 · 标记',
    story: '涵盖「知识、科学、世界、学者、教师」。注意中间字母加叠音就会从「知道」变成「教会别人」。',
    words: [
      { ar: 'عَلِمَ', tr: 'ʿalima', zh: '他知道；获悉', wazn: 'فَعِلَ', waznRole: '第 I 式动词', pos: '动词' },
      { ar: 'عِلْم', tr: 'ʿilm', zh: '知识；科学', wazn: 'فِعْل', waznRole: '词根名词', pos: '名词' },
      { ar: 'عَالِم', tr: 'ʿālim', zh: '学者；科学家', wazn: 'فَاعِل', waznRole: '主动分词（掌握知识的人）', pos: '名词' },
      { ar: 'مُعَلِّم', tr: 'muʿallim', zh: '老师；导师', wazn: 'مُفَعِّل', waznRole: '第 II 式主动分词（传授知识的人）', pos: '名词' },
      { ar: 'عَالَم', tr: 'ʿālam', zh: '世界；宇宙', wazn: 'فَاعَل', waznRole: '衍生名词', pos: '名词' },
      { ar: 'مَعْلُوم', tr: 'maʿlūm', zh: '已知的；当然', wazn: 'مَفْعُول', waznRole: '被动分词', pos: '形容词' },
    ],
  },
  {
    id: '3ml',
    letters: ['ع', 'م', 'ل'],
    display: 'ع · م · ل',
    coreMeaning: '劳动 · 制作 · 行动',
    story: '表示「动手做事」的核心词根，衍生出工作、工人、工厂以及实用。',
    words: [
      { ar: 'عَمِلَ', tr: 'ʿamila', zh: '他工作了；做了', wazn: 'فَعِلَ', waznRole: '第 I 式动词', pos: '动词' },
      { ar: 'عَمَل', tr: 'ʿamal', zh: '工作；职业', wazn: 'فَعَل', waznRole: '词根名词', pos: '名词' },
      { ar: 'عَامِل', tr: 'ʿāmil', zh: '工人；职员', wazn: 'فَاعِل', waznRole: '主动分词（工作的人）', pos: '名词' },
      { ar: 'مَعْمَل', tr: 'maʿmal', zh: '工厂；实验室', wazn: 'مَفْعَل', waznRole: '场所名词（工作的场所）', pos: '名词' },
      { ar: 'عَمَلِيَّة', tr: 'ʿamaliyya', zh: '操作；手术；行动', wazn: 'فَعَلِيَّة', waznRole: '抽象名词', pos: '名词' },
    ],
  },
  {
    id: 'slm',
    letters: ['س', 'ل', 'م'],
    display: 'س · ل · م',
    coreMeaning: '平安 · 健全 · 顺从',
    story: '阿拉伯问候语「Salām（平安）」的源头，也是「Islām」与「Muslim」的词根。',
    words: [
      { ar: 'سَلَام', tr: 'salām', zh: '和平；平安；问候', wazn: 'فَعَال', waznRole: '词根名词', pos: '名词' },
      { ar: 'سَلِيم', tr: 'salīm', zh: '健全的；无恙的', wazn: 'فَعِيل', waznRole: '指小/性质形容词', pos: '形容词' },
      { ar: 'إِسْلَام', tr: 'islām', zh: '伊斯兰；归顺和平', wazn: 'إِفْعَال', waznRole: '第 IV 式词根名词', pos: '名词' },
      { ar: 'مُسْلِم', tr: 'muslim', zh: '穆斯林（顺从和平者）', wazn: 'مُفْعِل', waznRole: '第 IV 式主动分词', pos: '名词' },
      { ar: 'سُلَّم', tr: 'sullam', zh: '梯子；阶梯', wazn: 'فُعَّل', waznRole: '工具名词', pos: '名词' },
    ],
  },
  {
    id: 'ftH',
    letters: ['ف', 'ت', 'ح'],
    display: 'ف · ت · ح',
    coreMeaning: '打开 · 开启 · 开创',
    story: '打开门是 fataḥa，用来开门的工具就是 miftāḥ（钥匙），被打开的状态就是 maftūḥ（营业中/开着的）。',
    words: [
      { ar: 'فَتَحَ', tr: 'fataḥa', zh: '他打开了', wazn: 'فَعَلَ', waznRole: '第 I 式动词', pos: '动词' },
      { ar: 'فَتْح', tr: 'fatḥ', zh: '开启；开拓', wazn: 'فَعْل', waznRole: '词根名词', pos: '名词' },
      { ar: 'مِفْتَاح', tr: 'miftāḥ', zh: '钥匙；开关', wazn: 'مِفْعَال', waznRole: '工具名词（用来开锁的工具）', pos: '名词' },
      { ar: 'فَاتِح', tr: 'fātiḥ', zh: '开启者；（颜色）浅的', wazn: 'فَاعِل', waznRole: '主动分词', pos: '形容词' },
      { ar: 'مَفْتُوح', tr: 'maftūḥ', zh: '开着的；敞开的', wazn: 'مَفْعُول', waznRole: '被动分词', pos: '形容词' },
    ],
  },
  {
    id: 'qrA',
    letters: ['ق', 'ر', 'أ'],
    display: 'ق · ر · أ',
    coreMeaning: '阅读 · 朗诵',
    story: '最后一个根字母是声门塞音 hamza (أ)。动词「读」、名词「阅读」以及「古兰经（诵读之书）」均出于此。',
    words: [
      { ar: 'قَرَأَ', tr: 'qaraʾa', zh: '他读了；阅读', wazn: 'فَعَلَ', waznRole: '第 I 式动词', pos: '动词' },
      { ar: 'قِرَاءَة', tr: 'qirāʾa', zh: '阅读；读书', wazn: 'فِعَالَة', waznRole: '词根名词', pos: '名词' },
      { ar: 'قَارِئ', tr: 'qāriʾ', zh: '读者；诵读者', wazn: 'فَاعِل', waznRole: '主动分词', pos: '名词' },
      { ar: 'قُرْآن', tr: 'qurʾān', zh: '古兰经（诵读物）', wazn: 'فُعْلَان', waznRole: '专有名词', pos: '名词' },
    ],
  },
  {
    id: 'khrj',
    letters: ['خ', 'ر', 'ج'],
    display: 'خ · ر · ج',
    coreMeaning: '出去 · 离开 · 产出',
    story: '与「د-خ-ل（进入）」正好相反。在机场和地铁站，你会随处看到 مَخْرَج (makhraj 出口) 和 خُرُوج (khurūj 出去)。',
    words: [
      { ar: 'خَرَجَ', tr: 'kharaja', zh: '他出去了', wazn: 'فَعَلَ', waznRole: '第 I 式动词', pos: '动词' },
      { ar: 'خُرُوج', tr: 'khurūj', zh: '外出；离开', wazn: 'فُعُول', waznRole: '词根名词', pos: '名词' },
      { ar: 'مَخْرَج', tr: 'makhraj', zh: '出口；发音部位', wazn: 'مَفْعَل', waznRole: '场所名词（出去的地方）', pos: '名词' },
      { ar: 'خَارِج', tr: 'khārij', zh: '外部；国外', wazn: 'فَاعِل', waznRole: '主动分词', pos: '名词/方位' },
    ],
  },
  {
    id: 'dkhl',
    letters: ['د', 'خ', 'ل'],
    display: 'د · خ · ل',
    coreMeaning: '进入 · 内部 · 收入',
    story: '与「خ-ر-ج」成对记忆：مَدْخَل (入口) vs مَخْرَج (出口)，دَاخِل (内部) vs خَارِج (外部)。',
    words: [
      { ar: 'دَخَلَ', tr: 'dakhala', zh: '他进入了', wazn: 'فَعَلَ', waznRole: '第 I 式动词', pos: '动词' },
      { ar: 'دُخُول', tr: 'dukhūl', zh: '进入；入场', wazn: 'فُعُول', waznRole: '词根名词', pos: '名词' },
      { ar: 'مَدْخَل', tr: 'madkhal', zh: '入口；门厅；导论', wazn: 'مَفْعَل', waznRole: '场所名词（进入的地方）', pos: '名词' },
      { ar: 'دَاخِل', tr: 'dākhil', zh: '内部；以内', wazn: 'فَاعِل', waznRole: '主动分词', pos: '名词/方位' },
    ],
  },
  {
    id: 'jls',
    letters: ['ج', 'ل', 'س'],
    display: 'ج · ل · س',
    coreMeaning: '坐下 · 聚会 · 议事',
    story: '人们坐在一起的地方叫 مَجْلِس (majlis)，在中东既是家里的「会客厅」，也是国家的「议会/委员会」。',
    words: [
      { ar: 'جَلَسَ', tr: 'jalasa', zh: '他坐下了', wazn: 'فَعَلَ', waznRole: '第 I 式动词', pos: '动词' },
      { ar: 'جُلُوس', tr: 'julūs', zh: '坐；就座', wazn: 'فُعُول', waznRole: '词根名词', pos: '名词' },
      { ar: 'جَالِس', tr: 'jālis', zh: '坐着的（人）', wazn: 'فَاعِل', waznRole: '主动分词', pos: '形容词' },
      { ar: 'مَجْلِس', tr: 'majlis', zh: '客厅；议会；理事会', wazn: 'مَفْعِل', waznRole: '场所名词（坐在一起的地方）', pos: '名词' },
    ],
  },
]

export interface ConjugationRow {
  pronounAr: string
  pronounTr: string
  pronounZh: string
  pastAr: string
  pastTr: string
  pastSuffix: string
  presentAr: string
  presentTr: string
  presentAffix: string
}

export interface VerbParadigm {
  id: string
  root: string
  baseAr: string
  baseTr: string
  meaning: string
  rows: ConjugationRow[]
}

export const VERB_PARADIGMS: VerbParadigm[] = [
  {
    id: 'kataba',
    root: 'ك-ت-ب',
    baseAr: 'كَتَبَ · يَكْتُبُ',
    baseTr: 'kataba / yaktubu',
    meaning: '写（Writing）',
    rows: [
      { pronounAr: 'أَنَا', pronounTr: 'anā', pronounZh: '我', pastAr: 'كَتَبْتُ', pastTr: 'katab-tu', pastSuffix: 'ـتُ (-tu)', presentAr: 'أَكْتُبُ', presentTr: 'a-ktubu', presentAffix: 'أَـ (a-)' },
      { pronounAr: 'نَحْنُ', pronounTr: 'naḥnu', pronounZh: '我们', pastAr: 'كَتَبْنَا', pastTr: 'katab-nā', pastSuffix: 'ـنَا (-nā)', presentAr: 'نَكْتُبُ', presentTr: 'na-ktubu', presentAffix: 'نَـ (na-)' },
      { pronounAr: 'أَنْتَ', pronounTr: 'anta', pronounZh: '你（男）', pastAr: 'كَتَبْتَ', pastTr: 'katab-ta', pastSuffix: 'ـتَ (-ta)', presentAr: 'تَكْتُبُ', presentTr: 'ta-ktubu', presentAffix: 'تَـ (ta-)' },
      { pronounAr: 'أَنْتِ', pronounTr: 'anti', pronounZh: '你（女）', pastAr: 'كَتَبْتِ', pastTr: 'katab-ti', pastSuffix: 'ـتِ (-ti)', presentAr: 'تَكْتُبِينَ', presentTr: 'ta-ktub-īna', presentAffix: 'تَـ ... ـِينَ' },
      { pronounAr: 'هُوَ', pronounTr: 'huwa', pronounZh: '他（字典原形）', pastAr: 'كَتَبَ', pastTr: 'kataba', pastSuffix: 'ـَ (-a)', presentAr: 'يَكْتُبُ', presentTr: 'ya-ktubu', presentAffix: 'يَـ (ya-)' },
      { pronounAr: 'هِيَ', pronounTr: 'hiya', pronounZh: '她', pastAr: 'كَتَبَتْ', pastTr: 'katab-at', pastSuffix: 'ـَتْ (-at)', presentAr: 'تَكْتُبُ', presentTr: 'ta-ktubu', presentAffix: 'تَـ (ta-)' },
      { pronounAr: 'هُمْ', pronounTr: 'hum', pronounZh: '他们', pastAr: 'كَتَبُوا', pastTr: 'katab-ū', pastSuffix: 'ـُوا (-ū)', presentAr: 'يَكْتُبُونَ', presentTr: 'ya-ktub-ūna', presentAffix: 'يَـ ... ـُونَ' },
    ],
  },
  {
    id: 'dhahaba',
    root: 'ذ-ه-ب',
    baseAr: 'ذَهَبَ · يَذْهَبُ',
    baseTr: 'dhahaba / yadhhabu',
    meaning: '去 / 前往（Going）',
    rows: [
      { pronounAr: 'أَنَا', pronounTr: 'anā', pronounZh: '我', pastAr: 'ذَهَبْتُ', pastTr: 'dhahab-tu', pastSuffix: 'ـتُ (-tu)', presentAr: 'أَذْهَبُ', presentTr: 'a-dhhabu', presentAffix: 'أَـ (a-)' },
      { pronounAr: 'نَحْنُ', pronounTr: 'naḥnu', pronounZh: '我们', pastAr: 'ذَهَبْنَا', pastTr: 'dhahab-nā', pastSuffix: 'ـنَا (-nā)', presentAr: 'نَذْهَبُ', presentTr: 'na-dhhabu', presentAffix: 'نَـ (na-)' },
      { pronounAr: 'أَنْتَ', pronounTr: 'anta', pronounZh: '你（男）', pastAr: 'ذَهَبْتَ', pastTr: 'dhahab-ta', pastSuffix: 'ـتَ (-ta)', presentAr: 'تَذْهَبُ', presentTr: 'ta-dhhabu', presentAffix: 'تَـ (ta-)' },
      { pronounAr: 'أَنْتِ', pronounTr: 'anti', pronounZh: '你（女）', pastAr: 'ذَهَبْتِ', pastTr: 'dhahab-ti', pastSuffix: 'ـتِ (-ti)', presentAr: 'تَذْهَبِينَ', presentTr: 'ta-dhhab-īna', presentAffix: 'تَـ ... ـِينَ' },
      { pronounAr: 'هُوَ', pronounTr: 'huwa', pronounZh: '他（字典原形）', pastAr: 'ذَهَبَ', pastTr: 'dhahaba', pastSuffix: 'ـَ (-a)', presentAr: 'يَذْهَبُ', presentTr: 'ya-dhhabu', presentAffix: 'يَـ (ya-)' },
      { pronounAr: 'هِيَ', pronounTr: 'hiya', pronounZh: '她', pastAr: 'ذَهَبَتْ', pastTr: 'dhahab-at', pastSuffix: 'ـَتْ (-at)', presentAr: 'تَذْهَبُ', presentTr: 'ta-dhhabu', presentAffix: 'تَـ (ta-)' },
      { pronounAr: 'هُمْ', pronounTr: 'hum', pronounZh: '他们', pastAr: 'ذَهَبُوا', pastTr: 'dhahab-ū', pastSuffix: 'ـُوا (-ū)', presentAr: 'يَذْهَبُونَ', presentTr: 'ya-dhhab-ūna', presentAffix: 'يَـ ... ـُونَ' },
    ],
  },
  {
    id: 'darasa',
    root: 'د-ر-س',
    baseAr: 'دَرَسَ · يَدْرُسُ',
    baseTr: 'darasa / yadrusu',
    meaning: '学习（Studying）',
    rows: [
      { pronounAr: 'أَنَا', pronounTr: 'anā', pronounZh: '我', pastAr: 'دَرَسْتُ', pastTr: 'daras-tu', pastSuffix: 'ـتُ (-tu)', presentAr: 'أَدْرُسُ', presentTr: 'a-drusu', presentAffix: 'أَـ (a-)' },
      { pronounAr: 'نَحْنُ', pronounTr: 'naḥnu', pronounZh: '我们', pastAr: 'دَرَسْنَا', pastTr: 'daras-nā', pastSuffix: 'ـنَا (-nā)', presentAr: 'نَدْرُسُ', presentTr: 'na-drusu', presentAffix: 'نَـ (na-)' },
      { pronounAr: 'أَنْتَ', pronounTr: 'anta', pronounZh: '你（男）', pastAr: 'دَرَسْتَ', pastTr: 'daras-ta', pastSuffix: 'ـتَ (-ta)', presentAr: 'تَدْرُسُ', presentTr: 'ta-drusu', presentAffix: 'تَـ (ta-)' },
      { pronounAr: 'أَنْتِ', pronounTr: 'anti', pronounZh: '你（女）', pastAr: 'دَرَسْتِ', pastTr: 'daras-ti', pastSuffix: 'ـتِ (-ti)', presentAr: 'تَدْرُسِينَ', presentTr: 'ta-drus-īna', presentAffix: 'تَـ ... ـِينَ' },
      { pronounAr: 'هُوَ', pronounTr: 'huwa', pronounZh: '他（字典原形）', pastAr: 'دَرَسَ', pastTr: 'darasa', pastSuffix: 'ـَ (-a)', presentAr: 'يَدْرُسُ', presentTr: 'ya-drusu', presentAffix: 'يَـ (ya-)' },
      { pronounAr: 'هِيَ', pronounTr: 'hiya', pronounZh: '她', pastAr: 'دَرَسَتْ', pastTr: 'daras-at', pastSuffix: 'ـَتْ (-at)', presentAr: 'تَدْرُسُ', presentTr: 'ta-drusu', presentAffix: 'تَـ (ta-)' },
      { pronounAr: 'هُمْ', pronounTr: 'hum', pronounZh: '他们', pastAr: 'دَرَسُوا', pastTr: 'daras-ū', pastSuffix: 'ـُوا (-ū)', presentAr: 'يَدْرُسُونَ', presentTr: 'ya-drus-ūna', presentAffix: 'يَـ ... ـُونَ' },
    ],
  },
]
