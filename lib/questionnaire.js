const femaleOnly = [{ questionId: 'q2', operator: 'equals', value: 'Female' }];
const maleOnly = [{ questionId: 'q2', operator: 'equals', value: 'Male' }];

function question(config) {
  return {
    required: false,
    voiceEnabled: false,
    helperText: '',
    options: [],
    conditions: [],
    ...config,
    id: `q${config.id}`,
    order: config.id,
  };
}

function shortText(id, sectionId, text, tags, overrides = {}) {
  return question({
    id,
    sectionId,
    text,
    answerType: 'short_text',
    tags,
    voiceEnabled: true,
    ...overrides,
  });
}

function longText(id, sectionId, text, tags, overrides = {}) {
  return question({
    id,
    sectionId,
    text,
    answerType: 'long_text',
    tags,
    voiceEnabled: true,
    ...overrides,
  });
}

function radio(id, sectionId, text, tags, options, overrides = {}) {
  return question({
    id,
    sectionId,
    text,
    answerType: 'radio',
    tags,
    options,
    ...overrides,
  });
}

function select(id, sectionId, text, tags, options, overrides = {}) {
  return question({
    id,
    sectionId,
    text,
    answerType: 'select',
    tags,
    options,
    ...overrides,
  });
}

function numberField(id, sectionId, text, tags, overrides = {}) {
  return question({
    id,
    sectionId,
    text,
    answerType: 'number',
    tags,
    ...overrides,
  });
}

export const QUESTION_SECTIONS = [
  {
    id: 'profile',
    title: 'Respondent Profile',
    description: 'Set your context so juniors get practical advice from someone like them.',
  },
  {
    id: 'expectations',
    title: 'Expectations vs Reality',
    description: 'Capture fears, misconceptions, surprises, and mindset resets.',
  },
  {
    id: 'travel',
    title: 'Travel and Journey',
    description: 'Summarize journey stress points and transport survival advice.',
  },
  {
    id: 'packing',
    title: 'Packing Basics',
    description: 'Distill what to carry, what to skip, and what people regret forgetting.',
  },
  {
    id: 'female_practical',
    title: 'Female Practical Tips',
    description: 'Female-specific realities and recommendations.',
  },
  {
    id: 'male_practical',
    title: 'Male Practical Tips',
    description: 'Male-specific realities and recommendations.',
  },
  {
    id: 'food_living',
    title: 'Food and Daily Living',
    description: 'Food planning, feeding stress, and day-to-day living tips.',
  },
  {
    id: 'accommodation',
    title: 'Accommodation and Comfort',
    description: 'Comfort, bedding, water, sanitation, and settling-in checks.',
  },
  {
    id: 'community',
    title: 'Community Entry and Social Life',
    description: 'How to earn trust and avoid social mistakes early.',
  },
  {
    id: 'fieldwork',
    title: 'Field Work and Data Collection',
    description: 'Interview strategy, coordination, and data collection discipline.',
  },
  {
    id: 'final_advice',
    title: 'Final Advice and Story',
    description: 'High-value survival advice and real stories juniors can learn from.',
  },
];

