/**
 * 默认国标体测项目配置
 */

export interface DefaultTestItem {
  itemCode: string;
  itemName: string;
  itemUnit?: string;
  genderLimit?: 'male' | 'female' | null;
  isRequired: boolean;
  sortOrder: number;
  weight?: number;
  scoringStandard?: Record<string, unknown>;
  validationRules?: {
    min?: number;
    max?: number;
    decimals?: number;
  };
  isCalculated?: boolean; // 是否为计算型项目（不需要手动输入）
}

/**
 * 国标体测项目列表
 * 通用项目：身高、体重、BMI、肺活量、50米跑、立定跳远、坐位体前屈
 * 女生专属：仰卧起坐、800米跑
 * 男生专属：引体向上、1000米跑
 */
export const defaultTestItems: DefaultTestItem[] = [
  {
    itemCode: 'height',
    itemName: '身高',
    itemUnit: 'cm',
    genderLimit: null,
    isRequired: true,
    sortOrder: 1,
    weight: 0,
    validationRules: {
      min: 100,
      max: 230,
      decimals: 1,
    },
    scoringStandard: {
      description: '身高测量值',
      type: 'numeric',
    },
  },
  {
    itemCode: 'weight',
    itemName: '体重',
    itemUnit: 'kg',
    genderLimit: null,
    isRequired: true,
    sortOrder: 2,
    weight: 0,
    validationRules: {
      min: 20,
      max: 200,
      decimals: 1,
    },
    scoringStandard: {
      description: '体重测量值',
      type: 'numeric',
    },
  },
  {
    itemCode: 'bmi',
    itemName: 'BMI',
    itemUnit: '',
    genderLimit: null,
    isRequired: true,
    weight: 15,
    sortOrder: 3,
    isCalculated: true, // BMI 由后端自动计算
    validationRules: {
      min: 8,
      max: 50,
      decimals: 2,
    },
    scoringStandard: {
      description: 'BMI自动计算: 体重(kg) / 身高²(m)',
      type: 'numeric',
      male: {
        grade1: [
          { max: 16.4, score: 80 },
          { max: 23.2, score: 100 },
          { exclusiveMax: 26.4, score: 80 },
          { min: 26.4, score: 60 },
        ],
        grade2: [
          { max: 16.7, score: 80 },
          { max: 23.7, score: 100 },
          { exclusiveMax: 26.6, score: 80 },
          { min: 26.6, score: 60 },
        ],
        grade3: [
          { max: 17.2, score: 80 },
          { max: 23.8, score: 100 },
          { exclusiveMax: 27.4, score: 80 },
          { min: 27.4, score: 60 },
        ],
      },
      female: {
        grade1: [
          { max: 16.4, score: 80 },
          { max: 22.7, score: 100 },
          { exclusiveMax: 25.3, score: 80 },
          { min: 25.3, score: 60 },
        ],
        grade2: [
          { max: 16.8, score: 80 },
          { max: 23.2, score: 100 },
          { exclusiveMax: 25.5, score: 80 },
          { min: 25.5, score: 60 },
        ],
        grade3: [
          { max: 17.0, score: 80 },
          { max: 23.3, score: 100 },
          { exclusiveMax: 25.8, score: 80 },
          { min: 25.8, score: 60 },
        ],
      },
    },
  },
  {
    itemCode: 'lung_capacity',
    itemName: '肺活量',
    itemUnit: 'ml',
    genderLimit: null,
    isRequired: true,
    sortOrder: 4,
    weight: 15,
    validationRules: {
      min: 500,
      max: 8000,
      decimals: 0,
    },
    scoringStandard: {
      description: '肺活量测量值',
      type: 'numeric',
      male: {
        grade1: {
          A: { min: 4540, score: 100 },
          B: { min: 4420, max: 4539, score: 95 },
          C: { min: 4300, max: 4419, score: 90 },
          D: { min: 4050, max: 4299, score: 85 },
          E: { min: 3800, max: 4049, score: 80 },
          F: { min: 3680, max: 3799, score: 78 },
          G: { min: 3560, max: 3679, score: 76 },
          H: { min: 3440, max: 3559, score: 74 },
          I: { min: 3320, max: 3439, score: 72 },
          J: { min: 3200, max: 3319, score: 70 },
          K: { min: 3080, max: 3199, score: 68 },
          L: { min: 2960, max: 3079, score: 66 },
          M: { min: 2840, max: 2959, score: 64 },
          N: { min: 2720, max: 2839, score: 62 },
          O: { min: 2600, max: 2719, score: 60 },
          P: { min: 2470, max: 2599, score: 50 },
          Q: { min: 2340, max: 2469, score: 40 },
          R: { min: 2210, max: 2339, score: 30 },
          S: { min: 2080, max: 2209, score: 20 },
          T: { min: 1950, max: 2079, score: 10 },
          U: { max: 1949, score: 0 },
        },
        grade2: {
          A: { min: 5160, score: 100 },
          B: { min: 4920, max: 5159, score: 95 },
          C: { min: 4680, max: 4919, score: 90 },
          D: { min: 4300, max: 4679, score: 85 },
          E: { min: 3920, max: 4299, score: 80 },
          F: { min: 3730, max: 3919, score: 78 },
          G: { min: 3540, max: 3729, score: 76 },
          H: { min: 3350, max: 3539, score: 74 },
          I: { min: 3160, max: 3349, score: 72 },
          J: { min: 2970, max: 3159, score: 70 },
          K: { min: 2780, max: 2969, score: 68 },
          L: { min: 2590, max: 2779, score: 66 },
          M: { min: 2400, max: 2589, score: 64 },
          N: { min: 2210, max: 2399, score: 62 },
          O: { min: 2020, max: 2209, score: 60 },
          P: { min: 1830, max: 2019, score: 50 },
          Q: { min: 1640, max: 1829, score: 40 },
          R: { min: 1450, max: 1639, score: 30 },
          S: { min: 1260, max: 1449, score: 20 },
          T: { min: 1070, max: 1259, score: 10 },
          U: { max: 1069, score: 0 },
        },
        grade3: {
          A: { min: 5280, score: 100 },
          B: { min: 5040, max: 5279, score: 95 },
          C: { min: 4800, max: 5039, score: 90 },
          D: { min: 4420, max: 4799, score: 85 },
          E: { min: 4040, max: 4419, score: 80 },
          F: { min: 3850, max: 4039, score: 78 },
          G: { min: 3660, max: 3849, score: 76 },
          H: { min: 3470, max: 3659, score: 74 },
          I: { min: 3280, max: 3469, score: 72 },
          J: { min: 3090, max: 3279, score: 70 },
          K: { min: 2900, max: 3089, score: 68 },
          L: { min: 2710, max: 2899, score: 66 },
          M: { min: 2520, max: 2709, score: 64 },
          N: { min: 2330, max: 2519, score: 62 },
          O: { min: 2140, max: 2329, score: 60 },
          P: { min: 1950, max: 2139, score: 50 },
          Q: { min: 1760, max: 1949, score: 40 },
          R: { min: 1570, max: 1759, score: 30 },
          S: { min: 1380, max: 1569, score: 20 },
          T: { min: 1190, max: 1379, score: 10 },
          U: { max: 1189, score: 0 },
        },
      },
      female: {
        grade1: {
          A: { min: 3150, score: 100 },
          B: { min: 3100, max: 3149, score: 95 },
          C: { min: 3050, max: 3099, score: 90 },
          D: { min: 2900, max: 3049, score: 85 },
          E: { min: 2750, max: 2899, score: 80 },
          F: { min: 2650, max: 2749, score: 78 },
          G: { min: 2550, max: 2649, score: 76 },
          H: { min: 2450, max: 2549, score: 74 },
          I: { min: 2350, max: 2449, score: 72 },
          J: { min: 2250, max: 2349, score: 70 },
          K: { min: 2150, max: 2249, score: 68 },
          L: { min: 2050, max: 2149, score: 66 },
          M: { min: 1950, max: 2049, score: 64 },
          N: { min: 1850, max: 1949, score: 62 },
          O: { min: 1750, max: 1849, score: 60 },
          P: { min: 1710, max: 1749, score: 50 },
          Q: { min: 1670, max: 1709, score: 40 },
          R: { min: 1630, max: 1669, score: 30 },
          S: { min: 1590, max: 1629, score: 20 },
          T: { min: 1550, max: 1589, score: 10 },
          U: { max: 1549, score: 0 },
        },
        grade2: {
          A: { min: 3450, score: 100 },
          B: { min: 3300, max: 3449, score: 95 },
          C: { min: 3150, max: 3299, score: 90 },
          D: { min: 2900, max: 3149, score: 85 },
          E: { min: 2650, max: 2899, score: 80 },
          F: { min: 2525, max: 2649, score: 78 },
          G: { min: 2400, max: 2524, score: 76 },
          H: { min: 2275, max: 2399, score: 74 },
          I: { min: 2150, max: 2274, score: 72 },
          J: { min: 2025, max: 2149, score: 70 },
          K: { min: 1900, max: 2024, score: 68 },
          L: { min: 1775, max: 1899, score: 66 },
          M: { min: 1650, max: 1774, score: 64 },
          N: { min: 1525, max: 1649, score: 62 },
          O: { min: 1400, max: 1524, score: 60 },
          P: { min: 1275, max: 1399, score: 50 },
          Q: { min: 1150, max: 1274, score: 40 },
          R: { min: 1025, max: 1149, score: 30 },
          S: { min: 900, max: 1024, score: 20 },
          T: { min: 775, max: 899, score: 10 },
          U: { max: 774, score: 0 },
        },
        grade3: {
          A: { min: 3500, score: 100 },
          B: { min: 3350, max: 3499, score: 95 },
          C: { min: 3200, max: 3349, score: 90 },
          D: { min: 2950, max: 3199, score: 85 },
          E: { min: 2700, max: 2949, score: 80 },
          F: { min: 2575, max: 2699, score: 78 },
          G: { min: 2450, max: 2574, score: 76 },
          H: { min: 2325, max: 2449, score: 74 },
          I: { min: 2200, max: 2324, score: 72 },
          J: { min: 2075, max: 2199, score: 70 },
          K: { min: 1950, max: 2074, score: 68 },
          L: { min: 1825, max: 1949, score: 66 },
          M: { min: 1700, max: 1824, score: 64 },
          N: { min: 1575, max: 1699, score: 62 },
          O: { min: 1450, max: 1574, score: 60 },
          P: { min: 1325, max: 1449, score: 50 },
          Q: { min: 1200, max: 1324, score: 40 },
          R: { min: 1075, max: 1199, score: 30 },
          S: { min: 950, max: 1074, score: 20 },
          T: { min: 825, max: 949, score: 10 },
          U: { max: 824, score: 0 },
        },
      },
    },
  },
  {
    itemCode: 'sprint_50m',
    itemName: '50米跑',
    itemUnit: '秒',
    genderLimit: null,
    isRequired: true,
    sortOrder: 5,
    weight: 20,
    validationRules: {
      min: 5,
      max: 30,
      decimals: 2,
    },
    scoringStandard: {
      description: '50米跑成绩(秒)',
      type: 'numeric',
      note: '成绩越小越好',
      male: {
        grade1: {
          A: { max: 7.1, score: 100 },
          B: { max: 7.2, score: 95 },
          C: { max: 7.3, score: 90 },
          D: { max: 7.4, score: 85 },
          E: { max: 7.5, score: 80 },
          F: { max: 7.7, score: 78 },
          G: { max: 7.9, score: 76 },
          H: { max: 8.1, score: 74 },
          I: { max: 8.3, score: 72 },
          J: { max: 8.5, score: 70 },
          K: { max: 8.7, score: 68 },
          L: { max: 8.9, score: 66 },
          M: { max: 9.1, score: 64 },
          N: { max: 9.3, score: 62 },
          O: { max: 9.5, score: 60 },
          P: { max: 9.7, score: 50 },
          Q: { max: 9.9, score: 40 },
          R: { max: 10.1, score: 30 },
          S: { max: 10.3, score: 20 },
          T: { max: 10.5, score: 10 },
          U: { score: 0 },
        },
        grade2: {
          A: { max: 7.0, score: 100 },
          B: { min: 7.1, max: 7.1, score: 95 },
          C: { min: 7.2, max: 7.2, score: 90 },
          D: { min: 7.3, max: 7.3, score: 85 },
          E: { min: 7.4, max: 7.4, score: 80 },
          F: { min: 7.5, max: 7.6, score: 78 },
          G: { min: 7.7, max: 7.8, score: 76 },
          H: { min: 7.9, max: 8.0, score: 74 },
          I: { min: 8.1, max: 8.2, score: 72 },
          J: { min: 8.3, max: 8.4, score: 70 },
          K: { min: 8.5, max: 8.6, score: 68 },
          L: { min: 8.7, max: 8.8, score: 66 },
          M: { min: 8.9, max: 9.0, score: 64 },
          N: { min: 9.1, max: 9.2, score: 62 },
          O: { min: 9.3, max: 9.4, score: 60 },
          P: { min: 9.5, max: 9.6, score: 50 },
          Q: { min: 9.7, max: 9.8, score: 40 },
          R: { min: 9.9, max: 10.0, score: 30 },
          S: { min: 10.1, max: 10.2, score: 20 },
          T: { min: 10.3, max: 10.4, score: 10 },
          U: { min: 10.5, score: 0 },
        },
        grade3: {
          A: { max: 6.8, score: 100 },
          B: { min: 6.9, max: 6.9, score: 95 },
          C: { min: 7.0, max: 7.0, score: 90 },
          D: { min: 7.1, max: 7.1, score: 85 },
          E: { min: 7.2, max: 7.2, score: 80 },
          F: { min: 7.3, max: 7.4, score: 78 },
          G: { min: 7.5, max: 7.6, score: 76 },
          H: { min: 7.7, max: 7.8, score: 74 },
          I: { min: 7.9, max: 8.0, score: 72 },
          J: { min: 8.1, max: 8.2, score: 70 },
          K: { min: 8.3, max: 8.4, score: 68 },
          L: { min: 8.5, max: 8.6, score: 66 },
          M: { min: 8.7, max: 8.8, score: 64 },
          N: { min: 8.9, max: 9.0, score: 62 },
          O: { min: 9.1, max: 9.2, score: 60 },
          P: { min: 9.3, max: 9.4, score: 50 },
          Q: { min: 9.5, max: 9.6, score: 40 },
          R: { min: 9.7, max: 9.8, score: 30 },
          S: { min: 9.9, max: 10.0, score: 20 },
          T: { min: 10.1, max: 10.2, score: 10 },
          U: { min: 10.3, score: 0 },
        },
      },
      female: {
        grade1: {
          A: { max: 7.8, score: 100 },
          B: { max: 7.9, score: 95 },
          C: { max: 8.0, score: 90 },
          D: { max: 8.3, score: 85 },
          E: { max: 8.6, score: 80 },
          F: { max: 8.8, score: 78 },
          G: { max: 9.0, score: 76 },
          H: { max: 9.2, score: 74 },
          I: { max: 9.4, score: 72 },
          J: { max: 9.6, score: 70 },
          K: { max: 9.8, score: 68 },
          L: { max: 10.0, score: 66 },
          M: { max: 10.2, score: 64 },
          N: { max: 10.4, score: 62 },
          O: { max: 10.6, score: 60 },
          P: { max: 10.8, score: 50 },
          Q: { max: 11.0, score: 40 },
          R: { max: 11.2, score: 30 },
          S: { max: 11.4, score: 20 },
          T: { max: 11.6, score: 10 },
          U: { score: 0 },
        },
        grade2: {
          A: { max: 7.7, score: 100 },
          B: { min: 7.8, max: 7.8, score: 95 },
          C: { min: 7.9, max: 7.9, score: 90 },
          D: { min: 8.0, max: 8.2, score: 85 },
          E: { min: 8.3, max: 8.5, score: 80 },
          F: { min: 8.6, max: 8.7, score: 78 },
          G: { min: 8.8, max: 8.9, score: 76 },
          H: { min: 9.0, max: 9.0, score: 74 },
          I: { min: 9.1, max: 9.2, score: 72 },
          J: { min: 9.3, max: 9.4, score: 70 },
          K: { min: 9.5, max: 9.7, score: 68 },
          L: { min: 9.8, max: 9.9, score: 66 },
          M: { min: 10.0, max: 10.1, score: 64 },
          N: { min: 10.2, max: 10.3, score: 62 },
          O: { min: 10.4, max: 10.5, score: 60 },
          P: { min: 10.6, max: 10.7, score: 50 },
          Q: { min: 10.8, max: 10.9, score: 40 },
          R: { min: 11.0, max: 11.1, score: 30 },
          S: { min: 11.2, max: 11.3, score: 20 },
          T: { min: 11.4, max: 11.5, score: 10 },
          U: { min: 11.6, score: 0 },
        },
        grade3: {
          A: { max: 7.6, score: 100 },
          B: { min: 7.7, max: 7.7, score: 95 },
          C: { min: 7.8, max: 7.8, score: 90 },
          D: { min: 7.9, max: 8.1, score: 85 },
          E: { min: 8.2, max: 8.4, score: 80 },
          F: { min: 8.5, max: 8.6, score: 78 },
          G: { min: 8.7, max: 8.8, score: 76 },
          H: { min: 8.9, max: 8.9, score: 74 },
          I: { min: 9.0, max: 9.1, score: 72 },
          J: { min: 9.2, max: 9.3, score: 70 },
          K: { min: 9.4, max: 9.6, score: 68 },
          L: { min: 9.7, max: 9.8, score: 66 },
          M: { min: 9.9, max: 10.0, score: 64 },
          N: { min: 10.1, max: 10.2, score: 62 },
          O: { min: 10.3, max: 10.4, score: 60 },
          P: { min: 10.5, max: 10.6, score: 50 },
          Q: { min: 10.7, max: 10.8, score: 40 },
          R: { min: 10.9, max: 11.0, score: 30 },
          S: { min: 11.1, max: 11.2, score: 20 },
          T: { min: 11.3, max: 11.4, score: 10 },
          U: { min: 11.5, score: 0 },
        },
      },
    },
  },
  {
    itemCode: 'standing_jump',
    itemName: '立定跳远',
    itemUnit: 'cm',
    genderLimit: null,
    isRequired: true,
    sortOrder: 6,
    weight: 10,
    validationRules: {
      min: 50,
      max: 350,
      decimals: 1,
    },
    scoringStandard: {
      description: '立定跳远距离',
      type: 'numeric',
      male: {
        grade1: {
          A: { min: 260, score: 100 },
          B: { min: 255, max: 259, score: 95 },
          C: { min: 250, max: 254, score: 90 },
          D: { min: 243, max: 249, score: 85 },
          E: { min: 235, max: 242, score: 80 },
          F: { min: 231, max: 234, score: 78 },
          G: { min: 227, max: 230, score: 76 },
          H: { min: 223, max: 226, score: 74 },
          I: { min: 219, max: 222, score: 72 },
          J: { min: 215, max: 218, score: 70 },
          K: { min: 211, max: 214, score: 68 },
          L: { min: 207, max: 210, score: 66 },
          M: { min: 203, max: 206, score: 64 },
          N: { min: 199, max: 202, score: 62 },
          O: { min: 195, max: 198, score: 60 },
          P: { min: 190, max: 194, score: 50 },
          Q: { min: 185, max: 189, score: 40 },
          R: { min: 180, max: 184, score: 30 },
          S: { min: 175, max: 179, score: 20 },
          T: { min: 170, max: 174, score: 10 },
          U: { max: 169, score: 0 },
        },
        grade2: {
          A: { min: 275, score: 100 },
          B: { min: 270, max: 274, score: 95 },
          C: { min: 265, max: 269, score: 90 },
          D: { min: 255, max: 264, score: 85 },
          E: { min: 245, max: 254, score: 80 },
          F: { min: 240, max: 244, score: 78 },
          G: { min: 235, max: 239, score: 76 },
          H: { min: 230, max: 234, score: 74 },
          I: { min: 225, max: 229, score: 72 },
          J: { min: 220, max: 224, score: 70 },
          K: { min: 215, max: 219, score: 68 },
          L: { min: 210, max: 214, score: 66 },
          M: { min: 205, max: 209, score: 64 },
          N: { min: 200, max: 204, score: 62 },
          O: { min: 195, max: 199, score: 60 },
          P: { min: 190, max: 194, score: 50 },
          Q: { min: 185, max: 189, score: 40 },
          R: { min: 180, max: 184, score: 30 },
          S: { min: 175, max: 179, score: 20 },
          T: { min: 170, max: 174, score: 10 },
          U: { max: 169, score: 0 },
        },
        grade3: {
          A: { min: 280, score: 100 },
          B: { min: 275, max: 279, score: 95 },
          C: { min: 270, max: 274, score: 90 },
          D: { min: 260, max: 269, score: 85 },
          E: { min: 250, max: 259, score: 80 },
          F: { min: 245, max: 249, score: 78 },
          G: { min: 240, max: 244, score: 76 },
          H: { min: 235, max: 239, score: 74 },
          I: { min: 230, max: 234, score: 72 },
          J: { min: 225, max: 229, score: 70 },
          K: { min: 220, max: 224, score: 68 },
          L: { min: 215, max: 219, score: 66 },
          M: { min: 210, max: 214, score: 64 },
          N: { min: 205, max: 209, score: 62 },
          O: { min: 200, max: 204, score: 60 },
          P: { min: 195, max: 199, score: 50 },
          Q: { min: 190, max: 194, score: 40 },
          R: { min: 185, max: 189, score: 30 },
          S: { min: 180, max: 184, score: 20 },
          T: { min: 175, max: 179, score: 10 },
          U: { max: 174, score: 0 },
        },
      },
      female: {
        grade1: {
          A: { min: 204, score: 100 },
          B: { min: 198, max: 203, score: 95 },
          C: { min: 192, max: 197, score: 90 },
          D: { min: 185, max: 191, score: 85 },
          E: { min: 178, max: 184, score: 80 },
          F: { min: 175, max: 177, score: 78 },
          G: { min: 172, max: 174, score: 76 },
          H: { min: 169, max: 171, score: 74 },
          I: { min: 166, max: 168, score: 72 },
          J: { min: 163, max: 165, score: 70 },
          K: { min: 160, max: 162, score: 68 },
          L: { min: 157, max: 159, score: 66 },
          M: { min: 154, max: 156, score: 64 },
          N: { min: 151, max: 153, score: 62 },
          O: { min: 148, max: 150, score: 60 },
          P: { min: 143, max: 147, score: 50 },
          Q: { min: 138, max: 142, score: 40 },
          R: { min: 133, max: 137, score: 30 },
          S: { min: 128, max: 132, score: 20 },
          T: { min: 123, max: 127, score: 10 },
          U: { max: 122, score: 0 },
        },
        grade2: {
          A: { min: 209, score: 100 },
          B: { min: 204, max: 208, score: 95 },
          C: { min: 199, max: 203, score: 90 },
          D: { min: 190, max: 198, score: 85 },
          E: { min: 181, max: 189, score: 80 },
          F: { min: 176, max: 180, score: 78 },
          G: { min: 171, max: 175, score: 76 },
          H: { min: 166, max: 170, score: 74 },
          I: { min: 161, max: 165, score: 72 },
          J: { min: 156, max: 160, score: 70 },
          K: { min: 151, max: 155, score: 68 },
          L: { min: 146, max: 150, score: 66 },
          M: { min: 141, max: 145, score: 64 },
          N: { min: 136, max: 140, score: 62 },
          O: { min: 131, max: 135, score: 60 },
          P: { min: 126, max: 130, score: 50 },
          Q: { min: 121, max: 125, score: 40 },
          R: { min: 116, max: 120, score: 30 },
          S: { min: 111, max: 115, score: 20 },
          T: { min: 106, max: 110, score: 10 },
          U: { max: 105, score: 0 },
        },
        grade3: {
          A: { min: 211, score: 100 },
          B: { min: 206, max: 210, score: 95 },
          C: { min: 201, max: 205, score: 90 },
          D: { min: 192, max: 200, score: 85 },
          E: { min: 183, max: 191, score: 80 },
          F: { min: 178, max: 182, score: 78 },
          G: { min: 173, max: 177, score: 76 },
          H: { min: 168, max: 172, score: 74 },
          I: { min: 163, max: 167, score: 72 },
          J: { min: 158, max: 162, score: 70 },
          K: { min: 153, max: 157, score: 68 },
          L: { min: 148, max: 152, score: 66 },
          M: { min: 143, max: 147, score: 64 },
          N: { min: 138, max: 142, score: 62 },
          O: { min: 133, max: 137, score: 60 },
          P: { min: 128, max: 132, score: 50 },
          Q: { min: 123, max: 127, score: 40 },
          R: { min: 118, max: 122, score: 30 },
          S: { min: 113, max: 117, score: 20 },
          T: { min: 108, max: 112, score: 10 },
          U: { max: 107, score: 0 },
        },
      },
    },
  },
  {
    itemCode: 'sit_reach',
    itemName: '坐位体前屈',
    itemUnit: 'cm',
    genderLimit: null,
    isRequired: true,
    sortOrder: 7,
    weight: 10,
    validationRules: {
      min: -20,
      max: 50,
      decimals: 1,
    },
    scoringStandard: {
      description: '坐位体前屈距离',
      type: 'numeric',
      male: {
        grade1: {
          A: { min: 23.6, score: 100 },
          B: { min: 21.5, max: 23.5, score: 95 },
          C: { min: 19.4, max: 21.4, score: 90 },
          D: { min: 17.2, max: 19.3, score: 85 },
          E: { min: 15.0, max: 17.1, score: 80 },
          F: { min: 13.6, max: 14.9, score: 78 },
          G: { min: 12.2, max: 13.5, score: 76 },
          H: { min: 10.8, max: 12.1, score: 74 },
          I: { min: 9.4, max: 10.7, score: 72 },
          J: { min: 8.0, max: 9.3, score: 70 },
          K: { min: 6.6, max: 7.9, score: 68 },
          L: { min: 5.2, max: 6.5, score: 66 },
          M: { min: 3.8, max: 5.1, score: 64 },
          N: { min: 2.4, max: 3.7, score: 62 },
          O: { min: 1.0, max: 2.3, score: 60 },
          P: { min: 0.0, max: 0.9, score: 50 },
          Q: { min: -1.0, max: -0.1, score: 40 },
          R: { min: -2.0, max: -1.1, score: 30 },
          S: { min: -3.0, max: -2.1, score: 20 },
          T: { min: -4.0, max: -3.1, score: 10 },
          U: { max: -4.1, score: 0 },
        },
        grade2: {
          A: { min: 24.3, score: 100 },
          B: { min: 22.4, max: 24.2, score: 95 },
          C: { min: 20.5, max: 22.3, score: 90 },
          D: { min: 18.3, max: 20.4, score: 85 },
          E: { min: 16.1, max: 18.2, score: 80 },
          F: { min: 14.7, max: 16.0, score: 78 },
          G: { min: 13.3, max: 14.6, score: 76 },
          H: { min: 11.9, max: 13.2, score: 74 },
          I: { min: 10.5, max: 11.8, score: 72 },
          J: { min: 9.1, max: 10.4, score: 70 },
          K: { min: 7.7, max: 9.0, score: 68 },
          L: { min: 6.3, max: 7.6, score: 66 },
          M: { min: 4.9, max: 6.2, score: 64 },
          N: { min: 3.5, max: 4.8, score: 62 },
          O: { min: 2.1, max: 3.4, score: 60 },
          P: { min: 1.1, max: 2.0, score: 50 },
          Q: { min: 0.1, max: 1.0, score: 40 },
          R: { min: -0.9, max: 0.0, score: 30 },
          S: { min: -1.9, max: -1.0, score: 20 },
          T: { min: -2.9, max: -2.0, score: 10 },
          U: { max: -3.0, score: 0 },
        },
        grade3: {
          A: { min: 25.0, score: 100 },
          B: { min: 23.3, max: 24.9, score: 95 },
          C: { min: 21.6, max: 23.2, score: 90 },
          D: { min: 19.4, max: 21.5, score: 85 },
          E: { min: 17.2, max: 19.3, score: 80 },
          F: { min: 15.8, max: 17.1, score: 78 },
          G: { min: 14.4, max: 15.7, score: 76 },
          H: { min: 13.0, max: 14.3, score: 74 },
          I: { min: 11.6, max: 12.9, score: 72 },
          J: { min: 10.2, max: 11.5, score: 70 },
          K: { min: 8.8, max: 10.1, score: 68 },
          L: { min: 7.4, max: 8.7, score: 66 },
          M: { min: 6.0, max: 7.3, score: 64 },
          N: { min: 4.6, max: 5.9, score: 62 },
          O: { min: 3.2, max: 4.5, score: 60 },
          P: { min: 2.2, max: 3.1, score: 50 },
          Q: { min: 1.2, max: 2.1, score: 40 },
          R: { min: 0.2, max: 1.1, score: 30 },
          S: { min: -0.8, max: 0.1, score: 20 },
          T: { min: -1.8, max: -0.9, score: 10 },
          U: { max: -1.9, score: 0 },
        },
      },
      female: {
        grade1: {
          A: { min: 24.2, score: 100 },
          B: { min: 22.5, max: 24.1, score: 95 },
          C: { min: 20.8, max: 22.4, score: 90 },
          D: { min: 19.1, max: 20.7, score: 85 },
          E: { min: 17.4, max: 19.0, score: 80 },
          F: { min: 16.1, max: 17.3, score: 78 },
          G: { min: 14.8, max: 16.0, score: 76 },
          H: { min: 13.5, max: 14.7, score: 74 },
          I: { min: 12.2, max: 13.4, score: 72 },
          J: { min: 10.9, max: 12.1, score: 70 },
          K: { min: 9.6, max: 10.8, score: 68 },
          L: { min: 8.3, max: 9.5, score: 66 },
          M: { min: 7.0, max: 8.2, score: 64 },
          N: { min: 5.7, max: 6.9, score: 62 },
          O: { min: 4.4, max: 5.6, score: 60 },
          P: { min: 3.6, max: 4.3, score: 50 },
          Q: { min: 2.8, max: 3.5, score: 40 },
          R: { min: 2.0, max: 2.7, score: 30 },
          S: { min: 1.2, max: 1.9, score: 20 },
          T: { min: 0.4, max: 1.1, score: 10 },
          U: { max: 0.3, score: 0 },
        },
        grade2: {
          A: { min: 25.2, score: 100 },
          B: { min: 23.4, max: 25.1, score: 95 },
          C: { min: 21.6, max: 23.3, score: 90 },
          D: { min: 19.4, max: 21.5, score: 85 },
          E: { min: 17.2, max: 19.3, score: 80 },
          F: { min: 15.8, max: 17.1, score: 78 },
          G: { min: 14.4, max: 15.7, score: 76 },
          H: { min: 13.0, max: 14.3, score: 74 },
          I: { min: 11.6, max: 12.9, score: 72 },
          J: { min: 10.2, max: 11.5, score: 70 },
          K: { min: 8.8, max: 10.1, score: 68 },
          L: { min: 7.4, max: 8.7, score: 66 },
          M: { min: 6.0, max: 7.3, score: 64 },
          N: { min: 4.6, max: 5.9, score: 62 },
          O: { min: 3.2, max: 4.5, score: 60 },
          P: { min: 2.2, max: 3.1, score: 50 },
          Q: { min: 1.2, max: 2.1, score: 40 },
          R: { min: 0.2, max: 1.1, score: 30 },
          S: { min: -0.8, max: 0.1, score: 20 },
          T: { min: -1.8, max: -0.9, score: 10 },
          U: { max: -1.9, score: 0 },
        },
        grade3: {
          A: { min: 25.9, score: 100 },
          B: { min: 24.3, max: 25.8, score: 95 },
          C: { min: 22.7, max: 24.2, score: 90 },
          D: { min: 20.5, max: 22.6, score: 85 },
          E: { min: 18.3, max: 20.4, score: 80 },
          F: { min: 16.9, max: 18.2, score: 78 },
          G: { min: 15.5, max: 16.8, score: 76 },
          H: { min: 14.1, max: 15.4, score: 74 },
          I: { min: 12.7, max: 14.0, score: 72 },
          J: { min: 11.3, max: 12.6, score: 70 },
          K: { min: 9.9, max: 11.2, score: 68 },
          L: { min: 8.5, max: 9.8, score: 66 },
          M: { min: 7.1, max: 8.4, score: 64 },
          N: { min: 5.7, max: 7.0, score: 62 },
          O: { min: 4.3, max: 5.6, score: 60 },
          P: { min: 3.3, max: 4.2, score: 50 },
          Q: { min: 2.3, max: 3.2, score: 40 },
          R: { min: 1.3, max: 2.2, score: 30 },
          S: { min: 0.3, max: 1.2, score: 20 },
          T: { min: -0.7, max: 0.2, score: 10 },
          U: { max: -0.8, score: 0 },
        },
      },
    },
  },
  {
    itemCode: 'situp_1min',
    itemName: '仰卧起坐(1分钟)',
    itemUnit: '次',
    genderLimit: 'female',
    isRequired: true,
    sortOrder: 8,
    weight: 10,
    validationRules: {
      min: 0,
      max: 100,
      decimals: 0,
    },
    scoringStandard: {
      description: '仰卧起坐1分钟次数(仅女生)',
      type: 'numeric',
      female: {
        grade1: {
          A: { min: 53, score: 100 },
          B: { min: 51, max: 52, score: 95 },
          C: { min: 49, max: 50, score: 90 },
          D: { min: 46, max: 48, score: 85 },
          E: { min: 43, max: 45, score: 80 },
          F: { min: 41, max: 42, score: 78 },
          G: { min: 39, max: 40, score: 76 },
          H: { min: 37, max: 38, score: 74 },
          I: { min: 35, max: 36, score: 72 },
          J: { min: 33, max: 34, score: 70 },
          K: { min: 31, max: 32, score: 68 },
          L: { min: 29, max: 30, score: 66 },
          M: { min: 27, max: 28, score: 64 },
          N: { min: 25, max: 26, score: 62 },
          O: { min: 23, max: 24, score: 60 },
          P: { min: 21, max: 22, score: 50 },
          Q: { min: 19, max: 20, score: 40 },
          R: { min: 17, max: 18, score: 30 },
          S: { min: 15, max: 16, score: 20 },
          T: { min: 13, max: 14, score: 10 },
          U: { max: 12, score: 0 },
        },
        grade2: {
          A: { min: 57, score: 100 },
          B: { min: 55, max: 56, score: 95 },
          C: { min: 53, max: 54, score: 90 },
          D: { min: 50, max: 52, score: 85 },
          E: { min: 47, max: 49, score: 80 },
          F: { min: 45, max: 46, score: 78 },
          G: { min: 43, max: 44, score: 76 },
          H: { min: 41, max: 42, score: 74 },
          I: { min: 39, max: 40, score: 72 },
          J: { min: 37, max: 38, score: 70 },
          K: { min: 35, max: 36, score: 68 },
          L: { min: 33, max: 34, score: 66 },
          M: { min: 31, max: 32, score: 64 },
          N: { min: 29, max: 30, score: 62 },
          O: { min: 27, max: 28, score: 60 },
          P: { min: 25, max: 26, score: 50 },
          Q: { min: 23, max: 24, score: 40 },
          R: { min: 21, max: 22, score: 30 },
          S: { min: 19, max: 20, score: 20 },
          T: { min: 17, max: 18, score: 10 },
          U: { max: 16, score: 0 },
        },
        grade3: {
          A: { min: 58, score: 100 },
          B: { min: 56, max: 57, score: 95 },
          C: { min: 54, max: 55, score: 90 },
          D: { min: 51, max: 53, score: 85 },
          E: { min: 48, max: 50, score: 80 },
          F: { min: 46, max: 47, score: 78 },
          G: { min: 44, max: 45, score: 76 },
          H: { min: 42, max: 43, score: 74 },
          I: { min: 40, max: 41, score: 72 },
          J: { min: 38, max: 39, score: 70 },
          K: { min: 36, max: 37, score: 68 },
          L: { min: 34, max: 35, score: 66 },
          M: { min: 32, max: 33, score: 64 },
          N: { min: 30, max: 31, score: 62 },
          O: { min: 28, max: 29, score: 60 },
          P: { min: 26, max: 27, score: 50 },
          Q: { min: 24, max: 25, score: 40 },
          R: { min: 22, max: 23, score: 30 },
          S: { min: 20, max: 21, score: 20 },
          T: { min: 18, max: 19, score: 10 },
          U: { max: 17, score: 0 },
        },
      },
    },
  },
  {
    itemCode: 'pullup',
    itemName: '引体向上',
    itemUnit: '次',
    genderLimit: 'male',
    isRequired: true,
    sortOrder: 9,
    weight: 10,
    validationRules: {
      min: 0,
      max: 50,
      decimals: 0,
    },
    scoringStandard: {
      description: '引体向上次数(仅男生)',
      type: 'numeric',
      male: {
        grade1: {
          A: { min: 16, score: 100 },
          B: { min: 15, max: 15, score: 95 },
          C: { min: 14, max: 14, score: 90 },
          D: { min: 13, max: 13, score: 85 },
          E: { min: 12, max: 12, score: 80 },
          F: { min: 11, max: 11, score: 76 },
          G: { min: 10, max: 10, score: 72 },
          H: { min: 9, max: 9, score: 68 },
          I: { min: 8, max: 8, score: 64 },
          J: { min: 7, max: 7, score: 60 },
          K: { min: 6, max: 6, score: 50 },
          L: { min: 5, max: 5, score: 40 },
          M: { min: 4, max: 4, score: 30 },
          N: { min: 3, max: 3, score: 20 },
          O: { min: 2, max: 2, score: 10 },
          P: { max: 1, score: 0 },
        },
        grade2: {
          A: { min: 18, score: 100 },
          B: { min: 17, max: 17, score: 95 },
          C: { min: 16, max: 16, score: 90 },
          D: { min: 15, max: 15, score: 85 },
          E: { min: 14, max: 14, score: 80 },
          F: { min: 13, max: 13, score: 78 },
          G: { min: 12, max: 12, score: 76 },
          H: { min: 11, max: 11, score: 74 },
          I: { min: 10, max: 10, score: 72 },
          J: { min: 9, max: 9, score: 70 },
          K: { min: 8, max: 8, score: 68 },
          L: { min: 7, max: 7, score: 66 },
          M: { min: 6, max: 6, score: 64 },
          N: { min: 5, max: 5, score: 62 },
          O: { min: 4, max: 4, score: 60 },
          P: { min: 3, max: 3, score: 50 },
          Q: { min: 2, max: 2, score: 40 },
          R: { min: 1, max: 1, score: 30 },
          S: { min: 1, max: 1, score: 20 },
          T: { min: 1, max: 1, score: 10 },
          U: { max: 0, score: 0 },
        },
        grade3: {
          A: { min: 19, score: 100 },
          B: { min: 18, max: 18, score: 95 },
          C: { min: 17, max: 17, score: 90 },
          D: { min: 16, max: 16, score: 85 },
          E: { min: 15, max: 15, score: 80 },
          F: { min: 14, max: 14, score: 78 },
          G: { min: 13, max: 13, score: 76 },
          H: { min: 12, max: 12, score: 74 },
          I: { min: 11, max: 11, score: 72 },
          J: { min: 10, max: 10, score: 70 },
          K: { min: 9, max: 9, score: 68 },
          L: { min: 8, max: 8, score: 66 },
          M: { min: 7, max: 7, score: 64 },
          N: { min: 6, max: 6, score: 62 },
          O: { min: 5, max: 5, score: 60 },
          P: { min: 4, max: 4, score: 50 },
          Q: { min: 3, max: 3, score: 40 },
          R: { min: 2, max: 2, score: 30 },
          S: { min: 1, max: 1, score: 20 },
          T: { min: 1, max: 1, score: 10 },
          U: { max: 0, score: 0 },
        },
      },
    },
  },
  {
    itemCode: 'run_800m',
    itemName: '800米跑',
    itemUnit: '分秒',
    genderLimit: 'female',
    isRequired: true,
    sortOrder: 10,
    weight: 20,
    validationRules: {
      min: 120,
      max: 600,
      decimals: 2,
    },
    scoringStandard: {
      description: '800米跑成绩(仅女生)',
      type: 'time',
      note: '成绩越小越好',
      female: {
        grade1: {
          A: { max: 204, score: 100 }, // 3'24"
          B: { min: 205, max: 210, score: 95 }, // 3'30"
          C: { min: 211, max: 216, score: 90 }, // 3'36"
          D: { min: 217, max: 223, score: 85 }, // 3'43"
          E: { min: 224, max: 230, score: 80 }, // 3'50"
          F: { min: 231, max: 235, score: 78 }, // 3'55"
          G: { min: 236, max: 240, score: 76 }, // 4'00"
          H: { min: 241, max: 245, score: 74 }, // 4'05"
          I: { min: 246, max: 250, score: 72 }, // 4'10"
          J: { min: 251, max: 255, score: 70 }, // 4'15"
          K: { min: 256, max: 260, score: 68 }, // 4'20"
          L: { min: 261, max: 265, score: 66 }, // 4'25"
          M: { min: 266, max: 270, score: 64 }, // 4'30"
          N: { min: 271, max: 275, score: 62 }, // 4'35"
          O: { min: 276, max: 280, score: 60 }, // 4'40"
          P: { min: 281, max: 290, score: 50 }, // 4'50"
          Q: { min: 291, max: 300, score: 40 }, // 5'00"
          R: { min: 301, max: 310, score: 30 }, // 5'10"
          S: { min: 311, max: 320, score: 20 }, // 5'20"
          T: { min: 321, max: 330, score: 10 }, // 5'30"
          U: { min: 331, score: 0 }, // 超过最大时间
        },
        grade2: {
          A: { max: 202, score: 100 }, // 3'22"
          B: { min: 203, max: 206, score: 95 }, // 3'26"
          C: { min: 207, max: 212, score: 90 }, // 3'32"
          D: { min: 213, max: 219, score: 85 }, // 3'39"
          E: { min: 220, max: 226, score: 80 }, // 3'46"
          F: { min: 227, max: 228, score: 78 }, // 3'48"
          G: { min: 229, max: 236, score: 76 }, // 3'56"
          H: { min: 237, max: 241, score: 74 }, // 4'01"
          I: { min: 242, max: 246, score: 72 }, // 4'06"
          J: { min: 247, max: 249, score: 70 }, // 4'09"
          K: { min: 250, max: 256, score: 68 }, // 4'16"
          L: { min: 257, max: 261, score: 66 }, // 4'21"
          M: { min: 262, max: 266, score: 64 }, // 4'26"
          N: { min: 267, max: 271, score: 62 }, // 4'31"
          O: { min: 272, max: 276, score: 60 }, // 4'36"
          P: { min: 277, max: 286, score: 50 }, // 4'46"
          Q: { min: 287, max: 298, score: 40 }, // 4'58"
          R: { min: 299, max: 308, score: 30 }, // 5'08"
          S: { min: 309, max: 318, score: 20 }, // 5'18"
          T: { min: 319, max: 328, score: 10 }, // 5'28"
          U: { min: 329, score: 0 }, // 超过最大时间
        },
        grade3: {
          A: { max: 200, score: 100 }, // 3'20"
          B: { min: 201, max: 204, score: 95 }, // 3'24"
          C: { min: 205, max: 210, score: 90 }, // 3'30"
          D: { min: 211, max: 217, score: 85 }, // 3'37"
          E: { min: 218, max: 224, score: 80 }, // 3'44"
          F: { min: 225, max: 226, score: 78 }, // 3'46"
          G: { min: 227, max: 234, score: 76 }, // 3'54"
          H: { min: 235, max: 239, score: 74 }, // 3'59"
          I: { min: 240, max: 244, score: 72 }, // 4'04"
          J: { min: 245, max: 247, score: 70 }, // 4'07"
          K: { min: 248, max: 254, score: 68 }, // 4'14"
          L: { min: 255, max: 259, score: 66 }, // 4'19"
          M: { min: 260, max: 264, score: 64 }, // 4'24"
          N: { min: 265, max: 269, score: 62 }, // 4'29"
          O: { min: 270, max: 274, score: 60 }, // 4'34"
          P: { min: 275, max: 284, score: 50 }, // 4'44"
          Q: { min: 285, max: 296, score: 40 }, // 4'56"
          R: { min: 297, max: 306, score: 30 }, // 5'06"
          S: { min: 307, max: 316, score: 20 }, // 5'16"
          T: { min: 317, max: 326, score: 10 }, // 5'26"
          U: { min: 327, score: 0 }, // 超过最大时间
        },
      },
    },
  },
  {
    itemCode: 'run_1000m',
    itemName: '1000米跑',
    itemUnit: '分秒',
    genderLimit: 'male',
    isRequired: true,
    sortOrder: 11,
    weight: 20,
    validationRules: {
      min: 150,
      max: 800,
      decimals: 2,
    },
    scoringStandard: {
      description: '1000米跑成绩(仅男生)',
      type: 'time',
      note: '成绩越小越好',
      male: {
        grade1: {
          A: { max: 210, score: 100 }, // 3'30"
          B: { min: 211, max: 215, score: 95 }, // 3'35"
          C: { min: 216, max: 220, score: 90 }, // 3'40"
          D: { min: 221, max: 227, score: 85 }, // 3'47"
          E: { min: 228, max: 235, score: 80 }, // 3'55"
          F: { min: 236, max: 240, score: 78 }, // 4'00"  
          G: { min: 241, max: 245, score: 76 }, // 4'05"
          H: { min: 246, max: 250, score: 74 }, // 4'10"
          I: { min: 251, max: 255, score: 72 }, // 4'15"
          J: { min: 256, max: 260, score: 70 }, // 4'20"
          K: { min: 261, max: 265, score: 68 }, // 4'25"
          L: { min: 266, max: 270, score: 66 }, // 4'30"
          M: { min: 271, max: 275, score: 64 }, // 4'35"
          N: { min: 276, max: 280, score: 62 }, // 4'40"
          O: { min: 281, max: 285, score: 60 }, // 4'45"
          P: { min: 286, max: 305, score: 50 }, // 5'05"
          Q: { min: 306, max: 320, score: 40 }, // 5'20"
          R: { min: 321, max: 345, score: 30 }, // 5'45"
          S: { min: 346, max: 385, score: 20 }, // 6'25"
          T: { min: 386, max: 420, score: 10 }, // 7'00"
          U: { min: 421, score: 0 }, // 超过最大时间
        },
        grade2: {
          A: { max: 205, score: 100 }, // 3'25"
          B: { min: 206, max: 210, score: 95 }, // 3'30"
          C: { min: 211, max: 215, score: 90 }, // 3'35"
          D: { min: 216, max: 222, score: 85 }, // 3'42"
          E: { min: 223, max: 230, score: 80 }, // 3'50"
          F: { min: 231, max: 235, score: 78 }, // 3'55"
          G: { min: 236, max: 240, score: 76 }, // 4'00"
          H: { min: 241, max: 245, score: 74 }, // 4'05"
          I: { min: 246, max: 250, score: 72 }, // 4'10"
          J: { min: 251, max: 255, score: 70 }, // 4'15"
          K: { min: 256, max: 260, score: 68 }, // 4'20"
          L: { min: 261, max: 265, score: 66 }, // 4'25"
          M: { min: 266, max: 270, score: 64 }, // 4'30"
          N: { min: 271, max: 275, score: 62 }, // 4'35"
          O: { min: 276, max: 280, score: 60 }, // 4'40"
          P: { min: 281, max: 300, score: 50 }, // 5'00"
          Q: { min: 301, max: 315, score: 40 }, // 5'15"
          R: { min: 316, max: 335, score: 30 }, // 5'35"
          S: { min: 336, max: 380, score: 20 }, // 6'20"
          T: { min: 381, max: 415, score: 10 }, // 6'55"
          U: { min: 416, score: 0 }, // 超过最大时间
        },
        grade3: {
          A: { max: 200, score: 100 }, // 3'20"
          B: { min: 201, max: 205, score: 95 }, // 3'25"
          C: { min: 206, max: 210, score: 90 }, // 3'30"
          D: { min: 211, max: 217, score: 85 }, // 3'37"
          E: { min: 218, max: 225, score: 80 }, // 3'45"
          F: { min: 226, max: 230, score: 78 }, // 3'50"
          G: { min: 231, max: 235, score: 76 }, // 3'55"
          H: { min: 236, max: 240, score: 74 }, // 4'00"
          I: { min: 241, max: 245, score: 72 }, // 4'05"
          J: { min: 246, max: 250, score: 70 }, // 4'10"
          K: { min: 251, max: 255, score: 68 }, // 4'15"
          L: { min: 256, max: 260, score: 66 }, // 4'20"
          M: { min: 261, max: 265, score: 64 }, // 4'25"
          N: { min: 266, max: 270, score: 62 }, // 4'30"
          O: { min: 271, max: 275, score: 60 }, // 4'35"
          P: { min: 276, max: 295, score: 50 }, // 4'55"
          Q: { min: 296, max: 310, score: 40 }, // 5'10"
          R: { min: 311, max: 330, score: 30 }, // 5'30"
          S: { min: 331, max: 375, score: 20 }, // 6'15"
          T: { min: 376, max: 410, score: 10 }, // 6'50"
          U: { min: 411, score: 0 }, // 超过最大时间
        },
      },
    },
  },
];
