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
  "Longest Consecutive Sequence": {
    desc: "Given an unsorted array, return length of longest consecutive elements sequence. O(n). Only start counting from seq-start (when n-1 not in set).",
    examples: [{ input: "nums = [100, 4, 200, 1, 3, 2]", output: "4", explanation: "[1,2,3,4]" }],
    starterCode: { javascript: `function longestConsecutive(nums) {\n  \n}` },
    testCases: [
      { args: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
      { args: [[]], expected: 0 },
      { args: [[1]], expected: 1 },
    ],
    fnName: "longestConsecutive",
  },
  "Top K Frequent Elements": {
    desc: "Return k most frequent elements. Bucket sort: index = frequency, value = list of numbers with that frequency.",
    examples: [{ input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]" }],
    starterCode: { javascript: `function topKFrequent(nums, k) {\n  \n}` },
    testCases: [
      { args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2], cmp: "set" },
      { args: [[1], 1], expected: [1] },
      { args: [[4, 1, -1, 2, -1, 2, 3], 2], expected: [-1, 2], cmp: "set" },
    ],
    fnName: "topKFrequent",
  },
  "Subarray Sum Equals K": {
    desc: "Count subarrays summing to k. Use prefix sum + hash map (count of each prefix sum seen).",
    examples: [{ input: "nums = [1,1,1], k = 2", output: "2" }],
    starterCode: { javascript: `function subarraySum(nums, k) {\n  \n}` },
    testCases: [
      { args: [[1, 1, 1], 2], expected: 2 },
      { args: [[1, 2, 3], 3], expected: 2 },
      { args: [[1], 1], expected: 1 },
      { args: [[-1, -1, 1], 0], expected: 1 },
    ],
    fnName: "subarraySum",
  },
  "Rotate Image": {
    desc: "Rotate n x n matrix 90 degrees clockwise, in place. Transpose, then reverse each row.",
    starterCode: { javascript: `function rotate(matrix) {\n  // in-place; return matrix\n  \n  return matrix;\n}` },
    testCases: [
      { args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], expected: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] },
      { args: [[[1]]], expected: [[1]] },
    ],
    fnName: "rotate",
  },
  "Spiral Matrix": {
    desc: "Return all elements of matrix in spiral order (right, down, left, up).",
    starterCode: { javascript: `function spiralOrder(matrix) {\n  \n}` },
    testCases: [
      { args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], expected: [1, 2, 3, 6, 9, 8, 7, 4, 5] },
      { args: [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], expected: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7] },
    ],
    fnName: "spiralOrder",
  },
  "Set Matrix Zeroes": {
    desc: "If element is 0, set entire row and column to 0. In-place, O(1) extra space (use first row/col as markers).",
    starterCode: { javascript: `function setZeroes(matrix) {\n  \n  return matrix;\n}` },
    testCases: [
      { args: [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], expected: [[1, 0, 1], [0, 0, 0], [1, 0, 1]] },
      { args: [[[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]]], expected: [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]] },
    ],
    fnName: "setZeroes",
  },
  "Jump Game": {
    desc: "Greedy. Track max reachable index. If current index > max reachable, return false.",
    examples: [{ input: "nums = [2,3,1,1,4]", output: "true" }, { input: "nums = [3,2,1,0,4]", output: "false" }],
    starterCode: { javascript: `function canJump(nums) {\n  \n}` },
    testCases: [
      { args: [[2, 3, 1, 1, 4]], expected: true },
      { args: [[3, 2, 1, 0, 4]], expected: false },
      { args: [[0]], expected: true },
      { args: [[2, 0, 0]], expected: true },
    ],
    fnName: "canJump",
  },
  "Longest Palindromic Substring": {
    desc: "Try each index (and each gap) as palindrome center, expand outward.",
    starterCode: { javascript: `function longestPalindrome(s) {\n  \n}` },
    testCases: [
      { args: ["babad"], expected: "bab" }, // or "aba"
      { args: ["cbbd"], expected: "bb" },
      { args: ["a"], expected: "a" },
      { args: ["ac"], expected: "a" }, // or "c"
    ],
    fnName: "longestPalindrome",
  },
  "Palindromic Substrings": {
    desc: "Count palindromic substrings. Expand around each center (char + gap).",
    starterCode: { javascript: `function countSubstrings(s) {\n  \n}` },
    testCases: [
      { args: ["abc"], expected: 3 },
      { args: ["aaa"], expected: 6 },
      { args: ["aba"], expected: 4 },
    ],
    fnName: "countSubstrings",
  },
  "Longest Increasing Subsequence": {
    desc: "LIS. Two approaches: O(n²) DP or O(n log n) patience sorting with binary search.",
    examples: [{ input: "nums = [10,9,2,5,3,7,101,18]", output: "4", explanation: "[2,3,7,101]" }],
    starterCode: { javascript: `function lengthOfLIS(nums) {\n  \n}` },
    testCases: [
      { args: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4 },
      { args: [[0, 1, 0, 3, 2, 3]], expected: 4 },
      { args: [[7, 7, 7, 7]], expected: 1 },
    ],
    fnName: "lengthOfLIS",
  },
  "Longest Common Subsequence": {
    desc: "2D DP. If chars match → diagonal + 1; else → max of left, top.",
    starterCode: { javascript: `function longestCommonSubsequence(s1, s2) {\n  \n}` },
    testCases: [
      { args: ["abcde", "ace"], expected: 3 },
      { args: ["abc", "abc"], expected: 3 },
      { args: ["abc", "def"], expected: 0 },
    ],
    fnName: "longestCommonSubsequence",
  },
  "Edit Distance": {
    desc: "Min operations (insert, delete, replace) to convert s1 to s2. 2D DP: dp[i][j] = min edits for first i chars of s1 to first j of s2.",
    starterCode: { javascript: `function minDistance(s1, s2) {\n  \n}` },
    testCases: [
      { args: ["horse", "ros"], expected: 3 },
      { args: ["intention", "execution"], expected: 5 },
      { args: ["", "abc"], expected: 3 },
      { args: ["abc", ""], expected: 3 },
    ],
    fnName: "minDistance",
  },
  "Word Break": {
    desc: "Can s be segmented into dictionary words? DP: dp[i] = true if exists j where dp[j] && s[j..i] in dict.",
    starterCode: { javascript: `function wordBreak(s, wordDict) {\n  \n}` },
    testCases: [
      { args: ["leetcode", ["leet", "code"]], expected: true },
      { args: ["applepenapple", ["apple", "pen"]], expected: true },
      { args: ["catsandog", ["cats", "dog", "sand", "and", "cat"]], expected: false },
    ],
    fnName: "wordBreak",
  },
  "Unique Paths": {
    desc: "m x n grid, start top-left, end bottom-right. Only right/down moves. 2D DP.",
    examples: [{ input: "m=3, n=7", output: "28" }],
    starterCode: { javascript: `function uniquePaths(m, n) {\n  \n}` },
    testCases: [
      { args: [3, 7], expected: 28 },
      { args: [3, 2], expected: 3 },
      { args: [7, 3], expected: 28 },
      { args: [1, 1], expected: 1 },
    ],
    fnName: "uniquePaths",
  },
  "Partition Equal Subset Sum": {
    desc: "Can we partition array into 2 subsets with equal sum? Subset sum = total/2. 0/1 Knapsack variant.",
    starterCode: { javascript: `function canPartition(nums) {\n  \n}` },
    testCases: [
      { args: [[1, 5, 11, 5]], expected: true },
      { args: [[1, 2, 3, 5]], expected: false },
      { args: [[1, 1]], expected: true },
    ],
    fnName: "canPartition",
  },
  "Generate Parentheses": {
    desc: "Generate all valid combinations of n pairs of parens. Backtrack with open/close counts.",
    starterCode: { javascript: `function generateParenthesis(n) {\n  \n}` },
    testCases: [
      { args: [1], expected: ["()"] },
      { args: [2], expected: ["(())", "()()"], cmp: "set" },
      { args: [3], expected: ["((()))", "(()())", "(())()", "()(())", "()()()"], cmp: "set" },
    ],
    fnName: "generateParenthesis",
  },
  "Subsets": {
    desc: "All subsets (power set). Each element: include or exclude. 2^n subsets.",
    starterCode: { javascript: `function subsets(nums) {\n  \n}` },
    testCases: [
      { args: [[1, 2, 3]], expected: [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]], cmp: "set" },
      { args: [[0]], expected: [[], [0]], cmp: "set" },
    ],
    fnName: "subsets",
  },
  "Permutations": {
    desc: "All permutations. Backtrack with used set or swap-based.",
    starterCode: { javascript: `function permute(nums) {\n  \n}` },
    testCases: [
      { args: [[1, 2, 3]], expected: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]], cmp: "set" },
      { args: [[0, 1]], expected: [[0, 1], [1, 0]], cmp: "set" },
      { args: [[1]], expected: [[1]] },
    ],
    fnName: "permute",
  },
  "Combination Sum": {
    desc: "Find all combinations summing to target. Can reuse same element. Backtrack.",
    starterCode: { javascript: `function combinationSum(candidates, target) {\n  \n}` },
    testCases: [
      { args: [[2, 3, 6, 7], 7], expected: [[2, 2, 3], [7]], cmp: "set" },
      { args: [[2, 3, 5], 8], expected: [[2, 2, 2, 2], [2, 3, 3], [3, 5]], cmp: "set" },
      { args: [[2], 1], expected: [] },
    ],
    fnName: "combinationSum",
  },
  "Kth Largest Element in an Array": {
    desc: "Find kth largest. Min-heap of size k, or Quickselect (O(n) avg).",
    starterCode: { javascript: `function findKthLargest(nums, k) {\n  \n}` },
    testCases: [
      { args: [[3, 2, 1, 5, 6, 4], 2], expected: 5 },
      { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], expected: 4 },
    ],
    fnName: "findKthLargest",
  },
  "Longest Repeating Character Replacement": {
    desc: "Longest substring with same char after at most k replacements. Window is valid if (len - maxFreq) <= k.",
    starterCode: { javascript: `function characterReplacement(s, k) {\n  \n}` },
    testCases: [
      { args: ["ABAB", 2], expected: 4 },
      { args: ["AABABBA", 1], expected: 4 },
      { args: ["A", 0], expected: 1 },
    ],
    fnName: "characterReplacement",
  },
  "Encode and Decode Strings": {
    desc: "Serialize list of strings → one string → back. Use prefix length + delimiter.",
    starterCode: { javascript: `function encode(strs) {\n  return strs.map(s => s.length + '#' + s).join('');\n}\nfunction decode(str) {\n  // parse length, read that many chars\n  \n}` },
    testCases: [], // stateful pair — skip automated
    fnName: "decode",
  },
  "Meeting Rooms II": {
    desc: "Min rooms needed so no meetings overlap. Sort by start; use min-heap of end times.",
    starterCode: { javascript: `function minMeetingRooms(intervals) {\n  \n}` },
    testCases: [
      { args: [[[0, 30], [5, 10], [15, 20]]], expected: 2 },
      { args: [[[7, 10], [2, 4]]], expected: 1 },
      { args: [[[9, 10], [4, 9], [4, 17]]], expected: 2 },
    ],
    fnName: "minMeetingRooms",
  },
  "Insert Interval": {
    desc: "Insert new interval into sorted, non-overlapping intervals. Merge as needed. Three phases: before, overlap, after.",
    starterCode: { javascript: `function insert(intervals, newInterval) {\n  \n}` },
    testCases: [
      { args: [[[1, 3], [6, 9]], [2, 5]], expected: [[1, 5], [6, 9]] },
      { args: [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], expected: [[1, 2], [3, 10], [12, 16]] },
    ],
    fnName: "insert",
  },
  "Non-overlapping Intervals": {
    desc: "Min removals to make non-overlapping. Greedy: sort by end, keep earliest-ending.",
    starterCode: { javascript: `function eraseOverlapIntervals(intervals) {\n  \n}` },
    testCases: [
      { args: [[[1, 2], [2, 3], [3, 4], [1, 3]]], expected: 1 },
      { args: [[[1, 2], [1, 2], [1, 2]]], expected: 2 },
      { args: [[[1, 2], [2, 3]]], expected: 0 },
    ],
    fnName: "eraseOverlapIntervals",
  },
  "Single Number": {
    desc: "Every element appears twice except one. XOR all → pairs cancel, answer remains.",
    starterCode: { javascript: `function singleNumber(nums) {\n  \n}` },
    testCases: [
      { args: [[2, 2, 1]], expected: 1 },
      { args: [[4, 1, 2, 1, 2]], expected: 4 },
      { args: [[1]], expected: 1 },
    ],
    fnName: "singleNumber",
  },
  "Number of 1 Bits": {
    desc: "Count 1s in binary of n. Trick: n & (n-1) drops lowest set bit.",
    starterCode: { javascript: `function hammingWeight(n) {\n  \n}` },
    testCases: [
      { args: [11], expected: 3 }, // 1011
      { args: [128], expected: 1 }, // 10000000
      { args: [2147483645], expected: 30 },
    ],
    fnName: "hammingWeight",
  },
  "Counting Bits": {
    desc: "For 0..n, count 1s in binary. DP: bits[i] = bits[i >> 1] + (i & 1).",
    starterCode: { javascript: `function countBits(n) {\n  \n}` },
    testCases: [
      { args: [2], expected: [0, 1, 1] },
      { args: [5], expected: [0, 1, 1, 2, 1, 2] },
    ],
    fnName: "countBits",
  },
  "Missing Number": {
    desc: "Array has n distinct numbers from 0..n (one missing). XOR approach or sum formula.",
    starterCode: { javascript: `function missingNumber(nums) {\n  \n}` },
    testCases: [
      { args: [[3, 0, 1]], expected: 2 },
      { args: [[0, 1]], expected: 2 },
      { args: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], expected: 8 },
    ],
    fnName: "missingNumber",
  },
  "Reverse Bits": {
    desc: "Reverse bits of 32-bit unsigned int.",
    starterCode: { javascript: `function reverseBits(n) {\n  \n}` },
    testCases: [
      { args: [0b00000010100101000001111010011100], expected: 964176192 },
      { args: [0b11111111111111111111111111111101], expected: 3221225471 },
    ],
    fnName: "reverseBits",
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
