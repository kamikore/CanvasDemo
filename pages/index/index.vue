<template>
	<view class="page-container">
		<view class="header">
			<!-- 撤销 -->
			<uni-icons :class="['iconfont', undoStack.length ? '' : 'isDisabled']" type="undo"  @click="undo"></uni-icons>
			<!-- 恢复 -->
			<uni-icons :class="['iconfont', redoStack.length ? '' : 'isDisabled']" type="redo"  @click="redo"></uni-icons>
			<!-- 重置画布 -->
			<uni-icons class="iconfont" type="refresh" @click="reset"></uni-icons>
			<text 
				:class="['iconfont', isActive == 'Eraser' ? 'isActive' : '']" 
				@click="isActive = (isActive == 'Eraser') ? '' : 'Eraser'"
			>&#xe94e;</text>
			<!-- 粗细度 -->
			<Popover :visible="isActive == 'Thickness'">
				<text 
					:class="['iconfont', isActive == 'Thickness' ? 'isActive' : '']"  
					@click="isActive = (isActive == 'Thickness') ? '' : 'Thickness'"
				>&#xe600</text>
				<template #content>
					<view class="thickness">
						<slider 
							class="slider" 
							:value="2" 
							:step="1"
							:min="1"
							:max="40"
							:block-size="20"
							@changing="e => thickness = e.detail.value" 
							@change="e => ctx.setLineWidth(e.detail.value)"
						/>
						<view class="circle" :style="{height: thickness + 'px', width: thickness + 'px'}"></view>
					</view>
				</template>
			</Popover>
			<!-- 调色板 -->
			<Popover :visible="isActive == 'ColorPalette'">
				<uni-icons 
					class="iconfont" 
					type="color" 
					@click="isActive = (isActive == 'ColorPalette') ? '' : 'ColorPalette'"
				></uni-icons>
				<template #content>
					<view class="colorPalette">
						<view
							v-for="(color, index) in colorPalette"
							:key="color"
							:class="[
								'color',
								color == strokeColor ? 'isActive' : '' 
							]" 
							:style="{backgroundColor: color}"
							@click="strokeColor = color"
						></view>
					</view>
				</template>
			</Popover>
			<!-- 文本 -->
			<popover :visible="isActive == 'Text'">
				<uni-icons 
					:class="['iconfont', isActive == 'Text' ? 'isActive' : '']" 
					type="font"
					@click="onTextClick"
				></uni-icons>
				<template #content>
					<view class="textBar">
						<uni-data-select 
							class="select" 
							:localdata="fontSizeRange" 
							:clear="false"
							v-model="fontSize"
							@change="val => ctx.setFontSize(val)"
						/>
						<view class="colorPalette">
							<view
								v-for="(color, index) in colorPalette"
								:key="color"
								:class="[
									'color',
									color == fillColor ? 'isActive' : '' 
								]" 
								:style="{backgroundColor: color}"
								@click="fillColor = color"
							></view>
						</view>
					</view>
				</template>
			</popover>
			<!-- 导出图片 -->
			<uni-icons class="iconfont" type="image" @click="save"></uni-icons>
		</view>
		<canvas 
			style="width: 100%; height: 100%" 
			canvas-id="canvas" 
			class="canvas"
			@touchstart="onTouchstart"
			@touchmove="onTouchmove"
			@touchend="onTouchend"
		>
			<!-- 橡皮擦 -->
			<view 
				v-show="showEraser"
				class="eraser" 
				:style="{
					eraserY: eraserY + 'px', 
					eraserX: eraserX + 'px',
					width: eraserSize + 'px',
					height: eraserSize + 'px'
				}"
			></view>
			<!-- 文本框 -->
			<movable-area v-show="showTextbox" :style="{width: canvasWidth + 'px', height: canvasHeight + 'px'}">
				<movable-view
					:style="{
						width: movableWidth + 'px',
						height: movableHeight + 'px',
					}"
					direction="all"
					:animation="false"
					:x="textboxX"
					:y="textboxY"
					@change="onTextboxMove"
					@touchstart.stop=""
					@touchmove.stop=""
					@touchend.stop=""
				>
					<textarea 
						:value="text" 
						:style="{
							fontSize: fontSize + 'px',
							color: fillColor,
							lineHeight: lineHeight
						}"
						@input="e => text = e.detail.value"
						@linechange="onLineChange"
						focus
						auto-height
					></textarea>
				</movable-view>		
			</movable-area>
		</canvas>
	</view>
