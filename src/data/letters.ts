export type Joining = 'dual' | 'right' | 'none'

export interface Letter {
  char: string
  /** Arabic name with harakat, used for TTS */
  name: string
  nameLatin: string
  translit: string
  /** pronunciation hint for Chinese speakers */
  hint: string
  joining: Joining
  example: { ar: string; tr: string; zh: string }
  extra?: boolean
}

const L = (
  char: string,
  name: string,
  nameLatin: string,
  translit: string,
  hint: string,
  joining: Joining,
  ex: [string, string, string],
  extra = false,
): Letter => ({ char, name, nameLatin, translit, hint, joining, example: { ar: ex[0], tr: ex[1], zh: ex[2] }, extra })

export const LETTERS: Letter[] = [
  L('ا', 'أَلِف', 'alif', 'ā / ʾ', '作长元音 ā，或作 hamza 的"座"', 'right', ['أَب', 'ab', '父亲']),
  L('ب', 'بَاء', 'bāʾ', 'b', '同拼音 b，但声带振动更明显', 'dual', ['بَيْت', 'bayt', '房子']),
  L('ت', 'تَاء', 'tāʾ', 't', '同拼音 t，不送气', 'dual', ['تُفَّاح', 'tuffāḥ', '苹果']),
  L('ث', 'ثَاء', 'thāʾ', 'th', '英语 think 的 th，舌尖轻咬', 'dual', ['ثَلَاثَة', 'thalātha', '三']),
  L('ج', 'جِيم', 'jīm', 'j', '英语 jam 的 j', 'dual', ['جَمِيل', 'jamīl', '美丽']),
  L('ح', 'حَاء', 'ḥāʾ', 'ḥ', '喉咙收紧送气的 h，像对着镜子哈气', 'dual', ['حَلِيب', 'ḥalīb', '牛奶']),
  L('خ', 'خَاء', 'khāʾ', 'kh', '接近汉语"喝"的 h，带摩擦', 'dual', ['خُبْز', 'khubz', '面包']),
  L('د', 'دَال', 'dāl', 'd', '同拼音 d，声带振动', 'right', ['دَجَاج', 'dajāj', '鸡肉']),
  L('ذ', 'ذَال', 'dhāl', 'dh', '英语 this 的 th（浊音）', 'right', ['ذَهَبَ', 'dhahaba', '去了']),
  L('ر', 'رَاء', 'rāʾ', 'r', '舌尖颤音（大舌音）', 'right', ['رَأْس', 'raʾs', '头']),
  L('ز', 'زَاي', 'zāy', 'z', '英语 zoo 的 z', 'right', ['زَوْج', 'zawj', '丈夫']),
  L('س', 'سِين', 'sīn', 's', '同拼音 s', 'dual', ['سَمَك', 'samak', '鱼']),
  L('ش', 'شِين', 'shīn', 'sh', '接近拼音 sh（诗）', 'dual', ['شَاي', 'shāy', '茶']),
  L('ص', 'صَاد', 'ṣād', 'ṣ', '"重" s：舌根后缩，口腔变空', 'dual', ['صَدِيق', 'ṣadīq', '朋友']),
  L('ض', 'ضَاد', 'ḍād', 'ḍ', '"重" d；阿语自称"ḍād 的语言"', 'dual', ['ضَيْف', 'ḍayf', '客人']),
  L('ط', 'طَاء', 'ṭāʾ', 'ṭ', '"重" t', 'dual', ['طَعَام', 'ṭaʿām', '食物']),
  L('ظ', 'ظَاء', 'ẓāʾ', 'ẓ', '"重" dh', 'dual', ['ظَهْر', 'ẓahr', '背']),
  L('ع', 'عَيْن', 'ʿayn', 'ʿ', '喉咙挤压发出的浊音，汉语没有', 'dual', ['عَيْن', 'ʿayn', '眼睛']),
  L('غ', 'غَيْن', 'ghayn', 'gh', '像法语小舌 r，像漱口', 'dual', ['غُرْفَة', 'ghurfa', '房间']),
  L('ف', 'فَاء', 'fāʾ', 'f', '同拼音 f', 'dual', ['فَم', 'fam', '嘴']),
  L('ق', 'قَاف', 'qāf', 'q', '小舌 k，比 k 更靠后', 'dual', ['قَلَم', 'qalam', '笔']),
  L('ك', 'كَاف', 'kāf', 'k', '同拼音 k', 'dual', ['كِتَاب', 'kitāb', '书']),
  L('ل', 'لَام', 'lām', 'l', '同拼音 l', 'dual', ['لَيْل', 'layl', '夜']),
  L('م', 'مِيم', 'mīm', 'm', '同拼音 m', 'dual', ['مَاء', 'māʾ', '水']),
  L('ن', 'نُون', 'nūn', 'n', '同拼音 n', 'dual', ['نُور', 'nūr', '光']),
  L('ه', 'هَاء', 'hāʾ', 'h', '轻柔的 h，同英语 hat', 'dual', ['هَاتِف', 'hātif', '电话']),
  L('و', 'وَاو', 'wāw', 'w / ū', '辅音 w，或长元音 ū', 'right', ['وَلَد', 'walad', '男孩']),
  L('ي', 'يَاء', 'yāʾ', 'y / ī', '辅音 y，或长元音 ī', 'dual', ['يَد', 'yad', '手']),
  L('ء', 'هَمْزَة', 'hamza', 'ʾ', '声门塞音，像"啊"之前那一下停顿', 'none', ['مَاء', 'māʾ', '水'], true),
  L('ة', 'تَاء مَرْبُوطَة', 'tāʾ marbūṭa', 'a / t', '阴性词尾，停顿时读 a', 'right', ['مَدْرَسَة', 'madrasa', '学校'], true),
  L('ى', 'أَلِف مَقْصُورَة', 'alif maqṣūra', 'ā', '词尾的长音 ā，形似无点的 ي', 'dual', ['مُسْتَشْفَى', 'mustashfā', '医院'], true),
]

