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