export const QUESTIONS = [
  shortText(1, 'profile', 'Full name (optional)', ['topic'], {
    required: false,
    voiceEnabled: false,
    placeholder: 'Optional',
  }),
  radio(
    2,
    'profile',
    'Gender',
    ['topic'],
    [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' },
    ],
    { required: true }
  ),
  select(
    3,
    'profile',
    'Programme of study',
    ['topic'],
    [
      { value: 'Medicine', label: 'Medicine' },
      { value: 'Pharmacy', label: 'Pharmacy' },
      { value: 'Nursing', label: 'Nursing' },
      { value: 'Allied Health', label: 'Allied Health' },
      { value: 'Agriculture', label: 'Agriculture' },
      { value: 'Education', label: 'Education' },
      { value: 'Engineering', label: 'Engineering' },
      { value: 'Other', label: 'Other' },
    ],
    { required: true }
  ),
  shortText(4, 'profile', 'School / faculty', ['topic'], {
    placeholder: 'e.g. School of Medicine',
    voiceEnabled: false,
  }),
  radio(
    5,
    'profile',
    'Did you do TTFPP in:',
    ['topic'],
    [
      { value: 'Year 1', label: 'Year 1' },
      { value: 'Year 2', label: 'Year 2' },
      { value: 'Both', label: 'Both' },
    ],
    {
      required: true,
      helperText:
        'Medicine and Pharmacy students often do TTFPP once in Year 1. Choose the path that matches your real experience.',
    }
  ),
  shortText(6, 'profile', 'Which academic year did you complete it?', ['topic'], {
    placeholder: 'e.g. 2024/2025',
    voiceEnabled: false,
  }),
  shortText(7, 'profile', 'Which community were you posted to?', ['topic'], {
    placeholder: 'Community name',
    voiceEnabled: false,
  }),
  shortText(8, 'profile', 'Which district / municipality was it in?', ['topic'], {
    placeholder: 'District or municipality',
    voiceEnabled: false,
  }),
  radio(
    9,
    'profile',
    'How rural was the area?',
    ['topic'],
    [
      { value: 'Very rural', label: 'Very rural' },
      { value: 'Rural', label: 'Rural' },
      { value: 'Semi-urban', label: 'Semi-urban' },
    ]
  ),
  numberField(10, 'profile', 'How many people were in your group?', ['topic']),
  radio(
    11,
    'food_living',
    'How were you getting food during TTFPP?',
    ['food_tip', 'topic'],
    [
      { value: 'Cooking ourselves', label: 'Cooking ourselves' },
      { value: 'Buying from the community', label: 'Buying from the community' },
      { value: 'Both', label: 'Both' },
      { value: 'Other', label: 'Other' },
    ]
  ),
  longText(
    12,
    'expectations',
    'Before and after arrival, summarize your biggest worries, misconceptions (yours and juniors\'), surprises, what felt easier than expected, what was harder than expected, and what students overthink or fear unnecessarily.',
    ['misconception', 'what_i_wish_i_knew', 'advice', 'mistake_to_avoid', 'topic']
  ),
  longText(
    13,
    'travel',
    'Describe your journey and transport advice: how long it took, the most stressful part, one travel mistake to avoid, what students should do/confirm before moving, best luggage style, and what to keep close during transit.',
    ['transport_tip', 'advice', 'mistake_to_avoid', 'packing_tip']
  ),
  longText(
    14,
    'packing',
    'Give your packing guide: top must-carry items, unnecessary items, forgotten-but-critical items, personal care/hygiene, sleeping/comfort items, light/electricity items, and things students should never leave behind.',
    ['packing_tip', 'advice', 'mistake_to_avoid', 'what_i_wish_i_knew', 'accommodation_tip']
  ),
  longText(
    15,
    'female_practical',
    'For female students: share female-specific packing, hygiene essentials, privacy/comfort items, hidden challenges others may miss, what to know before going, what makes the stay easier, and one mistake to avoid.',
    ['gender_specific_tip', 'packing_tip', 'advice', 'mistake_to_avoid', 'what_i_wish_i_knew'],
    { conditions: femaleOnly }
  ),
  longText(
    16,
    'male_practical',
    'For male students: share male-specific packing, common male mistakes, habits to improve before leaving, what to know early, and practical tips that made TTFPP easier.',
    ['gender_specific_tip', 'packing_tip', 'advice', 'mistake_to_avoid', 'what_i_wish_i_knew'],
    { conditions: maleOnly }
  ),
  longText(
    17,
    'food_living',
    'Explain food realities: what to carry from home, useful vs unnecessary food items, utensils needed, affordability, common feeding mistakes, what students forget about food planning, and low-stress feeding strategies.',
    ['food_tip', 'advice', 'mistake_to_avoid', 'what_i_wish_i_knew', 'packing_tip']
  ),
  longText(
    18,
    'accommodation',
    'Describe accommodation realities: type of place, what was good/uncomfortable, what to check before settling in, what improved comfort, best bedding items, unexpected challenges, and bathing/water/sanitation advice.',
    ['accommodation_tip', 'advice', 'mistake_to_avoid', 'what_i_wish_i_knew', 'packing_tip']
  ),
  longText(
    19,
    'community',
    'Describe community entry and social life: who to meet first, what helped gain trust, mistakes to avoid, how to relate with elders/leaders, cultural cautions, what helped your group connect well, and what students should never do on arrival.',
    ['community_entry_tip', 'advice', 'mistake_to_avoid', 'topic']
  ),
  longText(
    20,
    'fieldwork',
    'Summarize fieldwork and data collection: hardest and easier parts, what helped household interviews, one data-collection mistake to avoid, how you organized notes/questionnaires, what kept your group coordinated, and language/communication tips.',
    ['data_collection_tip', 'advice', 'mistake_to_avoid', 'what_i_wish_i_knew', 'topic']
  ),
  longText(
    21,
    'final_advice',
    'In one final response, share: your one-sentence description of TTFPP, top survival tips, what juniors should buy, what not to waste money on, one thing that sounds important but is not, one small thing that matters a lot, one real story, one difficult moment, one mistake you learned from, what your group did well, and what you wish you knew before leaving.',
    [
      'advice',
      'packing_tip',
      'transport_tip',
      'food_tip',
      'accommodation_tip',
      'community_entry_tip',
      'data_collection_tip',
      'what_i_wish_i_knew',
      'mistake_to_avoid',
      'topic',
    ]
  ),
];

