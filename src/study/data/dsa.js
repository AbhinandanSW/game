// DSA data — merges detailed problems (with test cases) into the big catalog
// The catalog (dsa-catalog.js) has 250+ problems with rich tags.
// This file enriches specific problems with full descriptions + test cases.

import { ALL_DSA as CATALOG, CURATED_LISTS, PATTERNS, TIERS } from "./dsa-catalog";

// Detailed problems — name → extra data
const DETAILED = {
  "Two Sum": {
    desc: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 9" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists."],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // your code here\n  \n}`,
      python: `def two_sum(nums, target):\n    pass`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) { return new int[]{}; }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) { return {}; }\n};`,
    },
    testCases: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
    ],
    fnName: "twoSum",
  },
  "Valid Parentheses": {
    desc: "Given a string s containing just '(){}[]', determine if valid.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 <= s.length <= 10^4"],
    starterCode: {
      javascript: `function isValid(s) {\n  \n}`,
      python: `def is_valid(s): pass`,
      java: `class Solution { public boolean isValid(String s) { return false; } }`,
      cpp: `class Solution { public: bool isValid(string s) { return false; } };`,
    },
    testCases: [
      { args: ["()"], expected: true },
      { args: ["()[]{}"], expected: true },
      { args: ["(]"], expected: false },
      { args: ["([])"], expected: true },
      { args: ["((("], expected: false },
    ],
    fnName: "isValid",
  },
  "Maximum Subarray (Kadane's)": {
    desc: "Given nums, find the contiguous subarray with largest sum. Kadane's algorithm.",
    examples: [{ input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6" }],
    starterCode: {
      javascript: `function maxSubArray(nums) {\n  \n}`,
      python: `def max_sub_array(nums): pass`,
      java: `public int maxSubArray(int[] nums) { return 0; }`,
      cpp: `int maxSubArray(vector<int>& nums) { return 0; }`,
    },
    testCases: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1 },
      { args: [[5, 4, -1, 7, 8]], expected: 23 },
    ],
    fnName: "maxSubArray",
  },
  "Climbing Stairs": {
    desc: "Staircase of n steps; 1 or 2 steps at a time. How many distinct ways? (Fibonacci)",
    examples: [{ input: "n = 3", output: "3" }],
    starterCode: {
      javascript: `function climbStairs(n) {\n  \n}`,
      python: `def climb_stairs(n): pass`,
    },
    testCases: [
      { args: [1], expected: 1 },
      { args: [2], expected: 2 },
      { args: [5], expected: 8 },
      { args: [10], expected: 89 },
    ],
    fnName: "climbStairs",
  },
  "Container With Most Water": {
    desc: "Find two lines that form a container with most water. Two pointers — move the shorter.",
    starterCode: { javascript: `function maxArea(height) {\n  \n}` },
    testCases: [
      { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
      { args: [[1, 1]], expected: 1 },
      { args: [[4, 3, 2, 1, 4]], expected: 16 },
    ],
    fnName: "maxArea",
  },
  "3Sum": {
    desc: "Return all unique triplets that sum to zero. Sort, fix one, two pointer for rest.",
    starterCode: { javascript: `function threeSum(nums) {\n  \n}` },
    testCases: [
      { args: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]], cmp: "set" },
      { args: [[0, 1, 1]], expected: [] },
      { args: [[0, 0, 0]], expected: [[0, 0, 0]] },
    ],
    fnName: "threeSum",
  },
  "Group Anagrams": {
    desc: "Group anagrams. Use sorted string as key.",
    starterCode: { javascript: `function groupAnagrams(strs) {\n  \n}` },
    testCases: [
      { args: [["eat", "tea", "tan", "ate", "nat", "bat"]], expected: [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]], cmp: "grouped" },
      { args: [[""]], expected: [[""]] },
      { args: [["a"]], expected: [["a"]] },
    ],
    fnName: "groupAnagrams",
  },
  "Longest Substring Without Repeating Characters": {
    desc: "Find length of longest substring without repeats. Sliding window.",
    starterCode: { javascript: `function lengthOfLongestSubstring(s) {\n  \n}` },
    testCases: [
      { args: ["abcabcbb"], expected: 3 },
      { args: ["bbbbb"], expected: 1 },
      { args: ["pwwkew"], expected: 3 },
      { args: [""], expected: 0 },
    ],
    fnName: "lengthOfLongestSubstring",
  },
  "Number of Islands": {
    desc: '2D grid of "1"s (land) and "0"s (water). Count islands.',
    starterCode: { javascript: `function numIslands(grid) {\n  \n}` },
    testCases: [
      { args: [[["1", "1", "0"], ["0", "1", "0"], ["0", "0", "1"]]], expected: 2 },
      { args: [[["1", "1", "1"], ["1", "1", "1"], ["1", "1", "1"]]], expected: 1 },
      { args: [[["0"]]], expected: 0 },
    ],
    fnName: "numIslands",
  },
  "Merge Intervals": {
    desc: "Merge overlapping intervals.",
    starterCode: { javascript: `function merge(intervals) {\n  \n}` },
    testCases: [
      { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { args: [[[1, 4], [2, 3]]], expected: [[1, 4]] },
    ],
    fnName: "merge",
  },
  "Product of Array Except Self": {
    desc: "Return array where answer[i] = product of all except nums[i]. No division.",
    starterCode: { javascript: `function productExceptSelf(nums) {\n  \n}` },
    testCases: [
      { args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
    ],
    fnName: "productExceptSelf",
  },
  "Coin Change": {
    desc: "Fewest number of coins to make amount. -1 if impossible.",
    starterCode: { javascript: `function coinChange(coins, amount) {\n  \n}` },
    testCases: [
      { args: [[1, 2, 5], 11], expected: 3 },
      { args: [[2], 3], expected: -1 },
      { args: [[1], 0], expected: 0 },
    ],
    fnName: "coinChange",
  },
  "Best Time to Buy and Sell Stock": {
    desc: "Single buy + single sell, max profit.",
    starterCode: { javascript: `function maxProfit(prices) {\n  \n}` },
    testCases: [
      { args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { args: [[7, 6, 4, 3, 1]], expected: 0 },
    ],
    fnName: "maxProfit",
  },
  "Valid Anagram": {
    desc: "Check if t is an anagram of s.",
    starterCode: { javascript: `function isAnagram(s, t) {\n  \n}` },
    testCases: [
      { args: ["anagram", "nagaram"], expected: true },
      { args: ["rat", "car"], expected: false },
      { args: ["", ""], expected: true },
    ],
    fnName: "isAnagram",
  },
  "Contains Duplicate": {
    desc: "Return true if any value appears at least twice.",
    starterCode: { javascript: `function containsDuplicate(nums) {\n  \n}` },
    testCases: [
      { args: [[1, 2, 3, 1]], expected: true },
      { args: [[1, 2, 3, 4]], expected: false },
      { args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
    ],
    fnName: "containsDuplicate",
  },
  "Valid Palindrome": {
    desc: "Is s a palindrome considering only alphanumeric? Case-insensitive.",
    starterCode: { javascript: `function isPalindrome(s) {\n  \n}` },
    testCases: [
      { args: ["A man, a plan, a canal: Panama"], expected: true },
      { args: ["race a car"], expected: false },
      { args: [" "], expected: true },
    ],
    fnName: "isPalindrome",
  },
  "Merge Two Sorted Lists": {
    desc: "Merge two sorted arrays into one sorted array.",
    starterCode: { javascript: `function mergeTwoLists(l1, l2) {\n  \n}` },
    testCases: [
      { args: [[1, 2, 4], [1, 3, 4]], expected: [1, 1, 2, 3, 4, 4] },
      { args: [[], []], expected: [] },
      { args: [[], [0]], expected: [0] },
    ],
    fnName: "mergeTwoLists",
  },
  "Reverse Linked List": {
    desc: "Reverse a singly linked list (array input/output).",
    starterCode: { javascript: `function reverseList(head) {\n  \n}` },
    testCases: [
      { args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
      { args: [[1, 2]], expected: [2, 1] },
      { args: [[]], expected: [] },
    ],
    fnName: "reverseList",
  },
  "Binary Search": {
    desc: "Classic binary search. Return index of target or -1.",
    starterCode: { javascript: `function search(nums, target) {\n  \n}` },
    testCases: [
      { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { args: [[5], 5], expected: 0 },
    ],
    fnName: "search",
  },
  "Maximum Depth of Binary Tree": {
    desc: "Return max depth of binary tree. Input: level-order array (null for empty).",
    starterCode: { javascript: `// root = level-order array; find max depth\nfunction maxDepth(root) {\n  \n}` },
    testCases: [
      { args: [[3, 9, 20, null, null, 15, 7]], expected: 3 },
      { args: [[1, null, 2]], expected: 2 },
      { args: [[]], expected: 0 },
    ],
    fnName: "maxDepth",
  },
  "House Robber": {
    desc: "Max amount you can rob without robbing adjacent houses.",
    starterCode: { javascript: `function rob(nums) {\n  \n}` },
    testCases: [
      { args: [[1, 2, 3, 1]], expected: 4 },
      { args: [[2, 7, 9, 3, 1]], expected: 12 },
      { args: [[2, 1, 1, 2]], expected: 4 },
    ],
    fnName: "rob",
  },
};

// Enrich catalog with DETAILED when available
export const ALL_DSA = CATALOG.map((p) => {
  const detail = DETAILED[p.n];
  if (!detail) return p;
  return {
    ...p,
    desc: detail.desc || p.desc,
    examples: detail.examples || p.examples,
    constraints: detail.constraints || p.constraints,
    starterCode: { ...p.starterCode, ...(detail.starterCode || {}) },
    testCases: detail.testCases || p.testCases,
    fnName: detail.fnName || p.fnName,
  };
});

export { CURATED_LISTS, PATTERNS, TIERS };