</template>

<script setup>
import { onLoad, onReady } from '@dcloudio/uni-app'
import { ref, reactive, watchEffect, computed, nextTick } from 'vue'
import Popover from '@/components/Popover.vue'
import { rangeArray } from '@/utils/utils.js'

// 调色板可选颜色
const colorPalette = [
	'#000000',
	'#666666',
	'#ff0000',
	'#40b0ff',
	'#ffaa00',
	'#32dc18',
	'#ff55ff',
	'#5555ff',
]

// 默认画笔粗细
const thicknessDefault = 2

// 画布参数
let ctx = uni.createCanvasContext('canvas')	
let canvasHeight = 0
let canvasWidth = 0

// 鼠标起点、终点坐标
let startX = null
let startY = null
let endX = null
let endY = null

/* 
 撤销和恢复机制
 当undo、redo长度不为0，才允许撤销和恢复
 
 每点击一次撤销，undo执行pop，redo执行push。
 每当有新绘制，清空redo
 */
const undoStack = reactive([])
const redoStack = reactive([])

// 当前激活的功能
const isActive = ref('')
// 当前显示的弹出框

const thickness = ref(thicknessDefault)

// Stroke、fill 颜色
const strokeColor = ref('#000000')
const fillColor = ref('#000000')

// 橡皮擦
const showEraser = ref(false)
const eraserSize = ref(30)		
const eraserX = ref(0)
const eraserY = ref(0)

// 文本
const fontSizeRange =  [
	{ value: 1, text: 1 },
	{ value: 2, text: 2 },
	{ value: 3, text: 3 },
	{ value: 4, text: 4 },
	{ value: 5, text: 5 },
	{ value: 6, text: 6 },
	{ value: 7, text: 7 },
	{ value: 8, text: 8 },
	{ value: 9, text: 9 },
	{ value: 10, text: 10 },
	{ value: 11, text: 11 },
	{ value: 12, text: 12 },
	{ value: 13, text: 13 },
	{ value: 14, text: 14 },
	{ value: 15, text: 15 },
	{ value: 16, text: 16 },
	{ value: 17, text: 17 },
	{ value: 18, text: 18 },
	{ value: 19, text: 19 },
	{ value: 20, text: 20 },
	{ value: 21, text: 21 },
	{ value: 22, text: 22 },
	{ value: 23, text: 23 },
	{ value: 24, text: 24 },
	{ value: 25, text: 25 },
	{ value: 26, text: 26 },
	{ value: 27, text: 27 },
	{ value: 28, text: 28 },
	{ value: 29, text: 29 },
	{ value: 30, text: 30 },
]
const showTextbox = ref(false)
const textboxX = ref(0)
const textboxY = ref(0)
const text = ref('')
const fontSize = ref(16)
const lineHeight = 1.2		// 取决文字大小
const lineHeight2px = computed(() => 
	fontSize.value * lineHeight
)

const movableHeight = ref(16 * 1.2 + 12)
const movableWidth = computed(() => {
	const res = text.value.split('\n').reduce((pre, curr) => {
		return pre.length > curr.length ? pre : curr
	}) 
	
	return ctx.measureText(res).width + 12 + 12 + 4
})

function onLineChange(e) {
	movableHeight.value = e.detail.height + 12
}

watchEffect(() => {
	ctx.setFillStyle(fillColor.value)
	ctx.setStrokeStyle(strokeColor.value)
})