export const QUESTION_MAP = new Map(QUESTIONS.map((item) => [item.id, item]));

export function getQuestionById(questionId) {
  return QUESTION_MAP.get(questionId) || null;
}

export function getQuestionsForSection(sectionId) {
  return QUESTIONS.filter((questionItem) => questionItem.sectionId === sectionId).sort(
    (a, b) => a.order - b.order
  );
}

function getComparableValues(answer) {
  if (!answer) {
    return [];
  }

  if (Array.isArray(answer.selectedOptions) && answer.selectedOptions.length > 0) {
    return answer.selectedOptions;
  }

  if (answer.selectedOption) {
    return [answer.selectedOption];
  }

  if (answer.finalAnswerText) {
    return [answer.finalAnswerText];
  }

  return [];
}

function evaluateCondition(condition, answers) {
  const values = getComparableValues(answers[condition.questionId]);
  const expected = Array.isArray(condition.value) ? condition.value : [condition.value];

  if (condition.operator === 'equals') {
    return values.some((value) => expected.includes(value));
  }

  if (condition.operator === 'not_equals') {
    return values.length > 0 && values.every((value) => !expected.includes(value));
  }

  if (condition.operator === 'in') {
    return values.some((value) => expected.includes(value));
  }

  if (condition.operator === 'not_in') {
    return values.length > 0 && values.every((value) => !expected.includes(value));
  }

  return true;
}

export function isQuestionVisible(questionItem, answers) {
  if (!questionItem.conditions || questionItem.conditions.length === 0) {
    return true;
  }

  return questionItem.conditions.every((condition) => evaluateCondition(condition, answers));
}

export function getVisibleSections(answers) {
  return QUESTION_SECTIONS.map((section) => {
    const questions = getQuestionsForSection(section.id).filter((questionItem) =>
      isQuestionVisible(questionItem, answers)
    );

    return {
      ...section,
      questions,
    };
  }).filter((section) => section.questions.length > 0);
}

function getAnswerValue(answer) {
  if (!answer) {
    return '';
  }

  if (answer.selectedOption) {
    return answer.selectedOption;
  }

  if (answer.finalAnswerText) {
    return answer.finalAnswerText;
  }

  return '';
}

export function getQuestionOptions(questionItem, answers) {
  if (questionItem.id !== 'q5') {
    return questionItem.options || [];
  }

  const programme = getAnswerValue(answers['q3']).toLowerCase();
  const isMedicineOrPharmacy = programme === 'medicine' || programme === 'pharmacy';

  if (!isMedicineOrPharmacy) {
    return questionItem.options || [];
  }

  return [
    { value: 'Year 1', label: 'Year 1 (typical for Medicine/Pharmacy)' },
    { value: 'Year 2', label: 'Year 2 (if your track was different)' },
    { value: 'Both', label: 'Both (if you had both placements)' },
  ];
}
