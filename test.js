// test file for jcomp.pl

var ret = 0;
/*
var nums = [1, 3, 5, 1, 5, 4, 2];
*/
var nums = [4, 5, 6];
for (var i = nums.length -1; i >= 0; --i)
  ret += nums[i];
ret /= nums.length;

console.log(ret);