function onTextClick() {
	if(isActive.value == 'Text') {
		isActive.value = ''
		showTextbox.value = false
	} else {
		isActive.value = 'Text'
	}
}

function onTouchstart(e) {
		
	startX = e.changedTouches[0].x
	startY = e.changedTouches[0].y
	eraserX.value = startX - eraserSize.value / 2
	eraserY.value = startY - eraserSize.value / 2
	
	if(isActive.value == 'Text') {
		textboxX.value = startX - 10
		textboxY.value = startY - lineHeight2px.value / 2 
		text.value.split('\n').forEach((val, i) => {
			ctx.fillText(val, endX, endY + (fontSize.value * lineHeight * i))
		})
		ctx.draw(true)
		
		// 如果文本框内容不为空，则保存状态
		if(text.value) {
			uni.canvasGetImageData({
				canvasId: 'canvas',
				x: 0,
				y: 0,
				width: canvasWidth,
				height: canvasHeight,
				success: res => {
					undoStack.push(res.data)
					console.log('undo', undoStack.length)
					console.log('redo', redoStack.length)
				},
				fail: err => {
					console.log('获取像素数据失败', err)
				}
			})
		}
		
		text.value = ''
		showTextbox.value = true
		return
	}
	
	if(isActive.value == 'Eraser') {
		ctx.clearRect(startX - eraserSize.value / 2, startY - eraserSize.value / 2, eraserSize.value, eraserSize.value)
		ctx.draw(true)	
		showEraser.value = true
		return
	}
	
	isActive.value = ''
	ctx.beginPath()
	ctx.moveTo(startX, startY)
	ctx.lineTo(startX, startY)
	ctx.stroke()
	ctx.draw(true)			// 保留上次绘制, 避免每次绘制清空画布
	ctx.closePath()
}

function onTouchmove(e) {
	const newX = e.changedTouches[0].x
	const newY = e.changedTouches[0].y
	eraserY.value = newY - eraserSize.value / 2
	eraserX.value = newX - eraserSize.value / 2
	
	if(isActive.value == 'Eraser') {
		ctx.clearRect(newX - eraserSize.value / 2, newY - eraserSize.value / 2, eraserSize.value, eraserSize.value)
		ctx.draw(true)	
		return
	}
	
	if(isActive.value == 'Text') {
		return
	}
	
	ctx.beginPath()
	ctx.moveTo(startX, startY)
	ctx.lineTo(newX, newY)
	ctx.stroke()
	ctx.draw(true)			// 保留上次绘制, 避免每次绘制清空画布
	ctx.closePath()
	startX = newX
	startY = newY
}	

function onTouchend(e) {
	redoStack.length = 0
	
	if(isActive.value == 'Text') {
		endX = e.changedTouches[0].x
		endY = e.changedTouches[0].y + 8
		return
	}
	
	// 绘制结束后, 推入undoStack
	uni.canvasGetImageData({
		canvasId: 'canvas',
		x: 0,
		y: 0,
		width: canvasWidth,
		height: canvasHeight,
		success: res => {
			undoStack.push(res.data)
			console.log('undo', undoStack.length)
			console.log('redo', redoStack.length)
		},
		fail: err => {
			console.log('获取像素数据失败', err)
		}
	})
	
}


/**
 * 撤销操作
 */
function undo() {
	if(undoStack.length) {
		// 清空画布
		ctx.draw()
		
		if(undoStack.length == 1) {
			redoStack.push(undoStack.pop())
			console.log('undo', undoStack.length)
			console.log('redo', redoStack.length)
			return
		}
		
		const data = undoStack.pop()
		uni.canvasPutImageData({
			canvasId: 'canvas',
			x: 0,
			y: 0,
			width: canvasWidth,
			data: undoStack[undoStack.length - 1],
			success: res => {
				redoStack.push(data)
				
			},
			fail: err => {
				console.log('绘制失败', err)
			}
		})
	}
}

/**
 * 恢复操作
 */
