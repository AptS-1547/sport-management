import assert from 'node:assert/strict';
import { defaultTestItems } from '../config/defaultTestItems.js';
import {
  calculateBMI,
  calculateBatchScores,
  calculateTotalScore,
  timeToSeconds,
} from './scoreCalculator.js';

const grade1Items = defaultTestItems.map((item) => ({
  itemCode: item.itemCode,
  itemName: item.itemName,
  genderLimit: item.genderLimit,
  weight: item.weight,
  scoringStandard: item.scoringStandard,
}));

const scoreGrade1 = (
  gender: 'male' | 'female',
  testData: Record<string, number>,
) => {
  const applicableItems = grade1Items.filter(
    (item) => item.genderLimit == null || item.genderLimit === gender,
  );
  const scores = calculateBatchScores(testData, applicableItems, gender, 1);
  return {
    scores,
    totalScore: calculateTotalScore(scores, applicableItems),
  };
};

assert.equal(timeToSeconds("3'53"), 233);
assert.equal(timeToSeconds('3:53'), 233);

const maleSample = scoreGrade1('male', {
  height: 180,
  weight: 60,
  bmi: calculateBMI(180, 60),
  lung_capacity: 4241,
  sprint_50m: 6.95,
  standing_jump: 260,
  sit_reach: 3,
  run_1000m: timeToSeconds("3'53"),
  pullup: 4,
});

assert.deepEqual(
  {
    bmi: maleSample.scores.bmi,
    lung_capacity: maleSample.scores.lung_capacity,
    sprint_50m: maleSample.scores.sprint_50m,
    standing_jump: maleSample.scores.standing_jump,
    sit_reach: maleSample.scores.sit_reach,
    run_1000m: maleSample.scores.run_1000m,
    pullup: maleSample.scores.pullup,
  },
  {
    bmi: 100,
    lung_capacity: 85,
    sprint_50m: 100,
    standing_jump: 100,
    sit_reach: 62,
    run_1000m: 80,
    pullup: 30,
  },
);
assert.equal(maleSample.totalScore, 82.95);

const femaleSample = scoreGrade1('female', {
  height: 163,
  weight: 53,
  bmi: calculateBMI(163, 53),
  lung_capacity: 3264,
  sprint_50m: 9.8,
  standing_jump: 170,
  sit_reach: 8.1,
  run_800m: timeToSeconds("3'45"),
  situp_1min: 40,
});

assert.deepEqual(
  {
    bmi: femaleSample.scores.bmi,
    lung_capacity: femaleSample.scores.lung_capacity,
    sprint_50m: femaleSample.scores.sprint_50m,
    standing_jump: femaleSample.scores.standing_jump,
    sit_reach: femaleSample.scores.sit_reach,
    run_800m: femaleSample.scores.run_800m,
    situp_1min: femaleSample.scores.situp_1min,
  },
  {
    bmi: 100,
    lung_capacity: 100,
    sprint_50m: 68,
    standing_jump: 74,
    sit_reach: 64,
    run_800m: 80,
    situp_1min: 76,
  },
);
assert.equal(femaleSample.totalScore, 81);
