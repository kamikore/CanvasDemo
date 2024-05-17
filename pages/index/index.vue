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
				<text :class="['iconfont', isActive == 'Thickness' ? 'isActive' : '']"  @click="isActive = 'Thickness'">&#xe600</text>
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
				<uni-icons class="iconfont" type="color" @click="isActive = 'ColorPalette'"></uni-icons>
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
			<!-- 插入文字 -->
			<popover :visible="isActive == 'Text'">
				<uni-icons 
					:class="['iconfont', isActive == 'Text' ? 'isActive' : '']" 
					type="font"
					@click="isActive = (isActive == 'Text') ? '' : 'Text'"
				></uni-icons>
				<template #content>
					<view class="textBar">
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
			@touchmove="onTouchmove"
			@touchstart="onTouchstart"
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
						minWidth: minTextboxWidth + 'px',
						minHeight: minTextboxHeight + 'px'
					}"
					direction="all"
					:animation="false"
					:x="textboxX"
					:y="textboxY"
					@change="onTextboxMove"
				>
					<textarea 
						:value="text" 
						:style="{
							fontSize: fontSize + 'px',
							color: fillColor
						}"
						@input="onTextboxInput" 
						auto-height
					></textarea>
				</movable-view>		
			</movable-area>
		</canvas>
	</view>
</template>

<script setup>
import { onLoad, onReady } from '@dcloudio/uni-app'
import { ref, reactive, watchEffect } from 'vue'
import Popover from '@/components/Popover.vue'

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
let startX = null
let startY = null
let canvasHeight = 0
let canvasWidth = 0

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

// 文本框
const isText = ref(false)
const showTextbox = ref(false)
const minTextboxWidth = 24
const minTextboxHeight = 32
const textboxX = ref(0)
const textboxY = ref(0)
const text = ref('')
const fontSize = ref(16)

watchEffect(() => {
	ctx.setFillStyle(fillColor.value)
	ctx.setStrokeStyle(strokeColor.value)
})

	
function onTouchstart(e) {
		
	startX = e.changedTouches[0].x
	startY = e.changedTouches[0].y
	eraserX.value = startX - eraserSize.value / 2
	eraserY.value = startY - eraserSize.value / 2
	
	if(isActive.value == 'Text') {
		textboxX.value = startX - (minTextboxWidth / 2)
		textboxY.value = startY - (minTextboxHeight / 2)
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
	
	// 绘制结束后, 推入undoStack
	uni.canvasGetImageData({
		canvasId: 'canvas',
		x: 0,
		y: 0,
		width: canvasWidth,
		height: canvasHeight,
		success: res => {
			undoStack.push(res.data)
		},
		fail: err => {
			console.log('获取像素数据失败', err)
		}
	})
	
	if(isActive.value == 'Text') {
	}
	
	
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
	textboxX.value = x
	textboxY.value = y
}

/**
 * 文本框输入事件
 * @param {Object} e 事件对象
 */
function onTextboxInput(e) {
	text.value = e.detail.value
	// ctx.fillText(e.detail.value, textboxX.value, textboxY.value)
	// ctx.draw(true)
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
	ctx.setLineWidth(thicknessDefault)
	ctx.setLineCap('round')
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
			canvasHeight = res.height
			canvasWidth = res.width
		}
	})
})	
	
	
</script>

<style lang="scss" scoped>
.page-container {
	height: calc(100vh - var(--status-bar-height) - var(--window-top) - 48px);
	width: 100%;
	
	.header {
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
				background-color: pink;
				
				textarea {
					background-color: #9ab3d4;
				}
			}
		}
	}
}

</style>