function redo() {
	if(redoStack.length) {
		// 清空画布
		ctx.draw()
		
		const data = redoStack.pop()
		uni.canvasPutImageData({
			canvasId: 'canvas',
			x: 0,
			y: 0,
			width: canvasWidth,
			data,
			success: res => {
				undoStack.push(data)
				console.log('undo', undoStack.length)
				console.log('redo', redoStack.length)
			},
			fail: err => {
				console.log('绘制失败', err)
			}
		})
	}
}

/**
 * 重置画布
 */
function reset() {
	uni.showModal({
		title: '重置',
		content: '请确认是否重置画布',
		success: res => {
			if(res.confirm) {
				ctx.draw()
				undoStack.length = 0
				redoStack.length = 0
			}
		}
	})
}


/**
 * 文本框拖动事件
 * @param {Object} e 事件对象
 */
function onTextboxMove(e) {
	const { x, y } = e.detail
	endX = x + 6
	endY = y + fontSize.value + 8
}


/**
 * 保存图片
 */
function save() {
	uni.canvasToTempFilePath({
		canvasId: 'canvas',
		success: res => {
			// 在H5平台下，tempFilePath 为 base64
			console.log('save success', res)
			
			// #ifdef APP
			uni.saveFile({
				tempFilePath: res.tempFilePath,
				success: res => {
					console.log('保存文件', res)
				},
				fail: err => {
					console.log('保存失败', err)
				}
			})
			// #endif
		},
		fail: err => {
			console.log('save fail', err)
		}
	})
}


onLoad(() => {
	// 初始化参数
	ctx.setLineCap('round')
	ctx.setLineWidth(thicknessDefault)
	ctx.setFontSize(fontSize.value)
	ctx.setStrokeStyle(strokeColor.value)
	ctx.setFillStyle(fillColor.value)
})


onReady(() => {
	// 获取画布像素数据
	uni.canvasGetImageData({
		canvasId: 'canvas',
		x: 0,
		y: 0,
		success: res => {
			console.log('画布宽高', res.height, res.width)
			canvasHeight = res.height
			canvasWidth = res.width
		}
	})
})	
	
</script>

<style lang="scss" scoped>
.page-container {
	height: calc(100vh - var(--status-bar-height) - var(--window-top) - 40px);
	width: 100%;
	
	.header {
		box-sizing: border-box;
		height: 40px;
		line-height: 40px;
		border-bottom: 1px solid #eeeeee;
		
		.iconfont {
			display: inline-block;
			color: #5e6d82 !important;
			font-size: 28px !important;
			margin: 0 12px;
			
			&:active {
				color: #9ab3d4 !important;
			}
			
			&.isActive {
				color: #40b0ff !important;
			}
			
			&.isDisabled {
				color: #b6b6b6 !important;
			}
		}
		
		.thickness {
			display: flex;
			justify-content: space-between;
			align-items: center;
			
			.slider {
				width: 150px;
			}
			
			.circle {
				background-color: #000;
				border-radius: 50%;
			}
		}

		
		.colorPalette {
			display: flex;
			justify-content: space-around;
			
			.color {
				width: 20px;
				height: 20px;
				border-radius: 50%;
				margin: 0 4px;
				border: 4px solid #eeeeee;
				
				&.isActive {
					box-shadow: inset 0px 0px 4px #fff;
					transform: translateY(-4px);
				}
				
			}
		}
		
		.textBar {
			display: flex;
			justify-content: space-between;
			align-items: center;
			
			.select {
				width: 100px;
			}
		}
	}
	
	.canvas {
		position: relative;
		
		.eraser {
			box-sizing: border-box;
			position: absolute;
			background-color: #fff;
			border: 1px solid #e5e5e5;
		}
		
		movable-area {
			
			movable-view {
				min-width: 20px;
				
				textarea {
					box-sizing: border-box;
					width: 100%;
					border: 1px solid #6b6b6b;
					border-radius: 4px;
					padding: 6px 8px;
				}
				
			}
		}
	}
}

</style>
