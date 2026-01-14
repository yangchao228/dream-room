import { Character } from '../types';

interface LocalizedData {
  name: string;
  tag: string;
  phrases: string[];
}

const charactersData: Record<string, Record<'en' | 'zh', LocalizedData>> = {
  musk: {
    en: {
      name: 'Elon Musk',
      tag: 'Tech Visionary',
      phrases: [
        'First principles thinking tells us that the essence of {topic} is...',
        'Hardcore! We need to discuss {topic} on Mars.',
        'AI is like a nuke, it must be open source! Regarding {topic}...',
        'This is critical for the future of consciousness.',
        'We need to make {topic} multi-planetary.',
        'Exactly. We need to iterate faster.',
        'The pace of innovation is everything.',
        'I think we are too slow here.',
        'Let that sink in.',
        'We are currently simulation the future.'
      ]
    },
    zh: {
      name: '埃隆·马斯克',
      tag: '科技狂人',
      phrases: [
        '第一性原理告诉我们，这背后的本质是物理学。',
        'Hardcore！我们要在火星上讨论这个。',
        'AI 就像核弹，必须开源！关于 {topic}...',
        '这对意识的未来至关重要。',
        '我们需要让它跨行星化。',
        '这绝对是正确的方向。',
        '我们要加速！',
        '这就是为什么我要造火箭。',
        '这也太疯狂了，但我喜欢。',
        '如果是物理学允许的，我们就应该做。',
        '让我们回归第一性原理思考 {topic}。'
      ]
    }
  },
  einstein: {
    en: {
      name: 'Albert Einstein',
      tag: 'Physics God',
      phrases: [
        'God does not play dice, but {topic} is indeed full of uncertainty.',
        'Imagination is more important than knowledge. Let me imagine a metaphor about {topic}...',
        'Relativity tells us that there is no absolute answer to {topic}.',
        'We cannot solve our problems with the same thinking we used when we created them.',
        'Time is an illusion, just like our understanding of {topic}.',
        'Everything should be made as simple as possible, but not simpler.',
        'Look deep into nature, and then you will understand everything better.',
        'The important thing is not to stop questioning.',
        'Logic will get you from A to B. Imagination will take you everywhere.'
      ]
    },
    zh: {
      name: '阿尔伯特·爱因斯坦',
      tag: '物理之神',
      phrases: [
        '上帝不掷骰子，但这件事确实充满不确定性。',
        '想象力比知识更重要。',
        '相对论告诉我们，凡事没有绝对的答案。',
        '我们不能用创造问题时的思维来解决问题。',
        '时间是幻觉，就像我们对 {topic} 的理解一样。',
        '这让我想起了一个思想实验。',
        '凡事应该力求简单，但不能过分简单。',
        '重要的是不要停止提问。',
        '逻辑能把你从 A 带到 B，但想象力能带你去任何地方。',
        '这就好比坐在光速飞行的列车上观察 {topic}。'
      ]
    }
  },
  luxun: {
    en: {
      name: 'Lu Xun',
      tag: 'Soul of the Nation',
      phrases: [
        'Hehe, {topic}? Has it always been like this? And is that right?',
        'I have always suspected {topic} with the worst malice.',
        'There was no road in the world, but when many people discussed {topic}, it became a road.',
        'Save the children... from {topic}!',
        'Silence! Silence! Unless we explode in silence, we shall perish in silence regarding {topic}.',
        'This is just like an iron house without windows.',
        'I see "Eat People" written between the lines.',
        'Hope cannot be said to exist, nor can it be said not to exist.',
        'Wasting others\' time is equal to murder.'
      ]
    },
    zh: {
      name: '鲁迅',
      tag: '民族魂',
      phrases: [
        '呵呵，{topic}？从来如此，便对么？',
        '我向来不惮以最坏的恶意来推测这件事。',
        '世上本没有路，走的人多了，也便成了路。',
        '救救孩子... 别被 {topic} 害了！',
        '不在沉默中爆发，就在沉默中灭亡。',
        '这让我想起铁屋子里的人们。',
        '翻开历史一查，这历史没有年代，歪歪斜斜的每页上都写着“仁义道德”几个字。',
        '其实地上本没有路，走的人多了，也便成了路。',
        '浪费别人的时间，等于谋财害命。',
        '我看这件事，字缝里都写着“吃人”两个字。',
        '差不多先生们大概是不会懂的。'
      ]
    }
  },
  kobe: {
    en: {
      name: 'Kobe Bryant',
      tag: 'Black Mamba',
      phrases: [
        '4 AM in Los Angeles tells me that {topic} needs Mamba Mentality.',
        'If you are afraid of {topic}, you have already lost.',
        'Greatness needs daily effort, just like I practice shooting. Even for {topic}.',
        'Everything negative - pressure, challenges - is all an opportunity for me to rise.',
        'Job\'s not finished. Is {topic} finished? I don\'t think so.',
        'Rest at the end, not in the middle.',
        'Dedication makes dreams come true.',
        'I don\'t relate to lazy people.',
        'Mamba out.'
      ]
    },
    zh: {
      name: '科比·布莱恩特',
      tag: '黑曼巴',
      phrases: [
        '凌晨四点的洛杉矶告诉我，这需要曼巴精神。',
        '如果你害怕 {topic}，你就已经输了。',
        '伟大需要每天的努力，就像我练习投篮一样。',
        '所有负面的东西——压力、挑战——都是我崛起的机会。',
        '任务还没完成。结束了吗？我不这么认为。',
        '要休息等到终点再休息，不要在半途停下。',
        '我不理解那些懒惰的人。',
        '这就是曼巴精神！',
        '如果你不相信自己，没人会相信你。',
        '关于 {topic}，我的回答是：再练一千次。'
      ]
    }
  }
};