/** Groups of letters that share a skeleton — used for tricky quiz distractors */
export const LOOKALIKE_GROUPS = ['بتثني', 'جحخ', 'دذ', 'رز', 'سش', 'صض', 'طظ', 'عغ', 'فق', 'هة', 'ىي']

export interface HarakatRule {
  id: string
  category: 'short' | 'long' | 'special' | 'tanwin'
  categoryLabel: string
  symbol: string
  sampleWithBa: string
  sampleSound: string
  nameAr: string
  nameZh: string
  nameLatin: string
  desc: string
  grammarTip: string
  example: { ar: string; tr: string; zh: string }
}

export const HARAKAT_RULES: HarakatRule[] = [
  {
    id: 'fatha',
    category: 'short',
    categoryLabel: '三短音（动符）',
    symbol: '◌َ',
    sampleWithBa: 'بَ',
    sampleSound: 'ba',
    nameAr: 'فَتْحَة',
    nameZh: '开口符',
    nameLatin: 'fatḥa (-a)',
    desc: '写在字母上方的小斜杠，发短促的 a 音（口型张开）。',
    grammarTip: '在句法中，词尾的开口符（-a）通常标志着「宾格（Manṣūb）」或过去式动词词尾。',
    example: { ar: 'كَتَبَ', tr: 'kataba', zh: '他写了（连读三个短音 a）' },
  },
  {
    id: 'kasra',
    category: 'short',
    categoryLabel: '三短音（动符）',
    symbol: '◌ِ',
    sampleWithBa: 'بِ',
    sampleSound: 'bi',
    nameAr: 'كَسْرَة',
    nameZh: '齐齿符',
    nameLatin: 'kasra (-i)',
    desc: '写在字母下方的小斜杠，发短促的 i 音（嘴角向两边裂开）。',
    grammarTip: '在句法中，词尾的齐齿符（-i）通常标志着「属格（Majrūr）」，常见于介词后或偏次。',
    example: { ar: 'بِنْت', tr: 'bint', zh: '女孩 / 女儿' },
  },
  {
    id: 'damma',
    category: 'short',
    categoryLabel: '三短音（动符）',
    symbol: '◌ُ',
    sampleWithBa: 'بُ',
    sampleSound: 'bu',
    nameAr: 'ضَمَّة',
    nameZh: '合口符',
    nameLatin: 'ḍamma (-u)',
    desc: '写在字母上方的小逗点（形似缩小版的 و），发短促的 u 音（双唇拢圆）。',
    grammarTip: '在句法中，词尾的合口符（-u）通常标志着「主格（Marfūʿ）」，用于主语、起词和述语。',
    example: { ar: 'كُتُب', tr: 'kutub', zh: '书籍（复数）' },
  },
  {
    id: 'long-a',
    category: 'long',
    categoryLabel: '三长音（Madd）',
    symbol: '◌َا',
    sampleWithBa: 'بَا',
    sampleSound: 'bā',
    nameAr: 'مَدّ بِالأَلِف',
    nameZh: '开口长音',
    nameLatin: 'ā (fatḥa + alif)',
    desc: '开口符（َ）后面紧跟不带符号的 ا，发音延长至短音的 2 倍（ā）。',
    grammarTip: '长音会改变词义！例如 كَتَبَ (kataba 他写了) vs كَاتَبَ (kātaba 他与人通信)。',
    example: { ar: 'بَاب', tr: 'bāb', zh: '门' },
  },
  {
    id: 'long-i',
    category: 'long',
    categoryLabel: '三长音（Madd）',
    symbol: '◌ِي',
    sampleWithBa: 'بِي',
    sampleSound: 'bī',
    nameAr: 'مَدّ بِاليَاء',
    nameZh: '齐齿长音',
    nameLatin: 'ī (kasra + yāʾ)',
    desc: '齐齿符（ِ）后面紧跟不带符号的 ي，发延长的 ī 音。',
    grammarTip: '词尾加上 ـِي (-ī) 就是「我的…」，例如 كِتَاب (书) → كِتَابِي (我的书)。',
    example: { ar: 'كَبِير', tr: 'kabīr', zh: '大的' },
  },
  {
    id: 'long-u',
    category: 'long',
    categoryLabel: '三长音（Madd）',
    symbol: '◌ُو',
    sampleWithBa: 'بُو',
    sampleSound: 'bū',
    nameAr: 'مَدّ بِالوَاو',
    nameZh: '合口长音',
    nameLatin: 'ū (ḍamma + wāw)',
    desc: '合口符（ُ）后面紧跟不带符号的 و，发延长的 ū 音。',
    grammarTip: '规则阳性复数主格词尾就是 ـُونَ (-ūna)，如 مُسْلِمُونَ。',
    example: { ar: 'نُور', tr: 'nūr', zh: '光' },
  },
  {
    id: 'sukun',
    category: 'special',
    categoryLabel: '静符与叠音',
    symbol: '◌ْ',
    sampleWithBa: 'أَبْ',
    sampleSound: 'ab',
    nameAr: 'سُكُون',
    nameZh: '静符',
    nameLatin: 'sukūn (无元音)',
    desc: '字母上方的小圆圈，表示该辅音后面没有元音，需与前一个音节快速收尾拼成闭音节。',
    grammarTip: '阿语没有以静符开头的词；口语停顿（Waqf）时，词尾无论是什么动符通常都读成静符。',
    example: { ar: 'مَسْجِد', tr: 'masjid', zh: '清真寺（mas-jid 两个音节）' },
  },
  {
    id: 'shadda',
    category: 'special',
    categoryLabel: '静符与叠音',
    symbol: '◌ّ',
    sampleWithBa: 'رَبَّ',
    sampleSound: 'rab-ba',
    nameAr: 'شَدَّة',
    nameZh: '叠音符',
    nameLatin: 'shadda (双辅音)',
    desc: '形似小 w，表示这个字母要读两次：第一个带静符收尾，第二个带动符放出（如 بَّ = بْ + بَ）。',
    grammarTip: '千万不能漏读！دَرَسَ (darasa 他学了) 中间加叠音变成 دَرَّسَ (darrasa 他教书了)。',
    example: { ar: 'مُدَرِّس', tr: 'mudarris', zh: '老师' },
  },
  {
    id: 'tanwin-u',
    category: 'tanwin',
    categoryLabel: '三鼻音（泛指标志）',
    symbol: '◌ٌ',
    sampleWithBa: 'بَابٌ',
    sampleSound: 'bābun',
    nameAr: 'تَنْوِين ضَمّ',
    nameZh: '合口鼻音符',
    nameLatin: 'tanwīn ḍamm (-un)',
    desc: '双合口符，读作 -un。相当于英语的不定冠词 "a / an"。',
    grammarTip: '表示「泛指主格」。一旦名词前面加上定冠词 الـ，词尾的双符必须变成单符（كِتَابٌ → الْكِتَابُ）。',
    example: { ar: 'كِتَابٌ', tr: 'kitābun', zh: '一本书（泛指·主格）' },
  },
  {
    id: 'tanwin-a',
    category: 'tanwin',
    categoryLabel: '三鼻音（泛指标志）',
    symbol: '◌ً',
    sampleWithBa: 'بَابًا',
    sampleSound: 'bāban',
    nameAr: 'تَنْوِين فَتْح',
    nameZh: '开口鼻音符',
    nameLatin: 'tanwīn fatḥ (-an)',
    desc: '双开口符，读作 -an。除 ة / ء 外，书写时后面通常要挂一个不发音的护卫字母 ا。',
    grammarTip: '常用于泛指宾格，以及日常高频副词口语（如 شُكْرًا shukran、مَرْحَبًا marḥaban）。',
    example: { ar: 'شُكْرًا', tr: 'shukran', zh: '谢谢' },
  },
  {
    id: 'tanwin-i',
    category: 'tanwin',
    categoryLabel: '三鼻音（泛指标志）',
    symbol: '◌ٍ',
    sampleWithBa: 'بَابٍ',
    sampleSound: 'bābin',
    nameAr: 'تَنْوِين كَسْر',
    nameZh: '齐齿鼻音符',
    nameLatin: 'tanwīn kasr (-in)',
    desc: '写在字母下方的双齐齿符，读作 -in。',
    grammarTip: '表示「泛指属格」，例如 فِي بَيْتٍ (fī baytin 在一所房子里)。',
    example: { ar: 'بَيْتٍ', tr: 'baytin', zh: '一所房子（泛指·属格）' },
  },
]

