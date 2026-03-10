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
    description: 'Start with your context so juniors get advice from someone like them.',
  },
  {
    id: 'expectations',
    title: 'Expectations vs Reality',
    description: 'Capture fears, surprises, and myths that need correction.',
  },
  {
    id: 'travel',
    title: 'Travel and Journey',
    description: 'Help juniors plan transport and avoid stressful mistakes.',
  },
  {
    id: 'packing',
    title: 'Packing Basics',
    description: 'Share what really matters in the bag.',
  },
  {
    id: 'female_practical',
    title: 'Female Practical Tips',
    description: 'Practical female-specific survival advice.',
  },
  {
    id: 'male_practical',
    title: 'Male Practical Tips',
    description: 'Practical male-specific survival advice.',
  },
  {
    id: 'food_living',
    title: 'Food and Daily Living',
    description: 'Reduce food stress and daily routine confusion.',
  },
  {
    id: 'accommodation',
    title: 'Accommodation and Comfort',
    description: 'What makes living conditions easier to manage.',
  },
  {
    id: 'community',
    title: 'Community Entry and Social Life',
    description: 'How to build trust and avoid social mistakes early.',
  },
  {
    id: 'fieldwork',
    title: 'Field Work and Data Collection',
    description: 'Tips for smoother interviews and better coordination.',
  },
  {
    id: 'survival',
    title: 'Survival and Group Experience',
    description: 'What helped day-to-day life and teamwork.',
  },
  {
    id: 'final_advice',
    title: 'Final Advice',
    description: 'Distill your strongest recommendations for juniors.',
  },
  {
    id: 'story_mode',
    title: 'Story Mode',
    description: 'Real stories future students can learn from.',
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
  }),
  shortText(7, 'profile', 'Which community were you posted to?', ['topic'], {
    placeholder: 'Community name',
  }),
  shortText(8, 'profile', 'Which district / municipality was it in?', ['topic'], {
    placeholder: 'District or municipality',
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

  longText(11, 'expectations', 'Before going for TTFPP, what were you most worried about?', [
    'topic',
    'what_i_wish_i_knew',
  ]),
  longText(12, 'expectations', 'What misconceptions did you have about TTFPP before going?', [
    'misconception',
    'topic',
  ]),
  longText(13, 'expectations', 'What misconceptions do juniors commonly have about TTFPP?', [
    'misconception',
    'advice',
  ]),
  longText(14, 'expectations', 'What surprised you most when you got there?', [
    'topic',
    'what_i_wish_i_knew',
  ]),
  longText(15, 'expectations', 'What did you think would be difficult but turned out manageable?', [
    'advice',
    'what_i_wish_i_knew',
  ]),
  longText(16, 'expectations', 'What turned out to be harder than expected?', [
    'topic',
    'mistake_to_avoid',
  ]),
  longText(17, 'expectations', 'What do students usually overthink unnecessarily before TTFPP?', [
    'misconception',
    'advice',
  ]),
  longText(18, 'expectations', 'What should students stop being too afraid of?', [
    'advice',
    'what_i_wish_i_knew',
  ]),

  radio(
    19,
    'travel',
    'How did you travel to the community?',
    ['transport_tip', 'topic'],
    [
      { value: 'Bus', label: 'Bus' },
      { value: 'Trotro / shared transport', label: 'Trotro / shared transport' },
      { value: 'Private car', label: 'Private car' },
      { value: 'Motorbike', label: 'Motorbike' },
      { value: 'Other', label: 'Other' },
    ]
  ),
  shortText(20, 'travel', 'About how long did the journey take?', ['transport_tip'], {
    placeholder: 'e.g. 4 hours',
  }),
  longText(21, 'travel', 'What part of the journey was the most stressful?', [
    'transport_tip',
    'mistake_to_avoid',
  ]),
  longText(22, 'travel', 'What travel mistake should students avoid?', [
    'transport_tip',
    'mistake_to_avoid',
  ]),
  longText(23, 'travel', 'What should students do before leaving for the trip?', [
    'transport_tip',
    'advice',
  ]),
  longText(24, 'travel', 'What should students confirm before boarding or moving?', [
    'transport_tip',
    'advice',
  ]),
  longText(25, 'travel', 'What kind of bag or luggage worked best for you?', [
    'transport_tip',
    'packing_tip',
  ]),
  longText(26, 'travel', 'What travel essentials helped you most?', [
    'transport_tip',
    'packing_tip',
  ]),
  longText(27, 'travel', 'What would you advise students to keep close during the journey?', [
    'transport_tip',
    'advice',
  ]),

  longText(28, 'packing', 'What are the 5 most important items every student should carry?', [
    'packing_tip',
    'advice',
  ]),
  longText(29, 'packing', 'What items did you pack that were not really necessary?', [
    'packing_tip',
    'mistake_to_avoid',
  ]),
  longText(30, 'packing', 'What items did you forget to pack and later regretted?', [
    'packing_tip',
    'what_i_wish_i_knew',
  ]),
  longText(31, 'packing', 'What small items made your stay much easier?', [
    'packing_tip',
    'advice',
  ]),
  longText(32, 'packing', 'What personal care items were especially useful?', [
    'packing_tip',
    'advice',
  ]),
  longText(33, 'packing', 'What sleeping or comfort items helped a lot?', [
    'packing_tip',
    'accommodation_tip',
  ]),
  longText(34, 'packing', 'What light/electricity-related items helped?', [
    'packing_tip',
    'accommodation_tip',
  ]),
  longText(35, 'packing', 'What items should students definitely not leave behind?', [
    'packing_tip',
    'advice',
  ]),

  longText(36, 'female_practical', 'What should female students specifically pack for TTFPP?', [
    'gender_specific_tip',
    'packing_tip',
  ], { conditions: femaleOnly }),
  longText(37, 'female_practical', 'What hygiene items are especially important for female students?', [
    'gender_specific_tip',
    'packing_tip',
  ], { conditions: femaleOnly }),
  longText(38, 'female_practical', 'What comfort or privacy items would you recommend?', [
    'gender_specific_tip',
    'advice',
  ], { conditions: femaleOnly }),
  longText(39, 'female_practical', 'What challenges did female students face that others may not think about?', [
    'gender_specific_tip',
    'topic',
  ], { conditions: femaleOnly }),
  longText(40, 'female_practical', 'What should female students know before going?', [
    'gender_specific_tip',
    'what_i_wish_i_knew',
  ], { conditions: femaleOnly }),
  longText(41, 'female_practical', 'What should female students do to make the stay easier?', [
    'gender_specific_tip',
    'advice',
  ], { conditions: femaleOnly }),
  longText(42, 'female_practical', 'What female-specific packing mistake should be avoided?', [
    'gender_specific_tip',
    'mistake_to_avoid',
  ], { conditions: femaleOnly }),

  longText(43, 'male_practical', 'What should male students specifically pack for TTFPP?', [
    'gender_specific_tip',
    'packing_tip',
  ], { conditions: maleOnly }),
  longText(44, 'male_practical', 'What common packing mistakes do male students make?', [
    'gender_specific_tip',
    'mistake_to_avoid',
  ], { conditions: maleOnly }),
  longText(45, 'male_practical', 'What habits should male students improve before going?', [
    'gender_specific_tip',
    'advice',
  ], { conditions: maleOnly }),
  longText(46, 'male_practical', 'What should male students know before leaving?', [
    'gender_specific_tip',
    'what_i_wish_i_knew',
  ], { conditions: maleOnly }),
  longText(47, 'male_practical', 'What practical tips would help male students during TTFPP?', [
    'gender_specific_tip',
    'advice',
  ], { conditions: maleOnly }),

  radio(
    48,
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
  longText(49, 'food_living', 'What foodstuffs should students carry from home?', ['food_tip', 'advice']),
  longText(50, 'food_living', 'What food items turned out to be very useful?', ['food_tip', 'advice']),
  longText(51, 'food_living', 'What food items were unnecessary?', [
    'food_tip',
    'mistake_to_avoid',
  ]),
  longText(52, 'food_living', 'What cooking items or utensils were necessary?', ['food_tip', 'packing_tip']),
  radio(
    53,
    'food_living',
    'Was food in the community affordable?',
    ['food_tip', 'topic'],
    [
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No' },
      { value: 'It depended', label: 'It depended' },
    ]
  ),
  longText(54, 'food_living', 'What mistakes do students make regarding food?', [
    'food_tip',
    'mistake_to_avoid',
  ]),
  longText(55, 'food_living', 'What do students usually forget about feeding during TTFPP?', [
    'food_tip',
    'what_i_wish_i_knew',
  ]),
  longText(56, 'food_living', 'What would you recommend for students who do not like stress around food?', [
    'food_tip',
    'advice',
  ]),

  shortText(57, 'accommodation', 'What type of accommodation did you stay in?', [
    'accommodation_tip',
    'topic',
  ]),
  longText(58, 'accommodation', 'What was good about the place?', ['accommodation_tip', 'advice']),
  longText(59, 'accommodation', 'What was uncomfortable about it?', [
    'accommodation_tip',
    'mistake_to_avoid',
  ]),
  longText(60, 'accommodation', 'What should students check before settling in?', [
    'accommodation_tip',
    'advice',
  ]),
  longText(61, 'accommodation', 'What helped make the place more comfortable?', [
    'accommodation_tip',
    'advice',
  ]),
  longText(62, 'accommodation', 'What bedding or sleeping items helped most?', [
    'accommodation_tip',
    'packing_tip',
  ]),
  longText(63, 'accommodation', 'What accommodation challenge did you not expect?', [
    'accommodation_tip',
    'what_i_wish_i_knew',
  ]),
  longText(64, 'accommodation', 'What advice would you give about bathing, water, or sanitation in the place?', [
    'accommodation_tip',
    'advice',
  ]),

  radio(
    65,
    'community',
    'How welcoming was the community?',
    ['community_entry_tip', 'topic'],
    [
      { value: 'Very welcoming', label: 'Very welcoming' },
      { value: 'Somewhat welcoming', label: 'Somewhat welcoming' },
      { value: 'Not welcoming', label: 'Not welcoming' },
      { value: 'Mixed', label: 'Mixed' },
    ]
  ),
  longText(66, 'community', 'Who did you meet first?', ['community_entry_tip', 'topic']),
  longText(67, 'community', 'What helped you gain the trust of the community?', [
    'community_entry_tip',
    'advice',
  ]),
  longText(68, 'community', 'What mistakes should students avoid during community entry?', [
    'community_entry_tip',
    'mistake_to_avoid',
  ]),
  longText(69, 'community', 'What should students know about interacting with elders or leaders?', [
    'community_entry_tip',
    'advice',
  ]),
  longText(70, 'community', 'What social or cultural thing should students be careful about?', [
    'community_entry_tip',
    'mistake_to_avoid',
  ]),
  longText(71, 'community', 'What helped your group relate well with people in the community?', [
    'community_entry_tip',
    'advice',
  ]),
  longText(72, 'community', 'What should students never do when they arrive?', [
    'community_entry_tip',
    'mistake_to_avoid',
  ]),

  longText(73, 'fieldwork', 'What part of the actual field work was hardest?', [
    'data_collection_tip',
    'topic',
  ]),
  longText(74, 'fieldwork', 'What part was easier than expected?', [
    'data_collection_tip',
    'what_i_wish_i_knew',
  ]),
  longText(75, 'fieldwork', 'What helped with household interviews?', [
    'data_collection_tip',
    'advice',
  ]),
  longText(76, 'fieldwork', 'What data collection mistake should students avoid?', [
    'data_collection_tip',
    'mistake_to_avoid',
  ]),
  longText(77, 'fieldwork', 'How did you organize your questionnaires and notes?', [
    'data_collection_tip',
    'advice',
  ]),
  longText(78, 'fieldwork', 'What helped your group stay coordinated during field work?', [
    'data_collection_tip',
    'advice',
  ]),
  longText(79, 'fieldwork', 'What advice would you give for approaching respondents?', [
    'data_collection_tip',
    'advice',
  ]),
  longText(80, 'fieldwork', 'What should students know about language barriers or communication issues?', [
    'data_collection_tip',
    'advice',
  ]),

  longText(81, 'survival', 'What helped you survive TTFPP comfortably?', ['advice', 'topic']),
  longText(82, 'survival', 'What daily habit made life easier?', ['advice', 'what_i_wish_i_knew']),
  longText(83, 'survival', 'What did your group do that worked really well?', ['advice', 'topic']),
  longText(84, 'survival', 'What group mistake should others avoid?', [
    'mistake_to_avoid',
    'advice',
  ]),
  longText(85, 'survival', 'What made the experience enjoyable?', ['topic', 'advice']),
  longText(86, 'survival', 'What made it stressful?', ['topic', 'what_i_wish_i_knew']),
  longText(87, 'survival', 'If you could do TTFPP again, what would you do differently?', [
    'what_i_wish_i_knew',
    'advice',
  ]),
  longText(88, 'survival', 'What is one thing you wish someone had told you before you left?', [
    'what_i_wish_i_knew',
    'advice',
  ]),

  shortText(89, 'final_advice', 'In one sentence, how would you describe TTFPP?', [
    'topic',
    'advice',
  ]),
  longText(90, 'final_advice', 'What are your top 3 survival tips?', ['advice', 'packing_tip']),
  longText(91, 'final_advice', 'What should every junior know before going?', [
    'advice',
    'what_i_wish_i_knew',
  ]),
  longText(92, 'final_advice', 'What should students buy before they travel?', [
    'packing_tip',
    'transport_tip',
  ]),
  longText(93, 'final_advice', 'What should students not waste money on?', [
    'mistake_to_avoid',
    'advice',
  ]),
  longText(94, 'final_advice', 'What is one thing that sounds important but really is not?', [
    'misconception',
    'mistake_to_avoid',
  ]),
  longText(95, 'final_advice', 'What is one thing that seems small but is actually very important?', [
    'advice',
    'what_i_wish_i_knew',
  ]),
  longText(96, 'final_advice', 'Any final advice for future students?', ['advice', 'topic']),

  longText(97, 'story_mode', 'Tell one real story from your TTFPP experience that future students can learn from.', [
    'topic',
    'advice',
  ]),
  longText(98, 'story_mode', 'Describe one mistake you made and what you learned from it.', [
    'mistake_to_avoid',
    'what_i_wish_i_knew',
  ]),
  longText(99, 'story_mode', 'Describe one thing your group did well that others should copy.', [
    'advice',
    'topic',
  ]),
  longText(100, 'story_mode', 'Describe one difficult moment and how you handled it.', [
    'advice',
    'what_i_wish_i_knew',
  ]),
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
