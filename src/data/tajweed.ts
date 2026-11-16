export interface TajweedLesson {
  id: string
  title: string
  summary: string
  rules: { label: string; explanation: string; example?: string; caution?: string }[]
  quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[]
}

export const TAJWEED_SCOPE = '按哈夫斯传自阿绥姆（Ḥafṣ ʿan ʿĀṣim）常见入门规则学习。这里训练规则辨认，不提供经典释义，也不评判实际诵读。示例为字母或音节组合，并非完整经句；正确发音仍需合格教师示范与纠音。'

export const TAJWEED_SOURCES = [
  {
    title: '乌姆古拉大学教师讲义：ملخص في علم التجويد（鼻音、نْ / مْ、延长音）',
    url: 'https://drive.uqu.edu.sa/_/sabokhari/files/new%20docment.pdf',
  },
  {
    title: 'خيركم 教育部门：منهج التجويد（基础规则体系）',
    url: 'https://qj.edu.sa/storage/uploads/KmKTPE8WO1B1Ib3lK1U1pyXAeuPREpuWK18bdWjh.pdf',
  },
  {
    title: 'الميسر لأحكام التجويد：第十课（Qalqalah 与常见错误）',
    url: 'https://www.qurankarim.org/books/contentsimages/htmlfiles/moyassar-tajweed/moyassar-02.html',
  },
  {
    title: 'المرصفي《هداية القاري》：停读与词尾处理',
    url: 'https://www.islamweb.net/ar/library/content/231/81/',
  },
  {
    title: 'القضاة《الواضح في أحكام التجويد》：停顿标记（大学藏本）',
    url: 'https://drive.uqu.edu.sa/_/bhlehyani/files/%D8%A7%D9%84%D9%88%D8%A7%D8%B6%D8%AD%20%D9%81%D9%8A%20%D8%A3%D8%AD%D9%83%D8%A7%D9%85%20%D8%A7%D9%84%D8%AA%D8%AC%D9%88%D9%8A%D8%AF-%20%D8%A7%D9%84%D9%82%D8%B6%D8%A7%D8%A9.pdf',
  },
]

