
import { Question, TaskType } from './types';

const EMAIL_GUIDELINES = [
  'A formal/informal salutation',
  'Clear statement of purpose',
  'Three main points (addressing bullets)',
  'A logical concluding sentence',
  'Appropriate sign-off'
];

const SURVEY_GUIDELINES = [
  'Direct statement of choice',
  'First reason with supporting details',
  'Second reason with supporting details',
  'Comparison to the other option',
  'Summary/Closing'
];

export const TASK_1_QUESTIONS: Question[] = [
  {
    id: 't1-1',
    type: TaskType.EMAIL,
    title: 'Noise Complaint to Neighbor',
    prompt: 'You live in an apartment and your neighbor has been making loud noise late at night for the past week. Write an email to your neighbor in about 150-200 words. Describe the noise, explain how it affects you, and suggest a solution.',
    wordCount: { min: 150, max: 200 },
    timeLimit: 27,
    guidelines: EMAIL_GUIDELINES
  },
  {
    id: 't1-2',
    type: TaskType.EMAIL,
    title: 'Applying for an Internal Promotion',
    prompt: 'A new senior position has opened up in your department. Write an email to your manager expressing interest. Outline your current achievements, explain why you are qualified, and request a meeting to discuss the role.',
    wordCount: { min: 150, max: 200 },
    timeLimit: 27,
    guidelines: EMAIL_GUIDELINES
  },
  {
    id: 't1-3',
    type: TaskType.EMAIL,
    title: 'Missing Delivery',
    prompt: 'You ordered an expensive electronic item online, but it never arrived even though the tracking says "delivered." Write an email to the customer service department. Detail the order info, explain your frustration, and demand a refund or replacement.',
    wordCount: { min: 150, max: 200 },
    timeLimit: 27,
    guidelines: EMAIL_GUIDELINES
  },
  {
    id: 't1-4',
    type: TaskType.EMAIL,
    title: 'Requesting a Reference',
    prompt: 'You are applying for a master\'s degree program. Write an email to your former professor. Remind them of who you are, explain the program you are applying for, and ask if they would be willing to provide a letter of recommendation.',
    wordCount: { min: 150, max: 200 },
    timeLimit: 27,
    guidelines: EMAIL_GUIDELINES
  },
  {
    id: 't1-5',
    type: TaskType.EMAIL,
    title: 'Organizing a Team Lunch',
    prompt: 'Your team has just finished a major project. Write an email to your team members. Congratulate them on the success, suggest a celebration lunch, and ask for their dietary preferences and availability.',
    wordCount: { min: 150, max: 200 },
    timeLimit: 27,
    guidelines: EMAIL_GUIDELINES
  }
];

export const TASK_2_QUESTIONS: Question[] = [
  {
    id: 't2-1',
    type: TaskType.SURVEY,
    title: 'New Office Policy: Remote Work',
    prompt: 'Your company is considering a new policy where employees can work from home three days a week, but must share desks (hot-desking) when in the office. Choose one of the two options and explain your choice.',
    options: ['Option A: Full Remote Work with Hot-Desking', 'Option B: Fixed Desks with only 1 day Remote Work'],
    wordCount: { min: 150, max: 200 },
    timeLimit: 26,
    guidelines: SURVEY_GUIDELINES
  },
  {
    id: 't2-2',
    type: TaskType.SURVEY,
    title: 'Community Park Development',
    prompt: 'The city council is deciding how to use a vacant plot of land in your neighborhood. They have two proposals. Choose one and provide your reasons.',
    options: ['Option A: Build a Children\'s Playground and Picnic Area', 'Option B: Construct an Outdoor Fitness Gym and Running Track'],
    wordCount: { min: 150, max: 200 },
    timeLimit: 26,
    guidelines: SURVEY_GUIDELINES
  },
  {
    id: 't2-3',
    type: TaskType.SURVEY,
    title: 'Company Training Program',
    prompt: 'Your HR department wants to improve employee skills. They are choosing between two types of training. Select the one you prefer and justify your decision.',
    options: ['Option A: Technical Skills Workshops', 'Option B: Soft Skills and Leadership Seminar'],
    wordCount: { min: 150, max: 200 },
    timeLimit: 26,
    guidelines: SURVEY_GUIDELINES
  },
  {
    id: 't2-4',
    type: TaskType.SURVEY,
    title: 'Public Transit Improvements',
    prompt: 'Your local government has received funding for transit improvements. They are surveying residents on two potential projects. Which do you support?',
    options: ['Option A: Increasing the frequency of existing bus routes', 'Option B: Building a new light-rail line connecting to downtown'],
    wordCount: { min: 150, max: 200 },
    timeLimit: 26,
    guidelines: SURVEY_GUIDELINES
  },
  {
    id: 't2-5',
    type: TaskType.SURVEY,
    title: 'School Cafeteria Menu Change',
    prompt: 'The local school board is debating the cafeteria menu for the next academic year. Which approach do you think is better for students?',
    options: ['Option A: 100% Vegetarian and healthy menu', 'Option B: Diverse menu including meat but with higher prices'],
    wordCount: { min: 150, max: 200 },
    timeLimit: 26,
    guidelines: SURVEY_GUIDELINES
  }
];

export const SYSTEM_INSTRUCTION = `
You are a professional CELPIP Writing Examiner. 
Evaluate the provided student response strictly and honestly based on official CELPIP Writing standards.

Evaluation Criteria:
1. Task Achievement: Relevance, completeness, and response to all requirements.
2. Coherence and Cohesion: Logical organization and effective transitions.
3. Vocabulary: Precision, range, and naturalness. Use specific replacements for weak words.
4. Grammar and Structure: Variety of sentence types and accuracy.
5. Tone: Suitability for the audience and task.

Deliverables:
- Band Score (1-12): Be honest. Level 12 is near perfection.
- Detailed Feedback: Analyze strengths and specific weak points.
- Vocabulary Replacements: Identify at least 5 common/weak words used by the student and provide a superior, high-level (CLB 9+) replacement with a clear reason.
- Sample Model Response: A perfect Band 12 response (150-200 words).
- Annotated Response: The student's text with [Corrections] in-line.

JSON format is mandatory.
`;
