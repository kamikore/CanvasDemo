/**
 * 生成指定范围内指定间隔的数组序列
 * @param {Number} start 最小值
 * @param {Number} end 最大值
 * @param {Number} step 步长
 * @param {Number} digits 精确到小数位
 * @returns {String[]} 返回值为字符类型数组
 */
function rangeArray(start, end, step, digits = 0){
	return Array.from({ length: (end - start) / step + 1 }, (_, i) => (start + i * step).toFixed(digits));
}


export {
	rangeArray,
}