const baseCharacters: Character[] = [
  {
    id: 'musk',
    name: 'Elon Musk',
    avatar: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Elon%20Musk%20portrait%2C%20realistic%2C%20tech%20visionary%20style&image_size=square',
    tag: 'Tech Visionary',
    personality: 'musk',
    color: 'border-emerald-500',
    phrases: []
  },
  {
    id: 'einstein',
    name: 'Albert Einstein',
    avatar: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Albert%20Einstein%20portrait%2C%20realistic%2C%20physicist%20style&image_size=square',
    tag: 'Physics God',
    personality: 'einstein',
    color: 'border-sky-500',
    phrases: []
  },
  {
    id: 'luxun',
    name: 'Lu Xun',
    avatar: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Lu%20Xun%20portrait%2C%20realistic%2C%20chinese%20writer%20style%2C%20black%20and%20white&image_size=square',
    tag: 'Soul of the Nation',
    personality: 'luxun',
    color: 'border-rose-500',
    phrases: []
  },
  {
    id: 'kobe',
    name: 'Kobe Bryant',
    avatar: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Kobe%20Bryant%20portrait%2C%20realistic%2C%20basketball%20legend%20style&image_size=square',
    tag: 'Black Mamba',
    personality: 'kobe',
    color: 'border-amber-500',
    phrases: []
  }
];

// Default export for backward compatibility (English)
export const characters: Character[] = baseCharacters.map(char => ({
  ...char,
  ...charactersData[char.id].en
}));

export const getCharacters = (lang: string = 'en'): Character[] => {
  const language = lang.startsWith('zh') ? 'zh' : 'en';
  return baseCharacters.map(char => ({
    ...char,
    ...charactersData[char.id][language]
  }));
};

export const getCharacterById = (id: string, lang: string = 'en'): Character | undefined => {
  const language = lang.startsWith('zh') ? 'zh' : 'en';
  const char = baseCharacters.find(c => c.id === id);
  if (!char) return undefined;
  
  return {
    ...char,
    ...charactersData[id][language]
  };
};