export const TAJWEED_LESSONS: TajweedLesson[] = [
  {
    id: 'tj-sound-length',
    title: '先分清短音、长音与鼻音',
    summary: '识别基础音长与 Ghunnah，为后面的连读规则做准备。',
    rules: [
      {
        label: '短元音与自然延长 · Madd ṭabīʿī',
        explanation: '◌َ、◌ِ、◌ُ 是短元音。与前音匹配的 ا、静音 ي、静音 و 可形成 ā、ī、ū；自然延长读两拍。',
        example: 'بَ / بَا · بِ / بِي · بُ / بُو',
        caution: '这里的两拍是相对当前诵读速度的时值，不是固定两秒。遇到 hamzah 或 sukūn 等延长原因，需要另判规则，不能一概读两拍。',
      },
      {
        label: '静符与叠音符',
        explanation: '静符 ◌ْ 表示该辅音不带短元音；叠音符 ◌ّ 表示辅音加倍。先辨认这两个标记，再判断鼻音、并读与弹音。',
        example: 'نْ · نَّ · مْ · مَّ',
      },
      {
        label: '鼻音 · Ghunnah',
        explanation: '鼻音通过鼻腔共鸣。带叠音符的 نّ、مّ 要保持两拍鼻音；后续的隐读和部分并读也会用到它。',
        example: 'نَّ · مَّ',
        caution: '两拍鼻音不是把后面的 a、i、u 拉长。文字不能检验共鸣位置或发音动作，需要听教师示范。',
      },
    ],
    quiz: [
      { question: '本课自然延长的 بَا 应如何理解？', options: ['固定延长两秒', '相对当前速度保持两拍', '任何情况下都延长六拍'], correctIndex: 1, explanation: '自然延长的时值为两拍，随诵读速度变化；不是秒表上的两秒。' },
      { question: '看到 نَّ，哪项是本课要注意的声音特征？', options: ['完全去掉鼻音', '在后面补一个元音', '保持两拍鼻音'], correctIndex: 2, explanation: '叠音 نّ、مّ 需要鼻音；不要把鼻音时值转移到后面的元音上。' },
      { question: '关于 ◌ْ 和 ◌ّ，哪项正确？', options: ['◌ْ 表示没有短元音，◌ّ 表示辅音加倍', '两者都表示长元音', '两者都表示需要停顿'], correctIndex: 0, explanation: '先辨清静音与叠音，才能判断后续规则。' },
    ],
  },
  {
    id: 'tj-noon-tanwin',
    title: '静音 نْ 与 Tanwīn：看后一个字母',
    summary: '用后接字母区分明读、并读、变读和隐读。',
    rules: [
      { label: '明读 · Iẓhār', explanation: 'نْ 或 tanwīn 连读时，后接 ء ه ع ح غ خ，清楚读出 n 音，不增加隐读或并读时的延长鼻音。', example: 'نْ + ع' },
      {
        label: '并读 · Idghām',
        explanation: '通常在两个词之间：后接 ي ن م و 时并入后字并保留鼻音；后接 ل ر 时并入而不保留 n 的鼻音。',
        example: '词尾 نْ + 下一词 ي / ل',
        caution: '不要把这个跨词规则机械套在同一词内的 نْ + ي / و 上。断读、特殊词位与传承细节另学。',
      },
      { label: '变读 · Iqlāb', explanation: '后接 ب 时，把 نْ 或 tanwīn 的 n 音转为隐读的 m 音，并保留鼻音。', example: 'نْ + ب' },
      { label: '隐读 · Ikhfāʾ', explanation: '后接 ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك 时隐读并保留鼻音；既不是清楚读出完整 n，也不是直接并成后字。', example: 'نْ + س' },
    ],
    quiz: [
      { question: '连读示意 نْ + ع 属于哪类？', options: ['变读 Iqlāb', '明读 Iẓhār', '隐读 Ikhfāʾ'], correctIndex: 1, explanation: 'ع 属于 ء ه ع ح غ خ 六个明读字母。' },
      { question: '普通跨词连读中，词尾 نْ 后接下一词的 ل，应怎样处理？', options: ['并读，不保留 n 的鼻音', '变成隐读的 m', '清楚读出 n 并额外拉长'], correctIndex: 0, explanation: 'ل、ر 属于无鼻音并读字母；本题不涉及断读或特殊词位。' },
      { question: 'نْ 后接 ب，哪项判断正确？', options: ['弹音 Qalqalah', '自然延长', '变读 Iqlāb，保留鼻音'], correctIndex: 2, explanation: 'ب 是本章变读的触发字母，要转为隐读的 m 音。' },
      { question: '连读示意 نْ + س 属于哪类？', options: ['无鼻音并读', '隐读 Ikhfāʾ，保留鼻音', '明读 Iẓhār'], correctIndex: 1, explanation: 'س 在十五个隐读字母中。判断时要看 نْ 后面的字母。' },
    ],
  },
  {
    id: 'tj-meem-sakinah',
    title: '静音 مْ：三种唇音规则',
    summary: '把 مْ 的规则与 نْ 的规则分开判断。',
    rules: [
      { label: 'مْ + ب：唇隐读', explanation: 'مْ 后接 ب 时，使用唇隐读（Ikhfāʾ shafawī）并保持鼻音。', example: 'مْ + ب', caution: '双唇动作应由教师示范；不要凭文字强行挤压双唇或另加元音。' },
      { label: 'مْ + م：唇并读', explanation: '静音 مْ 遇到带元音的 م，并成叠音 مّ，保持鼻音。', example: 'مْ + مَ' },
      { label: '其余可后接的字母：唇明读', explanation: '除 ب 和 م 外，清楚读出 مْ。特别留意 و、ف，不要因为发音位置相近就自行隐读。', example: 'مْ + ف · مْ + و' },
    ],
    quiz: [
      { question: 'مْ + ب 对应什么规则？', options: ['唇隐读，带鼻音', '无鼻音并读', '弹音'], correctIndex: 0, explanation: '静音 مْ 后接 ب 是唇隐读，不要误叫成 نْ 的变读。' },
      { question: 'مْ + مَ 应如何处理？', options: ['把第一个 م 改成 ن', '分别断开并添加元音', '并为叠音 مّ，保持鼻音'], correctIndex: 2, explanation: '两个 م 在此并读，鼻音保留。' },
      { question: 'مْ 后接 ف，按本课基本规则应怎样读？', options: ['直接删去 م', '清楚读出 مْ', '一律隐读'], correctIndex: 1, explanation: 'ف 不属于 مْ 的隐读或并读触发字母，要保持唇明读。' },
    ],
  },
  {
    id: 'tj-qalqalah',
    title: 'Qalqalah：让静音辅音清楚释放',
    summary: '认出五个弹音字母，避免把弹音读成额外元音。',
    rules: [
      { label: '五个字母', explanation: 'ق ط ب ج د 是弹音字母。它们处于静音状态时有可听见的释放；不是所有带静符的字母都需要弹音。', example: 'قْ · طْ · بْ · جْ · دْ' },
      { label: '连读与停读都要看实际状态', explanation: '静音可以原本就存在，也可以由停读形成。弹音在停读位置通常更明显，但仍要保留字母本身的性质。', example: 'بْ（静音）与 بَ（带短元音）' },
      { label: '不要另造一个音节', explanation: '释放辅音时，不追加 a、i、u，也不补 ه 或 ء，更不要拖成一个长音。', caution: '本页只判断“哪里需要弹音”；弹音的轻重与口腔动作需现场纠音。' },
    ],
    quiz: [
      { question: '哪组全部属于 Qalqalah 字母？', options: ['ن م و ي ل', 'ق ط ب ج د', 'ء ه ع ح غ'], correctIndex: 1, explanation: '五个弹音字母是 ق、ط、ب、ج、د。' },
      { question: '练习 بْ 的弹音时，哪种处理正确？', options: ['清楚释放辅音，不补完整元音', '在后面加一个 a', '把它延长为 bā'], correctIndex: 0, explanation: '弹音不是加短元音或长元音；声音仍属于静音辅音的释放。' },
      { question: '看到 سْ，可以因为它带静符就加 Qalqalah 吗？', options: ['可以，所有静音都一样', '只要在词尾就可以', '不可以，س 不在五个弹音字母中'], correctIndex: 2, explanation: '先核对字母，再看静音状态，不能只凭静符判断。' },
    ],
  },
  {
    id: 'tj-waqf',
    title: '停与连：先认识基本变化',
    summary: '分清停读与连读，理解常见停顿标记的作用。',
    rules: [
      {
        label: '停读不是把连读声音原样截断',
        explanation: '先学习以纯静音停读：一般辅音词尾的短元音、ٌ 或 ٍ 不再读出。词尾 ً、ة 与长元音不能用同一条删音规则处理。',
        caution: 'Rawm、Ishmām、特殊词尾及停读引起的延长音属于后续学习范围。',
      },
      {
        label: '两种要单独认识的词尾',
        explanation: '停在普通 ة 结尾时，改读静音 h；普通 ً 结尾停读时通常以两拍 ā 代替 tanwīn，但 ةً 仍按 ة 处理。',
        example: 'ةً → هْ（发音示意，并非改写原文）',
        caution: '本课不处理奥斯曼书体的特殊词形，不能据此自动改写经文或判定全部停读方式。',
      },
      {
        label: '先辨认常见标记',
        explanation: '常见印本中：ج 表示可停可连；صلى 表示连读更优；قلى 表示停读更优。使用时也要看该印本的标记说明。',
        example: 'ج · صلى · قلى',
        caution: '标记帮助选择停顿位置；重新起读还要保持语义连接。本课不训练独立选择任意经句的停连位置。',
      },
    ],
    quiz: [
      { question: '本课谈到的 ةً 词尾，在停读时应怎样处理？', options: ['一律读两拍 ā', '按 ة 处理，读静音 h', '保留完整 tanwīn 的 n'], correctIndex: 1, explanation: 'ةً 不直接套用普通开口 tanwīn 停读为 ā 的规则。' },
      { question: '常见停顿标记 صلى 表示什么？', options: ['必须停止', '停读更优', '连读更优，但允许停读'], correctIndex: 2, explanation: '不要与 قلى 混淆：قلى 是停读更优。' },
      { question: '能否把所有词尾一律删掉元音，作为完整停读规则？', options: ['不能；ة、ً、长元音及特殊词形等要另判', '能，停读只需删除最后一个符号', '能，所有词尾都必须添加 h'], correctIndex: 0, explanation: '本课只提供入门分类，不能代替完整的停读与起读学习。' },
    ],
  },
  {
    id: 'tj-review',
    title: '综合辨析：先判断，再练习',
    summary: '把规则放在一起识别，并明确概念测试与实际诵读的区别。',
    rules: [
      { label: '先看对象，再看后接字母', explanation: '遇到 نْ / tanwīn，使用四类规则；遇到 مْ，使用三类唇音规则。不要看到 ب 就把所有前字都叫作 Iqlāb。', example: 'نْ + ب ≠ مْ + ب（规则名称不同）' },
      { label: '区分声音的不同维度', explanation: '延长音处理元音时值，Ghunnah 处理鼻腔共鸣，Qalqalah 处理特定静音辅音的释放；它们不是同一件事。' },
      { label: '把本页作为课前辨认与课后回顾', explanation: '先口头说出判断依据，再跟随合格教师练读并请其纠音。文字题答对，只能说明本次识别正确。', caution: '没有录音采集与教师评估，不能从选择题分数推断发音、节奏或诵读已经合格。' },
    ],
    quiz: [
      { question: 'نْ + ب 与 مْ + ب，哪项区分正确？', options: ['两者都叫 Iqlāb', '前者变读，后者唇隐读', '两者都无鼻音'], correctIndex: 1, explanation: '前面的字母不同，所属规则不同；两者都涉及鼻音，但名称不能混用。' },
      { question: 'نّ 的两拍鼻音与自然延长的两拍，是否是同一种发音动作？', options: ['是，只要拖长任意声音就行', '是，都应再加一个元音', '不是；鼻腔共鸣与元音延长要分清'], correctIndex: 2, explanation: '相同的时值提示，不代表发音部位或动作相同。' },
      { question: '不看讲义答对了本页题目，最准确的结论是？', options: ['本次规则辨认正确，实际诵读仍需听辨与纠音', '已具备全部 Tajweed 诵读能力', '不再需要听任何示范'], correctIndex: 0, explanation: '概念识别与口头技能是不同的验收项目。下一步应在可靠示范与反馈下练习。' },
    ],
  },
]