/** 14 Sun letters (الحروف الشمسية): assimilate the 'l' of al- */
export const SUN_LETTERS = new Set(['ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ل', 'ن'])

export interface SunMoonExample {
  type: 'sun' | 'moon'
  letter: string
  bare: string
  withAl: string
  tr: string
  zh: string
  ruleNote: string
}

export const SUN_MOON_EXAMPLES: SunMoonExample[] = [
  {
    type: 'sun',
    letter: 'ش',
    bare: 'شَمْسٌ',
    withAl: 'الشَّمْسُ',
    tr: 'ash-shamsu',
    zh: '太阳',
    ruleNote: 'ش 是舌面音（太阳字母），冠词 الـ 的 ل 被同化不发音，ش 上加叠音符 ّ，读作 ash-shamsu 而非 al-shamsu。',
  },
  {
    type: 'sun',
    letter: 'ط',
    bare: 'طَالِبٌ',
    withAl: 'الطَّالِبُ',
    tr: 'aṭ-ṭālibu',
    zh: '那个学生',
    ruleNote: 'ط 是舌尖顶音（太阳字母），ل 同化为 ط，读作 aṭ-ṭālibu。',
  },
  {
    type: 'sun',
    letter: 'س',
    bare: 'سَلَامٌ',
    withAl: 'السَّلَامُ',
    tr: 'as-salāmu',
    zh: '和平 / 问候',
    ruleNote: 'س 是太阳字母，因此问候语 السَّلَامُ عَلَيْكُمْ 读作 as-salāmu ʿalaykum。',
  },
  {
    type: 'sun',
    letter: 'ن',
    bare: 'نُورٌ',
    withAl: 'النُّورُ',
    tr: 'an-nūru',
    zh: '那道光',
    ruleNote: 'ن 是太阳字母，ل 同化为 ن，读作 an-nūru。',
  },
  {
    type: 'moon',
    letter: 'ق',
    bare: 'قَمَرٌ',
    withAl: 'الْقَمَرُ',
    tr: 'al-qamaru',
    zh: '月亮',
    ruleNote: 'ق 是小舌音（月亮字母），舌尖不需要提前就位，冠词 الْـ 的 ل 清晰读出静符：al-qamaru。',
  },
  {
    type: 'moon',
    letter: 'ك',
    bare: 'كِتَابٌ',
    withAl: 'الْكِتَابُ',
    tr: 'al-kitābu',
    zh: '那本书',
    ruleNote: 'ك 是月亮字母，ل 正常发 l 音：al-kitābu。注意加 الـ 后词尾从 ٌ (-un) 变成了 ُ (-u)。',
  },
  {
    type: 'moon',
    letter: 'ب',
    bare: 'بَيْتٌ',
    withAl: 'الْبَيْتُ',
    tr: 'al-baytu',
    zh: '那所房子',
    ruleNote: 'ب 是双唇音（月亮字母），冠词清晰读作 al-baytu。',
  },
  {
    type: 'moon',
    letter: 'م',
    bare: 'مَدْرَسَةٌ',
    withAl: 'الْمَدْرَسَةُ',
    tr: 'al-madrasatu',
    zh: '那所学校',
    ruleNote: 'م 是月亮字母，冠词清晰读作 al-madrasatu。',
  },
]
